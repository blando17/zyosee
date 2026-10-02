import { Link } from "react-router-dom";
import Icon from "./Icon";
import Avatar from "./Avatar";
import { DIFFICULTY_TINT, clockText, modeOf } from "../duelText";

/*
 * How the duel finished.
 *
 * THE SCORE IS BROKEN DOWN, NOT JUST ANNOUNCED
 *
 * A single number at the end of a match is either agreed with or resented, and
 * there is no way to tell which without showing the arithmetic. So every
 * problem shows what it paid and why — correctness, speed and economy as three
 * separate figures — and the totals are those figures added up. Somebody who
 * lost can see exactly where, which is the only part of losing that is useful.
 *
 * WHAT IS NOT CLAIMED
 *
 * Nothing here is adjusted after the fact. These are the stored final scores,
 * written once when the duel ended: reopening this page next week shows the
 * same numbers even if the problems have been edited since.
 */

function ratingLine(change) {
  if (change > 0) return { text: `+${change}`, tone: "text-emerald-700" };
  if (change < 0) return { text: String(change), tone: "text-rose-700" };
  return { text: "±0", tone: "text-ink-500" };
}

/* One player's name, rating change and final score, facing the divider. */
function Scoreline({ player, card, rating, mirrored = false }) {
  const delta = ratingLine(rating[player.id]?.change ?? 0);
  return (
    <div className={mirrored ? "text-right" : "text-left"}>
      <div className={`flex items-center gap-2.5 ${mirrored ? "flex-row-reverse" : ""}`}>
        <Avatar name={player.username} size="h-11 w-11" className="text-sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-ink-900">
            {player.isYou ? "You" : player.username}
          </p>
          <p className={`text-[11px] font-bold tabular-nums ${delta.tone}`}>
            {rating[player.id]?.after ?? player.rating} ({delta.text})
          </p>
        </div>
      </div>
      <p className="mt-1.5 font-display text-4xl font-extrabold tabular-nums text-ink-900">
        {card?.total ?? 0}
      </p>
    </div>
  );
}

