/*
 * The decoration behind one feature band.
 *
 * WHAT IT IS FOR
 *
 * The page backdrop is deliberately even — one wash, one grid, a few drifting
 * orbs — and across six long bands that evenness became the problem: every
 * band looked like the one before it. This adds a layer of its own to each
 * band, built from the vocabulary in the reference designs: soft organic
 * blobs, a patch of dot matrix, a few small plus marks, a circle outline and
 * one flowing line.
 *
 * EVERY PIECE IS DECORATION
 *
 * The whole layer is aria-hidden and pointer-events-none, sits at the bottom
 * of the stacking order inside its band, and never carries information. If it
 * failed to render, nothing would be lost but the texture.
 *
 * WHY THE SHAPES ARE MIRRORED RATHER THAN DIFFERENT
 *
 * The bands alternate which side the picture sits on, so the decoration has to
 * alternate with it or it ends up crowding the words on half the page. One set
 * of shapes, flipped, keeps the rhythm without six hand-placed layouts to keep
 * in step with each other.
 */

/* Four organic blobs, varied enough that two neighbouring bands do not twin. */
const BLOBS = [
  "M52 8c22 -6 46 4 54 24s2 44 -14 58 -40 20 -58 10S8 62 14 40 30 14 52 8Z",
  "M46 4c26 0 50 16 54 38s-14 46 -36 54 -48 2 -58 -18 -4 -48 12 -60S20 4 46 4Z",
  "M58 6c20 2 38 20 40 42s-10 44 -30 52 -44 2 -56 -16 -10 -44 4 -58S38 4 58 6Z",
  "M40 10c24 -8 52 2 60 22s0 48 -18 62 -44 16 -58 2S6 54 12 34 16 18 40 10Z",
];

export default function BandDecor({ flip = false, variant = 0, tint = "brand" }) {
  const blob = BLOBS[variant % BLOBS.length];
  const second = BLOBS[(variant + 2) % BLOBS.length];

  /* Each band leans slightly warm or slightly cool, so six of them in a row
     are not one colour repeated. */
  const hue = {
    brand: { big: "fill-brand-200/40", small: "fill-amber-100/60", line: "stroke-brand-300/60", dots: "text-brand-300/50", mark: "text-brand-400/60" },
    warm: { big: "fill-orange-200/30", small: "fill-brand-100/70", line: "stroke-brand-400/50", dots: "text-brand-400/40", mark: "text-orange-400/50" },
    cool: { big: "fill-sky-200/25", small: "fill-brand-100/60", line: "stroke-sky-300/55", dots: "text-sky-300/45", mark: "text-brand-400/55" },
  }[tint];

  return (
    <div
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${flip ? "scale-x-[-1]" : ""}`}
      aria-hidden="true"
    >
      {/* The two blobs. preserveAspectRatio="none" lets one shape stretch to
          whatever the band's proportions turn out to be. */}
      <svg
        viewBox="0 0 110 110"
        preserveAspectRatio="none"
        className="absolute -left-[8%] top-[-18%] h-[150%] w-[46%]"
      >
        <path d={blob} className={hue.big} />
      </svg>
      <svg
        viewBox="0 0 110 110"
        preserveAspectRatio="none"
        className="absolute -right-[14%] bottom-[-30%] h-[120%] w-[40%]"
      >
        <path d={second} className={hue.small} />
      </svg>

      {/* One flowing line with a dot at its end, as in the reference. */}
      <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-x-0 top-[6%] h-[38%] w-full">
        <path
          d="M-10 78 C 90 78, 130 18, 220 22 S 340 66, 412 14"
          fill="none"
          strokeWidth="1.4"
          className={hue.line}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="412" cy="14" r="3.5" className={hue.dots.replace("text-", "fill-")} />
      </svg>

      {/* Two patches of dot matrix. */}
      <span className={`oj-dots absolute left-[6%] top-[14%] h-16 w-24 ${hue.dots}`} />
      <span className={`oj-dots absolute right-[8%] bottom-[12%] h-20 w-28 ${hue.dots}`} />

      {/* A circle outline and a few plus marks. */}
      <span className={`absolute left-[3%] top-[62%] h-10 w-10 rounded-full border-2 ${hue.line.replace("stroke-", "border-")}`} />
      {[
        { left: "22%", top: "10%", size: "text-sm" },
        { left: "46%", top: "78%", size: "text-xs" },
        { left: "74%", top: "18%", size: "text-base" },
      ].map((mark) => (
        <span
          key={mark.left}
          className={`absolute font-bold leading-none ${mark.size} ${hue.mark}`}
          style={{ left: mark.left, top: mark.top }}
        >
          +
        </span>
      ))}
    </div>
  );
}
