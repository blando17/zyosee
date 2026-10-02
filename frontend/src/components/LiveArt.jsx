import Icon from "./Icon";

/*
 * The two moving illustrations on the home page.
 *
 * These are the only looping animations on the site, and they loop for a
 * reason rather than for decoration: Pair Lab and the Duel Arena are both
 * about something HAPPENING between two people, and a still picture of a
 * shared editor is indistinguishable from a picture of an editor. Two carets
 * moving in one file say in a second what the paragraph above them spells out.
 *
 * Everything moves in CSS, from keyframes in tailwind.config.js. No timers, no
 * state, no re-renders — so a card scrolled off screen or sitting in a
 * background tab costs nothing, and the browser can drop frames on a slow
 * machine without React ever knowing.
 *
 * Both stop dead for anybody whose system asks for reduced motion; the rule
 * that does it is in index.css and explains why.
 *
 * None of this is real data. It is a drawing of what the feature does, and it
 * carries aria-hidden so the words beside it are what is announced.
 */

/*
 * The room's own first two seat colours, lifted from ROOM_COLOURS in
 * roomController.js so the picture matches what a real session looks like.
 * Pink is seat one and blue is seat two — which is why the tags read "you" and
 * "partner" rather than naming a colour: in a real room your colour depends on
 * which seat you took, not on who you are.
 */
const YOU = "#ec4899";
const THEM = "#3b82f6";

/* ------------------------------------------------------------------ *
 * Pair Lab: one file, two carets
 * ------------------------------------------------------------------ */

/* A line of code being typed, with the cursor riding along at the end of it. */
function TypedLine({ animation, colour }) {
  return (
    <span className="flex min-w-0 items-center gap-[3px]">
      <span className={`h-[5px] rounded-full ${animation}`} style={{ backgroundColor: colour }} />
      <span className="h-[10px] w-[2px] shrink-0 animate-blink rounded-[1px] bg-brand-100/80" />
    </span>
  );
}

export function PairLabLive() {
  return (
    <div
      className="relative h-32 overflow-hidden rounded-xl bg-code p-3 shadow-inner"
      aria-hidden="true"
    >
      {/* Window chrome, so it reads as an editor rather than a dark box. */}
      <div className="mb-2 flex items-center gap-1.5">
        {["#ff5f57", "#febc2e", "#28c840"].map((colour) => (
          <span key={colour} className="h-2 w-2 rounded-full" style={{ backgroundColor: colour }} />
        ))}
        <span className="ml-1 font-mono text-[9px] text-brand-200/70">solution.cpp</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: YOU }} />
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: THEM }} />
        </span>
      </div>

      <div className="relative">
        {/* The two line highlights, each on its own loop length so the pair
            keep drifting apart rather than locking into a shared rhythm. */}
        <span
          className="absolute left-0 right-0 top-0 h-[18px] animate-caret-a rounded"
          style={{ backgroundColor: `${YOU}24`, borderLeft: `2px solid ${YOU}` }}
        />
        <span
          className="absolute left-0 right-0 top-0 h-[18px] animate-caret-b rounded"
          style={{ backgroundColor: `${THEM}24`, borderLeft: `2px solid ${THEM}` }}
        />

        {/* Four lines, 18px apart to match the step distance in the keyframes. */}
        <ul className="relative font-mono text-[10px] leading-[18px]">
          <li className="flex h-[18px] items-center gap-2 pl-2">
            <span className="w-3 shrink-0 text-right text-brand-200/30">1</span>
            <span className="h-[5px] w-[46%] rounded-full bg-brand-300/60" />
          </li>
          <li className="flex h-[18px] items-center gap-2 pl-2">
            <span className="w-3 shrink-0 text-right text-brand-200/30">2</span>
            <TypedLine animation="animate-type" colour="rgba(251,191,36,0.85)" />
          </li>
          <li className="flex h-[18px] items-center gap-2 pl-2">
            <span className="w-3 shrink-0 text-right text-brand-200/30">3</span>
            <TypedLine animation="animate-type-late" colour="rgba(96,165,250,0.85)" />
          </li>
          <li className="flex h-[18px] items-center gap-2 pl-2">
            <span className="w-3 shrink-0 text-right text-brand-200/30">4</span>
            <span className="h-[5px] w-[30%] rounded-full bg-brand-200/30" />
          </li>
        </ul>

        {/* Name tags riding with their own caret. Positioned inside the same
            box as the highlights so they share one coordinate system. */}
        <span
          className="absolute right-1 top-0 flex h-[18px] animate-caret-a items-center rounded px-1.5 text-[8px] font-bold text-white"
          style={{ backgroundColor: YOU }}
        >
          you
        </span>
        <span
          className="absolute right-10 top-0 flex h-[18px] animate-caret-b items-center rounded px-1.5 text-[8px] font-bold text-white"
          style={{ backgroundColor: THEM }}
        >
          partner
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Duel Arena: two scores, one clock
 * ------------------------------------------------------------------ */

