/*
 * One icon set for the whole application.
 *
 * WHY THESE REPLACED EMOJI
 *
 * The app used forty seven emoji as its iconography, and emoji are the wrong
 * tool for interface marks for three reasons that all showed up in practice:
 *
 *   They are somebody else's artwork. The swords glyph rendered as a flat
 *   monochrome "X" on this machine and as full colour elsewhere, so a card
 *   that looked designed on one screen looked broken on another.
 *
 *   They ignore the theme. Every other colour in this app resolves through a
 *   CSS variable and flips with the palette; a colour emoji stays exactly as
 *   bright on a near-black page as on a cream one.
 *
 *   They are inconsistent with each other. Drawn by different hands at
 *   different weights, they never line up as a set however carefully they are
 *   placed.
 *
 * These are drawn on one 24x24 grid at one stroke weight, and every one takes
 * its colour from `currentColor` — so an icon is the same colour as the text
 * beside it, in either theme, for free.
 *
 * ACCESSIBILITY
 *
 * Decorative by default: aria-hidden, because the label next to an icon is
 * almost always already saying the same thing and a screen reader should not
 * hear it twice. Pass a `title` only where the icon is genuinely alone.
 */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/*
 * Paths only, so the set stays readable and every icon is guaranteed to share
 * the same grid, weight and cap style. Anything needing a filled shape or a
 * second element is a function instead.
 */
