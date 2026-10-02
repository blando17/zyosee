/*
 * The submission queue.
 *
 * Before this, POST /submit compiled the code, ran it against every test, and
 * only then answered. A brute-force solution that times out holds that
 * connection for five seconds, and nothing limited how many of those could run
 * at once. Twenty people pressing Submit during a demo meant twenty concurrent
 * g++ processes inside one container, which is how a laptop falls over.
 *
 * Now /submit writes the job to Redis and answers immediately with an id. One
 * or more worker processes take jobs off the list and judge them one at a time,
 * so the number of compilers running at once is the number of workers, whatever
 * the class does. `docker compose up --scale worker=3` is the whole scaling
 * story.
 *
 * The important promise is unchanged: judging must never depend on Redis. When
 * Redis is unreachable, isAvailable() is false and index.js judges inline and
 * returns the verdict in the response, exactly as it used to. Slower under load,
 * but never broken.
 */

const { v4: uuid } = require("uuid");
const { withRedis, withBlockingRedis, isReady } = require("./redisClient");

const QUEUE_KEY = "oj:judge:queue";
const JOB_KEY = (id) => `oj:judge:job:${id}`;

// How long a finished result stays readable. Long enough for a browser that
// was backgrounded mid-judge, short enough that submitted source is not
// lingering in Redis. The job holds the solver's code, so this is a retention
// decision as much as a memory one.
const JOB_TTL_SECONDS = Number(process.env.JUDGE_JOB_TTL_SECONDS) || 600;

function isAvailable() {
  return isReady();
}

async function readJob(redis, id) {
  const raw = await redis.get(JOB_KEY(id));
  return raw ? JSON.parse(raw) : null;
}

async function writeJob(redis, job) {
  await redis.set(JOB_KEY(job.id), JSON.stringify(job), { EX: JOB_TTL_SECONDS });
}

/*
 * Queues one submission. Returns the job, or null when Redis is unavailable so
 * the caller knows to judge inline instead.
 *
 * The job is written before the id is pushed. The other order has a window
 * where a worker pops an id whose job does not exist yet.
 */
async function enqueue({ userId, slug, language, code, duelId = null }) {
  return withRedis(async (redis) => {
    const job = {
      id: uuid(),
      userId,
      slug,
      language,
      code,
      // Carried through the queue so a duel submission counts the same whether
      // a worker judged it or the inline path did. Already checked against the
      // duel before it got here; the worker takes it as given.
      duelId,
      status: "queued",
      queuedAt: Date.now(),
      startedAt: null,
      finishedAt: null,
      result: null,
      error: null,
    };
    await writeJob(redis, job);
    await redis.lPush(QUEUE_KEY, job.id);
    return job;
  }, null);
}

/*
 * What the browser is allowed to see about a job.
 *
 * Never the code: the browser sent it and re-reading it from a shared store is
 * a way for one account to read another's work if the ownership check below
 * ever slips.
 */
function publicJob(job, waitingAhead) {
  return {
    jobId: job.id,
    status: job.status,
    queuedAt: job.queuedAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    waitingAhead: job.status === "queued" ? waitingAhead : 0,
    ...(job.result || {}),
    ...(job.error ? { verdict: "server_error", message: job.error } : {}),
  };
}

async function getJob(id, userId) {
  return withRedis(async (redis) => {
    const job = await readJob(redis, id);
    if (!job) return { missing: true };
    // A job id is a uuid, but guessing is not the only way to hold one. The
    // owner check is what stops a leaked id revealing somebody's verdict.
    if (job.userId !== userId) return { forbidden: true };

    /*
     * How many submissions will be judged before this one.
     *
     * LPOS gives this job's index from the head, and jobs are pushed to the
     * head and taken from the tail, so everything between it and the tail goes
     * first. Counting the whole queue instead would include this job and tell
     * somebody alone in the queue that one submission is ahead of theirs.
     */
    let waitingAhead = 0;
    if (job.status === "queued") {
      const length = await redis.lLen(QUEUE_KEY);
      const index = await redis.lPos(QUEUE_KEY, job.id);
      waitingAhead = index === null ? 0 : Math.max(0, length - 1 - index);
    }
    return { job: publicJob(job, waitingAhead) };
  }, { unavailable: true });
}

/* ---------- the worker side ---------- */

// Blocks until there is work or the timeout passes, so an idle worker costs
// nothing rather than spinning on a poll.
async function claimNext(timeoutSeconds = 5) {
  // withBlockingRedis, not withRedis: this command is meant to wait, and the
  // ordinary wrapper's one second ceiling would abandon it mid-pop and lose
  // the job it had just taken off the list.
  return withBlockingRedis(
    async (redis) => {
      const popped = await redis.brPop(QUEUE_KEY, timeoutSeconds);
      return popped ? popped.element : null;
    },
    null,
    /*
     * The backstop, well clear of how long this command can honestly take.
     *
     * BRPOP returns within `timeoutSeconds` on any working connection, so a
     * ceiling of that plus ten seconds can only be reached by a socket that has
     * stopped answering without saying so. Sized as a multiple rather than a
     * constant so that raising the poll interval cannot quietly turn the
     * backstop into something that fires during normal waiting.
     */
    { maxWaitMs: timeoutSeconds * 1000 + 10000 }
  );
}

async function loadJob(id) {
  return withRedis((redis) => readJob(redis, id), null);
}

async function markRunning(id) {
  return withRedis(async (redis) => {
    const job = await readJob(redis, id);
    if (!job) return null;
    job.status = "running";
    job.startedAt = Date.now();
    await writeJob(redis, job);
    return job;
  }, null);
}

async function markDone(id, result) {
  return withRedis(async (redis) => {
    const job = await readJob(redis, id);
    if (!job) return null;
    job.status = "done";
    job.finishedAt = Date.now();
    job.result = result;
    // The code is dropped once there is a verdict. Nothing reads it again, and
    // a store full of other people's solutions is a liability for no benefit.
    job.code = null;
    await writeJob(redis, job);
    return job;
  }, null);
}

async function markFailed(id, message) {
  return withRedis(async (redis) => {
    const job = await readJob(redis, id);
    if (!job) return null;
    job.status = "failed";
    job.finishedAt = Date.now();
    job.error = message;
    job.code = null;
    await writeJob(redis, job);
    return job;
  }, null);
}

async function depth() {
  return withRedis((redis) => redis.lLen(QUEUE_KEY), null);
}

module.exports = {
  isAvailable, enqueue, getJob, claimNext, loadJob,
  markRunning, markDone, markFailed, depth,
  QUEUE_KEY, JOB_TTL_SECONDS,
};
