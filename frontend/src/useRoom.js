import { useCallback, useEffect, useRef, useState } from "react";
import { storedToken } from "./api";

/*
 * The live connection to a Pair Lab room.
 *
 * Holds the socket, the shared document and who else is present, and hides the
 * one genuinely fiddly part: applying somebody else's edit without throwing
 * your own cursor to the end of the file.
 *
 * The server is the authority. Every edit carries the version it was based on;
 * if that is stale the server refuses it and sends back the truth, so the two
 * screens can never quietly disagree about what the code says.
 */

const RECONNECT_DELAY_MS = 1500;
const SEND_DEBOUNCE_MS = 150;

/*
 * Where the caret should sit after the text underneath it changed.
 *
 * Without this, applying a remote edit means assigning a new value to the
 * textarea, which puts the caret at the end — so the moment your partner types
 * anything, you are thrown to the bottom of the file mid-word.
 *
 * The shared prefix and suffix say where the change actually was. A caret
 * before it does not move; one after it shifts by the length difference; one
 * inside the edited region is clamped, because there is no honest answer.
 */
export function remapCaret(before, after, caret) {
  if (before === after) return caret;

  const shortest = Math.min(before.length, after.length);
  let prefix = 0;
  while (prefix < shortest && before[prefix] === after[prefix]) prefix += 1;
  if (caret <= prefix) return caret;

  let suffix = 0;
  while (
    suffix < shortest - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  if (caret >= before.length - suffix) return after.length - (before.length - caret);
  return Math.min(caret, after.length);
}

export default function useRoom(roomId, { username, textareaId }) {
  const [status, setStatus] = useState("connecting");
  const [document_, setDocument] = useState("");
  const [members, setMembers] = useState([]);
  const [me, setMe] = useState(null);
  const [language, setLanguage] = useState("cpp");
  const [error, setError] = useState("");
  const [chat, setChat] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  const socketRef = useRef(null);
  const versionRef = useRef(0);
  const documentRef = useRef("");
  const sendTimer = useRef(null);
  const retryTimer = useRef(null);

  /*
   * Writes text that came from somebody else, keeping the caret where it
   * belongs. React sets the value through state; the caret has to be restored
   * afterwards, once the DOM has the new text.
   */
  const applyRemote = useCallback(
    (text) => {
      const field = window.document.getElementById(textareaId);
      const caret = field ? remapCaret(documentRef.current, text, field.selectionStart ?? 0) : null;

      documentRef.current = text;
      setDocument(text);

      if (field && caret !== null && window.document.activeElement === field) {
        requestAnimationFrame(() => {
          try {
            field.setSelectionRange(caret, caret);
          } catch (err) {
            // A field that went away between frames. Nothing to restore.
          }
        });
      }
    },
    [textareaId]
  );

  useEffect(() => {
    if (!roomId) return undefined;

    /*
     * `disposed` belongs to THIS run of the effect, not to the component.
     *
     * It used to be a ref, and that was a real bug. React's StrictMode mounts,
     * unmounts and mounts again in development, and any quick navigation away
     * and back does the same in production. The second run reset the shared
     * flag to false before the first socket's close event — which is
     * asynchronous — had arrived. That dead socket then saw "not closed by us"
     * and dutifully reconnected, leaving TWO live sockets in the room and
     * every message arriving twice.
     *
     * A closure variable cannot be reset by a later run, so each socket can
     * only ever consult its own.
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
      const url = base.replace(/^http/, "ws") + "/rooms/socket";
      socket = new WebSocket(url);
      socketRef.current = socket;
      setStatus("connecting");

      socket.onopen = () => {
        // The token goes in the first message, never the URL: query strings
        // end up in logs and history, and this one is a live session key.
        socket.send(JSON.stringify({ t: "hello", token, roomId, username }));
      };

      socket.onmessage = (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch (err) {
          return;
        }

        if (message.t === "welcome") {
          versionRef.current = message.version;
          documentRef.current = message.document;
          setDocument(message.document);
          setLanguage(message.language);
          setMe(message.you);
          setMembers(message.members || []);
          setChat(message.chat || []);
          setStatus("live");
          setError("");
          return;
        }
        if (message.t === "doc") {
          versionRef.current = message.version;
          applyRemote(message.document);
          return;
        }
        if (message.t === "ack") {
          versionRef.current = message.version;
          return;
        }
        if (message.t === "resync") {
          // Somebody else's edit landed first. Theirs is the document now.
          versionRef.current = message.version;
          applyRemote(message.document);
          return;
        }
        if (message.t === "presence") {
          setMembers(message.members || []);
          return;
        }
        if (message.t === "result") {
          setLastResult(message.result);
          return;
        }
        if (message.t === "chat") {
          /*
           * Appended as it arrives from the server, including our own lines.
           * Showing a message locally the moment it is typed would be faster
           * to look at and wrong: two people talking at once would each see
           * their own line first and the transcripts would not match.
           */
          setChat((lines) => [...lines, message.message]);
          return;
        }
        if (message.t === "language") {
          setLanguage(message.language);
          return;
        }
        if (message.t === "error") {
          setError(message.message || "Something went wrong in the room.");
        }
      };

      socket.onclose = (event) => {
        if (disposed) return;
        // 4003 is "you are not in this room" — retrying cannot fix that.
        if (event.code === 4003) {
          setStatus("denied");
          setError("You are not a member of this room.");
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
      clearTimeout(sendTimer.current);
      clearTimeout(retryTimer.current);
      if (socket && socket.readyState <= WebSocket.OPEN) socket.close();
    };
  }, [roomId, username, applyRemote]);

  /* A local edit: shown at once, sent a beat later. */
  const edit = useCallback((text) => {
    documentRef.current = text;
    setDocument(text);

    clearTimeout(sendTimer.current);
    sendTimer.current = setTimeout(() => {
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ t: "doc", text: documentRef.current, base: versionRef.current }));
      }
    }, SEND_DEBOUNCE_MS);
  }, []);

  const reportLine = useCallback((line) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ t: "cursor", line }));
    }
  }, []);

  /*
   * Tell the room what the judge said. Sent to the server and mirrored back to
   * everybody including us, so the whole room sees one result at one moment.
   */
  const shareResult = useCallback((result) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ t: "result", ...result }));
    }
  }, []);

  const say = useCallback((text) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ t: "chat", text }));
    }
  }, []);

  const changeLanguage = useCallback((next) => {
    setLanguage(next);
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ t: "language", language: next }));
    }
  }, []);

  return { status, error, document: document_, members, me, language, chat, lastResult, edit, reportLine, say, shareResult, changeLanguage };
}
