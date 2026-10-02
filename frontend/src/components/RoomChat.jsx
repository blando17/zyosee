import { useEffect, useRef, useState } from "react";

/*
 * The conversation alongside the code.
 *
 * Every line is stamped and ordered by the server, so both people read the
 * same transcript in the same order — including their own messages, which is
 * why nothing is shown optimistically here.
 */

const QUICK = ["Looks good", "Try this approach", "There's a bug", "Your turn"];

function timeOf(value) {
  const at = new Date(value);
  return Number.isNaN(at.getTime())
    ? ""
    : at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function RoomChat({ chat, me, onSay, disabled }) {
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);
  const listRef = useRef(null);
  const pinned = useRef(true);

  /*
   * Follow new messages, unless the reader has scrolled up.
   *
   * Yanking somebody back to the bottom while they are reading something from
   * five minutes ago is the classic chat annoyance, so whether we are pinned
   * is decided before the new message is painted.
   */
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (pinned.current) endRef.current?.scrollIntoView({ block: "end" });
  }, [chat]);

  function onScroll() {
    const list = listRef.current;
    if (!list) return;
    pinned.current = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  }

  function send(text) {
    const message = text.trim();
    if (!message || disabled) return;
    onSay(message);
    setDraft("");
    pinned.current = true;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={listRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
      >
        {chat.length === 0 && (
          <p className="py-8 text-center text-xs text-ink-500">
            No messages yet. Talk through the approach before you write it.
          </p>
        )}

        {chat.map((line) => {
          const mine = line.userId === me?.id;
          return (
            <div key={line.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-extrabold text-white"
                style={{ backgroundColor: line.colour }}
                aria-hidden="true"
              >
                {(line.username || "?").charAt(0).toUpperCase()}
              </span>
              <div className={`min-w-0 max-w-[80%] ${mine ? "text-right" : ""}`}>
                <p className="text-[11px] font-semibold text-ink-500">
                  {mine ? "You" : line.username} · {timeOf(line.at)}
                </p>
                <p
                  className={`mt-0.5 inline-block whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-sm ${
                    mine ? "bg-brand-200 text-ink-900" : "bg-brand-50 text-ink-900 ring-1 ring-brand-100"
                  }`}
                >
                  {line.text}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-brand-100 px-3 py-2.5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {QUICK.map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => send(phrase)}
              disabled={disabled}
              className="rounded-full border border-brand-200 px-2.5 py-1 text-[11px] font-semibold text-ink-800 transition hover:bg-brand-50 disabled:opacity-50"
            >
              {phrase}
            </button>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends, Shift+Enter is a new line — the convention
              // everywhere, and worth matching so nobody has to learn it.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(draft);
              }
            }}
            rows={1}
            maxLength={1000}
            disabled={disabled}
            placeholder={disabled ? "Reconnecting..." : "Type a message..."}
            aria-label="Message your partner"
            className="max-h-28 min-h-[2.4rem] flex-1 resize-y rounded-xl border border-brand-200 bg-surface px-3 py-2
                       text-sm placeholder-brand-400/80 focus:border-brand-400 focus:outline-none
                       focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={disabled || !draft.trim()}
            className="btn-primary shrink-0 px-3 py-2 text-sm disabled:opacity-50"
            aria-label="Send"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M2.5 3.5l15 6.5-15 6.5L5 10z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
