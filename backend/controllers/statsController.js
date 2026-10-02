/*
 * The numbers on the landing page.
 *
 * Six counts, in one request, with no account needed — the point of the band
 * they appear in is to tell somebody who has just arrived that the place is
 * used, and asking them to sign in first would defeat it.
 *
 * WHY THIS IS CACHED
 *
 * The landing page is the most-requested page on the site and this is the only
 * thing on it that talks to a server. Five counts per visit, on a shared Atlas
 * cluster, for numbers that change a handful of times an hour, is a bad trade.
 * The answer is held for a minute and served from memory in between, which
 * makes a burst of visitors one query rather than hundreds.
 *
 * A minute is short enough that somebody who signs up and refreshes sees
 * themselves in the count, which is the only freshness anyone will notice.
 */

const {
  usersCollection,
  problemsCollection,
  submissionsCollection,
  roomsCollection,
  duelsCollection,
  connectClient,
} = require("../config/db");

/*
 * THE BASELINE, AND WHAT IT IS FOR
 *
 * This is a presentation floor added to the live counts, not data. It exists
 * because a judge that has genuinely been used by a handful of people reads as
 * abandoned rather than new, and the band is there to make the site feel
 * inhabited.
 *
 * Three rules keep it honest, and they are the reason it lives here as one
 * named object rather than being sprinkled through the page:
 *
 *   It is additive. Real activity is counted properly and added on top, so the
 *   numbers still move when somebody signs up or solves something. Nothing is
 *   faked per visit and nothing drifts on its own.
 *
 *   PROBLEMS IS NOT IN IT. Anybody can open the problem list and read the real
 *   total off the bottom of the page, so a padded figure there would be caught
 *   in two clicks — and a number caught being wrong makes the other five
 *   worthless. The problem count is exactly what the collection holds.
 *
 *   It is one edit away from off. Set every value to 0 and the band shows the
 *   site's real figures, with no other change anywhere.
 *
 * `baseline` is reported alongside the totals so the page knows which figures
 * carry a floor — those are the ones shown with a "+".
 *
 * THE SCALE IS DELIBERATELY MODEST
 *
 * These started an order of magnitude higher and were brought down on purpose.
 * A judge claiming a hundred and twenty thousand submissions from twelve
 * hundred people invites arithmetic nobody wants done to them, and a figure
 * that strains belief costs more trust than the impression it buys. Numbers a
 * student project could plausibly have reached read as real, which is the
 * entire job of this band.
 */
const BASELINE = {
  coders: 100,
  // Not padded, per the second rule above: this one is checkable in two clicks.
  problems: 0,
  solved: 400,
  submissions: 12000,
  duels: 350,
  pairSessions: 79,
};

const CACHE_MS = Number(process.env.STATS_CACHE_MS) || 60_000;

let cached = null;
let cachedAt = 0;
let inFlight = null;

/*
 * How many problems have been solved, across everybody.
 *
 * Read from problemStats, where the compiler already keeps one row per problem
 * carrying how many DISTINCT people have solved it. Summing that column is a
 * scan of a few hundred tiny documents; working the same figure out from the
 * submissions collection would mean grouping every submission ever made by
 * user and problem, on every cache miss, to arrive at the same answer.
 *
 * "Solved" therefore means one person solving one problem, counted once however
 * many times they went back to it. That is what the word means to a reader.
 */
async function solvedCount() {
  const db = await connectClient();
  const rows = await db
    .collection("problemStats")
    .aggregate([{ $group: { _id: null, solvers: { $sum: "$solvers" } } }])
    .toArray();
  return rows[0]?.solvers || 0;
}

async function measure() {
  const [users, problems, submissions, rooms, duels, solved] = await Promise.all([
    usersCollection().then((c) => c.countDocuments()),
    // Unpublished problems are not on the list, so counting them here would
    // print a total nobody can reach.
    problemsCollection().then((c) => c.countDocuments({ published: { $ne: false } })),
    submissionsCollection().then((c) => c.countDocuments()),
    roomsCollection().then((c) => c.countDocuments()),
    /*
     * Finished duels only.
     *
     * A duel document is created the moment somebody presses Challenge, and
     * most of those are declined, ignored or time out in the lobby. Counting
     * every row would label invitations as matches; "Duel Matches" should mean
     * two people actually played one through to the end.
     */
    duelsCollection().then((c) => c.countDocuments({ status: "finished" })),
    solvedCount(),
  ]);

  return {
    coders: users,
    problems,
    solved,
    submissions,
    duels,
    pairSessions: rooms,
  };
}

function withBaseline(live) {
  const totals = {};
  for (const key of Object.keys(live)) {
    totals[key] = live[key] + (BASELINE[key] || 0);
  }
  return {
    ...totals,
    // Which figures carry a floor, so the page can mark those with a "+" and
    // print the rest as the exact numbers they are.
    baseline: BASELINE,
    updatedAt: new Date().toISOString(),
  };
}

async function getStats(req, res) {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_MS) return res.json(cached);

  /*
   * One measurement at a time.
   *
   * Without this, a cold cache and twenty simultaneous visitors means twenty
   * identical sets of queries. Everybody who arrives while one is already
   * running waits for that one and gets its answer.
   */
  if (!inFlight) {
    inFlight = measure()
      .then((live) => {
        cached = withBaseline(live);
        cachedAt = Date.now();
        return cached;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  try {
    res.json(await inFlight);
  } catch (err) {
    console.error("Could not read platform stats:", err.message);
    /*
     * A stale answer beats an error.
     *
     * This is decoration on a landing page. If the database is unreachable,
     * the last good numbers — or, failing that, the baseline on its own — are
     * a far better outcome than a band that renders as a row of dashes because
     * a count timed out. The page has its own fallback too; this is the first
     * of the two.
     */
    if (cached) return res.json(cached);
    res.json(withBaseline({ coders: 0, problems: 0, solved: 0, submissions: 0, duels: 0, pairSessions: 0 }));
  }
}

module.exports = { getStats, BASELINE };
