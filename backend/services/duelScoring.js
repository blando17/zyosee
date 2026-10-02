/*
 * How a duel is scored.
 *
 * Its own file, with no database and no express in it, because the scoring
 * rules are the part of the arena most likely to be argued about and the part
 * that most needs to be testable on its own. Everything here is a pure
 * function of facts the judge already recorded.
 *
 * WHAT A PROBLEM IS WORTH
 *
 * Not every problem is worth the same. If an Easy and a Medium both paid 100
 * then a duel of two Easies and a Medium would be decided by the two Easies,
 * and the hard part of the match would be the part that did not matter.
 */
const POINTS = { Easy: 100, Medium: 150, Hard: 200 };

// An unrecognised difficulty is worth an Easy rather than nothing, so a typo
// in a problem's metadata cannot silently make it unscoreable.
function pointsFor(difficulty) {
  return POINTS[difficulty] ?? POINTS.Easy;
}

/*
 * The three components, and why these three.
 *
 * CORRECTNESS is the bulk of it. It is the only part that measures whether the
 * thing works, which is the only part that would matter outside a game.
 *
 * SPEED is real in a timed match and meaningless outside one. It is measured
 * from the moment the match started, not from when the problem was opened,
 * because both players start at the same instant.
 *
 * EFFICIENCY counts SUBMISSIONS, not runtime.
 *
 * Runtime was the obvious choice and it is the wrong one here. The judge does
 * report how long a solution took, but these two solutions are timed on the
 * same machine while it is also compiling the other player's code, so the
 * difference between eleven and fourteen milliseconds is the neighbouring
 * container, not the algorithm. Scoring on it would hand out points for noise
 * and, worse, would look precise while doing it. Submission count is measured
 * exactly and is a real skill: knowing your solution is right before you send
 * it is most of competitive programming.
 */
const WEIGHTS = { correctness: 0.6, speed: 0.25, efficiency: 0.15 };

/*
 * Solving at the buzzer is still worth something.
 *
 * A linear decay to zero would mean the last few minutes of a match are not
 * worth playing, which is the opposite of what a timer is for. This keeps
 * thirty per cent of the speed component alive right to the end, so somebody
 * who is behind always has a reason to keep typing.
 */
const SPEED_FLOOR = 0.3;

function speedFactor(elapsedMs, durationMs) {
  if (!durationMs || elapsedMs <= 0) return 1;
  const used = Math.min(1, elapsedMs / durationMs);
  return Math.max(SPEED_FLOOR, 1 - (1 - SPEED_FLOOR) * used);
}

/*
 * First time: everything. Each further attempt costs a quarter, and it stops
 * at a quarter rather than zero — somebody who fought a problem for five
 * submissions and won still did better than somebody who never solved it.
 */
function efficiencyFactor(attempts) {
  return Math.max(0.25, 1 - 0.25 * (Math.max(1, attempts) - 1));
}

/*
 * One player, one problem.
 *
 * `runs` is every judged submission this player made for this problem during
 * the match, oldest first, each { accepted, passed, total, at }.
 *
 * Partial credit is deliberate. A solution that passes nine tests of ten is
 * not a solve and is not nothing, and a duel where a near miss scores the same
 * as an empty editor teaches the wrong lesson.
 *
 * Speed and efficiency are paid only on a solve. They describe HOW something
 * was solved, and there is no honest way to say how quickly somebody did a
 * thing they did not do.
 */
