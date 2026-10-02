/*
 * The Redis connection, and what happens when there is not one.
 *
 * Redis holds the AI rate limits and the cache of answers already paid for.
 * Both used to live in this process's memory, which meant every restart of the
 * compiler forgave everyone's quota — and the compiler restarts every time
 * judge code changes. The counters guarding a paid API key were being reset
 * several times an afternoon.
 *
 * What this must never do is take the judge down with it. Judging does not
 * touch Redis at all, and the AI features fall back to in-memory counters when
 * Redis is unreachable. Falling back is never worse than the old behaviour,
 * because the old behaviour was in-memory counters all the time.
 *
 * The rule that makes that true: nothing here ever waits for a connection.
 *
 * The obvious version of this file awaits connect() on every call, and it
 * deadlocks the moment Redis stops: node-redis sits in its reconnect loop, the
 * await never settles, and requests that should have degraded to memory in a
 * millisecond hang instead. So the connection is established once in the
 * background, and every operation asks only "is the socket ready right now?"
 * — a synchronous check — before deciding whether to use Redis or the fallback.
 */

const { createClient } = require("redis");
const dotenv = require("dotenv");
dotenv.config();

const URL = process.env.REDIS_URL || "redis://localhost:6379";
const ENABLED = process.env.REDIS_ENABLED !== "0";
// A half-open socket accepts a command and never answers. Without a ceiling
// that would hang a request just as surely as waiting for a connection.
const OPERATION_TIMEOUT_MS = Number(process.env.REDIS_OPERATION_TIMEOUT_MS) || 1000;

let client = null;
let warned = false;

function isEnabled() {
  return ENABLED;
}

// Synchronous on purpose. See the note above: this is the check that replaces
// awaiting a connection.
function isReady() {
  return Boolean(client && client.isReady);
}

/*
 * Opens the connection once, in the background.
 *
 * node-redis reconnects on its own after this, so there is exactly one client
 * for the life of the process and nothing here ever creates a second one.
 * Called at startup; the promise is deliberately not awaited by callers.
 */
function start() {
  if (!ENABLED || client) return;

  client = createClient({
    url: URL,
    socket: {
      connectTimeout: 2000,
      // Keep trying for as long as the process lives, backing off to ten
      // seconds. Nothing waits on this, so a slow recovery costs nothing.
      reconnectStrategy: (attempt) => Math.min(attempt * 500, 10000),
    },
  });

  // Without a listener a connection error is an unhandled 'error' event, which
  // takes the whole process down. The judge must not die because a cache is
  // unreachable.
  client.on("error", (err) => {
    if (!warned) {
      console.error(`Redis unavailable at ${URL}: ${err.message}`);
      console.error("AI limits and cache fall back to this process's memory.");
      warned = true;
    }
  });
  client.on("ready", () => {
    console.log(`Redis connected at ${URL}`);
    warned = false;
  });

  client.connect().catch(() => {
    // Already reported by the error handler. The reconnect strategy takes over.
  });
}

/*
 * Runs a Redis operation, or returns `fallback` if it cannot be done now.
 *
 * Every caller in aiLimits goes through this, which keeps the "degrades to
 * memory" promise in one place instead of in nine try/catch blocks.
 */
async function withRedis(operation, fallback) {
  if (!ENABLED || !isReady()) return fallback;
  try {
    return await Promise.race([
      operation(client),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("redis timeout")), OPERATION_TIMEOUT_MS)
      ),
    ]);
  } catch (err) {
    return fallback;
  }
}

/*
 * Runs a BLOCKING Redis command, on a connection of its own.
 *
 * Two things make this different from withRedis, and getting either wrong
 * silently loses submissions.
 *
 * No fixed timeout. BRPOP is *supposed* to sit there for seconds; that is how
 * an idle worker waits without spinning. Racing it against a one second
 * ceiling, as withRedis does, aborts the wrapper while the command itself keeps
 * running — and when it then pops a job, nothing is listening. The job leaves
 * the queue and is never judged.
 *
 * Its own connection. A blocking command occupies the socket it was issued on,
 * so a worker sharing one client between BRPOP and its status writes would
 * stall itself for the length of every wait.
 *
 * WHY IT NO LONGER WAITS FOR EVER
 *
 * The version of this without the race below had a failure that was worse than
 * the one it was avoiding. When the socket died mid-BRPOP, node-redis never
 * settled the pending command: it reconnected underneath, and the promise this
 * function was awaiting simply never resolved. The worker's loop parked on that
 * one await and stopped consuming the queue — for ever, with the process alive,
 * nothing in the logs, and submissions piling up behind a spinner that said
 * "Waiting for a judge". Restarting the worker was the only cure.
 *
 * So the wait is now bounded by EVENTS rather than by a clock. The socket tells
 * us when it breaks — 'error' and 'end' both fire — and either one abandons the
 * wait immediately. That keeps the original property intact: a healthy BRPOP is
 * never interrupted, however long it sits, because a healthy socket emits
 * neither.
 *
 * `maxWaitMs` is only a backstop for a half-open socket that goes quiet without
 * ever emitting anything. Callers set it comfortably above how long their own
 * command can legitimately block, so it cannot fire on a connection that is
 * merely waiting.
 *
 * On any of those exits the connection is DESTROYED rather than returned to the
 * pool. That is what stops the job loss the original comment warns about: a
 * reply that arrives after we stopped listening has nowhere to arrive, so Redis
 * cannot pop a job into a socket nobody is reading. The next call builds a
 * fresh connection.
 */
let blockingClient = null;

async function withBlockingRedis(operation, fallback, { maxWaitMs = 30000 } = {}) {
  if (!ENABLED || !isReady()) return fallback;

  let conn = null;
  let onError = null;
  let onEnd = null;
  let timer = null;

  try {
    if (!blockingClient || !blockingClient.isReady) {
      blockingClient = client.duplicate();
      blockingClient.on("error", () => {
        // Reported by the main client's handler; this one only needs to exist
        // so an error is never an unhandled event.
      });
      await blockingClient.connect();
    }
    conn = blockingClient;

    /*
     * Rejects the moment the connection is known to be unusable.
     *
     * `once` rather than `on`, and both removed in the finally below: this runs
     * on every pass of the worker's loop, so listeners left behind would pile
     * up on a long-lived socket until Node started warning about a leak.
     */
    const broken = new Promise((_, reject) => {
      onError = () => reject(new Error("blocking connection errored"));
      onEnd = () => reject(new Error("blocking connection closed"));
      conn.once("error", onError);
      conn.once("end", onEnd);
      timer = setTimeout(() => reject(new Error("blocking connection went quiet")), maxWaitMs);
    });

    return await Promise.race([operation(conn), broken]);
  } catch (err) {
    /*
     * destroy(), not quit().
     *
     * quit() is graceful: it waits for commands already in flight to come back,
     * which on a socket that has just stopped answering is precisely the wait
     * being escaped. It was the second place this could hang.
     */
    try {
      if (conn) conn.destroy();
    } catch (ignored) {
      // Already gone, which is the state we wanted it in.
    }
    blockingClient = null;
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
    if (conn && onError) conn.removeListener("error", onError);
    if (conn && onEnd) conn.removeListener("end", onEnd);
  }
}

function status() {
  if (!ENABLED) return { enabled: false, connected: false };
  return { enabled: true, connected: isReady(), url: URL };
}

module.exports = { start, withRedis, withBlockingRedis, isReady, isEnabled, status };