export default function DuelResult({ duel, onRematch, rematching }) {
  const you = duel.players.find((player) => player.isYou);
  const them = duel.players.find((player) => !player.isYou);
  const result = duel.scores || {};
  const cards = result.cards || {};
  const mine = cards[you.id];
  const theirs = cards[them.id];
  const mode = modeOf(duel.mode);

  const outcome = result.draw ? "draw" : result.winnerId === you.id ? "won" : "lost";
  const banner = {
    won: { title: "You win", tint: "from-emerald-100 to-surface", ring: "border-emerald-300", icon: "trophy" },
    lost: { title: `${them.username} wins`, tint: "from-rose-50 to-surface", ring: "border-rose-200", icon: "friends" },
    draw: { title: "Drawn", tint: "from-brand-100 to-surface", ring: "border-brand-300", icon: "scales" },
  }[outcome];

  const rating = result.rating || {};

  return (
    <main className="mx-auto max-w-4xl px-4 pb-14 pt-6 sm:px-6">
      <Link to="/arena" className="text-sm font-bold text-brand-700 hover:text-brand-900">
        ← Duel Arena
      </Link>

      <section className={`mt-3 overflow-hidden rounded-3xl border-2 bg-surface shadow-sm ${banner.ring}`}>
        <header className={`bg-gradient-to-b px-5 py-7 text-center ${banner.tint}`}>
          <p className="font-display text-xs font-extrabold uppercase tracking-[0.25em] text-ink-500">
            <Icon name={mode.icon} className="h-3.5 w-3.5" /> Duel complete
          </p>
          <Icon name={banner.icon} className="mx-auto mt-2 h-12 w-12 text-brand-600" strokeWidth={1.5} />
          <h1 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-ink-900">
            {banner.title}
          </h1>

          {/* The dash goes BETWEEN the two, in document order. Grid fills its
              columns in the order the children are written, so a divider added
              after both players lands in the third column and pushes the
              second player into the middle. */}
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <Scoreline player={you} card={mine} rating={rating} mirrored />
            <span className="font-display text-lg font-extrabold text-brand-400" aria-hidden="true">
              –
            </span>
            <Scoreline player={them} card={theirs} rating={rating} />
          </div>
        </header>

        {/* --------------------------- the arithmetic ------------------------ */}
        <div className="overflow-x-auto border-t border-brand-100">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">Score for each problem</caption>
            <thead>
              <tr className="border-b border-brand-100 bg-brand-50 text-[11px] uppercase tracking-wide text-ink-500">
                <th scope="col" className="px-4 py-2 text-left font-bold">Problem</th>
                <th scope="col" className="px-3 py-2 text-right font-bold">You</th>
                <th scope="col" className="px-3 py-2 text-right font-bold">{them.username}</th>
              </tr>
            </thead>
            <tbody>
              {(duel.problems || []).map((problem, index) => {
                const a = mine?.problems?.[index];
                const b = theirs?.problems?.[index];
                return (
                  <tr key={problem.index ?? index} className="border-b border-brand-100 last:border-b-0">
                    <th scope="row" className="px-4 py-2.5 text-left font-normal">
                      <span className="flex flex-wrap items-center gap-2">
                        {problem.slug ? (
                          <Link
                            to={`/problems/${problem.slug}`}
                            className="font-bold text-ink-900 hover:text-brand-700"
                          >
                            {problem.title}
                          </Link>
                        ) : (
                          <span className="font-bold text-ink-900">{problem.title}</span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${
                            DIFFICULTY_TINT[problem.difficulty]
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                        <span className="text-[11px] text-ink-500">{problem.points} pts</span>
                      </span>
                    </th>

                    {[a, b].map((row, side) => (
                      <td key={side} className="px-3 py-2.5 text-right align-top">
                        <span className="font-display text-base font-extrabold tabular-nums text-ink-900">
                          {row?.score ?? 0}
                        </span>
                        <span className="block text-[10px] leading-tight text-ink-500">
                          {row?.solved
                            ? `${row.parts.correctness} + ${row.parts.speed} + ${row.parts.efficiency}`
                            : row?.attempts
                              ? `${row.bestPassed}/${row.total} tests`
                              : "not attempted"}
                        </span>
                        {row?.solved && (
                          <span className="block text-[10px] leading-tight text-ink-500">
                            {clockText(row.elapsedMs)} · {row.attempts} try
                            {row.attempts === 1 ? "" : "s"}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-brand-50 font-display font-extrabold">
                <th scope="row" className="px-4 py-2.5 text-left uppercase tracking-wide text-ink-900">
                  Total
                </th>
                <td className="px-3 py-2.5 text-right text-lg tabular-nums text-ink-900">
                  {mine?.total ?? 0}
                </td>
                <td className="px-3 py-2.5 text-right text-lg tabular-nums text-ink-900">
                  {theirs?.total ?? 0}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="border-t border-brand-100 px-4 py-2 text-center text-[11px] text-ink-500">
          Each problem pays 60% for correctness, 25% for how early it was solved and 15% for solving
          it in few submissions. Out of {result.maximum ?? 0} for the match.
        </p>

        <dl className="grid grid-cols-2 gap-px border-t border-brand-100 bg-brand-100">
          {[
            { term: "Problems solved", a: `${mine?.solved ?? 0}/${duel.problemCount}`, b: `${theirs?.solved ?? 0}/${duel.problemCount}` },
            { term: "Submissions", a: mine?.submissions ?? 0, b: theirs?.submissions ?? 0 },
          ].map((row) => (
            <div key={row.term} className="bg-surface px-4 py-3">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-500">{row.term}</dt>
              <dd className="mt-0.5 flex items-baseline gap-2 font-display text-sm font-extrabold text-ink-900">
                <span>{row.a}</span>
                <span className="text-ink-500">vs</span>
                <span>{row.b}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap gap-2 border-t border-brand-100 px-5 py-4">
          <button
            type="button"
            onClick={onRematch}
            disabled={rematching}
            className="btn-primary flex-1 justify-center py-2.5 text-sm disabled:opacity-50"
          >
            {rematching ? "Sending..." : <><Icon name="duel" className="h-4 w-4" /> Rematch</>}
          </button>
          <Link to="/arena" className="btn-ghost flex-1 justify-center py-2.5 text-sm">
            Back to arena
          </Link>
        </div>
      </section>
    </main>
  );
}
