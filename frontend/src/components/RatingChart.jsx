import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { Link } from "react-router-dom";

/*
 * Arena rating over the duels that produced it.
 *
 * WHAT IT PLOTS
 *
 * One point per finished duel, in order, joined by a line, with the starting
 * rating as the leftmost point so the first result has something to move from.
 * The x axis is duels played rather than dates: a rating only changes when a
 * match ends, so a calendar axis would be a flat line with occasional cliffs
 * and mostly empty space. Each point still carries its date, in the tooltip.
 *
 * THE Y AXIS DOES NOT START AT ZERO, AND SAYS SO
 *
 * Nobody's rating goes anywhere near zero — they start at 1200 — so a zero
 * baseline would squash every real change into a flat line near the top. The
 * axis is therefore windowed around the range actually played, which is the
 * right call for this data and also the classic way to make a small change
 * look dramatic. Both end labels are drawn, so the window is visible rather
 * than implied.
 *
 * A single duel is a point, not a trend, and the caption below says that
 * rather than letting one result look like a direction.
 */

const OUTCOME = {
  won: { dot: "fill-emerald-500", ring: "stroke-emerald-500", text: "text-emerald-700", word: "Won" },
  lost: { dot: "fill-rose-500", ring: "stroke-rose-500", text: "text-rose-700", word: "Lost" },
  draw: { dot: "fill-brand-400", ring: "stroke-brand-400", text: "text-ink-500", word: "Drawn" },
};

/*
 * The drawing surface, measured rather than assumed.
 *
 * A fixed viewBox looked like the tidy answer and was wrong. An SVG's default
 * preserveAspectRatio is "xMidYMid meet", which scales the drawing to FIT its
 * box without distorting it — so a 320x120 viewBox inside a wide, 128px-tall
 * panel was sized to the height and then CENTRED, leaving the chart floating
 * in the middle of the panel with empty space either side.
 *
 * "none" would stretch it to fill, and would also stretch the strokes and turn
 * every dot into an ellipse. So the width is measured instead and the viewBox
 * matches the element one-to-one: the line fills the panel, and a circle is
 * still a circle.
 */
const H = 120;
const PAD_X = 8;
const PAD_Y = 10;
// Used for the very first paint, before the observer has measured anything.
const FALLBACK_W = 320;

function useMeasuredWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(FALLBACK_W);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    // Not a window resize listener: this panel also changes width when the
    // grid reflows around it, which fires no window event.
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width;
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

