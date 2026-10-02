/*
 * Duel Arena: two people, the same problems, the same clock.
 *
 * A duel is a small record — who, which problems, how long — and everything
 * interesting about it is derived rather than stored. The scores are not a
 * field anybody writes; they are computed from the submissions the judge
 * already recorded, every time they are asked for. That is the whole reason
 * this is trustworthy: there is no path by which a score can be set except by
 * actually submitting code and having it judged.
 *
 * WHO WRITES WHAT
 *
 *   duels        this file, and nothing else.
 *   submissions  the compiler service, and nothing else. It stamps `duelId`
 *                on a submission after checking the duel is real, live, and
 *                one the submitter is actually in.
 *
 * So a player cannot forge a score by talking to this API, and cannot forge a
 * duel by talking to the compiler. Each service owns one half and reads the
 * other.
 *
 * WHAT IS HIDDEN, AND WHEN
 *
 * A duel is only fair if both people meet the problems at the same moment.
 * `visible()` below is the single place that decides what a viewer may see,
 * and before the match starts it does not send the statements — not "hides
 * them in the interface", does not send them. A custom duel does name its
 * problems at challenge time, because agreeing to a match without being told
 * what is in it is not a choice worth offering; the statements still arrive
 * only at GO.
 */

const { ObjectId } = require("mongodb");
const {
  duelsCollection,
  usersCollection,
  problemsCollection,
  friendshipsCollection,
  submissionsCollection,
} = require("../config/db");
const { scoreDuel, ratingChange, START_RATING, pointsFor } = require("../services/duelScoring");
const { duelChanged } = require("../realtime/duelEvents");

const MIN_PROBLEMS = 1;
const MAX_PROBLEMS = 3;
const MIN_DURATION_MIN = 10;
const MAX_DURATION_MIN = 60;
const RANDOM_DURATION_MIN = 30;
// The quick-match recipe, named once so the card in the interface and the
// picker here cannot drift apart.
const RANDOM_RECIPE = [
  { difficulty: "Easy", count: 2 },
  { difficulty: "Medium", count: 1 },
];
const LANGUAGES = new Set(["cpp", "c", "java", "py"]);

/*
 * A challenge nobody answered should not sit in an inbox for ever, and a duel
 * that was accepted but never started should not block the next one. Both are
 * swept lazily, on read, rather than by a background job: there is no worker
 * in this service to put one in, and a stale row only matters to somebody
 * looking at it.
 */
const CHALLENGE_TTL_MS = 24 * 60 * 60 * 1000;
const LOBBY_TTL_MS = 30 * 60 * 1000;

const JUDGED = new Set([
  "accepted",
  "wrong_answer",
  "time_limit_exceeded",
  "runtime_error",
  "output_limit_exceeded",
  "memory_limit_exceeded",
]);

function oid(value) {
  return ObjectId.isValid(String(value)) ? new ObjectId(String(value)) : null;
}

async function areFriends(a, b) {
  const friendships = await friendshipsCollection();
  const pairKey = [String(a), String(b)].sort().join(":");
  return Boolean(await friendships.findOne({ pairKey, status: "accepted" }));
}

/* Usernames and ratings for a handful of ids, in one query. */
async function peopleByIds(ids) {
  const users = await usersCollection();
  const rows = await users
    .find({ _id: { $in: ids.map(oid).filter(Boolean) } })
    .project({ username: 1, duelRating: 1 })
    .toArray();

  const byId = new Map();
  for (const row of rows) {
    byId.set(String(row._id), {
      id: String(row._id),
      username: row.username,
      // Absent until somebody finishes their first duel, so it is defaulted
      // here rather than backfilled onto every account that will never duel.
      rating: row.duelRating ?? START_RATING,
    });
  }
  return byId;
}

/* ------------------------------------------------------------------ *
 * Choosing the problems
 * ------------------------------------------------------------------ */

/*
 * Random duels draw from the same problem set as everything else.
 *
 * $sample rather than fetching every slug and shuffling in Node: the choice is
 * made by the database over an index, and nothing that is not chosen is ever
 * sent over the wire.
 *
 * The problems are chosen HERE, when the challenge is created, and simply not
 * revealed until the match starts. Choosing them at GO would be truer to the
 * words "selected when the match begins" and worse in every practical way: it
 * puts a query that can fail at the one moment both players are watching a
 * countdown, and it makes "does this duel have enough problems to be playable"
 * a question nobody can answer until it is too late to say so.
 */
