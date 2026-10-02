/*
 * Submission history, and everything derived from it.
 *
 * Until now a verdict lived only in Redis, under the job's id, with a TTL.
 * That is all a solver waiting for an answer needs, and nothing else could be
 * built on it: "have I solved this?" and "how many people get this right?" are
 * both questions about submissions that happened days ago.
 *
 * So every judged submission is written here. Three collections, each with one
 * job:
 *
 *   submissions   the log. One row per judged submission, for ever.
 *   problemStats  per-problem counters, so the problem list costs one query
 *                 instead of an aggregation over the log.
 *   favourites    which problems a solver starred.
 *
 * Why the counters are their own collection rather than a field on the problem:
 * problems.js caches problem documents and invalidates on `updatedAt`. Bumping
 * a counter on the problem document would either leave the cache serving stale
 * numbers, or touch `updatedAt` on every submission and throw the whole cache
 * away several times a minute. Problems are content and barely change; counters
 * change constantly. They do not belong in the same document.
 *
 * The code itself is deliberately NOT stored. Nothing here needs it, it is the
 * largest part of a submission by far, and keeping every draft anyone ever sent
 * is a liability rather than a feature. What is kept is the verdict and how it
 * scored.
 */

const { connectClient } = require("./db");

const ACCEPTED = "accepted";

/*
 * Verdicts that mean the judge actually ran the solution against the tests.
 *
 * A submission that failed to compile, or that the server dropped, is not an
 * attempt at the problem in any sense a solver would recognise, and counting it
 * against their acceptance rate would be unfair. It is still logged.
 */
const JUDGED = new Set([
  ACCEPTED,
  "wrong_answer",
  "time_limit_exceeded",
  "runtime_error",
  "output_limit_exceeded",
  "memory_limit_exceeded",
]);

let indexed = false;

async function collections() {
  const db = await connectClient();
  const submissions = db.collection("submissions");
  const stats = db.collection("problemStats");
  const favourites = db.collection("favourites");

  if (!indexed) {
    indexed = true;
    // Built once per process, in the background: a missing index makes the
    // queries slow, not wrong, so this must never block a submission.
    Promise.all([
      submissions.createIndex({ userId: 1, slug: 1 }),
      submissions.createIndex({ userId: 1, createdAt: -1 }),
      submissions.createIndex({ slug: 1, createdAt: -1 }),
      // Scoring a duel is one query for every submission carrying its id.
      // Sparse: almost no submission belongs to a duel, and indexing the nulls
      // would be an entry per row for nothing.
      submissions.createIndex({ duelId: 1, createdAt: 1 }, { sparse: true }),
      favourites.createIndex({ userId: 1, slug: 1 }, { unique: true }),
    ]).catch((err) => {
      indexed = false;
      console.error("Could not create submission indexes:", err.message);
    });
  }

  return { submissions, stats, favourites };
}

/*
 * Writes one judged submission.
 *
 * Called from both judging paths — the worker, and the inline judge the API
 * falls back to when Redis is down — so history does not depend on which one
 * ran.
 *
 * It never throws. A submission that was judged correctly must still be
 * returned to the solver even if the database is unreachable; losing a row of
 * history is a smaller failure than losing the verdict.
 */
