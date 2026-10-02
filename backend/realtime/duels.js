/*
 * The live half of a duel.
 *
 * WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT
 *
 * It is a broadcast channel. It does not decide anything. Every state change a
 * duel can undergo — accepting, readying, starting, finishing — happens in the
 * REST controller, because a state machine with two implementations is a state
 * machine with two answers. What arrives here from a browser is at most a
 * NUDGE: "something changed, go and look". The server then re-reads the duel
 * from the database and recomputes the scoreboard from the submission log, and
 * broadcasts what it found.
 *
 * That distinction is the whole security story. A player can send "refresh"
 * as often as they like and the worst they can do is make the server re-read
 * their own duel. They cannot report a score, a solve, or a verdict, because
 * there is no message that carries one.
 *
 * THE ONE THING CLIENTS DO ASSERT
 *
 * Which problem they are looking at, and whether they are typing or running.
 * That is a presence hint and it is treated as one — it is never scored, never
 * stored, and disappears when they disconnect. The ticks on the scoreboard
 * come from the judge, not from this.
 *
 * WHY IT ALSO POLLS ITSELF
 *
 * Scores are rebroadcast on a timer while a duel is live, not only when
 * somebody nudges. A nudge is an optimisation for how quickly the opponent's
 * tick appears; the timer is what makes the scoreboard correct even if every
 * nudge is lost, a tab is asleep, or somebody is watching a duel they are not
 * submitting in. Correctness does not depend on a client saying anything.
 */

const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { duelsCollection } = require("../config/db");
const { settle, present, COUNTDOWN_MS } = require("../controllers/duelController");
const { duelEvents } = require("./duelEvents");

const HELLO_TIMEOUT_MS = 10000;
const PING_INTERVAL_MS = 30000;
// How often a live duel refreshes itself for everybody watching. Fast enough
// that an opponent's solve appears while you are still reading their name,
// slow enough that two people cost a handful of queries a minute.
const LIVE_TICK_MS = 6000;
// A nudge does a database read, so they are rate limited per socket. Ten a
// second is far more than pressing Submit could ever produce.
const NUDGE_MIN_GAP_MS = 100;
const ACTIVITY_STATES = new Set(["coding", "testing", "submitting", "reading"]);

/* Live duels, held in memory only while somebody is watching one. */
const live = new Map();

function duelState(id) {
  if (!live.has(id)) {
    live.set(id, { id, clients: new Set(), activity: new Map(), tick: null, alarms: [] });
  }
  return live.get(id);
}

function send(socket, message) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

function activityList(state) {
  return [...state.activity.entries()].map(([userId, value]) => ({ userId, ...value }));
}

/*
 * Sends every watcher the duel as THEY are allowed to see it.
 *
 * Per viewer rather than once, because `present` marks which player is you and
 * — far more importantly — decides whether the problem slugs travel at all. A
 * single shared payload would have to be built for the most privileged viewer,
 * which is exactly the mistake that leaks the statements during a countdown.
 */
async function publish(state) {
  if (!state.clients.size) return;

  let duel;
  try {
    const duels = await duelsCollection();
    const found = await duels.findOne({ _id: new ObjectId(state.id) });
    if (!found) return;
    duel = await settle(found);
  } catch (err) {
    console.error(`Could not refresh duel ${state.id}:`, err.message);
    return;
  }

  const activity = activityList(state);
  await Promise.all(
    [...state.clients].map(async (socket) => {
      try {
        const view = await present(duel, socket.userId, { withBoard: true });
        send(socket, { t: "state", duel: view, activity });
      } catch (err) {
        console.error(`Could not build a duel view for ${socket.userId}:`, err.message);
      }
    })
  );

  scheduleFor(state, duel);
}

/*
 * The two moments that matter, booked as they become known.
 *
 * A duel starts and ends at instants the database already knows, so the socket
 * wakes exactly then rather than discovering it on the next tick. Neither
 * alarm DECIDES anything: the start alarm only triggers a publish, and by then
 * `present` reveals the problems because the clock has passed; the end alarm
 * triggers a publish, and `settle` inside it is what finishes the duel. A
 * server restart loses both alarms and costs nothing, because the next read of
 * the duel settles it anyway.
 */
function scheduleFor(state, duel) {
  for (const alarm of state.alarms) clearTimeout(alarm);
  state.alarms = [];
  if (!state.clients.size) return;

  const at = (when, label) => {
    if (!when) return;
    const wait = new Date(when).getTime() - Date.now();
    // A small margin, so the alarm lands just after the boundary rather than
    // in the same millisecond, where rounding could still read as "before".
    if (wait < -1000 || wait > 2 ** 31 - 1) return;
    state.alarms.push(setTimeout(() => publish(state).catch(() => {}), Math.max(0, wait) + 120));
  };

  if (duel.status === "live") {
    at(duel.startedAt, "start");
    at(duel.endsAt, "end");
  }

  const wantsTick = duel.status === "live";
  if (wantsTick && !state.tick) {
    state.tick = setInterval(() => publish(state).catch(() => {}), LIVE_TICK_MS);
  }
  if (!wantsTick && state.tick) {
    clearInterval(state.tick);
    state.tick = null;
  }
}

