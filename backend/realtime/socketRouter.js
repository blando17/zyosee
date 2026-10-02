/*
 * One upgrade listener, several socket endpoints.
 *
 * WHY THIS EXISTS, WHICH IS NOT OBVIOUS
 *
 * The natural way to add a second WebSocket endpoint is to construct a second
 * WebSocketServer with `{ server, path: "/duels/socket" }` beside the first.
 * That does not work, and it fails in a way that would have been very hard to
 * diagnose from the symptom.
 *
 * Passing `server` makes ws attach its own listener to the HTTP server's
 * "upgrade" event. Every such listener sees EVERY upgrade request, whatever
 * its path. ws then checks the path itself — and when it does not match, it
 * does not politely ignore the request, it calls abortHandshake and destroys
 * the socket (ws/lib/websocket-server.js, `shouldHandle` at the top of
 * `completeUpgrade`).
 *
 * So two of them on one server fight: whichever listener runs first kills the
 * connections meant for the other. Pair Lab would have started failing to
 * connect the moment the duel socket was added, with nothing in either file
 * looking wrong.
 *
 * The fix is the pattern ws documents for exactly this: every endpoint is a
 * `noServer` WebSocketServer, and ONE listener here reads the path and hands
 * the socket to the right one.
 */

const { WebSocketServer } = require("ws");

function createSocketRouter(server, allowedOrigins) {
  const routes = new Map();

  server.on("upgrade", (req, socket, head) => {
    // The query string is not part of the address. Nothing here reads one —
    // tokens travel in the first message, never the URL — but a request with
    // one appended should still reach its endpoint rather than be dropped.
    const pathname = String(req.url || "").split("?")[0];
    const wss = routes.get(pathname);

    if (!wss) {
      socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }

    /*
     * Anything may open a socket from a page we serve; a page on somebody
     * else's site may not. Without this, any website a logged-in user visited
     * could open a socket to this server.
     *
     * A request with no Origin at all is allowed through, which is the rule
     * the room socket already used: browsers always send one, so a missing
     * Origin means a non-browser client, and those still have to produce a
     * valid token in their first message before they can do anything.
     */
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      console.warn("Refused a socket from origin:", origin);
      socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });

  // Shutting the HTTP server down shuts the endpoints down with it, so each
  // one's own "close" handler runs and its heartbeat timer stops.
  server.on("close", () => {
    for (const wss of routes.values()) wss.close();
  });

  return {
    /* Claims one path and hands back the server that will own it. */
    route(pathname) {
      if (routes.has(pathname)) {
        throw new Error(`Two socket endpoints both asked for ${pathname}`);
      }
      const wss = new WebSocketServer({ noServer: true });
      routes.set(pathname, wss);
      return wss;
    },
    paths() {
      return [...routes.keys()];
    },
  };
}

module.exports = { createSocketRouter };
