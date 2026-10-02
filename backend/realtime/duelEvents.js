/*
 * A doorbell between the duel's REST routes and its socket.
 *
 * The state machine lives in the controller and the broadcasting lives in
 * duelRealtime, which is the right split — but accepting a challenge or
 * pressing ready has to reach the other player's screen at once, and the
 * controller has no idea who is watching.
 *
 * WHY AN EMITTER AND NOT A DIRECT CALL
 *
 * The socket already requires the controller, for `settle` and `present`.
 * Having the controller require the socket back would be a circular import,
 * and those do not fail loudly in Node — one of the two modules simply gets a
 * half-built copy of the other's exports, and whichever function was not
 * defined yet is `undefined` at the moment it is called. This tiny module is
 * required by both and requires neither, so there is no cycle to get wrong.
 *
 * WHAT TRAVELS
 *
 * An id, and nothing else. Deliberately: the listener re-reads the duel from
 * the database and rebuilds the scoreboard from the submission log, so there
 * is no way for a stale object passed through here to become what a player
 * sees. It is a doorbell, not a delivery.
 */

const { EventEmitter } = require("events");

const duelEvents = new EventEmitter();
// Two players, each with a tab or two. The default limit of ten would warn
// about a leak that is not one; this is still low enough to notice a real one.
duelEvents.setMaxListeners(50);

function duelChanged(duelId) {
  if (duelId) duelEvents.emit("changed", String(duelId));
}

module.exports = { duelEvents, duelChanged };
