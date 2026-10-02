import { useState } from "react";

/*
 * A ring split into segments, with a legend that highlights on hover.
 *
 * Drawn with one circle per segment and a dash pattern rather than arc paths:
 * a dash of the right length starting at the right offset IS the arc, and it
 * animates and rounds its caps without any trigonometry.
 *
 * The middle shows whichever segment is being pointed at, and the headline
 * figure when nothing is.
 */

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Donut({ segments, total, centreValue, centreLabel }) {
  const [active, setActive] = useState(null);

  const usable = segments.filter((segment) => segment.value > 0);
  const shown = active && usable.find((segment) => segment.id === active);

  let offset = 0;
  const arcs = usable.map((segment) => {
    const fraction = total > 0 ? segment.value / total : 0;
    const arc = { ...segment, fraction, offset };
    offset += fraction;
    return arc;
  });

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 128 128" className="h-36 w-36 -rotate-90">
          <circle cx="64" cy="64" r={RADIUS} className="fill-none stroke-brand-100" strokeWidth="16" />
          {arcs.map((arc) => (
            <circle
              key={arc.id}
              cx="64"
              cy="64"
              r={RADIUS}
              strokeWidth={active === arc.id ? 19 : 16}
              strokeLinecap="round"
              className={`fill-none cursor-pointer transition-all duration-300 ${arc.stroke} ${
                active && active !== arc.id ? "opacity-35" : "opacity-100"
              }`}
              strokeDasharray={`${Math.max(arc.fraction * CIRCUMFERENCE - 2, 0)} ${CIRCUMFERENCE}`}
              strokeDashoffset={-arc.offset * CIRCUMFERENCE}
              onMouseEnter={() => setActive(arc.id)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-extrabold leading-none text-ink-900">
            {shown ? shown.value : centreValue}
          </span>
          <span className="mt-0.5 text-[11px] font-semibold text-ink-500">
            {shown ? shown.label.toLowerCase() : centreLabel}
          </span>
        </div>
      </div>

      <ul className="min-w-[9rem] flex-1 space-y-1.5">
        {segments.map((segment) => {
          const percent = total > 0 ? Math.round((segment.value / total) * 100) : 0;
          return (
            <li key={segment.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(segment.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(segment.id)}
                onBlur={() => setActive(null)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm transition ${
                  active === segment.id ? "bg-brand-50" : ""
                }`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${segment.fill}`} aria-hidden="true" />
                <span className="font-medium text-ink-800">{segment.label}</span>
                <span className="ml-auto font-semibold tabular-nums text-ink-900">{segment.value}</span>
                <span className="w-11 text-right tabular-nums text-xs text-ink-500">({percent}%)</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
