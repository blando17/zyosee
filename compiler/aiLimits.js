const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const { withRedis, status: redisStatus, start: startRedis } = require("./redisClient");

// Opened once, in the background. Nothing waits on it.
startRedis();

/*
 * What stops the AI features from emptying a free Gemini key.
 *
 * Everything here is enforced on the server. Disabling a button in the browser
 * stops an honest click and nothing else: anyone can post to the endpoint
 * directly, so the frontend's own guards are a courtesy and these are the rule.
 *
 * Four defences, in the order a request meets them:
 *
 *   1. In flight. One AI request per person at a time. Three impatient clicks
 *      on Next Hint become one call, not three.
 *   2. Cache. The same question about the same unchanged code returns the
 *      answer already paid for. Closing the panel and reopening it costs
 *      nothing.
 *   3. Cooldown. A few seconds between calls from one person.
 *   4. Quota. A ceiling per hour and per day.
 *
 * All four live in Redis. They used to live in this process's memory, and the
 * problem with that was not scale: it was that the compiler restarts every time
 * judge code changes, and each restart silently reset everyone's quota to zero.
 * The counters guarding a paid API key were being forgiven several times an
 * afternoon. Redis outlives the container.
 *
 * When Redis is unreachable every function here falls back to the in-memory
 * maps below. That is exactly the old behaviour, so a Redis outage is never
 * worse than not having Redis at all — and judging never touches any of this.
 */