async function record({ userId, slug, language, result, duelId = null }) {
  if (!userId || !slug || !result) return;

  try {
    const { submissions, stats } = await collections();
    const verdict = String(result.verdict || "server_error");
    const counted = JUDGED.has(verdict);

    await submissions.insertOne({
      userId: String(userId),
      slug,
      language,
      verdict,
      passed: Number(result.passed) || 0,
      total: Number(result.total) || 0,
      runtimeMs: Number(result.maxRunMs) || 0,
      /*
       * Which duel this belonged to, if any.
       *
       * Set only after duelGate has checked the claim against the duel itself,
       * so it cannot be asserted by a browser. This single field is what a
       * duel's scores are computed from — there is no separate score anybody
       * writes — which is why it is stamped here, on the row the judge creates,
       * rather than reported afterwards by the page that made it.
       *
       * A duel submission is still an ordinary submission in every other way.
       * It counts towards the solver's own progress and the problem's
       * acceptance rate, because they really did solve it.
       */
      duelId: duelId ? String(duelId) : null,
      createdAt: new Date(),
    });

    if (!counted) return;

    /*
     * A solver counts once however many times they solve it.
     *
     * Asked after the insert: if this user now has exactly one accepted
     * submission for this problem, the one just written was their first.
     */
    let newSolver = 0;
    if (verdict === ACCEPTED) {
      const mine = await submissions.countDocuments({
        userId: String(userId),
        slug,
        verdict: ACCEPTED,
      });
      if (mine === 1) newSolver = 1;
    }

    await stats.updateOne(
      { _id: slug },
      {
        $inc: {
          submissions: 1,
          accepted: verdict === ACCEPTED ? 1 : 0,
          solvers: newSolver,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error(`Could not record submission for ${slug}:`, err.message);
  }
}

/*
 * The counters for every problem, keyed by slug.
 *
 * Returned as a plain object because the caller stitches it onto a list of
 * problems, and a problem with no submissions yet has no row here at all.
 */
async function allStats() {
  try {
    const { stats } = await collections();
    const rows = await stats.find({}).toArray();
    const bySlug = {};
    for (const row of rows) {
      const submissions = row.submissions || 0;
      const accepted = row.accepted || 0;
      bySlug[row._id] = {
        submissions,
        accepted,
        solvers: row.solvers || 0,
        // Null rather than 0 when nobody has tried it. "0% accepted" and "not
        // attempted yet" look identical otherwise, and mean opposite things.
        acceptance: submissions ? accepted / submissions : null,
      };
    }
    return bySlug;
  } catch (err) {
    console.error("Could not read problem stats:", err.message);
    return {};
  }
}

/*
 * One user's standing across every problem.
 *
 * Solved is what it sounds like. Attempted is a problem they have submitted to
 * and not yet solved — so the two never overlap, and a problem they solved on
 * their fourth try is solved, not attempted.
 *
 * Note that "attempted" counts a submission that failed to compile, while the
 * problem's acceptance rate does not. That is deliberate, because the two
 * answer different questions. A problem's acceptance rate measures how hard it
 * is to get right, and a submission that never ran says nothing about that.
 * Whether somebody has started a problem is about them, and sending code that
 * did not compile is unmistakably having started.
 */
async function progressFor(userId) {
  const empty = { solved: [], attempted: [], favourites: [], lastSolved: {}, lastTried: {} };
  if (!userId) return empty;

  try {
    const { submissions, favourites } = await collections();
    const id = String(userId);

    /*
     * One pass over this user's submissions, grouped by problem.
     *
     * This used to be three `distinct` calls. It is one aggregate now because
     * the list needs more than which problems were solved — it needs WHEN, so
     * it can say "solved two days ago" — and asking separately for each fact
     * would be three scans of the same rows.
     */
    const [rows, starred] = await Promise.all([
      submissions
        .aggregate([
          { $match: { userId: id } },
          {
            $group: {
              _id: "$slug",
              lastTried: { $max: "$createdAt" },
              // $max over "accepted ? date : null" is the latest accepted date,
              // and null for a problem that has never been solved.
              lastSolved: {
                $max: { $cond: [{ $eq: ["$verdict", ACCEPTED] }, "$createdAt", null] },
              },
            },
          },
        ])
        .toArray(),
      favourites.distinct("slug", { userId: id }),
    ]);

    const solved = [];
    const attempted = [];
    const lastSolved = {};
    const lastTried = {};

    for (const row of rows) {
      if (row.lastTried) lastTried[row._id] = row.lastTried;
      if (row.lastSolved) {
        solved.push(row._id);
        lastSolved[row._id] = row.lastSolved;
      } else {
        attempted.push(row._id);
      }
    }

    return { solved, attempted, favourites: starred, lastSolved, lastTried };
  } catch (err) {
    console.error("Could not read progress:", err.message);
    return empty;
  }
}

/*
 * One user's own record: their last few submissions, and their totals.
 *
 * The acceptance figure uses the same rule as a problem's — submissions that
 * never ran are left out of both halves of the fraction — so a solver's own
 * rate is measured the same way as the rates they see beside each problem.
 */
async function activityFor(userId, limit = 12) {
  const empty = { recent: [], totals: { submissions: 0, judged: 0, accepted: 0 } };
  if (!userId) return empty;

  try {
    const { submissions } = await collections();
    const id = String(userId);

    const [recent, summary] = await Promise.all([
      submissions
        .find(
          { userId: id },
          { projection: { _id: 0, slug: 1, language: 1, verdict: 1, passed: 1, total: 1, createdAt: 1 } }
        )
        .sort({ createdAt: -1 })
        .limit(Math.min(Number(limit) || 12, 50))
        .toArray(),
      submissions
        .aggregate([
          { $match: { userId: id } },
          {
            $group: {
              _id: null,
              submissions: { $sum: 1 },
              judged: { $sum: { $cond: [{ $in: ["$verdict", [...JUDGED]] }, 1, 0] } },
              accepted: { $sum: { $cond: [{ $eq: ["$verdict", ACCEPTED] }, 1, 0] } },
            },
          },
        ])
        .toArray(),
    ]);

    const totals = summary[0] || {};
    return {
      recent,
      totals: {
        submissions: totals.submissions || 0,
        judged: totals.judged || 0,
        accepted: totals.accepted || 0,
      },
    };
  } catch (err) {
    console.error("Could not read activity:", err.message);
    return empty;
  }
}

/*
 * Everything the progress page is built from, in one request.
 *
 * Two rules shaped this.
 *
 * Only submissions that RAN are counted, the same rule the acceptance rate
 * already uses. A submission that failed to compile is not an attempt at the
 * problem in any sense worth measuring, and counting it would quietly punish
 * somebody for a missing semicolon.
 *
 * Nothing here is bucketed by day. Calendar days depend on the viewer's
 * timezone, and this process runs in a container set to UTC, so a streak
 * computed here would break at midnight for anybody not on UTC. The raw
 * moments travel instead and the browser, which knows what day it is where the
 * person is sitting, does the bucketing.
 */
async function statsFor(userId) {
  const empty = { totals: { submissions: 0, judged: 0, accepted: 0 }, problems: {} };
  if (!userId) return empty;

  try {
    const { submissions } = await collections();
    const id = String(userId);

    const [rows, totals] = await Promise.all([
      submissions
        .aggregate([
          { $match: { userId: id, verdict: { $in: [...JUDGED] } } },
          { $sort: { createdAt: 1 } },
          {
            $group: {
              _id: "$slug",
              firstAt: { $first: "$createdAt" },
              runs: { $push: { ok: { $eq: ["$verdict", ACCEPTED] }, at: "$createdAt" } },
            },
          },
        ])
        .toArray(),
      submissions
        .aggregate([
          { $match: { userId: id } },
          {
            $group: {
              _id: null,
              submissions: { $sum: 1 },
              judged: { $sum: { $cond: [{ $in: ["$verdict", [...JUDGED]] }, 1, 0] } },
              accepted: { $sum: { $cond: [{ $eq: ["$verdict", ACCEPTED] }, 1, 0] } },
            },
          },
        ])
        .toArray(),
    ]);

    const problems = {};
    for (const row of rows) {
      const runs = row.runs || [];
      const firstWin = runs.findIndex((run) => run.ok);

      problems[row._id] = {
        firstTriedAt: row.firstAt,
        attempts: runs.length,
        // Attempts UP TO the solve, not in total. Going back to a solved
        // problem to try a neater version should not make it look harder than
        // it was.
        attemptsToSolve: firstWin === -1 ? null : firstWin + 1,
        firstSolvedAt: firstWin === -1 ? null : runs[firstWin].at,
        lastSolvedAt: firstWin === -1 ? null : runs.filter((r) => r.ok).pop().at,
        // Wall clock from the first attempt to the first accept. It is honest
        // about what it measures and nothing more: somebody who opens a
        // problem, goes to lunch and comes back is counted as having taken an
        // hour. The page reports the median for that reason.
        timeToSolveMs:
          firstWin === -1 ? null : new Date(runs[firstWin].at) - new Date(row.firstAt),
      };
    }

    const summary = totals[0] || {};
    return {
      totals: {
        submissions: summary.submissions || 0,
        judged: summary.judged || 0,
        accepted: summary.accepted || 0,
      },
      problems,
    };
  } catch (err) {
    console.error("Could not read stats:", err.message);
    return empty;
  }
}

async function setFavourite(userId, slug, starred) {
  const { favourites } = await collections();
  const id = String(userId);
  if (starred) {
    await favourites.updateOne(
      { userId: id, slug },
      { $setOnInsert: { userId: id, slug, createdAt: new Date() } },
      { upsert: true }
    );
  } else {
    await favourites.deleteOne({ userId: id, slug });
  }
  return starred;
}

/*
 * Rebuilds every counter from the log.
 *
 * The counters are maintained incrementally, which is fast but drifts if a
 * write is ever lost. This recomputes them from the submissions themselves,
 * which are the record of what actually happened.
 */
async function rebuildStats() {
  const { submissions, stats } = await collections();

  const rows = await submissions
    .aggregate([
      { $match: { verdict: { $in: [...JUDGED] } } },
      {
        $group: {
          _id: "$slug",
          submissions: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ["$verdict", ACCEPTED] }, 1, 0] } },
          solverIds: {
            $addToSet: { $cond: [{ $eq: ["$verdict", ACCEPTED] }, "$userId", "$$REMOVE"] },
          },
        },
      },
    ])
    .toArray();

  await stats.deleteMany({});
  if (rows.length) {
    await stats.insertMany(
      rows.map((r) => ({
        _id: r._id,
        submissions: r.submissions,
        accepted: r.accepted,
        solvers: r.solverIds.length,
      }))
    );
  }
  return rows.length;
}

module.exports = { record, allStats, progressFor, activityFor, statsFor, setFavourite, rebuildStats };
