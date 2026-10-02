/*
 * What stops one person monopolising the judge.
 *
 * WHAT THIS IS FOR, GIVEN THERE IS ALREADY A QUEUE
 *
 * judgeQueue.js bounds how many compilers run AT ONCE — that is the number of
 * workers, whatever the class does. It does not bound how much work one person
 * can put IN. A script submitting in a loop cannot melt the box any more, but
 * it can still fill the queue with its own jobs, and everyone else then waits
 * behind it. The queue made the judge survivable; this is what keeps it fair.
 *
 * It also bounds the cost of a submission that is never judged at all: every
 * one writes a row, reads a problem, and on the inline path compiles and runs
 * code for up to thirty seconds.
 *
 * KEYED ON THE PERSON, NOT THE ADDRESS
 *
 * Every route guarded here is behind requireAuth, so there is a user id to
 * count against. That is a straightforwardly better key than an address: it
 * cannot be changed by reconnecting, and — unlike the login limits in the
 * accounts API, which have no choice — it never charges one student for what
 * the rest of the lecture theatre is doing on the same campus NAT.
 *
 * REDIS, FOR THE SAME REASON aiLimits DOES
 *
 * Not for scale. Because this container is rebuilt every time judge code
 * changes, and an in-memory counter would forgive everybody's budget several
 * times an afternoon. Redis outlives the container.
 *
 * When Redis is unreachable every function here falls back to the in-memory
 * maps below, which is exactly what aiLimits.js does and exactly the behaviour
 * this service had before Redis existed. Judging must never depend on Redis —
 * so a Redis outage degrades this to a per-process limiter, and never to a
 * refusal.
 */

const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const { withRedis, start: startRedis } = require("./redisClient");

startRedis();

/*
 * Two activities, two budgets, because they are not the same thing.
 *
 * Submitting is the expensive one: every hidden test, up to a thirty second
 * budget, a queue slot and a stored row. You do it when you think you are
 * finished.
 *
 * Running against your own input is how you get there, and people do it far
 * more often — a tighter budget on it would be a limiter on thinking. It is
 * still capped, because /run compiles and executes exactly the same way and
 * limiting only /submit would leave the obvious way round it wide open.
 *
 * The numbers are deliberately loose. The aim is to stop a loop, not to ration
 * a person working: thirty submissions in five minutes is one every ten
 * seconds, sustained, which nobody reaches by solving problems.
 */
const BUDGETS = {
  submit: {
    label: "submission",
    cooldownMs: Number(process.env.SUBMIT_COOLDOWN_SECONDS || 3) * 1000,
    burst: { max: Number(process.env.SUBMIT_MAX_PER_5_MIN) || 30, windowMs: 5 * 60 * 1000 },
    hourly: { max: Number(process.env.SUBMIT_MAX_PER_HOUR) || 300, windowMs: 60 * 60 * 1000 },
  },
  run: {
    label: "run",
    cooldownMs: Number(process.env.RUN_COOLDOWN_SECONDS || 1.5) * 1000,
    burst: { max: Number(process.env.RUN_MAX_PER_5_MIN) || 60, windowMs: 5 * 60 * 1000 },
    hourly: { max: Number(process.env.RUN_MAX_PER_HOUR) || 500, windowMs: 60 * 60 * 1000 },
  },
};

const HISTORY_KEY = (kind, userId) => `oj:rate:${kind}:${userId}`;

/* ---------- the fallback, used only when Redis is not there ---------- */

const memory = new Map(); // `${kind}:${userId}` -> timestamps, oldest first

/*
 * The in-memory store is itself a target, so it is bounded.
 *
 * Every key here is a real authenticated user id, so this cannot be flooded by
 * a stranger the way an email-keyed store can — but a judge with thousands of
 * accounts still should not hold every one of them for ever. Past the cap the
 * least recently touched go first.
 */
const MAX_MEMORY_KEYS = Number(process.env.RATE_MAX_MEMORY_KEYS) || 10000;

function memoryTimes(kind, userId, windowMs, now) {
  const key = `${kind}:${userId}`;
  const kept = (memory.get(key) || []).filter((at) => now - at < windowMs);
  memory.delete(key);
  if (kept.length) memory.set(key, kept);

  while (memory.size > MAX_MEMORY_KEYS) {
    const oldest = memory.keys().next().value;
    if (oldest === undefined) break;
    memory.delete(oldest);
  }
  return kept;
}

/* ---------- usage ---------- */

/*
 * This person's recent attempts at one activity, newest last.
 *
 * A sorted set scored by timestamp — the same sliding window aiLimits.js keeps,
 * for the same reason: anything past the longest window is dropped on read
 * rather than left to pile up, and the key expires by itself if they never come
 * back.
 */
