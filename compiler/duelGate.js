/*
 * The one check that keeps a duel honest.
 *
 * A duel's scores are not stored while it runs. They are recomputed from the
 * submissions the judge recorded, which means the ONLY way to gain a point is
 * to have a submission on the log stamped with the duel's id. This file is the
 * only thing that stamps one, so every rule about what counts towards a duel
 * lives here and nowhere else.
 *
 * WHY THE BROWSER CANNOT BE TRUSTED WITH ANY OF THIS
 *
 * The duel id arrives in the request body, from the page. So does the slug and
 * the language. A player could send any of them. Each is therefore checked
 * against the duel document rather than believed:
 *
 *   - the duel must exist, be live, and be inside its own clock;
 *   - the submitter must be one of its two players;
 *   - the problem must be one of the duel's problems;
 *   - the language must be the one both players agreed to.
 *
 * A request that fails any of these is REFUSED rather than quietly recorded as
 * an ordinary submission. Silently dropping the duel id would be friendlier to
 * write and much worse to use: somebody would solve a problem during a match,
 * see a green verdict, and never find out it had not counted.
 */

const { duelsCollection, isConfigured } = require("./db");
const { ObjectId } = require("mongodb");

/*
 * Returns { ok: true, duel } or { ok: false, status, message }.
 *
 * Never throws for a bad claim — a refusal is an answer, not an error — but a
 * database that cannot be reached is a 503, because "your submission did not
 * count" and "we could not tell whether it counted" are different things and a
 * player deserves to know which one happened.
 */
async function checkDuelSubmission({ duelId, userId, slug, language }) {
  if (!isConfigured()) {
    return { ok: false, status: 503, message: "Duels are unavailable right now." };
  }
  if (!ObjectId.isValid(String(duelId))) {
    return { ok: false, status: 400, message: "That is not a valid duel." };
  }

  const duels = await duelsCollection();
  const duel = await duels.findOne({ _id: new ObjectId(String(duelId)) });

  // The same answer for a duel that does not exist and one somebody else is
  // playing, so guessing at ids reveals nothing about which are real.
  if (!duel || !duel.players.includes(String(userId))) {
    return { ok: false, status: 404, message: "No such duel." };
  }

  if (duel.status !== "live") {
    const because =
      duel.status === "finished" ? "That duel is over." : "That duel has not started.";
    return { ok: false, status: 409, message: because };
  }

  const now = Date.now();
  /*
   * Both ends of the clock, and the early end matters as much as the late one.
   *
   * A duel turns live a few seconds before it starts, so the countdown is a
   * real pause rather than an animation. Without this check a player who had
   * seen the problems in an earlier match could submit into that gap and score
   * before the opponent had been shown anything.
   */
  if (duel.startedAt && new Date(duel.startedAt).getTime() > now) {
    return { ok: false, status: 409, message: "The duel has not started yet." };
  }
  if (duel.endsAt && new Date(duel.endsAt).getTime() <= now) {
    return { ok: false, status: 409, message: "Time is up for that duel." };
  }

  if (!duel.problems.some((problem) => problem.slug === slug)) {
    return { ok: false, status: 400, message: "That problem is not part of this duel." };
  }

  if (duel.language && language !== duel.language) {
    return {
      ok: false,
      status: 400,
      message: `This duel is being played in ${duel.language}.`,
    };
  }

  return { ok: true, duel };
}

module.exports = { checkDuelSubmission };
