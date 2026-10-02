/*
 * Spot illustrations.
 *
 * Drawn in markup rather than shipped as images: they stay sharp at any size,
 * they follow the theme's own colours instead of being baked at export time,
 * and they cost nothing to download.
 *
 * Every one of these is decoration. They all carry aria-hidden, and none of
 * them is ever the only thing saying something — an empty state has words
 * beside the picture, because a paper aeroplane does not tell a screen reader
 * that no requests are outstanding.
 *
 * The two-person pieces use amber for "you" and blue for "them" throughout, so
 * the pairing reads the same on every screen it appears on.
 */

const AMBER = "#f59e0b";
const AMBER_SOFT = "#fbbf24";
const AMBER_PALE = "#fde68a";
const CREAM = "#fef3c7";
const BLUE = "#3b82f6";
const BLUE_PALE = "#bfdbfe";
const INK = "#1f1710";

/* A small four-pointed sparkle, used to lift the corners of the empty states. */
function Sparkle({ x, y, size = 7, colour = AMBER_SOFT, opacity = 1 }) {
  return (
    <path
      d={`M${x} ${y - size} Q${x + size * 0.18} ${y - size * 0.18} ${x + size} ${y}
          Q${x + size * 0.18} ${y + size * 0.18} ${x} ${y + size}
          Q${x - size * 0.18} ${y + size * 0.18} ${x - size} ${y}
          Q${x - size * 0.18} ${y - size * 0.18} ${x} ${y - size} Z`}
      fill={colour}
      opacity={opacity}
    />
  );
}

/* A person, as a disc with a head and shoulders. */
function Figure({ cx, cy, r, colour }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={colour} />
      <circle cx={cx} cy={cy - r * 0.22} r={r * 0.28} fill="#fff" />
      <path
        d={`M${cx - r * 0.5} ${cy + r * 0.62}
            a ${r * 0.5} ${r * 0.44} 0 0 1 ${r} 0 Z`}
        fill="#fff"
      />
    </g>
  );
}

/*
 * A dark editor card with a few lines of "code" in it.
 *
 * Every coordinate is coerced with Number() because this does arithmetic with
 * them. JSX attributes are strings unless they are written in braces, and
 * `"34" + 46` is "3446", not 80 — which put the rotation origin thousands of
 * units off-canvas and made the cards vanish while the circles beside them,
 * whose props happened to be numbers, drew perfectly. Coercing here means a
 * call site cannot reintroduce it.
 */
function CodeCard({ x: rawX, y: rawY, w: rawW, h: rawH, rotate = 0, lines, accent }) {
  const x = Number(rawX);
  const y = Number(rawY);
  const w = Number(rawW);
  const h = Number(rawH);

  return (
    <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
      <rect x={x} y={y} width={w} height={h} rx="9" fill={INK} />
      <rect x={x} y={y} width={w} height="11" rx="9" fill="#3a2c1e" />
      <rect x={x} y={y + 6} width={w} height="5" fill="#3a2c1e" />
      {[0, 1, 2].map((dot) => (
        <circle key={dot} cx={x + 9 + dot * 7} cy={y + 5.5} r="1.8" fill="#6b5640" />
      ))}
      {lines.map((line, index) => (
        <rect
          key={index}
          x={x + 9 + (line.indent || 0)}
          y={y + 20 + index * 9}
          width={line.width}
          height="4"
          rx="2"
          fill={index === 1 ? accent : "#7c6a55"}
          opacity={index === 1 ? 0.95 : 0.55}
        />
      ))}
    </g>
  );
}

/* A mouse pointer. */
function Cursor({ x, y, colour, rotate = 0 }) {
  return (
    <g transform={`rotate(${rotate} ${x} ${y})`}>
      <path d={`M${x} ${y} l0 14 l3.4 -3.6 l2.6 5.4 l2.8 -1.4 l-2.6 -5.2 l4.8 -0.4 Z`} fill={colour} stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" />
    </g>
  );
}

/* ------------------------------------------------------------------ *
 * Pair Lab — two people, two cursors, one file
 * ------------------------------------------------------------------ */
