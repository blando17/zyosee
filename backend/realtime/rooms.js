/*
 * The live half of a Pair Lab room: presence, cursors and the shared document.
 *
 * HOW THE DOCUMENT STAYS IN ONE PIECE
 *
 * The server holds the authoritative text and a version number. A client sends
 * its whole text along with the version it was working from:
 *
 *   - if that matches the server's version, the edit is accepted, the version
 *     goes up by one, and the new text is broadcast to everybody else;
 *   - if it does not, the edit is REFUSED and the sender is sent the current
 *     text to start again from.
 *
 * So the server is never guessing whose edit wins, and the document can never
 * silently diverge between two screens. The honest limitation: if two people
 * type in the same 150 millisecond window, one of them is told to resync and
 * loses those few keystrokes. Editing different parts of the file — which is
 * what pair programming actually looks like — never collides, because each
 * edit is accepted and broadcast before the next one is composed.
 *
 * Proper concurrent editing needs operational transforms or a CRDT. That is a
 * large piece of machinery, and this is the honest version of the simple one
 * rather than a simple one pretending to be more.
 *
 * WHY THE TOKEN ARRIVES IN A MESSAGE
 *
 * A browser cannot set headers on a WebSocket handshake, so the usual
 * workaround is to put the token in the query string — where it lands in
 * access logs, proxy logs and browser history. Instead the socket opens
 * unauthenticated and stays useless until the first message carries the token;
 * anything else, and it is closed.
 */

const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { roomsCollection } = require("../config/db");
const { colourFor } = require("../controllers/roomController");

// A socket that has not identified itself in this long is not going to.
const HELLO_TIMEOUT_MS = 10000;
// Heartbeat, so a laptop closed mid-session frees its seat instead of showing
// as online for ever.
const PING_INTERVAL_MS = 30000;
const MAX_DOCUMENT_BYTES = 200000;
const MAX_CHAT_LENGTH = 1000;
// Enough for a session's conversation without letting a room document grow
// without limit. Older lines scroll out of history rather than out of memory.
const CHAT_HISTORY = 200;
const SAVE_DEBOUNCE_MS = 3000;

/*
 * Live rooms, held in memory while somebody is in them.
 *
 * The document is written back to MongoDB a few seconds after it stops
 * changing, rather than on every keystroke: a room with two people typing
 * would otherwise be a write per character.
 */
const live = new Map();

function roomState(id) {
  if (!live.has(id)) {
    live.set(id, { id, doc: "", version: 0, language: "cpp", chat: [], clients: new Set(), saveTimer: null });
  }
  return live.get(id);
}

function send(socket, message) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

function broadcast(state, message, except) {
  for (const client of state.clients) {
    if (client !== except) send(client, message);
  }
}

/*
 * Who is in the room right now.
 *
 * Colour comes from the member's position in the room record, so it is the
 * same for everybody looking at it — the person in seat one is pink on both
 * screens, not pink on their own and blue on yours.
 */
function presenceOf(state) {
  const seen = new Map();
  for (const client of state.clients) {
    if (!seen.has(client.userId)) {
      seen.set(client.userId, {
        id: client.userId,
        username: client.username,
        colour: client.colour,
        line: client.line ?? null,
      });
    } else if (client.line !== null && client.line !== undefined) {
      // Same person in two tabs: show the most recent cursor rather than none.
      seen.get(client.userId).line = client.line;
    }
  }
  return [...seen.values()];
}

function announcePresence(state) {
  broadcast(state, { t: "presence", members: presenceOf(state) });
}

function scheduleSave(state) {
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(async () => {
    try {
      const rooms = await roomsCollection();
      await rooms.updateOne(
        { _id: new ObjectId(state.id) },
        { $set: { document: state.doc, version: state.version, language: state.language, updatedAt: new Date() } }
      );
    } catch (err) {
      // The room keeps working; only the saved copy falls behind.
      console.error(`Could not save room ${state.id}:`, err.message);
    }
  }, SAVE_DEBOUNCE_MS);
}

async function authenticate(raw) {
  const token = String(raw.token || "");
  const roomId = String(raw.roomId || "");
  if (!token || !ObjectId.isValid(roomId)) return null;

  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return null;
  }
  if (!ObjectId.isValid(claims?.id)) return null;

  const rooms = await roomsCollection();
  const room = await rooms.findOne({ _id: new ObjectId(roomId) });
  // Membership is checked here and nowhere else, so there is one place to get
  // it right. A non-member is simply refused.
  if (!room || !room.members.includes(String(claims.id))) return null;

  const seat = room.members.indexOf(String(claims.id));
  return { room, userId: String(claims.id), colour: colourFor(seat).hex };
}

/*
 * Takes a socket router rather than the HTTP server itself.
 *
 * Two WebSocketServers cannot share one HTTP server by each claiming a path —
 * ws destroys the sockets it does not recognise rather than passing them on.
 * socketRouter.js has the full explanation. The origin check that used to live
 * in verifyClient here now happens there, once, for every endpoint.
 */
