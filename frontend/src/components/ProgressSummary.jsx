/*
 * How far through the problem set somebody is.
 *
 * Every number here is derived from submissions that were actually judged, so
 * "solved" means the judge accepted it — not that the page was opened or the
 * editor typed in.
 */

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LEVELS = [
  { name: "Easy", ring: "text-emerald-600", chip: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  { name: "Medium", ring: "text-amber-600", chip: "bg-amber-50 text-amber-900 ring-amber-200" },
  { name: "Hard", ring: "text-rose-600", chip: "bg-rose-50 text-rose-800 ring-rose-200" },
];

export default function ProgressSummary({ solved, total, byDifficulty }) {
  /*
   * A judge with no problems would divide by zero. It cannot happen in practice
   * and the guard costs nothing, which is the right trade for a number rendered
   * into the page.
   */
  const fraction = total > 0 ? solved / total : 0;
  const percent = Math.round(fraction * 100);

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-brand-200 bg-surface px-5 py-4 shadow-sm">
      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle
            cx="32" cy="32" r={RADIUS} strokeWidth="7"
            className="fill-none stroke-brand-100"
          />
          <circle
            cx="32" cy="32" r={RADIUS} strokeWidth="7" strokeLinecap="round"
            className="fill-none stroke-brand-500 transition-[stroke-dashoffset] duration-700"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink-900">
          {percent}%
        </span>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-ink-900">Your progress</p>
        <p className="text-sm text-ink-800">
          <span className="font-semibold">{solved}</span> / {total} solved
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LEVELS.map((level) => {
          const counts = byDifficulty[level.name] || { solved: 0, total: 0 };
          return (
            <div
              key={level.name}
              className={`rounded-xl px-3 py-2 text-center ring-1 ${level.chip}`}
            >
              <p className="text-base font-bold leading-none">{counts.solved}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-80">
                {level.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