async function drawRandomProblems() {
  const problems = await problemsCollection();
  const picked = [];

  for (const { difficulty, count } of RANDOM_RECIPE) {
    const rows = await problems
      .aggregate([
        { $match: { difficulty, published: { $ne: false } } },
        { $sample: { size: count } },
        { $project: { slug: 1, title: 1, difficulty: 1 } },
      ])
      .toArray();
    if (rows.length < count) {
      throw Object.assign(
        new Error(`Not enough ${difficulty} problems for a random duel yet.`),
        { userFacing: true }
      );
    }
    picked.push(...rows);
  }

  return picked.map(shapeProblem);
}

function shapeProblem(doc) {
  return {
    slug: doc.slug,
    title: doc.title,
    difficulty: doc.difficulty,
    points: pointsFor(doc.difficulty),
  };
}

async function resolveChosenProblems(slugs) {
  const problems = await problemsCollection();
  const rows = await problems
    .find({ slug: { $in: slugs }, published: { $ne: false } })
    .project({ slug: 1, title: 1, difficulty: 1 })
    .toArray();

  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  const missing = slugs.filter((slug) => !bySlug.has(slug));
  if (missing.length) {
    throw Object.assign(new Error(`No problem called "${missing[0]}".`), { userFacing: true });
  }
  // Kept in the order the challenger arranged them, not the order Mongo
  // happened to return.
  return slugs.map((slug) => shapeProblem(bySlug.get(slug)));
}

/* ------------------------------------------------------------------ *
 * Scoring a duel from the submission log
 * ------------------------------------------------------------------ */

/*
 * Every judged submission made inside this duel, grouped by player and
 * problem, oldest first.
 *
 * Submissions that failed to compile are left out, the same rule the rest of
 * the judge uses: a file that never ran is not an attempt at the problem, and
 * counting it would cost somebody efficiency points for a missing semicolon.
 */
async function runsFor(duel) {
  const submissions = await submissionsCollection();
  const rows = await submissions
    .find(
      { duelId: String(duel._id), verdict: { $in: [...JUDGED] } },
      { projection: { userId: 1, slug: 1, verdict: 1, passed: 1, total: 1, createdAt: 1 } }
    )
    .sort({ createdAt: 1 })
    .toArray();

  const byPlayer = {};
  for (const id of duel.players) byPlayer[id] = {};

  for (const row of rows) {
    const mine = byPlayer[String(row.userId)];
    if (!mine) continue;
    (mine[row.slug] ||= []).push({
      accepted: row.verdict === "accepted",
      passed: row.passed || 0,
      total: row.total || 0,
      at: row.createdAt,
    });
  }
  return byPlayer;
}

async function scoreboardFor(duel) {
  return scoreDuel({
    problems: duel.problems,
    players: duel.players,
    runsByPlayer: await runsFor(duel),
    startedAt: duel.startedAt,
    durationMs: duel.durationMs,
  });
}

/* ------------------------------------------------------------------ *
 * The end of a duel
 * ------------------------------------------------------------------ */

/*
 * Finishing, and why it is written down when nothing else is.
 *
 * Scores are recomputed on every read while a duel is live, because that is
 * what makes them impossible to forge. The FINAL scores are stored, once,
 * because a finished duel must never change its mind: recomputing it later
 * would let a problem being edited, or a test being added, silently rewrite a
 * result somebody already saw. The rating change in particular has to be
 * calculated exactly once, and the conditional update below is what guarantees
 * that even if two requests arrive together.
 */