async function timestampsFor(kind, userId) {
  const now = Date.now();
  const longest = BUDGETS[kind].hourly.windowMs;

  const times = await withRedis(async (redis) => {
    const key = HISTORY_KEY(kind, userId);
    await redis.zRemRangeByScore(key, 0, now - longest);
    const members = await redis.zRange(key, 0, -1);
    return members.map((m) => Number(String(m).split("-")[0])).filter(Number.isFinite);
  }, null);

  return times ?? memoryTimes(kind, userId, longest, now);
}

/* ---------- the gate ---------- */

function describe(seconds) {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/*
 * May this person do this now?
 *
 * Returns { ok } or { ok: false, message, retryAfterSeconds }.
 *
 * The windows are checked before the cooldown, deliberately. Telling somebody
 * who has run out of their hour to "wait 3 seconds" is true and useless — the
 * same ordering, and the same reasoning, as aiLimits.check.
 */
async function check(kind, userId) {
  const budget = BUDGETS[kind];
  if (!budget) return { ok: true };

  const times = await timestampsFor(kind, userId);
  const now = Date.now();

  const within = (windowMs) => times.filter((at) => now - at < windowMs);

  const hourly = within(budget.hourly.windowMs);
  if (hourly.length >= budget.hourly.max) {
    const wait = Math.ceil((budget.hourly.windowMs - (now - hourly[0])) / 1000);
    return {
      ok: false,
      reason: "hourly_limit",
      retryAfterSeconds: wait,
      message:
        `That is ${budget.hourly.max} ${budget.label}s in an hour, which is as many as this judge ` +
        `takes from one account. Try again in ${describe(wait)}.`,
    };
  }

  const burst = within(budget.burst.windowMs);
  if (burst.length >= budget.burst.max) {
    const wait = Math.ceil((budget.burst.windowMs - (now - burst[0])) / 1000);
    return {
      ok: false,
      reason: "burst_limit",
      retryAfterSeconds: wait,
      message:
        `Slow down — that is ${budget.burst.max} ${budget.label}s in a few minutes. ` +
        `Try again in ${describe(wait)}.`,
    };
  }

  const last = times.length ? times[times.length - 1] : null;
  if (last && now - last < budget.cooldownMs) {
    const wait = Math.max(1, Math.ceil((budget.cooldownMs - (now - last)) / 1000));
    return {
      ok: false,
      reason: "cooldown",
      retryAfterSeconds: wait,
      message: `Wait ${describe(wait)} before your next ${budget.label}.`,
    };
  }

  return { ok: true };
}

/*
 * Counts one against the allowance.
 *
 * Called only once a request has really been dispatched — queued, or judged
 * inline. A submission refused for being empty, for naming a problem that does
 * not exist, or by the duel gate never reached the compiler, so it does not
 * spend anything.
 *
 * The random suffix is there because two calls in the same millisecond would
 * otherwise be the same member of the sorted set, and the second would silently
 * not count.
 */
async function record(kind, userId) {
  const now = Date.now();
  const longest = BUDGETS[kind]?.hourly.windowMs || 60 * 60 * 1000;

  const stored = await withRedis(async (redis) => {
    const key = HISTORY_KEY(kind, userId);
    await redis.zAdd(key, {
      score: now,
      value: `${now}-${crypto.randomBytes(4).toString("hex")}`,
    });
    await redis.expire(key, Math.ceil(longest / 1000));
    return true;
  }, false);

  if (!stored) {
    const key = `${kind}:${userId}`;
    const times = memory.get(key) || [];
    times.push(now);
    memory.delete(key);
    memory.set(key, times);
  }
}

/*
 * The gate as one call, for a route handler.
 *
 * Returns true when the caller may proceed. When it returns false it has
 * already answered the request, in the shape the submit and run routes use for
 * every other refusal — `verdict` so the page can branch on it, `message` for
 * the person reading it — plus the Retry-After header, which is the part a
 * script is supposed to obey.
 */
async function gate(kind, req, res) {
  const userId = req.user?.id;
  // No id means no auth, which these routes already refuse on their own. Not
  // this module's job to invent a second answer for it.
  if (!userId) return true;

  const verdict = await check(kind, userId);
  if (verdict.ok) return true;

  res.set("Retry-After", String(verdict.retryAfterSeconds));
  res.status(429).json({
    verdict: "rate_limited",
    reason: verdict.reason,
    message: verdict.message,
    retryAfterSeconds: verdict.retryAfterSeconds,
  });
  return false;
}

module.exports = { check, record, gate, BUDGETS };