/*
 * The three problems. They turn green in order, on one shared keyframe that
 * each chip enters at a different point via its delay — so the sequence needs
 * one animation rather than three near-identical ones.
 */
const CHIPS = [
  { label: "P1", delay: "0s" },
  { label: "P2", delay: "-1.4s" },
  { label: "P3", delay: "-2.8s" },
];

export function ArenaLive() {
  return (
    <div
      className="relative h-32 overflow-hidden rounded-xl bg-gradient-to-br from-code to-code-soft p-3 shadow-inner"
      aria-hidden="true"
    >
      {/* The clock, draining across the top of the card. It is the same 4.4s
          as the scores, so the bars reach their peak just as time runs out. */}
      <span className="absolute inset-x-0 top-0 h-[3px] bg-surface/5">
        <span className="block h-full animate-drain rounded-r-full bg-gradient-to-r from-rose-500 to-amber-400" />
      </span>

      <div className="mb-2.5 mt-1 flex items-center gap-2">
        <span className="font-mono text-[9px] tracking-wider text-brand-200/70">DUEL</span>
        <span className="ml-auto flex items-center gap-1.5 rounded-md bg-surface/10 px-1.5 py-0.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ring-out rounded-full bg-rose-400" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
          </span>
          {/* Written, not counted. A clock that ticked down would be inventing
              a match that is not happening. */}
          <span className="font-mono text-[9px] font-bold tabular-nums text-brand-100">12:04</span>
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-extrabold text-white"
          style={{ backgroundColor: YOU }}
        >
          Y
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          {/* Both climb, neither falls back. Scores in a duel only go up, and
              an oscillating bar said the opposite. */}
          <span className="block h-2 w-full overflow-hidden rounded-full bg-surface/10">
            <span className="block h-full animate-race-a rounded-full" style={{ backgroundColor: YOU }} />
          </span>
          <span className="block h-2 w-full overflow-hidden rounded-full bg-surface/10">
            <span className="block h-full animate-race-b rounded-full" style={{ backgroundColor: THEM }} />
          </span>
        </div>

        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-extrabold text-white"
          style={{ backgroundColor: THEM }}
        >
          R
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {CHIPS.map((chip) => (
          <span
            key={chip.label}
            className="animate-solved rounded px-2 py-0.5 font-mono text-[8px] font-bold"
            /* A negative delay starts the loop already part-way through, so
               the three chips are permanently out of phase instead of waiting
               their turn once and then marching in step. */
            style={{ animationDelay: chip.delay }}
          >
            {chip.label} ✓
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Problems: submit, and the judge answers
 * ------------------------------------------------------------------ */

/*
 * Three rows judged in turn.
 *
 * Negative delays put each row at a different point of the same loop, so one
 * keyframe produces a sequence instead of three rows flashing together. The
 * delays are spaced across the 4.2s cycle rather than evenly, because a
 * perfectly even rhythm reads as a machine and a slightly uneven one reads as
 * work happening.
 */
const JUDGED_ROWS = [
  { title: "Two Sum", level: "Easy", tint: "bg-emerald-400/20 text-emerald-300", delay: "0s", width: "58%" },
  { title: "Valid Parentheses", level: "Easy", tint: "bg-emerald-400/20 text-emerald-300", delay: "-1.5s", width: "72%" },
  { title: "Maximum Subarray", level: "Medium", tint: "bg-amber-400/20 text-amber-300", delay: "-2.9s", width: "64%" },
];

export function ProblemsLive() {
  return (
    <div
      className="relative h-32 overflow-hidden rounded-xl bg-code p-3 shadow-inner"
      aria-hidden="true"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[9px] tracking-wider text-brand-200/70">PROBLEM SET</span>
        <span className="ml-auto font-mono text-[9px] text-brand-200/50">73 problems</span>
      </div>

      <ul className="space-y-1.5">
        {JUDGED_ROWS.map((row) => (
          <li
            key={row.title}
            className="flex animate-row-solve items-center gap-2 rounded-md px-1.5 py-1"
            style={{ animationDelay: row.delay }}
          >
            {/* The tick that lands when the verdict comes back. */}
            <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              <span className="absolute h-3.5 w-3.5 rounded-full border border-brand-200/25" />
              <span
                className="absolute flex h-3.5 w-3.5 animate-verdict items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white"
                style={{ animationDelay: row.delay }}
              >
                ✓
              </span>
            </span>

            <span className="h-[5px] rounded-full bg-brand-200/35" style={{ width: row.width }} />
            <span
              className={`ml-auto shrink-0 rounded px-1.5 py-[1px] font-mono text-[7px] font-bold ${row.tint}`}
            >
              {row.level}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Progress: what the submissions add up to
 * ------------------------------------------------------------------ */

/* Heights are fixed; only the grow is animated, phase-shifted per bar. */
const CHART_BARS = [
  { height: 30, delay: "0s" },
  { height: 54, delay: "-0.25s" },
  { height: 22, delay: "-0.5s" },
  { height: 68, delay: "-0.75s" },
  { height: 44, delay: "-1s" },
  { height: 80, delay: "-1.25s" },
  { height: 60, delay: "-1.5s" },
];

export function ProgressLive() {
  return (
    <div
      className="relative h-32 overflow-hidden rounded-xl bg-code p-3 shadow-inner"
      aria-hidden="true"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[9px] tracking-wider text-brand-200/70">LAST 7 DAYS</span>
        <span className="ml-auto flex items-center gap-1 rounded-md bg-surface/10 px-1.5 py-0.5">
          <Icon name="fire" className="h-2.5 w-2.5 text-brand-400" />
          <span className="inline-block animate-count-pop font-mono text-[9px] font-bold text-brand-100">
            6 day streak
          </span>
        </span>
      </div>

      <div className="flex h-[62px] items-end gap-1.5">
        {CHART_BARS.map((bar) => (
          <span key={bar.delay} className="flex h-full flex-1 items-end">
            <span
              className="w-full animate-bar-rise rounded-t bg-gradient-to-t from-brand-500 to-brand-300"
              /* The origin is what makes it grow up from the axis rather than
                 out from its own middle. */
              style={{ height: `${bar.height}%`, transformOrigin: "bottom", animationDelay: bar.delay }}
            />
          </span>
        ))}
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <span className="h-[3px] flex-1 rounded-full bg-surface/10" />
        <span className="font-mono text-[8px] text-brand-200/50">rating 1223</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Compiler: press run, read the output
 * ------------------------------------------------------------------ */
export function CompilerLive() {
  return (
    <div
      className="relative h-32 overflow-hidden rounded-xl bg-code p-3 shadow-inner"
      aria-hidden="true"
    >
      <div className="mb-2 flex items-center gap-1.5">
        {["#ff5f57", "#febc2e", "#28c840"].map((colour) => (
          <span key={colour} className="h-2 w-2 rounded-full" style={{ backgroundColor: colour }} />
        ))}
        <span className="ml-1 font-mono text-[9px] text-brand-200/70">main.cpp</span>
        {/* The button, pressed on the same loop the output types on. */}
        <span className="ml-auto animate-press rounded bg-brand-500 px-2 py-[2px] font-mono text-[8px] font-bold text-ink-900">
          ▷ Run
        </span>
      </div>

      <div className="space-y-1">
        <span className="block h-[5px] w-[52%] rounded-full bg-brand-300/60" />
        <span className="block h-[5px] w-[70%] rounded-full bg-brand-200/35" />
      </div>

      <div className="mt-2 rounded-md bg-black/40 p-2">
        <span className="mb-1 block font-mono text-[8px] tracking-wider text-brand-200/50">OUTPUT</span>
        {/* steps() so it appears character by character rather than sliding. */}
        <span className="block overflow-hidden whitespace-nowrap">
          <span className="inline-block w-0 animate-out-type overflow-hidden align-middle">
            <span className="block whitespace-nowrap font-mono text-[9px] text-emerald-300">
              Hello, ZYOSEE! · 0.4 ms
            </span>
          </span>
          <span className="ml-[1px] inline-block h-[9px] w-[2px] animate-blink align-middle bg-brand-100/80" />
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Friends: a request crossing the gap
 * ------------------------------------------------------------------ */
export function FriendsLive() {
  return (
    <div
      className="relative h-32 overflow-hidden rounded-xl bg-code p-3 shadow-inner"
      aria-hidden="true"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-[9px] tracking-wider text-brand-200/70">FRIEND REQUEST</span>
      </div>

      <div className="relative flex items-center justify-center gap-[76px]">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full font-display text-xs font-extrabold text-white"
          style={{ backgroundColor: YOU }}
        >
          Y
        </span>

        {/* The request itself, travelling from one to the other. */}
        <span className="pointer-events-none absolute left-1/2 top-1/2 -ml-[44px] -mt-2 animate-fly text-sm">
          <Icon name="envelope" className="h-4 w-4 text-brand-300" />
        </span>
        {/* And the handshake that lands when it arrives. */}
        <span className="pointer-events-none absolute left-1/2 top-1/2 -ml-[10px] -mt-[10px] flex h-5 w-5 animate-pop-in items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
          ✓
        </span>

        <span
          className="flex h-10 w-10 items-center justify-center rounded-full font-display text-xs font-extrabold text-white"
          style={{ backgroundColor: THEM }}
        >
          R
        </span>
      </div>

      <p className="mt-3 text-center font-mono text-[8px] text-brand-200/50">
        friends can pair up and duel
      </p>
    </div>
  );
}