async function finalise(duel) {
  const duels = await duelsCollection();
  const board = await scoreboardFor(duel);

  const people = await peopleByIds(duel.players);
  const [a, b] = duel.players;
  const ratingA = people.get(a)?.rating ?? START_RATING;
  const ratingB = people.get(b)?.rating ?? START_RATING;

  const outcomeA = board.draw ? 0.5 : board.winnerId === a ? 1 : 0;
  const deltaA = ratingChange(ratingA, ratingB, outcomeA);
  const deltaB = ratingChange(ratingB, ratingA, 1 - outcomeA);

  const result = {
    cards: board.cards,
    winnerId: board.winnerId,
    draw: board.draw,
    maximum: board.maximum,
    rating: {
      [a]: { before: ratingA, after: ratingA + deltaA, change: deltaA },
      [b]: { before: ratingB, after: ratingB + deltaB, change: deltaB },
    },
  };

  /*
   * Only from "live". Two tabs, or a socket timer and a page load, can easily
   * try to finish the same duel at the same instant; whichever update matches
   * first does the work and the other matches nothing, so the ratings are
   * applied exactly once.
   */
  const outcome = await duels.updateOne(
    { _id: duel._id, status: "live" },
    { $set: { status: "finished", finishedAt: new Date(), result } }
  );

  if (outcome.modifiedCount === 1) {
    // However it ended — the clock running out, somebody pressing End match,
    // or a stale duel being settled on read — both screens should say so.
    duelChanged(duel._id);
    const users = await usersCollection();
    await Promise.all([
      users.updateOne({ _id: oid(a) }, { $set: { duelRating: ratingA + deltaA } }),
      users.updateOne({ _id: oid(b) }, { $set: { duelRating: ratingB + deltaB } }),
    ]);
    return { ...duel, status: "finished", finishedAt: new Date(), result };
  }

  // Somebody else finished it a moment ago. Theirs is the record.
  return (await duels.findOne({ _id: duel._id })) || duel;
}

/*
 * Anything whose time is up, brought up to date before it is looked at.
 *
 * This is the only clock the arena has. A duel ends because its end time has
 * passed, not because a timer fired in a process that might have been
 * restarted — so a duel left running when the server went down still ends at
 * the right moment, the next time anybody asks about it.
 */
async function settle(duel) {
  if (!duel) return duel;
  const now = Date.now();

  if (duel.status === "live" && new Date(duel.endsAt).getTime() <= now) {
    return finalise(duel);
  }
  if (duel.status === "pending" && now - new Date(duel.createdAt).getTime() > CHALLENGE_TTL_MS) {
    const duels = await duelsCollection();
    await duels.updateOne({ _id: duel._id, status: "pending" }, { $set: { status: "expired" } });
    return { ...duel, status: "expired" };
  }
  if (duel.status === "accepted" && now - new Date(duel.respondedAt).getTime() > LOBBY_TTL_MS) {
    const duels = await duelsCollection();
    await duels.updateOne({ _id: duel._id, status: "accepted" }, { $set: { status: "expired" } });
    return { ...duel, status: "expired" };
  }
  return duel;
}

/* ------------------------------------------------------------------ *
 * What a viewer is allowed to see
 * ------------------------------------------------------------------ */

/*
 * The one place that decides what leaves this service.
 *
 * Before a duel is live the problem SLUGS do not travel, whatever the mode.
 * That matters more than hiding the titles: a slug is the address of the full
 * statement on a public endpoint, so sending it early would hand somebody a
 * head start no amount of interface tidiness could take back.
 */
function visible(duel, viewerId, people, board) {
  /*
   * "live" is not the same as "started".
   *
   * Both players press ready, the duel turns live, and the clock is set a few
   * seconds into the future so the countdown is real rather than decorative.
   * During those seconds the status already says live — so testing the status
   * alone would hand out the statements before the match had begun, which is
   * precisely the head start the countdown exists to prevent. The reveal
   * follows the clock, not the label.
   */
  const started = duel.startedAt ? new Date(duel.startedAt).getTime() <= Date.now() : false;
  const revealed = (duel.status === "live" && started) || duel.status === "finished";
  const named = revealed || duel.mode === "custom";

  const mix = { Easy: 0, Medium: 0, Hard: 0 };
  for (const problem of duel.problems) mix[problem.difficulty] = (mix[problem.difficulty] || 0) + 1;

  return {
    id: String(duel._id),
    mode: duel.mode,
    status: duel.status,
    language: duel.language,
    durationMs: duel.durationMs,
    createdAt: duel.createdAt,
    respondedAt: duel.respondedAt || null,
    startedAt: duel.startedAt || null,
    endsAt: duel.endsAt || null,
    finishedAt: duel.finishedAt || null,

    challengerId: duel.challengerId,
    opponentId: duel.opponentId,
    players: duel.players.map((id) => ({
      ...(people.get(id) || { id, username: "someone", rating: START_RATING }),
      isYou: id === String(viewerId),
      ready: Boolean(duel.ready?.[id]),
      seat: duel.players.indexOf(id),
    })),

    problemCount: duel.problems.length,
    mix,
    maximum: duel.problems.reduce((sum, problem) => sum + problem.points, 0),

    /*
     * Named but not addressable, then fully revealed.
     *
     * A custom challenge says what it contains so the person deciding whether
     * to accept knows what they are agreeing to. The slug — the key to the
     * statement, the examples and the editorial — is withheld until GO for
     * both modes alike.
     */
    problems: named
      ? duel.problems.map((problem, index) => ({
          index,
          title: problem.title,
          difficulty: problem.difficulty,
          points: problem.points,
          slug: revealed ? problem.slug : null,
        }))
      : null,

    // Live: recomputed from the log a moment ago. Finished: the stored record.
    scores: board || duel.result || null,
    // Server time, so a player whose laptop clock is wrong still sees the same
    // clock as their opponent rather than arguing with it.
    now: new Date().toISOString(),
  };
}

