import { useState } from "react";

/*
 * Problems solved per day, as bars you can point at.
 *
 * The y axis is deliberately a whole number of steps — a chart whose tallest
 * bar is "3.5 problems" is telling you something that cannot happen. With no
 * activity at all it still draws the grid and the days, because an empty chart
 * that looks deliberate reads better than a panel that vanishes.
 */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ActivityChart({ buckets, span, onSpanChange }) {
  const [hover, setHover] = useState(null);

  const highest = buckets.reduce((most, bucket) => Math.max(most, bucket.count), 0);
  const ceiling = Math.max(1, highest);
  // At most four gridlines, and never a fractional one.
  const step = Math.max(1, Math.ceil(ceiling / 4));
  const top = Math.ceil(ceiling / step) * step;
  const lines = Array.from({ length: top / step + 1 }, (_, i) => i * step).reverse();

  const solvedThisSpan = buckets.reduce((total, bucket) => total + bucket.count, 0);
  const activeDays = buckets.filter((bucket) => bucket.count > 0).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-1">
        {[7, 30].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSpanChange(option)}
            aria-pressed={span === option}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
              span === option ? "bg-brand-200 text-ink-900" : "text-brand-800 hover:bg-brand-100"
            }`}
          >
            {option} days
          </button>
        ))}
      </div>

      <div className="relative flex gap-2">
        <div className="flex w-5 shrink-0 flex-col justify-between py-0.5 text-right text-[10px] tabular-nums text-ink-500">
          {lines.map((line) => <span key={line}>{line}</span>)}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-0 flex flex-col justify-between" aria-hidden="true">
            {lines.map((line) => <span key={line} className="border-t border-brand-100" />)}
          </div>

          <div className="relative flex h-28 items-end gap-[3px]">
            {buckets.map((bucket) => {
              const height = top > 0 ? (bucket.count / top) * 100 : 0;
              return (
                <button
                  key={bucket.index}
                  type="button"
                  onMouseEnter={() => setHover(bucket)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(bucket)}
                  onBlur={() => setHover(null)}
                  aria-label={`${bucket.count} solved on ${bucket.date.toDateString()}`}
                  className="group flex h-full flex-1 items-end"
                >
                  <span
                    className={`w-full rounded-t transition-all duration-300 ${
                      bucket.count ? "bg-brand-400 group-hover:bg-brand-600" : "bg-brand-100 group-hover:bg-brand-200"
                    }`}
                    /* A day with nothing still gets a sliver, so the bar is
                       big enough to point at. */
                    style={{ height: bucket.count ? `${Math.max(height, 4)}%` : "3px" }}
                  />
                </button>
              );
            })}
          </div>

          {/* Labels only when they will not collide: seven days get names,
              thirty get the first of each week. */}
          <div className="mt-1.5 flex gap-[3px] text-[10px] text-ink-500">
            {buckets.map((bucket, index) => (
              <span key={bucket.index} className="flex-1 truncate text-center">
                {span <= 7
                  ? WEEKDAYS[bucket.date.getDay()]
                  : index % 7 === 0
                    ? bucket.date.getDate()
                    : ""}
              </span>
            ))}
          </div>

          {hover && (
            <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 rounded-lg bg-code px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
              {hover.count} solved &middot;{" "}
              {hover.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-ink-800">
        {solvedThisSpan === 0 ? (
          <>Nothing solved in this window yet. One problem is enough to start a streak.</>
        ) : (
          <>
            <span className="font-bold">{solvedThisSpan}</span> solved across{" "}
            <span className="font-bold">{activeDays}</span> {activeDays === 1 ? "day" : "days"} in the last {span}.
          </>
        )}
      </p>
    </div>
  );
}
