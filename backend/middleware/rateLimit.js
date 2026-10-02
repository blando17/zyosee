/*
 * A small sliding-window rate limiter, for the routes that let someone in.
 *
 * WHY THIS IS NOT express-rate-limit
 *
 * Not because the library is bad — it is the obvious choice and it is better
 * tested than this. It is because what these routes actually need is two
 * limiters with different keys and different ceilings running on one request,
 * and because this service already hand-rolls exactly this in the compiler
 * (see compiler/aiLimits.js, which guards the AI quota the same way). One
 * pattern, in two places, beats a dependency in one and a hand-rolled version
 * in the other.
 *
 * WHY IT IS IN MEMORY
 *
 * The accounts API is a single `node index.js`. There is no cluster, no second
 * instance and no load balancer in front of it, so a Map in this process sees
 * every request there is. The honest cost is that a restart forgives every
 * counter — which matters a great deal for a paid API quota, and very little
 * here, because an attacker cannot make this process restart.
 *
 * If this is ever run as more than one process, this becomes per-process and
 * the real limit becomes N times what is configured. The fix at that point is
 * to move the store to Redis, keeping everything else; the shape below is
 * deliberately the shape a Redis sorted set would have.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * It does not read X-Forwarded-For. Nothing sets `trust proxy` on this app, so
 * `req.ip` is the socket's own address and cannot be forged. Turning proxy
 * trust on without a proxy actually in front would let any caller claim any
 * address in a header and walk straight past every limit here — a limiter that
 * can be bypassed by typing is worse than none, because it reads as protection.
 * If this is ever deployed behind nginx or a platform router, set `trust proxy`
 * to that proxy specifically, never to `true`.
 */

/*
 * How many distinct keys one limiter will track.
 *
 * This is a limiter, so it is itself a target: a script posting a million
 * different email addresses would otherwise grow the Map until the process ran
 * out of memory — denial of service through the thing meant to prevent it.
 * Past the cap, the least recently touched keys are dropped. Dropping a key is
 * safe in the direction that matters: the worst case is that an attacker who
 * has already flooded a hundred thousand buckets gets their counter forgotten,
 * which is the same position they would be in without a limiter at all.
 */
const MAX_KEYS = Number(process.env.RATE_LIMIT_MAX_KEYS) || 20000;

// A full sweep every so many requests, so expired keys are collected without a
// background timer holding the process open.
const SWEEP_EVERY = 500;

/*
 * The address a request came from, as a bucket.
 *
 * Two normalisations, both so that one attacker is one bucket:
 *
 *   ::ffff:1.2.3.4 is how an IPv4 client appears on a dual-stack socket. Left
 *   alone it would be a different bucket from 1.2.3.4 arriving another way.
 *
 *   IPv6 is truncated to its /64. A home or hosting IPv6 allocation is a /64 at
 *   minimum and often far larger, so limiting an exact v6 address limits one of
 *   the billions of addresses the same machine can pick from at will.
 */
function addressKey(req) {
  let ip = req.ip || req.socket?.remoteAddress || "unknown";

  if (ip.startsWith("::ffff:")) ip = ip.slice(7);

  if (ip.includes(":")) {
    const groups = ip.split(":");
    return `${groups.slice(0, 4).join(":")}::/64`;
  }
  return ip;
}

/*
 * Builds one limiter.
 *
 *   key        what to count against — an address, an email, anything
 *   max        how many hits are allowed in the window
 *   windowMs   how long the window is
 *   countWhen  given the finished response, whether this request should count.
 *              This is what lets a limiter watch for FAILURES only, which it
 *              cannot know until the handler has answered.
 *   message    what the caller is told when they are over
 */
function createLimiter({ key, max, windowMs, countWhen = null, message }) {
  // key -> array of timestamps, oldest first. Insertion order doubles as
  // recency, which is what makes the eviction below least-recently-used.
  const hits = new Map();
  let since = 0;

  function recent(k, now) {
    const kept = (hits.get(k) || []).filter((at) => now - at < windowMs);
    if (kept.length) {
      // Re-inserted so this key moves to the end and survives eviction longest.
      hits.delete(k);
      hits.set(k, kept);
    } else {
      hits.delete(k);
    }
    return kept;
  }

  function sweep(now) {
    for (const [k, times] of hits) {
      if (!times.some((at) => now - at < windowMs)) hits.delete(k);
    }
    // Still too many live keys: drop the oldest-touched until it fits.
    while (hits.size > MAX_KEYS) {
      const oldest = hits.keys().next().value;
      if (oldest === undefined) break;
      hits.delete(oldest);
    }
  }

  return function limiter(req, res, next) {
    const now = Date.now();

    since += 1;
    if (since >= SWEEP_EVERY) {
      since = 0;
      sweep(now);
    }

    const k = key(req);
    // A request we cannot attribute is let through rather than counted against
    // everybody else — a missing email is the body validator's problem, and
    // bucketing every one of them together would let one bad client lock out
    // every other malformed request.
    if (!k) return next();

    const times = recent(k, now);

    if (times.length >= max) {
      const retryAfterMs = windowMs - (now - times[0]);
      const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      res.set("Retry-After", String(seconds));
      return res.status(429).json({ message: message(seconds) });
    }

    /*
     * Counted when the response is finished, not now.
     *
     * `countWhen` needs the status code to decide, and a limiter that charged
     * for the request up front would charge for successful sign-ins too. Forty
     * students logging in from one lecture theatre share one NAT address; if
     * their successes counted, the fortieth would be refused for the crime of
     * arriving last.
     */
    res.on("finish", () => {
      if (countWhen && !countWhen(res)) return;
      const at = Date.now();
      const current = hits.get(k) || [];
      current.push(at);
      hits.delete(k);
      hits.set(k, current);
      if (hits.size > MAX_KEYS) sweep(at);
    });

    return next();
  };
}

module.exports = { createLimiter, addressKey };
