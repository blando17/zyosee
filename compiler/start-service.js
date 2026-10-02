/*
 * Entry point for platforms that give you ONE process slot per service.
 *
 * On a machine of our own the compiler and the judge workers are separate
 * containers, which is the arrangement that makes `--scale worker=3` mean
 * something. Render's free tier has no background workers at all — they are a
 * paid service type — so on that plan there is exactly one container, and
 * anything that must run has to run inside it.
 *
 * That leaves a trap worth naming. The compiler happily enqueues a job to Redis
 * whether or not anything is listening; if no worker runs, submissions are
 * accepted, queued, and then sit there until their 600s TTL expires, with the
 * page showing "Waiting for a judge" the whole time. A deployment that forgets
 * the worker does not look broken, it looks slow, which is worse.
 *
 * So this script owns the decision rather than leaving it to configuration:
 *
 *   Redis configured    -> run the API in this process, fork workers beside it
 *   Redis not configured -> run the API alone and let it judge inline
 *
 * index.js already chooses inline when queue.isAvailable() is false, so the
 * second case needs no special handling beyond not forking a worker that would
 * spin against a Redis that is not there.
 *
 * WHY THE API RUNS IN THIS PROCESS AND THE WORKERS ARE CHILDREN
 *
 * The API is what binds PORT, and Render decides a deploy succeeded by watching
 * for a listener on that port. Requiring index.js here — rather than forking it
 * too — means the HTTP server's fate IS this process's fate: if it dies the
 * container dies and the platform restarts it, which is the behaviour you want
 * for the part users talk to. A worker is different: it is a consumer that can
 * come and go without anybody noticing, so losing one should cost a restart of
 * that worker, not of the website.
 */

const path = require("path");
const { fork } = require("child_process");

const WORKER_COUNT = Math.max(0, Number(process.env.JUDGE_WORKERS) || 1);

// Both conditions matter. REDIS_ENABLED=0 is the explicit off switch, and an
// absent REDIS_URL is the accidental one — a service deployed before its Redis
// instance exists. Either way the answer is the same: judge inline.
const queueEnabled =
  process.env.REDIS_ENABLED !== "0" && Boolean(process.env.REDIS_URL);

let shuttingDown = false;
const workers = new Map();

function startWorker(n) {
  const child = fork(path.join(__dirname, "worker.js"), [], {
    env: { ...process.env, WORKER_NAME: `worker-${n}` },
  });
  workers.set(n, child);

  child.on("exit", (code, signal) => {
    workers.delete(n);
    if (shuttingDown) return;
    /*
     * A crash loop must not become a fork bomb. Two seconds is long enough that
     * a worker failing immediately — a bad REDIS_URL, say — restarts about
     * thirty times a minute rather than thousands, which keeps the logs
     * readable and leaves the CPU to the API.
     */
    console.error(
      `${new Date().toISOString()} worker-${n} exited (code=${code} signal=${signal}); restarting in 2s`
    );
    setTimeout(() => startWorker(n), 2000).unref();
  });
}

/*
 * Pass the platform's stop signal on to the workers.
 *
 * worker.js treats SIGTERM as "finish the job in hand, then exit", so a deploy
 * does not strand somebody mid-submission. Without this forwarding the children
 * would be killed outright when the parent goes, and whoever was being judged
 * would watch a spinner until the job's TTL ran out.
 */
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    shuttingDown = true;
    for (const child of workers.values()) {
      try {
        child.kill(signal);
      } catch (ignored) {
        // Already gone, which is the state we were asking for.
      }
    }
  });
}

if (queueEnabled && WORKER_COUNT > 0) {
  for (let n = 1; n <= WORKER_COUNT; n += 1) startWorker(n);
  console.log(`start-service: queue mode, ${WORKER_COUNT} worker(s) in this container`);
} else {
  console.log(
    "start-service: no Redis configured, judging inline (no workers started)"
  );
}

// Last, and deliberately: a worker that starts before the API is pointless, and
// requiring this blocks while Express sets itself up.
require("./index.js");