async function authenticate(raw) {
  const token = String(raw.token || "");
  const duelId = String(raw.duelId || "");
  if (!token || !ObjectId.isValid(duelId)) return null;

  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return null;
  }
  if (!ObjectId.isValid(claims?.id)) return null;

  const duels = await duelsCollection();
  const duel = await duels.findOne({ _id: new ObjectId(duelId) });
  // Membership is checked here and nowhere else in this file, so there is one
  // place to get it right.
  if (!duel || !duel.players.includes(String(claims.id))) return null;

  return { duel, userId: String(claims.id) };
}

function attachDuelRealtime(router) {
  const wss = router.route("/duels/socket");

  /*
   * A duel changed through the REST routes.
   *
   * Without this, a player waiting in the lobby would watch a screen that says
   * "not answered yet" long after their opponent accepted: the tick below only
   * runs for a LIVE duel, and a challenge being accepted or somebody pressing
   * ready happens in the controller, which has no idea anyone is watching.
   *
   * The event carries only an id, so this re-reads the duel and rebuilds the
   * scoreboard rather than trusting anything that was passed along.
   */
  duelEvents.on("changed", (duelId) => {
    const state = live.get(String(duelId));
    if (state) publish(state).catch(() => {});
  });

  wss.on("connection", (socket) => {
    socket.isAlive = true;
    socket.authed = false;
    socket.lastNudge = 0;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    const helloTimer = setTimeout(() => {
      if (!socket.authed) socket.close(4001, "No hello");
    }, HELLO_TIMEOUT_MS);

    socket.on("message", async (data) => {
      let message;
      try {
        message = JSON.parse(String(data));
      } catch (err) {
        return;
      }

      if (!socket.authed) {
        if (message.t !== "hello") return socket.close(4001, "Say hello first");
        // The token arrives here rather than in the URL: a query string ends
        // up in access logs, proxy logs and browser history, and this one is a
        // live session key.
        const identity = await authenticate(message);
        if (!identity) return socket.close(4003, "Not your duel");

        clearTimeout(helloTimer);
        socket.authed = true;
        socket.userId = identity.userId;
        socket.duelId = String(identity.duel._id);

        const state = duelState(socket.duelId);
        state.clients.add(socket);

        send(socket, { t: "hello", countdownMs: COUNTDOWN_MS });
        await publish(state);
        return;
      }

      const state = live.get(socket.duelId);
      if (!state) return;

      /*
       * "Something happened, look again."
       *
       * Carries no information whatsoever — not a verdict, not a score, not
       * which problem. The server re-reads the duel and the submission log and
       * works out for itself what changed. Sending this after a submission is
       * only a way of not waiting up to six seconds for the next tick.
       */
      if (message.t === "refresh") {
        const now = Date.now();
        if (now - socket.lastNudge < NUDGE_MIN_GAP_MS) return;
        socket.lastNudge = now;
        await publish(state);
        return;
      }

      /*
       * Where they are and what they are doing, as reported by their own page.
       *
       * Presence, not evidence. It is shown next to their name and it is never
       * scored, never written down, and gone the moment they disconnect — so
       * the worst somebody can do by lying is look busy.
       */
      if (message.t === "activity") {
        const value = {
          problemIndex: Number.isInteger(message.problemIndex) ? message.problemIndex : null,
          state: ACTIVITY_STATES.has(message.state) ? message.state : "reading",
          at: new Date().toISOString(),
        };
        state.activity.set(socket.userId, value);

        // Only the presence line, not the whole duel: this fires on every tab
        // change, and rebuilding the scoreboard for that would be a query per
        // click for something no score depends on.
        const activity = activityList(state);
        for (const client of state.clients) send(client, { t: "activity", activity });
        return;
      }
    });

    socket.on("close", () => {
      clearTimeout(helloTimer);
      const state = socket.duelId && live.get(socket.duelId);
      if (!state) return;

      state.clients.delete(socket);
      /*
       * Their presence line goes only if that was their last tab. Dropping it
       * on any close would make somebody with the duel open twice flicker out
       * of the other player's view every time they closed one.
       */
      if (![...state.clients].some((client) => client.userId === socket.userId)) {
        state.activity.delete(socket.userId);
      }

      if (state.clients.size) {
        const activity = activityList(state);
        for (const client of state.clients) send(client, { t: "activity", activity });
        return;
      }

      // Nobody watching. Stop the timers and drop the room, or the process
      // leaks an interval per duel that was ever opened.
      clearInterval(state.tick);
      for (const alarm of state.alarms) clearTimeout(alarm);
      live.delete(state.id);
    });
  });

  /*
   * A dropped connection does not always produce a close event — a laptop lid
   * closing sends nothing — and a duel is exactly the situation where somebody
   * showing as present when they have gone is misleading.
   */
  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (!socket.isAlive) {
        socket.terminate();
        continue;
      }
      socket.isAlive = false;
      socket.ping();
    }
  }, PING_INTERVAL_MS);

  wss.on("close", () => clearInterval(heartbeat));
  console.log("Duel sockets listening on /duels/socket");
  return wss;
}

module.exports = { attachDuelRealtime };
