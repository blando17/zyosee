import { useEffect, useState } from "react";

/*
 * Three, two, one, go.
 *
 * This is decoration over something real. The match genuinely starts at
 * `startedAt`, a few seconds in the future, and the server will not hand out
 * the problem statements or accept a submission until that instant has passed
 * — so a browser that skips this animation, or renders it late, gains exactly
 * nothing. It exists so the start feels like a start, not to enforce one.
 */
export default function DuelCountdown({ startedAt, serverNow, onDone }) {
  const [left, setLeft] = useState(() => new Date(startedAt).getTime() - serverNow());

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = new Date(startedAt).getTime() - serverNow();
      setLeft(remaining);
      // A moment past zero, so the page asks for the problems after the server
      // is willing to give them rather than in the same millisecond.
      if (remaining <= -400) {
        clearInterval(timer);
        onDone();
      }
    }, 100);
    return () => clearInterval(timer);
  }, [startedAt, serverNow, onDone]);

  const seconds = Math.ceil(left / 1000);
  const text = left <= 0 ? "GO" : String(Math.max(1, seconds));

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-code/90 backdrop-blur-sm">
      <p className="font-display text-sm font-extrabold uppercase tracking-[0.3em] text-brand-300">
        Get ready
      </p>
      <p
        key={text}
        className="mt-2 animate-[ping_0.6s_ease-out_1] font-display text-[8rem] font-extrabold leading-none text-white sm:text-[12rem]"
        aria-live="assertive"
      >
        {text}
      </p>
      <p className="mt-2 text-sm text-brand-200">
        {left <= 0 ? "Problems revealed." : "Both players start at the same instant."}
      </p>
    </div>
  );
}
