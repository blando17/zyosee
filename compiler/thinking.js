/*
 * Thinking boards and plans, stored per person per problem.
 *
 * Why MongoDB and not Redis, since Redis is right there:
 *
 * Redis in this service holds the rate-limit windows, the in-flight lock, the
 * answer cache and the submission queue. Every one of those is either
 * short-lived or rebuildable — flush Redis and the judge carries on, having
 * lost nothing anybody would miss. That is what makes it safe to run Redis as
 * a cache, and it is exactly the property a thinking board does not have. A
 * board is something a person made. Losing it to a flushed cache or a
 * recreated volume would be losing their work.
 *
 * It is also the wrong shape for memory. Redis keeps everything in RAM, and a
 * board is read perhaps twice in a session and then not again for days. Paying
 * for the fastest storage in the stack to hold cold data that must never be
 * evicted is the opposite of what a cache is for.
 *
 * So it lives here, beside the accounts, problems and submissions it belongs
 * with: one small document per person per problem, keyed by both.
 *
 * The browser keeps its own copy in localStorage as well. That is not a second
 * source of truth — it is what makes the board appear instantly instead of
 * after a round trip, what keeps it working with no network, and the only
 * store there is for somebody who has not signed in. Whichever copy has the
 * later `updatedAt` wins.
 */

const { connectClient } = require("./db");

/*
 * A ceiling on one board, chosen to sit under the service's public body limit
 * of 256 KB rather than above it.
 *
 * That ordering is the whole point. Whichever limit is lower is the one a
 * person actually meets, and a body parser rejecting a request produces an
 * error the page cannot explain, while this produces a sentence telling them
 * what to do about it. Giving this route a larger parser instead would mean a
 * third parser and a bigger buffer reachable from the browser, to support
 * boards nobody draws.
 *
 * For scale: a stroke is a few hundred bytes, so this holds several hundred
 * detailed strokes or thousands of short ones. Nothing is lost when it is hit
 * either — the browser's own copy still has everything.
 */
const MAX_BYTES = 192 * 1024;

let indexed = false;

async function collection() {
  const db = await connectClient();
  const boards = db.collection("thinking");

  if (!indexed) {
    indexed = true;
    // One board per person per problem, enforced rather than assumed.
    boards.createIndex({ userId: 1, slug: 1 }, { unique: true }).catch((err) => {
      indexed = false;
      console.error("Could not create the thinking index:", err.message);
    });
  }
  return boards;
}

const SHAPE_KINDS = new Set(["line", "arrow", "rect", "ellipse", "diamond"]);

function clean(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && (item.type === "stroke" || item.type === "text" || item.type === "shape"))
    .map((item) =>
      item.type === "shape"
        ? {
            type: "shape",
            // An unknown kind becomes a line rather than being dropped: the
            // browser is the only thing that writes these, so a strange value
            // means a version mismatch, and losing the object entirely would
            // be a worse answer than drawing it plainly.
            kind: SHAPE_KINDS.has(item.kind) ? item.kind : "line",
            colour: String(item.colour || "#1a130d").slice(0, 32),
            width: Number(item.width) || 4,
            x1: Number(item.x1) || 0,
            y1: Number(item.y1) || 0,
            x2: Number(item.x2) || 0,
            y2: Number(item.y2) || 0,
          }
        : item.type === "text"
        ? {
            type: "text",
            colour: String(item.colour || "#1a130d").slice(0, 32),
            size: Number(item.size) || 40,
            x: Number(item.x) || 0,
            y: Number(item.y) || 0,
            text: String(item.text || "").slice(0, 400),
          }
        : {
            type: "stroke",
            colour: String(item.colour || "#1a130d").slice(0, 32),
            width: Number(item.width) || 4,
            points: (Array.isArray(item.points) ? item.points : [])
              .map(Number)
              .filter(Number.isFinite),
          }
    );
}

const PLAN_FIELDS = ["approach", "timeComplexity", "spaceComplexity", "insights", "edgeCases"];

function cleanPlan(plan) {
  const out = {};
  for (const field of PLAN_FIELDS) {
    out[field] = String((plan && plan[field]) || "").slice(0, 4000);
  }
  return out;
}

async function load(userId, slug) {
  const boards = await collection();
  const doc = await boards.findOne(
    { userId: String(userId), slug },
    { projection: { _id: 0, items: 1, plan: 1, updatedAt: 1 } }
  );
  return doc || null;
}

/*
 * Writes a board, unless what is already stored is newer.
 *
 * `updatedAt` comes from the client, because the client is where the edit
 * happened and two devices may both have been edited offline. Last write wins,
 * which is the right rule for one person's own notes: there is no second
 * author to lose an edit to, and a merge dialogue over a doodle would be
 * absurd.
 */
async function save(userId, slug, { items, plan, updatedAt }) {
  const cleaned = { items: clean(items), plan: cleanPlan(plan) };

  const size = Buffer.byteLength(JSON.stringify(cleaned));
  if (size > MAX_BYTES) {
    const err = new Error(
      `That board is ${Math.round(size / 1024)} KB, over the ${MAX_BYTES / 1024} KB limit. ` +
        `Erase some of it, or clear the board and start again.`
    );
    err.tooLarge = true;
    throw err;
  }

  const stamp = new Date(updatedAt || Date.now());
  const when = Number.isFinite(stamp.getTime()) ? stamp : new Date();

  const boards = await collection();
  const key = { userId: String(userId), slug };

  /*
   * Update first, insert only if there was nothing there. Deliberately NOT one
   * upsert with the freshness condition in its filter.
   *
   * That was the first attempt and it is a trap: when the stored copy is the
   * newer one the filter matches nothing, so Mongo tries to INSERT instead —
   * which then trips the unique index on (userId, slug) and surfaces as a
   * duplicate key error. A stale write is an ordinary, expected outcome, and
   * it has to read as one rather than as a database failure.
   */
  const updated = await boards.updateOne(
    { ...key, $or: [{ updatedAt: { $lt: when } }, { updatedAt: null }] },
    { $set: { ...cleaned, updatedAt: when } }
  );
  if (updated.matchedCount > 0) return { written: true, bytes: size };

  // Nothing was updated: either there is no board yet, or the stored one is
  // newer. Only the first is something to write.
  if (await boards.countDocuments(key, { limit: 1 })) return { written: false, bytes: size };

  try {
    await boards.insertOne({ ...key, ...cleaned, updatedAt: when });
    return { written: true, bytes: size };
  } catch (err) {
    // Another request inserted between the check and here. Whatever it wrote
    // is at least as new as this, so treat it the same as a stale write.
    if (err.code === 11000) return { written: false, bytes: size };
    throw err;
  }
}

async function remove(userId, slug) {
  await (await collection()).deleteOne({ userId: String(userId), slug });
}

module.exports = { load, save, remove, MAX_BYTES };
