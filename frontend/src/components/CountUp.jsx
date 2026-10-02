import { useEffect, useRef, useState } from "react";

/*
 * A number that counts up to itself when it comes into view.
 *
 * WHY requestAnimationFrame AND NOT setInterval
 *
 * A timer ticking every 16 ms is not the same thing as a frame. It drifts, it
 * fires while the tab is in the background burning battery on a number nobody
 * is looking at, and on a slow frame it queues up ticks that then all land at
 * once. requestAnimationFrame is called by the browser when it is actually
 * about to paint, pauses by itself in a hidden tab, and hands over the real
 * timestamp — so the animation is driven by elapsed TIME rather than by a
 * count of ticks, and lasts the same 1.6 seconds on a 60 Hz laptop and a
 * 120 Hz phone.
 *
 * THE EASING
 *
 * Fast at first, then slowing to a stop. A linear count is oddly lifeless —
 * it looks like a progress bar — and the deceleration is what makes the last
 * few digits feel like they are settling rather than being cut off. The curve
 * is an ease-out quint, steep enough that the number is recognisably in the
 * right range almost immediately, which matters because somebody may scroll
 * past before it finishes.
 *
 * REDUCED MOTION
 *
 * Somebody who has asked their system for less movement gets the final number
 * immediately, with no animation at all. A counter spinning through a hundred
 * intermediate values is exactly the kind of thing that setting is for, and it
 * cannot be softened into something gentler — the only respectful version is
 * not doing it.
 */

const DURATION_MS = 1600;

// Ease-out quint: 1 - (1 - t)^5.
function easeOut(t) {
  return 1 - (1 - t) ** 5;
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/*
 * Counts from 0 to `to`, starting when `run` becomes true.
 *
 * `run` rather than an observer of its own: a row of these should start
 * together when the row is seen, not each one separately as it happens to
 * cross the threshold, and the section already knows when that is.
 */
export function useCountUp(to, run, { duration = DURATION_MS } = {}) {
  const [value, setValue] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    if (!run) return undefined;

    const target = Number(to) || 0;

    if (prefersReducedMotion() || target === 0) {
      setValue(target);
      return undefined;
    }

    let start = null;
    const step = (now) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      /*
       * Rounded, not floored.
       *
       * Flooring an eased curve means the last frame before t hits 1 can still
       * read one short, so the number visibly jumps by one at the very end —
       * small, and the sort of thing that reads as a glitch rather than as a
       * finish.
       */
      setValue(Math.round(target * easeOut(t)));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [to, run, duration]);

  return value;
}

/*
 * How a figure is written out.
 *
 * Below ten thousand it is printed in full with thousand separators, because
 * "1,250" is a number somebody can hold in their head and "1.3K" is not.
 * Above that the digits stop carrying information — nobody reads 118,442 as
 * anything other than "a lot" — so it becomes 118K, and 1,180,000 becomes
 * 1.2M. One decimal place below a hundred, none above, so the label keeps a
 * steady width while the count is running instead of jittering wider and
 * narrower as digits appear.
 */
export function formatCount(n) {
  const value = Number(n) || 0;

  if (value < 10_000) return value.toLocaleString("en-US");

  if (value < 1_000_000) {
    const k = value / 1000;
    return `${k < 100 ? k.toFixed(1).replace(/\.0$/, "") : Math.round(k)}K`;
  }

  const m = value / 1_000_000;
  return `${m < 100 ? m.toFixed(1).replace(/\.0$/, "") : Math.round(m)}M`;
}

export default function CountUp({ to, run, suffix = "", duration }) {
  const value = useCountUp(to, run, { duration });

  return (
    /*
     * The live number is hidden from screen readers and the final one is given
     * to them instead.
     *
     * A counter animating through a hundred values is, to a screen reader, a
     * hundred announcements of a number that is wrong. aria-hidden on the
     * visible text and the real figure in a visually-hidden span means it is
     * read once, correctly, whatever the animation is doing.
     */
    <>
      <span aria-hidden="true">
        {formatCount(value)}
        {suffix}
      </span>
      <span className="sr-only">
        {formatCount(to)}
        {suffix}
      </span>
    </>
  );
}
