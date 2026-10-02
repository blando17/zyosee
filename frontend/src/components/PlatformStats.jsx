import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import CountUp from "./CountUp";
import { useReveal } from "./Reveal";
import BandDecor from "./BandDecor";
import { authApi } from "../api";

/*
 * Six numbers about the site, counting up as you reach them.
 *
 * WHERE THE NUMBERS COME FROM
 *
 * All six are read from the database by GET /stats, which also applies the
 * presentation floor described in backend/controllers/statsController.js.
 * Nothing is written down in this file: a figure hardcoded in a component is a
 * figure that will still say 1,250 in a year, and having two places that both
 * claim to know how many people use the site is how they end up disagreeing.
 *
 * WHY THE BAND VANISHES RATHER THAN GUESSING
 *
 * If the request fails, this renders nothing at all. The alternative — keeping
 * a copy of the numbers here to fall back on — would mean the page could show
 * invented figures while the server sat there with the real ones, and nobody
 * looking at the page would be able to tell which they were seeing. A landing
 * page missing one decorative band is a much smaller problem than a landing
 * page quietly lying.
 *
 * THE HEIGHT IS RESERVED WHILE IT LOADS
 *
 * The band sits directly under the hero, so appearing late would shove the
 * whole page down under the reader. The cards are therefore drawn immediately
 * with a placeholder where the figure goes, and only the number arrives late.
 * `tabular-nums` on the figure keeps every digit the same width, so a counter
 * running from 0 to 120,000 does not make its own card breathe in and out.
 */

const CARDS = [
  {
    key: "coders",
    label: "Active Coders",
    icon: "friends",
    // Fixed tint on fixed tint. A THEMED text colour on a fixed background is
    // the bug this project keeps rediscovering: it inverts in one theme and
    // leaves pale text on a pale chip. Both halves of each pair here move
    // together, so each chip reads the same in both themes.
    chip: "bg-amber-100 text-amber-700",
    bar: "bg-amber-400",
  },
  {
    key: "problems",
    label: "Problems",
    icon: "problems",
    chip: "bg-orange-100 text-orange-700",
    bar: "bg-orange-400",
  },
  {
    key: "solved",
    label: "Problems Solved",
    icon: "check",
    chip: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-400",
  },
  {
    key: "submissions",
    label: "Submissions",
    icon: "compiler",
    chip: "bg-sky-100 text-sky-700",
    bar: "bg-sky-400",
  },
  {
    key: "duels",
    label: "Duel Matches",
    icon: "duel",
    chip: "bg-violet-100 text-violet-700",
    bar: "bg-violet-400",
  },
  {
    key: "pairSessions",
    label: "Pair Lab Sessions",
    icon: "pair",
    chip: "bg-pink-100 text-pink-700",
    bar: "bg-pink-400",
  },
];

function StatCard({ card, stats, run }) {
  const value = stats ? stats[card.key] : 0;

  /*
   * The "+" is earned, not decorative.
   *
   * It appears only on the figures that carry a presentation floor, which the
   * server reports in `baseline`. The problem count has no floor — it is
   * exactly what the collection holds, and anybody can check it against the
   * problem list — so it prints as the plain number it is.
   */
  const hasFloor = Boolean(stats?.baseline?.[card.key]);

  return (
    <div
      className="rounded-2xl border border-brand-200/70 bg-surface/80 px-3 py-5 text-center
                 shadow-sm shadow-brand-900/5 backdrop-blur-sm transition
                 hover:-translate-y-0.5 hover:shadow-md sm:px-4"
    >
      <span
        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${card.chip}`}
        aria-hidden="true"
      >
        <Icon name={card.icon} className="h-5 w-5" />
      </span>

      <p className="mt-3 font-display text-2xl font-extrabold tabular-nums text-ink-900 sm:text-[28px]">
        {stats ? (
          <CountUp to={value} run={run} suffix={hasFloor ? "+" : ""} />
        ) : (
          /* A placeholder that holds the line's height while the request is in
             flight. Coloured rather than dimmed: any opacity blends text toward
             its background, and a faded glyph on this card measured worse than
             simply using the muted ink token. */
          <span className="text-ink-500">—</span>
        )}
      </p>

      <p className="mt-1 text-xs font-medium leading-snug text-ink-800">{card.label}</p>

      <span className={`mx-auto mt-3 block h-1 w-8 rounded-full ${card.bar}`} aria-hidden="true" />
    </div>
  );
}

export default function PlatformStats() {
  const [ref, shown] = useReveal({ threshold: 0.2 });
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);

  /*
   * Fetched once per page load, which is exactly what makes the count run
   * again on every refresh — the thing the band is for.
   *
   * `alive` guards the setState: this band sits at the top of a long page and
   * somebody can easily click through to a problem before a slow request comes
   * back, and setting state on a component that has gone is a warning in the
   * console and a leak in principle.
   */
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;

    authApi
      .get("/stats")
      .then(({ data }) => {
        if (alive.current) setStats(data);
      })
      .catch(() => {
        if (alive.current) setFailed(true);
      });

    return () => {
      alive.current = false;
    };
  }, []);

  if (failed) return null;

  return (
    <section className="relative overflow-hidden px-6 py-12 sm:py-16">
      {/* The same pale lift the alternating feature bands use, as a gradient
          that starts and ends at nothing so there is no seam to see. */}
      <span
        className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-b
                   from-transparent via-surface/65 to-transparent"
        aria-hidden="true"
      />
      <BandDecor variant={1} tint="warm" />

      <div
        ref={ref}
        className={`mx-auto max-w-6xl transition-[opacity,transform] duration-500 ease-out ${
          shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
        }`}
      >
        <p className="text-center font-display text-xs font-extrabold uppercase tracking-[0.18em] text-brand-600">
          <span aria-hidden="true">✦</span> Platform statistics <span aria-hidden="true">✦</span>
        </p>

        <h2 className="mx-auto mt-2 max-w-2xl text-center font-display text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">
          Built for people who love
          <br className="hidden sm:block" />{" "}
          <span className="text-brand-600">solving problems.</span>
        </h2>

        <p className="mt-3 text-center text-sm text-ink-800">A quick look at the ZYOSEE community.</p>

        {/*
          Two across on a phone, three on a tablet, all six in a row on a
          desktop. Six in a row at phone width would give each card about
          sixty pixels, which is narrower than the word "Submissions".
        */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {CARDS.map((card) => (
            <StatCard
              key={card.key}
              card={card}
              stats={stats}
              /*
               * The count starts only once the band has been scrolled to AND
               * the figures have arrived. Starting on arrival alone would run
               * the whole animation above the fold while the reader is still
               * looking at the hero, and they would scroll down to six numbers
               * that had already finished.
               */
              run={shown && Boolean(stats)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
