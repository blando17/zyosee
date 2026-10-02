/*
 * A judge worker.
 *
 * Takes one submission off the queue at a time, judges it, writes the verdict
 * back, and asks for the next. Nothing else. It is the same judge the API used
 * to run inline — the only change is where it is called from.
 *
 * One job at a time is the point rather than a limitation. The concurrency of
 * the whole judge is the number of workers, which is a number you set:
 *
 *   docker compose up -d --scale worker=3
 *
 * Run it on its own with `npm run worker`, which is worth doing once to watch
 * what it prints.
 *
 * It needs the same image as the API because it needs the same toolchains, the
 * same problems from MongoDB, and the same test files on disk.
 */

const dotenv = require("dotenv");
dotenv.config();

const { stayAlive } = require("./stayAlive");
stayAlive("worker");

const queue = require("./judgeQueue");
const { judge } = require("./judge");
const { getProblem } = require("./problems");
const { record } = require("./submissions");
const { start: startRedis, isReady } = require("./redisClient");

const NAME = process.env.WORKER_NAME || `worker-${process.pid}`;
const IDLE_POLL_SECONDS = Number(process.env.WORKER_IDLE_POLL_SECONDS) || 5;

let running = true;
let judged = 0;

async function handle(jobId) {
  const job = await queue.loadJob(jobId);
  if (!job) {
    // The job outlived its TTL, or a previous worker finished it. Nothing to do
    // and nothing wrong.
    console.log(`${NAME}: job ${jobId} no longer exists, skipping`);
    return;
  }

  await queue.markRunning(jobId);
  const startedAt = Date.now();

  try {
    const problem = await getProblem(job.slug);
    if (!problem) {
      await queue.markFailed(jobId, `No problem called "${job.slug}".`);
      return;
    }

    const result = await judge({ language: job.language, code: job.code, problem });
    await queue.markDone(jobId, { ...result, slug: job.slug, language: job.language });

    /*
     * Written after the verdict is handed back, never before.
     *
     * The solver is waiting on markDone; recording history is bookkeeping and
     * must not sit between them. record() swallows its own errors for the same
     * reason — a database hiccup should cost a row of history, not a verdict.
     */
    await record({
      userId: job.userId,
      slug: job.slug,
      language: job.language,
      result,
      duelId: job.duelId || null,
    });

    judged += 1;
    console.log(
      `${NAME}: ${job.slug} (${job.language}) -> ${result.verdict} ` +
        `${result.passed}/${result.totalTests} in ${Date.now() - startedAt}ms`
    );
  } catch (err) {
    // A worker must not die on one bad submission. The verdict for this job
    // becomes an error the browser can show; the loop carries on.
    console.error(`${NAME}: job ${jobId} failed:`, err.message);
    await queue.markFailed(jobId, "Server error while judging.");
  }
}

async function loop() {
  console.log(`${NAME}: waiting for submissions`);

  while (running) {
    if (!isReady()) {
      // Without Redis there is no queue to read. The API judges inline in this
      // situation, so there is nothing for a worker to do but wait for Redis
      // to come back.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }

    /*
     * A claim that comes back empty is one of two very different things.
     *
     * An idle timeout: BRPOP waited the full poll interval, nobody submitted,
     * and the loop should go straight round again. That is the normal case and
     * it costs nothing.
     *
     * A failed claim: the connection broke and the wrapper gave up early. Going
     * straight round again then means rebuilding a socket, failing, and
     * repeating as fast as the machine allows — a busy loop that pins a core
     * for as long as Redis is away. This did not happen before only because the
     * old wrapper never returned at all; fixing the wedge without this would
     * trade a stuck worker for a spinning one.
     *
     * The two are told apart by how long the claim took, which needs no extra
     * state: only a broken connection can come back in appreciably less than
     * the interval it was asked to wait for.
     */
    const askedAt = Date.now();
    const jobId = await queue.claimNext(IDLE_POLL_SECONDS);

    if (jobId) {
      await handle(jobId);
      continue;
    }

    const waited = Date.now() - askedAt;
    if (waited < IDLE_POLL_SECONDS * 1000 * 0.5) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`${NAME}: stopped after judging ${judged} submission(s)`);
  process.exit(0);
}

// Finish the job in hand before exiting, so a deploy does not leave somebody
// watching a spinner that never resolves.
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!running) process.exit(0);
    console.log(`${NAME}: ${signal} received, finishing the current job`);
    running = false;
  });
}

startRedis();
loop();