export default function RatingChart({ history }) {
  const [hover, setHover] = useState(null);
  const [frame, W] = useMeasuredWidth();

  const { rating, start, points = [], played, won, lost, drawn, best, worst } = history;

  /* ------------------------- nothing played yet ------------------------- */
  if (!played) {
    return (
      <div className="text-center">
        <p className="font-display text-5xl font-extrabold tabular-nums text-ink-900">{rating}</p>
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Starting rating
        </p>
        {/* An empty chart would be a line with one point on it, which says
            nothing. This says the one true thing instead. */}
        <p className="mx-auto mt-4 max-w-xs rounded-xl bg-brand-50 px-4 py-3 text-xs text-ink-800">
          Your rating moves when a duel finishes. Win against somebody rated higher than you and it
          moves further.
        </p>
        <Link to="/arena" className="btn-primary mt-4 w-full justify-center py-2.5 text-sm">
          <Icon name="duel" className="h-4 w-4" /> Go to the arena
        </Link>
      </div>
    );
  }

  /* ------------------------------ the line ------------------------------ */
  // The start sits at index 0, so N duels give N+1 points.
  const series = [{ rating: start, origin: true }, ...points];

  const highest = Math.max(...series.map((point) => point.rating));
  const lowest = Math.min(...series.map((point) => point.rating));
  // A flat history would divide by zero; a tiny one would draw a line jumping
  // the full height of the panel for a single point of movement.
  const span = Math.max(20, highest - lowest);
  const top = highest + span * 0.15;
  const bottom = lowest - span * 0.15;

  const x = (index) =>
    PAD_X + (series.length === 1 ? (W - PAD_X * 2) / 2 : (index / (series.length - 1)) * (W - PAD_X * 2));
  const y = (value) => PAD_Y + (1 - (value - bottom) / (top - bottom)) * (H - PAD_Y * 2);

  const line = series.map((point, index) => `${x(index)},${y(point.rating)}`).join(" ");
  const area = `${x(0)},${H} ${line} ${x(series.length - 1)},${H}`;

  const overall = rating - start;
  const shown = hover ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <p className="font-display text-4xl font-extrabold tabular-nums leading-none text-ink-900">
          {rating}
        </p>
        <p
          className={`text-sm font-bold tabular-nums ${
            overall > 0 ? "text-emerald-700" : overall < 0 ? "text-rose-700" : "text-ink-500"
          }`}
        >
          {overall > 0 ? "+" : ""}
          {overall}
          <span className="ml-1 font-medium text-ink-500">
            from {start} in {played} duel{played === 1 ? "" : "s"}
          </span>
        </p>
      </div>

      <div className="relative mt-3" ref={frame}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          className="overflow-visible"
          role="img"
          aria-label={`Rating ${rating}, ${overall >= 0 ? "up" : "down"} ${Math.abs(overall)} from ${start} over ${played} duels`}
        >
          <defs>
            <linearGradient id="rating-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* The line your rating started at, so a climb or a slide is read
              against where you began rather than against the panel edge. */}
          <line
            x1={PAD_X} x2={W - PAD_X} y1={y(start)} y2={y(start)}
            className="stroke-brand-200" strokeDasharray="3 3" strokeWidth="1"
          />

          <polygon points={area} fill="url(#rating-fade)" />
          <polyline
            points={line}
            fill="none"
            className="stroke-brand-500"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {series.map((point, index) => {
            const look = point.origin ? null : OUTCOME[point.outcome];
            const active = shown?.index === index;
            return (
              <g key={point.duelId || "start"}>
                <circle
                  cx={x(index)} cy={y(point.rating)} r={active ? 5 : 3.5}
                  className={point.origin ? "fill-white stroke-brand-300" : `${look.dot} stroke-white`}
                  strokeWidth="2"
                />
                {/* A generous invisible target: the real dots are a few pixels
                    across and would be almost impossible to point at. */}
                <circle
                  cx={x(index)} cy={y(point.rating)} r="12"
                  fill="transparent"
                  className="cursor-pointer"
                  tabIndex={0}
                  role="button"
                  aria-label={
                    point.origin
                      ? `Starting rating ${point.rating}`
                      : `${OUTCOME[point.outcome].word} against ${point.opponent}, rating ${point.rating}`
                  }
                  onMouseEnter={() => setHover({ ...point, index })}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover({ ...point, index })}
                  onBlur={() => setHover(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Both ends of the window, drawn rather than implied, because the axis
            deliberately does not start at zero. */}
        <span className="pointer-events-none absolute right-0 top-0 rounded bg-surface/80 px-1 text-[10px] tabular-nums text-ink-500">
          {best}
        </span>
        <span className="pointer-events-none absolute bottom-0 right-0 rounded bg-surface/80 px-1 text-[10px] tabular-nums text-ink-500">
          {worst}
        </span>
      </div>

      {/* Reserved height, so hovering a point does not shuffle the panel and
          everything below it up and down. */}
      <div className="mt-2 min-h-[2.75rem]">
        {shown && !shown.origin ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg bg-brand-50 px-3 py-2 text-xs">
            <span className={`font-bold ${OUTCOME[shown.outcome].text}`}>
              {OUTCOME[shown.outcome].word}
            </span>
            <span className="text-ink-800">vs {shown.opponent}</span>
            {shown.score !== null && (
              <span className="tabular-nums text-ink-500">
                {shown.score}–{shown.opponentScore}
              </span>
            )}
            <span className="ml-auto font-bold tabular-nums text-ink-900">
              {shown.rating}
              <span
                className={
                  shown.change > 0 ? "ml-1 text-emerald-700" : shown.change < 0 ? "ml-1 text-rose-700" : "ml-1 text-ink-500"
                }
              >
                ({shown.change > 0 ? "+" : ""}
                {shown.change})
              </span>
            </span>
          </div>
        ) : shown?.origin ? (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-ink-800">
            Where you started, before your first duel.
          </p>
        ) : (
          <p className="px-1 text-xs text-ink-500">
            {played === 1
              ? "One duel is a point, not a trend. Play a few more to see a shape."
              : `${won} won · ${lost} lost · ${drawn} drawn. Point at a dot for that match.`}
          </p>
        )}
      </div>
    </div>
  );
}