const CONFIG = {
  perHour: Number(process.env.AI_REQUESTS_PER_HOUR) || 10,
  perDay: Number(process.env.AI_REQUESTS_PER_DAY) || 30,
  cooldownMs: (Number(process.env.AI_REQUEST_COOLDOWN_SECONDS) || 5) * 1000,
  cacheTtlMs: (Number(process.env.AI_CACHE_TTL_MINUTES) || 30) * 60 * 1000,
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Keys are prefixed so this database can be shared with anything else later
// without a name collision.
const HISTORY_KEY = (userId) => `oj:ai:hist:${userId}`;
const LOCK_KEY = (userId) => `oj:ai:lock:${userId}`;
const ANSWER_KEY = (fingerprint) => `oj:ai:ans:${fingerprint}`;

/* ---------- the fallback, used only when Redis is not there ---------- */

const history = new Map(); // userId -> timestamps, newest last
const inFlight = new Set(); // userId, while a request is running
const cache = new Map(); // fingerprint -> { at, value }

function memoryTimestamps(userId) {
  const now = Date.now();
  const kept = (history.get(userId) || []).filter((at) => now - at < DAY_MS);
  history.set(userId, kept);
  return kept;
}

/* ---------- usage ---------- */

function summarise(times, now) {
  const lastHour = times.filter((at) => now - at < HOUR_MS).length;
  return {
    hour: { used: lastHour, limit: CONFIG.perHour },
    day: { used: times.length, limit: CONFIG.perDay },
    lastRequestAt: times.length ? times[times.length - 1] : null,
  };
}

/*
 * How much of their allowance this person has used.
 *
 * A sorted set scored by timestamp, which is the same sliding window the
 * in-memory version kept in an array. Anything older than a day is dropped on
 * read rather than left to accumulate, and the key expires on its own if the
 * person never comes back.
 */
async function usageFor(userId) {
  const now = Date.now();

  const times = await withRedis(async (redis) => {
    const key = HISTORY_KEY(userId);
    await redis.zRemRangeByScore(key, 0, now - DAY_MS);
    const scores = await redis.zRange(key, 0, -1, { REV: false });
    // Members are "<timestamp>-<random>"; the timestamp is the part that counts.
    return scores.map((member) => Number(String(member).split("-")[0])).filter(Number.isFinite);
  }, null);

  return summarise(times ?? memoryTimestamps(userId), now);
}

/* ---------- the gate ---------- */

/*
 * May this person make an AI request right now?
 *
 * Returns { ok } or { ok: false, reason, message, retryAfterSeconds }. The
 * message is written for the person reading it, not for a log.
 */
async function check(userId) {
  const held = await withRedis(
    async (redis) => (await redis.exists(LOCK_KEY(userId))) === 1,
    inFlight.has(userId)
  );

  if (held) {
    return {
      ok: false,
      reason: "in_flight",
      message: "An AI request is already running. Wait for it to finish.",
      retryAfterSeconds: 3,
    };
  }

  const usage = await usageFor(userId);
  const now = Date.now();

  // Quota is checked before the cooldown on purpose. Telling someone who is out
  // of requests to "wait 5 seconds" would be true and useless.

  if (usage.hour.used >= usage.hour.limit) {
    return {
      ok: false,
      reason: "hourly_limit",
      message: `AI assistance limit reached: ${usage.hour.limit} requests an hour. Try again later.`,
      retryAfterSeconds: 600,
      usage,
    };
  }

  if (usage.day.used >= usage.day.limit) {
    return {
      ok: false,
      reason: "daily_limit",
      message: `AI assistance limit reached: ${usage.day.limit} requests a day. Try again tomorrow.`,
      retryAfterSeconds: 3600,
      usage,
    };
  }

  if (usage.lastRequestAt && now - usage.lastRequestAt < CONFIG.cooldownMs) {
    const wait = Math.ceil((CONFIG.cooldownMs - (now - usage.lastRequestAt)) / 1000);
    return {
      ok: false,
      reason: "cooldown",
      message: `Please wait ${wait} more second${wait === 1 ? "" : "s"} before asking the AI again.`,
      retryAfterSeconds: wait,
    };
  }

  return { ok: true, usage };
}

/*
 * Claims the one in-flight slot this person has.
 *
 * NX means the write only happens if nobody holds it, which is what turns three
 * impatient clicks into one Gemini call. The expiry is the improvement over the
 * in-memory Set it replaces: if a request dies between begin and end, the lock
 * clears itself in a minute instead of shutting that person out until the
 * process restarts.
 */
async function begin(userId) {
  const claimed = await withRedis(
    async (redis) => {
      const ok = await redis.set(LOCK_KEY(userId), "1", { NX: true, EX: 60 });
      return ok === "OK";
    },
    null
  );

  if (claimed === null) {
    if (inFlight.has(userId)) return false;
    inFlight.add(userId);
    return true;
  }
  return claimed;
}

/*
 * Counts one request against the allowance.
 *
 * Only called for a request that actually reached Gemini. One refused by the
 * cooldown, or answered from the cache, should not use up someone's hour.
 *
 * The member carries a random suffix because two calls in the same millisecond
 * would otherwise be one member in the set, and the second would not count.
 */
async function record(userId) {
  const now = Date.now();
  const stored = await withRedis(async (redis) => {
    const key = HISTORY_KEY(userId);
    await redis.zAdd(key, { score: now, value: `${now}-${crypto.randomBytes(4).toString("hex")}` });
    await redis.expire(key, Math.ceil(DAY_MS / 1000));
    return true;
  }, false);

  if (!stored) {
    const times = memoryTimestamps(userId);
    times.push(now);
    history.set(userId, times);
  }
}

async function end(userId) {
  const released = await withRedis(async (redis) => {
    await redis.del(LOCK_KEY(userId));
    return true;
  }, false);
  if (!released) inFlight.delete(userId);
}

/* ---------- the answer cache ---------- */

/*
 * A fingerprint of everything that would change the answer.
 *
 * Hashed rather than stored whole: these keys hold source code, and a store of
 * full submissions is a liability for no benefit. It stays synchronous because
 * it is pure arithmetic, and because it is used to build a key before anything
 * is asked of Redis.
 */
function fingerprint(parts) {
  return crypto.createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

async function cached(key) {
  const hit = await withRedis(async (redis) => {
    const raw = await redis.get(ANSWER_KEY(key));
    return raw ? JSON.parse(raw) : null;
  }, undefined);

  if (hit !== undefined) return hit;

  const local = cache.get(key);
  if (!local) return null;
  if (Date.now() - local.at > CONFIG.cacheTtlMs) {
    cache.delete(key);
    return null;
  }
  return local.value;
}

async function remember(key, value) {
  const stored = await withRedis(async (redis) => {
    // Redis expires it on its own, so there is no sweep to write and no cap to
    // enforce: an answer nobody asks for again simply stops existing.
    await redis.set(ANSWER_KEY(key), JSON.stringify(value), {
      EX: Math.ceil(CONFIG.cacheTtlMs / 1000),
    });
    return true;
  }, false);

  if (!stored) {
    // A plain cap, oldest out first. Map keeps insertion order, so the first
    // key is the oldest.
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    cache.set(key, { at: Date.now(), value });
  }
}

// Reported by the health endpoint, so it is possible to tell at a glance
// whether limits are surviving restarts or only living in this process.
function backend() {
  const redis = redisStatus();
  return { ...redis, store: redis.connected ? "redis" : "memory" };
}

module.exports = {
  CONFIG,
  check,
  begin,
  record,
  end,
  usageFor,
  fingerprint,
  cached,
  remember,
  backend,
};