function attachRealtime(router) {
  const wss = router.route("/rooms/socket");

  wss.on("connection", (socket) => {
    socket.isAlive = true;
    socket.authed = false;
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
        const identity = await authenticate(message);
        if (!identity) return socket.close(4003, "Not allowed in this room");

        clearTimeout(helloTimer);
        socket.authed = true;
        socket.userId = identity.userId;
        socket.username = message.username || "someone";
        socket.colour = identity.colour;
        socket.roomId = String(identity.room._id);
        socket.line = null;

        const state = roomState(socket.roomId);
        /*
         * The first person through the door restores the saved document. After
         * that the in-memory copy is the truth, and reloading it would undo
         * whatever the people already inside have typed.
         */
        if (state.clients.size === 0) {
          state.doc = identity.room.document || "";
          state.version = identity.room.version || 0;
          state.language = identity.room.language || "cpp";
          state.chat = Array.isArray(identity.room.chat) ? identity.room.chat : [];
        }
        state.clients.add(socket);

        send(socket, {
          t: "welcome",
          you: { id: socket.userId, username: socket.username, colour: socket.colour },
          document: state.doc,
          version: state.version,
          language: state.language,
          members: presenceOf(state),
          // Whoever arrives last should not be the only one who cannot see
          // what was already agreed.
          chat: state.chat,
        });
        announcePresence(state);
        return;
      }

      const state = live.get(socket.roomId);
      if (!state) return;

      if (message.t === "doc") {
        const text = String(message.text ?? "");
        if (text.length > MAX_DOCUMENT_BYTES) {
          return send(socket, { t: "error", message: "That file is too large to share." });
        }
        // Stale: somebody else's edit landed first. Hand back the truth rather
        // than overwriting them.
        if (Number(message.base) !== state.version) {
          return send(socket, { t: "resync", document: state.doc, version: state.version });
        }
        if (text === state.doc) return;

        state.doc = text;
        state.version += 1;
        broadcast(state, { t: "doc", document: state.doc, version: state.version, by: socket.userId }, socket);
        // The sender needs the new number too, or its next edit reads as stale.
        send(socket, { t: "ack", version: state.version });
        scheduleSave(state);
        return;
      }

      if (message.t === "cursor") {
        const line = Number(message.line);
        socket.line = Number.isFinite(line) ? line : null;
        announcePresence(state);
        return;
      }

      if (message.t === "chat") {
        const text = String(message.text ?? "").trim();
        if (!text) return;
        if (text.length > MAX_CHAT_LENGTH) {
          return send(socket, { t: "error", message: "That message is too long." });
        }

        const line = {
          // Enough to tell two messages apart in a list; the server stamps it
          // so a client cannot forge an author or a time.
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          userId: socket.userId,
          username: socket.username,
          colour: socket.colour,
          text,
          at: new Date().toISOString(),
        };

        state.chat = [...state.chat, line].slice(-CHAT_HISTORY);
        // To everybody INCLUDING the sender, so one server ordering is the
        // only ordering and two people typing at once see the same transcript.
        broadcast(state, { t: "chat", message: line });

        /*
         * Written straight away rather than on the document's save timer.
         * Messages are occasional, so a write each is cheap, and losing the
         * last thing somebody said because a tab closed first would be far
         * more annoying than losing a few keystrokes of code.
         */
        roomsCollection()
          .then((rooms) =>
            rooms.updateOne(
              { _id: new ObjectId(state.id) },
              { $push: { chat: { $each: [line], $slice: -CHAT_HISTORY } }, $set: { updatedAt: new Date() } }
            )
          )
          .catch((err) => console.error(`Could not save a chat line in ${state.id}:`, err.message));
        return;
      }

      /*
       * A run or a submission that somebody in the room just made.
       *
       * Relayed so both people watch the same verdict land instead of one
       * narrating it. Two things are worth being precise about:
       *
       * The AUTHOR is taken from the socket, never from the message, so nobody
       * can announce a result in somebody else's name.
       *
       * The verdict itself is what the sender's browser was told by the judge,
       * and this server does not re-check it. That is acceptable because it
       * buys nothing: the real submission is already recorded against the
       * person who made it, and this is the room's shared view of what just
       * happened, not the record. Nobody gains a solve from what is relayed
       * here.
       */
      if (message.t === "result") {
        broadcast(state, {
          t: "result",
          result: {
            kind: message.kind === "run" ? "run" : "submit",
            verdict: String(message.verdict || "server_error").slice(0, 40),
            passed: Number(message.passed) || 0,
            total: Number(message.total) || 0,
            message: String(message.message || "").slice(0, 300),
            by: { id: socket.userId, username: socket.username, colour: socket.colour },
            at: new Date().toISOString(),
          },
        });
        return;
      }

      if (message.t === "language") {
        state.language = String(message.language || "cpp");
        broadcast(state, { t: "language", language: state.language }, socket);
        scheduleSave(state);
      }
    });

    socket.on("close", () => {
      clearTimeout(helloTimer);
      const state = socket.roomId && live.get(socket.roomId);
      if (!state) return;

      state.clients.delete(socket);
      if (state.clients.size > 0) {
        announcePresence(state);
        return;
      }

      /*
       * The last person left. Save now rather than waiting for the debounce,
       * then drop the room from memory — keeping it would leak a document per
       * room for the life of the process.
       */
      clearTimeout(state.saveTimer);
      const { id, doc, version, language } = state;
      live.delete(id);
      roomsCollection()
        .then((rooms) =>
          rooms.updateOne(
            { _id: new ObjectId(id) },
            { $set: { document: doc, version, language, updatedAt: new Date() } }
          )
        )
        .catch((err) => console.error(`Could not save room ${id} on close:`, err.message));
    });
  });

  /*
   * A dropped connection does not always produce a close event — a laptop lid
   * closing does not send anything. Without this, that person stays listed as
   * present for ever.
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
  console.log("Room sockets listening on /rooms/socket");
  return wss;
}

module.exports = { attachRealtime };