async function present(duel, viewerId, { withBoard = false } = {}) {
  const people = await peopleByIds(duel.players);
  let board = null;
  if (withBoard && duel.status === "live") board = await scoreboardFor(duel);
  return visible(duel, viewerId, people, board);
}

/* ------------------------------------------------------------------ *
 * Routes
 * ------------------------------------------------------------------ */

async function createDuel(req, res) {
  const me = String(req.user.id);
  const mode = req.body.mode === "custom" ? "custom" : "random";
  const opponentId = String(req.body.opponentId || "");
  const language = LANGUAGES.has(String(req.body.language)) ? String(req.body.language) : "cpp";

  if (!oid(opponentId)) return res.status(400).json({ message: "Pick somebody to challenge." });
  if (opponentId === me) return res.status(400).json({ message: "You cannot duel yourself." });

  try {
    if (!(await areFriends(me, opponentId))) {
      return res.status(403).json({ message: "You can only challenge people you are friends with." });
    }

    const duels = await duelsCollection();

    /*
     * One match at a time, per person.
     *
     * Not a tidiness rule. Two live duels means two clocks running against the
     * same pair of hands, and every minute spent on one is silently lost from
     * the other — the loser of the second match would have lost it to the
     * first, which is not a result worth recording.
     */
    const busy = await duels.findOne({
      players: { $in: [me, opponentId] },
      status: { $in: ["live", "accepted"] },
    });
    if (busy) {
      const settled = await settle(busy);
      if (settled.status === "live" || settled.status === "accepted") {
        const mine = settled.players.includes(me);
        return res.status(409).json({
          message: mine
            ? "You are already in a duel. Finish it first."
            : "They are already in a duel. Try again in a few minutes.",
          duelId: mine ? String(settled._id) : undefined,
        });
      }
    }

    const alreadyAsked = await duels.findOne({
      challengerId: me,
      opponentId,
      status: "pending",
    });
    if (alreadyAsked) {
      return res.status(409).json({
        message: "You have already challenged them. They have not answered yet.",
        duelId: String(alreadyAsked._id),
      });
    }

    let problems;
    let durationMs;

    if (mode === "random") {
      problems = await drawRandomProblems();
      durationMs = RANDOM_DURATION_MIN * 60000;
    } else {
      const slugs = [...new Set((req.body.slugs || []).map((slug) => String(slug)))];
      if (slugs.length < MIN_PROBLEMS || slugs.length > MAX_PROBLEMS) {
        return res
          .status(400)
          .json({ message: `Pick between ${MIN_PROBLEMS} and ${MAX_PROBLEMS} problems.` });
      }
      const minutes = Number(req.body.durationMinutes);
      if (!Number.isFinite(minutes) || minutes < MIN_DURATION_MIN || minutes > MAX_DURATION_MIN) {
        return res
          .status(400)
          .json({ message: `Choose a length between ${MIN_DURATION_MIN} and ${MAX_DURATION_MIN} minutes.` });
      }
      problems = await resolveChosenProblems(slugs);
      durationMs = Math.round(minutes) * 60000;
    }

    const duel = {
      mode,
      challengerId: me,
      opponentId,
      players: [me, opponentId],
      problems,
      language,
      durationMs,
      status: "pending",
      ready: {},
      createdAt: new Date(),
    };

    const { insertedId } = await duels.insertOne(duel);
    res.status(201).json(await present({ ...duel, _id: insertedId }, me));
  } catch (err) {
    if (err.userFacing) return res.status(400).json({ message: err.message });
    console.error("Error creating duel:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/*
 * Everything the arena page draws, in one request.
 *
 * Sorted into the four questions somebody actually has when they open it: is
 * anybody waiting on me, am I waiting on anybody, is there a match to get back
 * into, and how have I been doing.
 */
async function listDuels(req, res) {
  const me = String(req.user.id);
  try {
    const duels = await duelsCollection();
    const rows = await duels.find({ players: me }).sort({ createdAt: -1 }).limit(60).toArray();

    const settled = await Promise.all(rows.map(settle));
    const ids = [...new Set(settled.flatMap((duel) => duel.players))];
    const people = await peopleByIds(ids);

    const incoming = [];
    const outgoing = [];
    const active = [];
    const recent = [];
    let won = 0;
    let lost = 0;
    let drawn = 0;

    for (const duel of settled) {
      const view = visible(duel, me, people, null);
      if (duel.status === "pending") {
        (duel.opponentId === me ? incoming : outgoing).push(view);
      } else if (duel.status === "live" || duel.status === "accepted") {
        active.push(view);
      } else if (duel.status === "finished") {
        recent.push(view);
        if (duel.result?.draw) drawn += 1;
        else if (duel.result?.winnerId === me) won += 1;
        else lost += 1;
      }
    }

    res.json({
      incoming,
      outgoing,
      active,
      recent: recent.slice(0, 12),
      stats: {
        total: won + lost + drawn,
        won,
        lost,
        drawn,
        rating: people.get(me)?.rating ?? START_RATING,
      },
    });
  } catch (err) {
    console.error("Error listing duels:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/*
 * Just the number for the badge in the navigation bar.
 *
 * Its own route because the full arena listing fetches sixty duels and looks
 * up every player in them, and the bar asks on every navigation. Two counts
 * and no documents is the difference between a badge that is free and one that
 * is a query per click.
 */
async function countWaiting(req, res) {
  const me = String(req.user.id);
  try {
    const duels = await duelsCollection();
    const [waiting, running] = await Promise.all([
      duels.countDocuments({ opponentId: me, status: "pending" }),
      duels.countDocuments({ players: me, status: { $in: ["live", "accepted"] } }),
    ]);
    res.json({ waiting, running });
  } catch (err) {
    console.error("Error counting duels:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/*
 * How a player's rating has moved, duel by duel.
 *
 * REBUILT FROM THE DUELS, NOT STORED SEPARATELY
 *
 * Every finished duel already records what each player's rating was before it
 * and after it, because that is written once when the duel ends and never
 * recalculated. Replaying those in order IS the history, so there is no second
 * copy to drift out of step with the first — and no way for the graph to show
 * a climb that did not happen.
 *
 * THE X AXIS IS DUELS, NOT DAYS
 *
 * A rating only moves when a match finishes, so a calendar axis would be
 * mostly flat line with occasional steps, and somebody who played four duels
 * in one evening and none since would get a chart that is 95% empty. Plotting
 * against duels played shows the shape of the thing the number is actually
 * measuring. The date of each duel still travels, for the tooltip.
 */
async function ratingHistory(req, res) {
  const me = String(req.user.id);
  try {
    const duels = await duelsCollection();
    const rows = await duels
      .find(
        { players: me, status: "finished" },
        {
          projection: {
            players: 1, finishedAt: 1, mode: 1, "result.rating": 1,
            "result.winnerId": 1, "result.draw": 1, "result.cards": 1,
          },
        }
      )
      .sort({ finishedAt: 1 })
      .toArray();

    const opponentIds = [...new Set(rows.map((row) => row.players.find((id) => id !== me)).filter(Boolean))];
    const people = await peopleByIds([...opponentIds, me]);

    const points = [];
    for (const row of rows) {
      const mine = row.result?.rating?.[me];
      // A duel finished before ratings existed, or one whose record is
      // incomplete, is skipped rather than guessed at.
      if (!mine || typeof mine.after !== "number") continue;

      const themId = row.players.find((id) => id !== me);
      points.push({
        duelId: String(row._id),
        at: row.finishedAt,
        mode: row.mode,
        rating: mine.after,
        change: mine.change ?? 0,
        outcome: row.result.draw ? "draw" : row.result.winnerId === me ? "won" : "lost",
        opponent: people.get(themId)?.username || "someone",
        score: row.result?.cards?.[me]?.total ?? null,
        opponentScore: themId ? row.result?.cards?.[themId]?.total ?? null : null,
      });
    }

    /*
     * Where the line begins.
     *
     * The first duel's own `before`, not the constant — if a player's rating
     * was ever adjusted outside a duel, the graph should start where they
     * actually started rather than where the default says they should have.
     */
    const start = points.length
      ? rows.find((row) => row.result?.rating?.[me])?.result.rating[me].before ?? START_RATING
      : people.get(me)?.rating ?? START_RATING;

    const ratings = points.map((point) => point.rating);
    res.json({
      // The live value from the account, so this agrees with the arena even if
      // a duel is mid-flight.
      rating: people.get(me)?.rating ?? START_RATING,
      start,
      points,
      played: points.length,
      won: points.filter((point) => point.outcome === "won").length,
      lost: points.filter((point) => point.outcome === "lost").length,
      drawn: points.filter((point) => point.outcome === "draw").length,
      best: ratings.length ? Math.max(start, ...ratings) : start,
      worst: ratings.length ? Math.min(start, ...ratings) : start,
    });
  } catch (err) {
    console.error("Error reading rating history:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getDuel(req, res) {
  const me = String(req.user.id);
  const id = oid(req.params.id);
  if (!id) return res.status(400).json({ message: "Not a valid duel." });

  try {
    const duels = await duelsCollection();
    const found = await duels.findOne({ _id: id });
    // A 404 rather than a 403 for somebody else's duel, so guessing at ids
    // cannot be used to find out which ones exist.
    if (!found || !found.players.includes(me)) {
      return res.status(404).json({ message: "No such duel." });
    }
    const duel = await settle(found);
    res.json(await present(duel, me, { withBoard: true }));
  } catch (err) {
    console.error("Error reading duel:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* Accept or decline. Only the person challenged may answer. */
async function respondToDuel(req, res) {
  const me = String(req.user.id);
  const id = oid(req.params.id);
  const accept = req.body.accept !== false;
  if (!id) return res.status(400).json({ message: "Not a valid duel." });

  try {
    const duels = await duelsCollection();
    const found = await duels.findOne({ _id: id });
    if (!found || !found.players.includes(me)) {
      return res.status(404).json({ message: "No such duel." });
    }
    if (found.opponentId !== me) {
      return res.status(403).json({ message: "Only the person challenged can answer." });
    }

    const duel = await settle(found);
    if (duel.status !== "pending") {
      return res.status(409).json({ message: `That challenge is already ${duel.status}.` });
    }

    if (!accept) {
      await duels.updateOne({ _id: id, status: "pending" }, { $set: { status: "declined", respondedAt: new Date() } });
      duelChanged(id);
      return res.json(await present({ ...duel, status: "declined", respondedAt: new Date() }, me));
    }

    // Checked again here, not only at creation: the other person may have
    // started a different duel in the minutes since they challenged you.
    const busy = await duels.findOne({
      players: { $in: duel.players },
      status: { $in: ["live", "accepted"] },
    });
    if (busy && String(busy._id) !== String(id)) {
      const settled = await settle(busy);
      if (settled.status === "live" || settled.status === "accepted") {
        return res.status(409).json({ message: "One of you is already in a duel." });
      }
    }

    const respondedAt = new Date();
    await duels.updateOne({ _id: id, status: "pending" }, { $set: { status: "accepted", respondedAt } });
    // The challenger is sitting on a screen that says "not answered yet".
    duelChanged(id);
    res.json(await present({ ...duel, status: "accepted", respondedAt }, me));
  } catch (err) {
    console.error("Error answering a duel:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/*
 * Three, two, one.
 *
 * The countdown is part of the match, not an animation played over it: the
 * clock genuinely starts a few seconds in the future, so neither player can
 * begin reading before the other. A browser that renders the countdown late,
 * or skips it entirely, gains nothing — the statements are not sent until
 * startedAt has passed either way.
 */
const COUNTDOWN_MS = 3500;

/*
 * "I'm ready", and the start of the match.
 *
 * The clock starts when the SECOND person is ready, and it is stamped here, on
 * the server, once. Everything the players then see about time remaining is
 * arithmetic on this one instant, which is why neither of them can be given a
 * longer match than the other by having a slower connection or a wrong clock.
 */
async function readyUp(req, res) {
  const me = String(req.user.id);
  const id = oid(req.params.id);
  if (!id) return res.status(400).json({ message: "Not a valid duel." });

  try {
    const duels = await duelsCollection();
    const found = await duels.findOne({ _id: id });
    if (!found || !found.players.includes(me)) {
      return res.status(404).json({ message: "No such duel." });
    }

    const duel = await settle(found);
    if (duel.status === "live" || duel.status === "finished") {
      return res.json(await present(duel, me, { withBoard: true }));
    }
    if (duel.status !== "accepted") {
      return res.status(409).json({ message: "That duel is not waiting to start." });
    }

    await duels.updateOne({ _id: id }, { $set: { [`ready.${me}`]: true } });
    const fresh = await duels.findOne({ _id: id });

    const everybody = fresh.players.every((player) => fresh.ready?.[player]);
    duelChanged(id);
    if (!everybody) return res.json(await present(fresh, me));

    /*
     * Both ready. The condition on the update is what makes the start time
     * singular: if both players press within the same instant, only one of the
     * two writes finds a duel still in "accepted", so `startedAt` is set once
     * and never moved.
     */
    const startedAt = new Date(Date.now() + COUNTDOWN_MS);
    const endsAt = new Date(startedAt.getTime() + fresh.durationMs);
    await duels.updateOne(
      { _id: id, status: "accepted" },
      { $set: { status: "live", startedAt, endsAt } }
    );
    const live = await duels.findOne({ _id: id });
    // Both screens need the countdown at the same moment, and the socket needs
    // to book its alarms for the start and the end.
    duelChanged(id);
    res.json(await present(live, me, { withBoard: true }));
  } catch (err) {
    console.error("Error readying a duel:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/*
 * Withdrawing.
 *
 * Before it starts, either person may call it off, and the row is marked
 * rather than deleted so it is still explicable afterwards. Once it is live,
 * giving up is `forfeit` below, which is a different thing and is scored.
 */
async function cancelDuel(req, res) {
  const me = String(req.user.id);
  const id = oid(req.params.id);
  if (!id) return res.status(400).json({ message: "Not a valid duel." });

  try {
    const duels = await duelsCollection();
    const found = await duels.findOne({ _id: id });
    if (!found || !found.players.includes(me)) {
      return res.status(404).json({ message: "No such duel." });
    }
    if (!["pending", "accepted"].includes(found.status)) {
      return res.status(409).json({ message: "That duel cannot be called off now." });
    }
    await duels.updateOne(
      { _id: id, status: found.status },
      { $set: { status: "cancelled", cancelledBy: me, respondedAt: new Date() } }
    );
    duelChanged(id);
    res.json(await present({ ...found, status: "cancelled" }, me));
  } catch (err) {
    console.error("Error cancelling a duel:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/*
 * Ending a live duel early.
 *
 * Both players have to be able to stop — a match nobody can leave for half an
 * hour is a trap, and "End match" is in the design for a reason. So this ends
 * it for both and scores it EXACTLY as it stands: whatever was solved counts,
 * whatever was not does not. It is not recorded as a resignation and the
 * person who pressed it is not penalised beyond the score they had actually
 * earned, because inventing a penalty would mean inventing a result.
 *
 * The honest cost, stated plainly in the interface: your opponent loses the
 * rest of their time too.
 */
async function endDuel(req, res) {
  const me = String(req.user.id);
  const id = oid(req.params.id);
  if (!id) return res.status(400).json({ message: "Not a valid duel." });

  try {
    const duels = await duelsCollection();
    const found = await duels.findOne({ _id: id });
    if (!found || !found.players.includes(me)) {
      return res.status(404).json({ message: "No such duel." });
    }
    const duel = await settle(found);
    if (duel.status === "finished") return res.json(await present(duel, me));
    if (duel.status !== "live") {
      return res.status(409).json({ message: "That duel is not running." });
    }

    await duels.updateOne({ _id: id, status: "live" }, { $set: { endedEarlyBy: me } });
    const finished = await finalise({ ...duel, endedEarlyBy: me });
    duelChanged(id);
    res.json(await present(finished, me));
  } catch (err) {
    console.error("Error ending a duel:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createDuel,
  listDuels,
  countWaiting,
  ratingHistory,
  getDuel,
  respondToDuel,
  readyUp,
  cancelDuel,
  endDuel,
  // Shared with the duel socket, so the live view and the polled view are
  // built by the same code and cannot disagree.
  settle,
  present,
  scoreboardFor,
  finalise,
  COUNTDOWN_MS,
  MIN_PROBLEMS,
  MAX_PROBLEMS,
  MIN_DURATION_MIN,
  MAX_DURATION_MIN,
  RANDOM_DURATION_MIN,
};