function scoreProblem({ runs = [], difficulty, startedAt, durationMs }) {
  const points = pointsFor(difficulty);
  const blank = {
    points,
    score: 0,
    solved: false,
    attempts: runs.length,
    bestPassed: 0,
    total: 0,
    solvedAt: null,
    elapsedMs: null,
    parts: { correctness: 0, speed: 0, efficiency: 0 },
  };
  if (!runs.length) return blank;

  const firstWin = runs.findIndex((run) => run.accepted);
  const solved = firstWin !== -1;

  // The best they managed, not the last thing they sent: going back to a
  // solved problem and breaking it should not undo the solve.
  const ratios = runs.map((run) => (run.total > 0 ? run.passed / run.total : 0));
  const bestRatio = solved ? 1 : Math.max(0, ...ratios);
  const best = runs[ratios.indexOf(Math.max(...ratios))] || runs[0];

  const correctness = Math.round(WEIGHTS.correctness * points * bestRatio);

  if (!solved) {
    return {
      ...blank,
      score: correctness,
      bestPassed: best.passed || 0,
      total: best.total || 0,
      parts: { correctness, speed: 0, efficiency: 0 },
    };
  }

  const solvedAt = runs[firstWin].at;
  const elapsedMs = Math.max(0, new Date(solvedAt) - new Date(startedAt));
  // Attempts UP TO the solve. Trying a neater version afterwards is not a cost.
  const attempts = firstWin + 1;

  /*
   * Each part is rounded, and the score is the sum of the ROUNDED parts.
   *
   * Not the rounded sum, which is what this did at first and which is subtly
   * wrong in a way people notice. A medium problem solved first time came to
   * 90 + 33.68 + 22.5: the parts displayed as 90, 34 and 23, and the total
   * displayed as 146, because the total had been rounded from 146.18 while the
   * parts were each rounded on their own. The screen then showed
   * "90 + 34 + 23" beside a total of 146, and a scoreboard whose own
   * arithmetic does not add up is not worth showing at all.
   *
   * Summing the rounded parts costs at most a point of precision and buys a
   * table that can be checked by eye. That is the better trade for a number
   * somebody just lost a match to.
   */
  const speed = Math.round(WEIGHTS.speed * points * speedFactor(elapsedMs, durationMs));
  const efficiency = Math.round(WEIGHTS.efficiency * points * efficiencyFactor(attempts));

  return {
    points,
    score: correctness + speed + efficiency,
    solved: true,
    attempts,
    bestPassed: runs[firstWin].passed || 0,
    total: runs[firstWin].total || 0,
    solvedAt,
    elapsedMs,
    parts: { correctness, speed, efficiency },
  };
}

/*
 * A whole duel.
 *
 * `runsByPlayer` is { userId: { slug: [run, run, ...] } }. Everything else is
 * the duel record. Returns a card per player and who won.
 */
function scoreDuel({ problems, players, runsByPlayer, startedAt, durationMs }) {
  const cards = {};

  for (const userId of players) {
    const byProblem = runsByPlayer[userId] || {};
    const rows = problems.map((problem) =>
      scoreProblem({
        runs: byProblem[problem.slug] || [],
        difficulty: problem.difficulty,
        startedAt,
        durationMs,
      })
    );

    cards[userId] = {
      problems: rows,
      total: rows.reduce((sum, row) => sum + row.score, 0),
      solved: rows.filter((row) => row.solved).length,
      submissions: rows.reduce((sum, row) => sum + row.attempts, 0),
    };
  }

  /*
   * The winner.
   *
   * Equal scores are a draw, and the tie is NOT broken by runtime or by who
   * submitted first. Both were considered and both are worse than admitting a
   * draw: runtime is the noise this file already refuses to score on, and
   * "first to submit" would quietly reintroduce speed after it has already
   * been paid for in the speed component.
   */
  const [a, b] = players;
  let winnerId = null;
  let draw = false;
  if (players.length === 2) {
    if (cards[a].total > cards[b].total) winnerId = a;
    else if (cards[b].total > cards[a].total) winnerId = b;
    else draw = true;
  }

  return { cards, winnerId, draw, maximum: problems.reduce((sum, p) => sum + pointsFor(p.difficulty), 0) };
}

/*
 * Rating, the ordinary Elo arithmetic.
 *
 * K is 24: high enough that a handful of duels move somebody towards where
 * they belong, low enough that one bad afternoon does not erase a term.
 * Everybody starts at 1200.
 */
const START_RATING = 1200;
const K = 24;

function expectedScore(mine, theirs) {
  return 1 / (1 + 10 ** ((theirs - mine) / 400));
}

function ratingChange(mine, theirs, outcome) {
  return Math.round(K * (outcome - expectedScore(mine, theirs)));
}

module.exports = {
  POINTS,
  START_RATING,
  pointsFor,
  speedFactor,
  efficiencyFactor,
  scoreProblem,
  scoreDuel,
  ratingChange,
  expectedScore,
};
