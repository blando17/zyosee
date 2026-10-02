/*
 * The shared drawing primitives for every Core CS diagram.
 *
 * WHY THESE ARE SVG AND NOT IMAGES FROM THE NOTES
 *
 * The source cheat-sheets have excellent diagrams, and cropping them was the
 * obvious plan. Three things stopped it:
 *
 *   They are somebody else's work. Every page of `Os.pdf` is signed by its
 *   author and carries their handle. Cropping them into this project would be
 *   republishing an artist's work inside it.
 *
 *   They are pictures of light-mode paper. This app has a dark theme, and a
 *   white rectangle in the middle of a near-black page is not a diagram, it is
 *   a hole.
 *
 *   They do not survive a phone. A 1024px wide cheat-sheet panel scaled to
 *   360px is unreadable, and there is nothing to be done about it because the
 *   labels are pixels.
 *
 * Drawn as SVG, every one of those goes away: strokes take `currentColor` and
 * fills use the palette variables, so a diagram flips with the theme like
 * everything else; text is text, so it scales, reflows to the viewBox and is
 * found by the browser's own search; and the whole set is a few kilobytes
 * rather than a few megabytes.
 *
 * HOUSE STYLE
 *
 * All of them are built from the four primitives below on a 320-wide viewBox,
 * so they share one stroke weight, one corner radius and one type size and
 * look like a set rather than twenty drawings. Each carries a real `title`,
 * which is what a screen reader announces — the drawing is never the only
 * place the information exists.
 */

export const BOX_FILL = {
  brand: "fill-brand-100 stroke-brand-400",
  plain: "fill-surface stroke-brand-300",
  deep: "fill-brand-200 stroke-brand-500",
  warn: "fill-amber-100 stroke-amber-400",
};

export function Box({ x, y, w, h, label, sub, tone = "plain", rx = 6 }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} className={BOX_FILL[tone]} strokeWidth="1.2" />
      <text
        x={x + w / 2}
        y={y + (sub ? h / 2 - 2 : h / 2 + 3)}
        textAnchor="middle"
        className="fill-ink-900 text-[8px] font-bold"
      >
        {label}
      </text>
      {sub && (
        <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle" className="fill-ink-500 text-[6.5px]">
          {sub}
        </text>
      )}
    </g>
  );
}

export function Oval({ cx, cy, rx, ry, label, tone = "brand" }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className={BOX_FILL[tone]} strokeWidth="1.2" />
      <text x={cx} y={cy + 3} textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
        {label}
      </text>
    </g>
  );
}

/*
 * An arrow. `d` is a path so a connector can curve where a straight line would
 * cross a box; the arrowhead is a marker defined once per diagram.
 */
export function Arrow({ d, label, lx, ly, dashed }) {
  return (
    <g>
      <path
        d={d}
        className="fill-none stroke-brand-600"
        strokeWidth="1.2"
        strokeDasharray={dashed ? "3 2" : undefined}
        markerEnd="url(#corecs-arrow)"
      />
      {label && (
        <text x={lx} y={ly} textAnchor="middle" className="fill-ink-500 text-[6.5px] font-bold">
          {label}
        </text>
      )}
    </g>
  );
}

export function Caption({ x, y, children, anchor = "middle", bold }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      className={`text-[7px] ${bold ? "fill-ink-800 font-bold" : "fill-ink-500"}`}
    >
      {children}
    </text>
  );
}

/* ------------------------------------------------------------ the set --- */