const PATHS = {
  /* ---- the features, as they appear in the navigation and on cards ---- */
  problems: "M7 3h7l5 5v12.2a.8.8 0 0 1-.8.8H7.8a.8.8 0 0 1-.8-.8V3.8A.8.8 0 0 1 7.8 3Zm7 0v5h5M9.5 13h5M9.5 16.5h5",
  pair: "M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11Zm7.5-.4a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2ZM3 19.4c0-2.7 2.7-4.4 6-4.4s6 1.7 6 4.4M16.2 14.6c2.9.2 4.8 1.8 4.8 4.2",
  duel: "M4 4h3l10.5 10.5M20 4h-3L6.5 14.5M15 15l2.2 2.2a1.6 1.6 0 0 0 2.3-2.3L17.3 12.7M9 15l-2.2 2.2a1.6 1.6 0 0 1-2.3-2.3L6.7 12.7",
  progress: "M4 20V11.5M9.3 20V4.5M14.7 20v-6M20 20V8.5",
  compiler: "M13.5 2.5 4.8 13.2a.6.6 0 0 0 .5 1h5.2l-1 7.3 8.7-10.7a.6.6 0 0 0-.5-1h-5.2Z",
  friends: "M8.6 12.4 6.3 10a2.2 2.2 0 0 1 3.1-3.1l1.3 1.3 1.3-1.3a2.2 2.2 0 0 1 3.1 3.1l-2.3 2.4M4 8.5 2.5 10a2 2 0 0 0 0 2.8l4.3 4.3a2 2 0 0 0 2.8 0M20 8.5 21.5 10a2 2 0 0 1 0 2.8l-4.3 4.3a2 2 0 0 1-2.8 0",
  think: "M9.5 20.5h5M9 17.6a6.5 6.5 0 1 1 6 0v1.1a.8.8 0 0 1-.8.8H9.8a.8.8 0 0 1-.8-.8Z",

  /* ---------------------------- duel arena ---------------------------- */
  dice: "M5.2 4.5h13.6a.7.7 0 0 1 .7.7v13.6a.7.7 0 0 1-.7.7H5.2a.7.7 0 0 1-.7-.7V5.2a.7.7 0 0 1 .7-.7Z",
  target: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm0-4.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z",
  trophy: "M8 4h8v5.5a4 4 0 0 1-8 0Zm0 1.5H5.5A2.5 2.5 0 0 0 8 10.8M16 5.5h2.5a2.5 2.5 0 0 1-2.5 5.3M12 13.5V17m-3.5 3h7",
  scales: "M12 4v16M7 20h10M5 9h14M5 9l-2.5 5a2.8 2.8 0 0 0 5 0Zm14 0-2.5 5a2.8 2.8 0 0 0 5 0ZM12 6.2 19 9M12 6.2 5 9",
  lock: "M6.8 10.5h10.4a.8.8 0 0 1 .8.8v8.4a.8.8 0 0 1-.8.8H6.8a.8.8 0 0 1-.8-.8v-8.4a.8.8 0 0 1 .8-.8Zm1.7 0V7.2a3.5 3.5 0 0 1 7 0v3.3",
  timer: "M12 21a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-8V9m-2.5-6h5",
  inbox: "M4 13.5 6.4 5.2a.8.8 0 0 1 .8-.6h9.6a.8.8 0 0 1 .8.6L20 13.5v5.2a.8.8 0 0 1-.8.8H4.8a.8.8 0 0 1-.8-.8Zm0 0h4.5l1.3 2.3h4.4l1.3-2.3H20",
  outbox: "M4 13.5 6.4 5.2a.8.8 0 0 1 .8-.6h9.6a.8.8 0 0 1 .8.6L20 13.5v5.2a.8.8 0 0 1-.8.8H4.8a.8.8 0 0 1-.8-.8Zm0 0h16M12 11.5V4.5m0 0-2.3 2.3M12 4.5l2.3 2.3",
  history: "M12 21a9 9 0 1 0-8.6-11.6M12 7.5V12l3 1.8M3.4 5v4.4h4.4",
  trendUp: "M3.5 16.5 9 11l3.5 3.5L20.5 6.5m0 0h-5m5 0v5M3.5 20.5h17",
  trendDown: "M3.5 7.5 9 13l3.5-3.5 8-8m0 0h-5m5 0v5M3.5 20.5h17",
  peace: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18ZM5.6 5.6l12.8 12.8",

  /* ------------------------------ friends ------------------------------ */
  search: "M10.5 17.5a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm5-2 5 5",
  envelope: "M4.8 5h14.4a.8.8 0 0 1 .8.8v12.4a.8.8 0 0 1-.8.8H4.8a.8.8 0 0 1-.8-.8V5.8a.8.8 0 0 1 .8-.8Zm-.5.4 7.7 6.3 7.7-6.3",
  bulb: "M9.5 20.5h5M10 17.6a6 6 0 1 1 4 0v1.2a.7.7 0 0 1-.7.7h-2.6a.7.7 0 0 1-.7-.7Z",

  /* ------------------------------ pair lab ----------------------------- */
  door: "M5 20.5h14M7.5 20.5V4.3a.8.8 0 0 1 1-.8l7 1.5a.8.8 0 0 1 .6.8v14.7M13.3 12.4v1.4",
  chat: "M20 14.2a1.8 1.8 0 0 1-1.8 1.8H8.5L4 19.5V5.8A1.8 1.8 0 0 1 5.8 4h12.4A1.8 1.8 0 0 1 20 5.8Z",
  pen: "M4 20.2 4.9 16 16.4 4.5a2.2 2.2 0 0 1 3.1 3.1L8 19.1Zm10.8-14.3 3.4 3.4",

  /* ------------------------------ progress ----------------------------- */
  fire: "M12 21.5c3.6 0 6-2.3 6-5.6 0-3.8-3.2-5.3-3.2-8.7 0-1.4.5-2.5 1-3.2-3.4.6-6.3 3.4-6.3 6.6 0 1.4.5 2.4.5 3.2 0 1-.7 1.7-1.5 1.7-1 0-1.7-.9-1.7-2.3-.9 1.1-1.3 2.6-1.3 4 0 2.9 2.6 4.3 6.5 4.3Z",
  repeat: "M4 9.5A4.5 4.5 0 0 1 8.5 5h11m0 0-3-3m3 3-3 3M20 14.5a4.5 4.5 0 0 1-4.5 4.5h-11m0 0 3 3m-3-3 3-3",
  signal: "M5 20v-4.5M11 20v-9M17 20V6.5",
  graduation: "M2.8 8.5 12 4.5l9.2 4-9.2 4Zm3.7 2.6v5.2c0 1.6 2.5 2.7 5.5 2.7s5.5-1.1 5.5-2.7v-5.2M20.4 9.3v5.4",
  calendar: "M4.8 6h14.4a.8.8 0 0 1 .8.8v12.4a.8.8 0 0 1-.8.8H4.8a.8.8 0 0 1-.8-.8V6.8A.8.8 0 0 1 4.8 6Zm-.8 4.5h16M8.5 3.5V6m7-2.5V6",

  /* ------------------------------- think ------------------------------- */
  memo: "M4.8 3.5h9.4L20 9.3v11a.8.8 0 0 1-.8.8H4.8a.8.8 0 0 1-.8-.8V4.3a.8.8 0 0 1 .8-.8Zm9.2 0v6h6M8 13h8M8 16.5h5",
  package: "M12 3.2 20.5 7.6v8.8L12 20.8 3.5 16.4V7.6Zm0 0v8.7m0 0L3.5 7.6M12 11.9l8.5-4.3M12 11.9v8.9",
  seedling: "M12 20.5v-6.3m0 0C12 10.8 9.3 8 6 8c0 3.4 2.7 6.2 6 6.2Zm0 0c0-3.4 2.7-6.2 6-6.2 0 3.4-2.7 6.2-6 6.2Z",
  palette: "M12 20.8a8.8 8.8 0 1 1 8.8-8.8c0 1.8-1.5 2.6-2.8 2.6h-2a2 2 0 0 0-1.4 3.4 1.7 1.7 0 0 1-1.2 2.8Z",
  warning: "M12 4.3 21.3 19a.8.8 0 0 1-.7 1.2H3.4a.8.8 0 0 1-.7-1.2ZM12 10v4m0 2.8v.2",

  /* ------------------------------- marks ------------------------------- */
  check: "M5 12.6 9.6 17 19 7.2",
  cross: "M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5",
  arrowRight: "M4.5 12h15m0 0-5.5-5.5M19.5 12 14 17.5",
  arrowLeft: "M19.5 12h-15m0 0L10 6.5M4.5 12 10 17.5",
  sparkle: "M12 3.5c.7 4.3 1.5 5.1 5.8 5.8-4.3.7-5.1 1.5-5.8 5.8-.7-4.3-1.5-5.1-5.8-5.8 4.3-.7 5.1-1.5 5.8-5.8ZM18 15.8c.35 2.1.75 2.5 2.9 2.9-2.15.35-2.55.75-2.9 2.9-.35-2.15-.75-2.55-2.9-2.9 2.15-.4 2.55-.8 2.9-2.9Z",
  gear: "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm8.2-1.8-1.8-.4a6.6 6.6 0 0 0 0-2l1.8-.4-1-2.6-1.7.8a6.7 6.7 0 0 0-1.4-1.4l.8-1.7-2.6-1-.4 1.8a6.6 6.6 0 0 0-2 0L11.5 3l-2.6 1 .8 1.7a6.7 6.7 0 0 0-1.4 1.4l-1.7-.8-1 2.6 1.8.4a6.6 6.6 0 0 0 0 2l-1.8.4 1 2.6 1.7-.8a6.7 6.7 0 0 0 1.4 1.4l-.8 1.7 2.6 1 .4-1.8a6.6 6.6 0 0 0 2 0l.4 1.8 2.6-1-.8-1.7a6.7 6.7 0 0 0 1.4-1.4l1.7.8Z",
  books: "M5 4.2h3.6a1.2 1.2 0 0 1 1.2 1.2v14a1.2 1.2 0 0 0-1.2-1.2H5Zm14 0h-3.6a1.2 1.2 0 0 0-1.2 1.2v14a1.2 1.2 0 0 1 1.2-1.2H19ZM12 6.4v13",
  page: "M6.5 3.5h11a.8.8 0 0 1 .8.8v14.4c0 1.6 1 2.3 1.9 2.3H6.5a2.2 2.2 0 0 1-2.2-2.2V5.7a2.2 2.2 0 0 1 2.2-2.2Zm2.2 5h6.6M8.7 12h6.6M8.7 15.5h4.4",
};

/*
 * A handful of marks need more than one element — the pips on a die, the dot
 * on a clock face. Kept as a separate table so PATHS stays a flat, readable
 * list of outlines rather than a mix of shapes and structure.
 */
const DOTS = {
  dice: [[9, 9], [15, 15], [12, 12]],
};

export default function Icon({ name, className = "h-[1.15em] w-[1.15em]", title, strokeWidth }) {
  const d = PATHS[name];
  const dots = DOTS[name];
  /*
   * A missing name renders nothing rather than throwing. An icon is never the
   * only thing carrying a meaning here, so a typo should cost a decoration,
   * not a page.
   */
  if (!d) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      className={`inline-block shrink-0 ${className}`}
      {...STROKE}
      strokeWidth={strokeWidth ?? STROKE.strokeWidth}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : "true"}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <path d={d} />
      {dots?.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.15" fill="currentColor" stroke="none" />
      ))}
    </svg>
  );
}

export const ICON_NAMES = Object.keys(PATHS);