export function PairLabArt({ className = "" }) {
  return (
    <svg viewBox="0 0 300 150" className={className} aria-hidden="true" fill="none">
      <ellipse cx="88" cy="112" rx="74" ry="26" fill={CREAM} />
      <ellipse cx="212" cy="106" rx="68" ry="24" fill={CREAM} opacity="0.75" />

      {/* The link between them, drawn first so it passes behind the figures. */}
      <path
        d="M76 42 C110 14, 168 14, 198 38"
        stroke={AMBER}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1 7"
        opacity="0.85"
      />

      <CodeCard
        x={34} y={56} w={92} h={60} rotate={-5} accent={AMBER_SOFT}
        lines={[{ width: 46 }, { width: 60, indent: 8 }, { width: 34, indent: 8 }, { width: 24 }]}
      />
      <CodeCard
        x={166} y={50} w={96} h={62} rotate={4} accent={BLUE_PALE}
        lines={[{ width: 52 }, { width: 44, indent: 8 }, { width: 62, indent: 8 }, { width: 30 }]}
      />

      <Cursor x={108} y={92} colour={AMBER} rotate={-8} />
      <Cursor x={196} y={82} colour={BLUE} rotate={6} />

      <Figure cx="62" cy="34" r="21" colour={AMBER} />
      <Figure cx="212" cy="30" r="21" colour={BLUE} />

      {/* Code brackets floating off to the side, as in the reference. */}
      <text x="272" y="34" fontSize="17" fontWeight="700" fill={AMBER_PALE} fontFamily="monospace">
        &lt;/&gt;
      </text>
      <circle cx="286" cy="62" r="3.5" fill={AMBER_PALE} />
      <circle cx="18" cy="70" r="4" fill={AMBER_PALE} />
      <circle cx="146" cy="20" r="3" fill={AMBER_SOFT} opacity="0.7" />
      <Sparkle x={150} y={128} size={8} colour={AMBER_SOFT} opacity={0.8} />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Friends — two characters at their laptops
 * ------------------------------------------------------------------ */
export function FriendsArt({ className = "" }) {
  const blob = (x, fill, stroke) => (
    <g>
      {/* A dome with a flat base: the simplest shape that reads as a friendly
          little character without needing a face beyond two eyes. */}
      <path
        d={`M${x - 34} 118 L${x - 34} 74 a 34 34 0 0 1 68 0 L${x + 34} 118 Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={stroke ? 2 : 0}
      />
      {/* Arms, resting either side of the laptop. */}
      <ellipse cx={x - 38} cy="102" rx="9" ry="15" fill={fill} stroke={stroke} strokeWidth={stroke ? 2 : 0} />
      <ellipse cx={x + 38} cy="102" rx="9" ry="15" fill={fill} stroke={stroke} strokeWidth={stroke ? 2 : 0} />
      <circle cx={x - 11} cy="72" r="3.6" fill={INK} />
      <circle cx={x + 11} cy="72" r="3.6" fill={INK} />
      {/* The laptop in front. */}
      <path d={`M${x - 30} 96 h60 v26 h-60 Z`} fill="#2b2118" rx="3" />
      <rect x={x - 30} y="96" width="60" height="26" rx="3" fill="#2b2118" />
      <rect x={x - 25} y="101" width="50" height="16" rx="2" fill="#4a3a2c" />
      <rect x={x - 38} y="122" width="76" height="5" rx="2.5" fill={INK} />
      <circle cx={x} cy="109" r="2" fill={AMBER_SOFT} />
    </g>
  );

  return (
    <svg viewBox="0 0 250 140" className={className} aria-hidden="true" fill="none">
      <ellipse cx="125" cy="128" rx="112" ry="12" fill={CREAM} />
      {blob(72, AMBER_SOFT, null)}
      {blob(172, "#ffffff", AMBER_PALE)}
      <Sparkle x={18} y={58} size={9} colour={AMBER_SOFT} />
      <Sparkle x={232} y={44} size={7} colour={AMBER_PALE} />
      <Sparkle x={124} y={30} size={6} colour={AMBER_SOFT} opacity={0.8} />
      <circle cx="40" cy="30" r="3.5" fill={AMBER_PALE} />
      <circle cx="210" cy="96" r="3" fill={AMBER_PALE} />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Empty states
 * ------------------------------------------------------------------ */

/* "Choose a partner", before there is anybody to choose. */
export function PartnerSpot({ className = "" }) {
  return (
    <svg viewBox="0 0 160 90" className={className} aria-hidden="true" fill="none">
      <ellipse cx="80" cy="78" rx="62" ry="9" fill={CREAM} />
      <path d="M58 44 C66 32, 94 32, 102 44" stroke={AMBER} strokeWidth="2" strokeDasharray="1 6" strokeLinecap="round" />
      <Figure cx={46} cy={44} r={21} colour={AMBER} />
      <Figure cx={114} cy={44} r={21} colour={BLUE} />
      {/* The link in the middle. */}
      <circle cx="80" cy="44" r="12" fill="#fff" stroke={AMBER_PALE} strokeWidth="2" />
      <path
        d="M76 44 a4 4 0 0 1 4 -4 h2 M84 44 a4 4 0 0 1 -4 4 h-2"
        stroke={AMBER}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Sparkle x={20} y={26} size={7} />
      <Sparkle x={142} y={30} size={6} colour={AMBER_PALE} />
      <Sparkle x={134} y={64} size={5} />
    </svg>
  );
}

/* "Requests for you", with nothing in it. */
export function InboxSpot({ className = "" }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true" fill="none">
      <ellipse cx="60" cy="80" rx="42" ry="7" fill={CREAM} />
      {/* Rays, so an empty tray still looks cheerful rather than broken. */}
      {[-26, 0, 26].map((angle, index) => (
        <line
          key={angle}
          x1={60 + Math.sin((angle * Math.PI) / 180) * 22}
          y1={40 - Math.cos((angle * Math.PI) / 180) * 22}
          x2={60 + Math.sin((angle * Math.PI) / 180) * 33}
          y2={40 - Math.cos((angle * Math.PI) / 180) * 33}
          stroke={index === 1 ? AMBER : AMBER_SOFT}
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
      <rect x="26" y="44" width="68" height="30" rx="6" fill="#fff" stroke={AMBER_PALE} strokeWidth="2.5" />
      <path d="M26 56 h20 l5 8 h18 l5 -8 h20" stroke={AMBER} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* "Sent by you", with nothing outstanding. */
export function SentSpot({ className = "" }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true" fill="none">
      <ellipse cx="60" cy="80" rx="40" ry="7" fill={CREAM} />
      <path
        d="M18 66 C24 44, 44 30, 72 28"
        stroke={AMBER_PALE}
        strokeWidth="2.5"
        strokeDasharray="2 7"
        strokeLinecap="round"
      />
      <path d="M92 20 L62 40 L70 46 L74 60 L92 20 Z" fill="#fff" stroke={AMBER} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M62 40 L74 60 L92 20 Z" fill={CREAM} stroke={AMBER} strokeWidth="2.5" strokeLinejoin="round" />
      <Sparkle x={28} y={26} size={6} />
    </svg>
  );
}

/* "Your rooms", before there have been any. */
export function RoomsSpot({ className = "" }) {
  return (
    <svg viewBox="0 0 120 84" className={className} aria-hidden="true" fill="none">
      <ellipse cx="60" cy="74" rx="40" ry="7" fill={CREAM} />
      <rect x="26" y="18" width="68" height="50" rx="8" fill="#fff" stroke={AMBER_PALE} strokeWidth="2.5" />
      <path d="M26 32 h68" stroke={AMBER_PALE} strokeWidth="2.5" />
      <circle cx="34" cy="25" r="2.2" fill={AMBER_SOFT} />
      <circle cx="42" cy="25" r="2.2" fill={AMBER_PALE} />
      {[0, 1, 2].map((line) => (
        <rect key={line} x="36" y={42 + line * 8} width={line === 1 ? 36 : 26} height="4" rx="2" fill={AMBER_PALE} />
      ))}
      <Sparkle x={14} y={26} size={6} />
      <Sparkle x={106} y={46} size={5} colour={AMBER_SOFT} />
    </svg>
  );
}

/*
 * The backdrop, behind every page.
 *
 * Rendered ONCE in App.jsx rather than per page. It used to be three
 * copies — one each in Home, Pair Lab and Friends — which meant every other
 * screen in the app sat on flat cream, and the three that had it re-created
 * the whole thing on each navigation.
 *
 * Fixed rather than absolute, so it does not scroll with a four-thousand-pixel
 * page and turn into a stripe. pointer-events-none throughout, so none of it
 * can ever swallow a click.
 *
 * FOUR LAYERS, IN ORDER
 *
 *   1. a vertical wash, lightest in the middle, so the page has a centre
 *   2. drifting colour, slow enough to read as ambient rather than animated
 *   3. a rule grid, masked so it fades before the edges (see .oj-grid)
 *   4. one soft diagonal beam across the top, the way light falls on a wall
 *
 * The whole thing is low contrast on purpose. A background you notice is a
 * background that has failed; this one only has to stop the page feeling like
 * an empty sheet.
 */
export function PageGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/*
        The wash. brand-50 is the page colour in both themes and surface is the
        card colour in both, so this gradient re-themes itself: a warm cream
        dip in the light, a lift out of near-black in the dark.
      */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-100/70 via-surface to-brand-100/60" />

      {/*
        Drifting colour.
        The opacities are halved in dark mode: the same glow that reads as a
        soft tint on cream reads as a blown-out smear on near-black, because
        the eye is adapted to the darker surround.
      */}
      <div className="absolute -left-[12%] top-[-8%] h-[38rem] w-[38rem] animate-drift-a rounded-full bg-brand-300/45 blur-[110px] dark:bg-brand-500/20" />
      <div className="absolute -right-[10%] top-[18%] h-[34rem] w-[34rem] animate-drift-b rounded-full bg-amber-200/55 blur-[110px] dark:bg-amber-500/14" />
      <div className="absolute bottom-[-10%] left-[28%] h-[32rem] w-[32rem] animate-drift-c rounded-full bg-orange-200/40 blur-[120px] dark:bg-orange-500/12" />
      {/* One cool note among the warm ones. Without it the whole page is a
          single hue and reads as a tint rather than as light. */}
      <div className="absolute right-[22%] top-[52%] h-[26rem] w-[26rem] animate-drift-a rounded-full bg-sky-200/25 blur-[120px] dark:bg-sky-500/12" />

      <div className="oj-grid absolute inset-0" />
      <div className="oj-beam absolute -inset-x-1/4 -top-1/3 h-[70rem] rotate-[-8deg] opacity-40 dark:opacity-100" />
    </div>
  );
}
