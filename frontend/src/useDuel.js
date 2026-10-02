import { useCallback, useEffect, useRef, useState } from "react";
import { authApi, storedToken } from "./api";

/*
 * The live view of one duel.
 *
 * WHAT COMES FROM WHERE, WHICH IS THE WHOLE POINT
 *
 * Everything this hook shows is computed on the server and sent down. Nothing
 * is worked out here: not the scores, not who is winning, not whether a
 * problem is solved, not even what time it is. The page is a renderer.
 *
 * That is not architectural tidiness, it is the only way the numbers can be
 * trusted. If the browser added up the scores then the scores would be whatever
 * the browser said, and the person whose browser it was would be the one
 * deciding. So the server reads the submission log, works out the totals, and
 * both players are sent the same answer.
 *
 * WHAT THIS HOOK IS ALLOWED TO SEND
 *
 * Two things, neither of which carries any claim:
 *
 *   refresh   "look again" — no payload at all. The server re-reads the duel
 *             and the submission log for itself.
 *   report    which problem this person is looking at, and whether they are
 *             typing or running. Presence only; nothing is scored from it.
 *
 * There is deliberately no message that says "I solved it" or "my score is".
 *
 * THE CLOCK
 *
 * A duel ends at an instant the server knows. A laptop whose clock is five
 * minutes fast would otherwise show a different amount of time remaining than
 * its opponent's, and one of the two would be wrong about when to panic. Every
 * update carries the server's own `now`, the difference is kept, and every
 * countdown on the page is drawn through it.
 */

const RECONNECT_DELAY_MS = 1500;

export default function useDuel(duelId) {
  const [duel, setDuel] = useState(null);
  const [activity, setActivity] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");

  // serverNow - browserNow, at the last update.
  const skewRef = useRef(0);
  const socketRef = useRef(null);
  const retryTimer = useRef(null);

  const absorb = useCallback((view) => {
    if (view?.now) skewRef.current = new Date(view.now).getTime() - Date.now();
    setDuel(view);
  }, []);

  /*
   * One REST read before the socket is up.
   *
   * The socket answers in a few dozen milliseconds, so this is not about
   * speed: it is so a page whose socket cannot connect at all still shows the
   * duel instead of a spinner that never resolves. The socket then takes over
   * and keeps it fresh.
   */
  useEffect(() => {
    if (!duelId) return undefined;
    let live = true;
    authApi
      .get(`/duels/${duelId}`)
      .then(({ data }) => {
        if (live) absorb(data);
      })
      .catch((err) => {
        if (!live) return;
        setError(err?.response?.data?.message || "That duel is not available.");
        setStatus("denied");
      });
    return () => {
      live = false;
    };
  }, [duelId, absorb]);

  useEffect(() => {
    if (!duelId) return undefined;

    /*
     * `disposed` belongs to THIS run of the effect, not to the component.
     *
     * A ref here would be a real bug, and it was one in the room socket before
     * this pattern was adopted: React mounts, unmounts and mounts again in
     * development, and the second run would reset a shared flag before the
     * first socket's close event — which is asynchronous — arrived. That dead
     * socket would then see "not closed by us", reconnect, and leave two live
     * sockets both nudging the server. A closure variable cannot be reset by a
     * later run.
     */
    let disposed = false;
    let socket;

    const connect = () => {
      if (disposed) return;
      const token = storedToken();
      if (!token) {
        setError("You are signed out.");
        return;
      }

      const base = import.meta.env.VITE_AUTH_URL || "http://localhost:5001";
      socket = new WebSocket(base.replace(/^http/, "ws") + "/duels/socket");
      socketRef.current = socket;
      setStatus((current) => (current === "live" ? "reconnecting" : "connecting"));

      socket.onopen = () => {
        // In the first message, never the URL: a query string ends up in logs
        // and browser history, and this one is a live session key.
        socket.send(JSON.stringify({ t: "hello", token, duelId }));
      };

      socket.onmessage = (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch (err) {
          return;
        }
        if (message.t === "state") {
          absorb(message.duel);
          setActivity(message.activity || []);
          setStatus("live");
          setError("");
          return;
        }
        if (message.t === "activity") {
          setActivity(message.activity || []);
        }
      };

      socket.onclose = (event) => {
        if (disposed) return;
        // 4003 is "not your duel" — retrying cannot fix that.
        if (event.code === 4003) {
          setStatus("denied");
          setError("You are not in this duel.");
          return;
        }
        setStatus("reconnecting");
        retryTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      socket.onerror = () => {
        // onclose always follows, and that is where reconnecting is handled.
      };
    };

    connect();
    return () => {
      disposed = true;
      clearTimeout(retryTimer.current);
      if (socket && socket.readyState <= WebSocket.OPEN) socket.close();
    };
  }, [duelId, absorb]);

  /*
   * "Something changed, look again."
   *
   * Sent after a submission so the opponent's tick appears at once rather than
   * on the server's next tick a few seconds later. It carries no information,
   * so it is not a way of reporting a result — the server goes and reads the
   * judge's own record either way, and would reach the same answer if this
   * were never sent.
   */
  const refresh = useCallback(() => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ t: "refresh" }));
      return;
    }
    // No socket: fall back to asking directly, so a submission still updates
    // the page for the person who made it.
    authApi.get(`/duels/${duelId}`).then(({ data }) => absorb(data)).catch(() => {});
  }, [duelId, absorb]);

  const report = useCallback((problemIndex, state) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ t: "activity", problemIndex, state }));
    }
  }, []);

  /*
   * The server's idea of now, as best this browser can tell.
   *
   * Everything time-related on the page goes through this rather than
   * Date.now(), so a wrong system clock changes nothing a player sees.
   */
  const serverNow = useCallback(() => Date.now() + skewRef.current, []);

  return { duel, activity, status, error, refresh, report, serverNow, absorb };
}
