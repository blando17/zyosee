import { useEffect, useState } from "react";
import Icon from "./Icon";
import { clockText } from "../duelText";

/*
 * The match clock.
 *
 * Drawn from the SERVER's idea of now, never the browser's. A laptop whose
 * clock is a few minutes out would otherwise show its owner a different amount
 * of time remaining than their opponent sees, and one of them would be wrong
 * about when to stop polishing and submit. `serverNow` comes from useDuel,
 * which keeps the difference from every update.
 *
 * It only DISPLAYS. The duel ends because the server says its end time has
 * passed; this reaching zero changes nothing on its own, which is why a tab
 * left asleep or a clock nudged forward cannot end anybody's match early.
 */

const WARN_MS = 5 * 60 * 1000;
const PANIC_MS = 60 * 1000;

export default function DuelTimer({ endsAt, serverNow, label = "Remaining" }) {
  // Half a second, not one: ticking on the second means the number sometimes
  // visibly skips one as the two clocks drift past each other.
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(timer);
  }, []);

  const remaining = Math.max(0, new Date(endsAt).getTime() - serverNow());
  const level = remaining <= PANIC_MS ? "panic" : remaining <= WARN_MS ? "warn" : "calm";

  const tone = {
    calm: "border-brand-200 bg-surface text-ink-900",
    warn: "border-amber-300 bg-amber-50 text-amber-900",
    panic: "border-rose-300 bg-rose-50 text-rose-700",
  }[level];

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 ${tone} ${
        level === "panic" ? "animate-pulse" : ""
      }`}
      /* Announced only when it starts mattering. A clock that reads itself out
         every half second is unusable with a screen reader. */
      role="timer"
      aria-live={level === "panic" ? "assertive" : "off"}
    >
      <Icon name="timer" className="h-4 w-4" />
      <span className="leading-tight">
        <span className="block font-display text-xl font-extrabold tabular-nums">
          {clockText(remaining)}
        </span>
        <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-70">
          {remaining === 0 ? "Time up" : label}
        </span>
      </span>
    </div>
  );
}
