import { Link } from "react-router-dom";
import Icon from "./Icon";
import Avatar from "./Avatar";
import { DIFFICULTY_TINT, durationText, languageName, mixText, modeOf, overallDifficulty } from "../duelText";

/*
 * The moment before the match.
 *
 * Both people have agreed; neither has started. The lobby exists so the start
 * is something they choose together rather than something that happens to
 * whoever was slower to open the page — which matters, because the clock is
 * the same length for both of them however long one spends reading.
 *
 * Nothing here can be rushed by refreshing. The problems are not in this
 * payload at all.
 */
/*
 * One side of the VS.
 *
 * `mirrored` turns the row around so the two players face each other across
 * the divider — avatar, then name, on the left; name, then avatar, on the
 * right — rather than both reading left to right past the middle.
 */
function PlayerSide({ player, mirrored = false }) {
  return (
    <div className={`min-w-0 ${mirrored ? "text-right" : "text-left"}`}>
      <div className={`flex items-center gap-3 ${mirrored ? "flex-row-reverse" : ""}`}>
        <Avatar name={player.username} size="h-14 w-14" className="text-base" />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-extrabold uppercase text-ink-900">
            {player.username}
          </p>
          <p className="font-display text-2xl font-extrabold tabular-nums text-brand-600">
            {player.rating}
          </p>
        </div>
      </div>

      <p
        className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
          player.ready
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
            : "bg-brand-50 text-ink-500 ring-1 ring-brand-200"
        }`}
      >
        <span aria-hidden="true">{player.ready ? "\u2713" : "\u25CF"}</span>
        {player.ready ? "Ready" : "Waiting"}
      </p>
    </div>
  );
}

export default function DuelLobby({ duel, onReady, onCancel, busy }) {
  const you = duel.players.find((player) => player.isYou);
  const them = duel.players.find((player) => !player.isYou);
  const mode = modeOf(duel.mode);
  const waiting = !them.ready;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-14 pt-6 sm:px-6">
      <Link to="/arena" className="text-sm font-bold text-brand-700 hover:text-brand-900">
        ← Duel Arena
      </Link>

      <section className="mt-3 overflow-hidden rounded-3xl border border-brand-200 bg-surface shadow-sm">
        <header className="flex items-center justify-center gap-2 border-b border-brand-100 bg-gradient-to-r from-brand-100 via-brand-50 to-brand-100 px-5 py-3.5">
          <Icon name={mode.icon} className="h-4 w-4 text-brand-700" />
          <h1 className="font-display text-base font-extrabold uppercase tracking-wide text-ink-900">
            {mode.label}
          </h1>
        </header>

        {/* ------------------------------ versus ----------------------------- */}
        {/*
          Three grid columns, and the VS is written BETWEEN the two players
          rather than after them. Grid fills its columns in document order, so
          putting the divider last — which reads more naturally in JSX, as the
          thing that goes in the middle — silently puts the second player in
          the middle column and the word VS out on the right.
        */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-7 sm:gap-6">
          <PlayerSide player={you} mirrored />
          <span className="font-display text-2xl font-extrabold text-brand-400" aria-hidden="true">
            VS
          </span>
          <PlayerSide player={them} />
        </div>

        {/* ------------------------------ what is in it ---------------------- */}
        <dl className="grid grid-cols-2 gap-px border-y border-brand-100 bg-brand-100 sm:grid-cols-4">
          {[
            { term: "Problems", value: duel.problemCount },
            { term: "Time", value: durationText(duel.durationMs) },
            { term: "Language", value: languageName(duel.language) },
            { term: "Difficulty", value: overallDifficulty(duel.mix) },
          ].map((row) => (
            <div key={row.term} className="bg-surface px-4 py-3 text-center">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-500">{row.term}</dt>
              <dd className="font-display text-sm font-extrabold text-ink-900">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="px-5 py-4">
          {duel.problems ? (
            <>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">
                In this match
              </p>
              <ul className="space-y-1.5">
                {duel.problems.map((problem) => (
                  <li
                    key={problem.index}
                    className="flex items-center gap-2.5 rounded-lg bg-brand-50 px-3 py-2 text-sm"
                  >
                    <span className="font-display text-xs font-extrabold text-brand-600">
                      {problem.index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink-900">
                      {problem.title}
                    </span>
                    <span className="shrink-0 text-[11px] font-bold tabular-nums text-ink-500">
                      {problem.points} pts
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${
                        DIFFICULTY_TINT[problem.difficulty]
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-500">
                <Icon name="lock" className="h-3.5 w-3.5 -mt-0.5" /> The statements stay locked until you are both
                ready.
              </p>
            </>
          ) : (
            <p className="rounded-xl bg-brand-50 px-4 py-3 text-center text-sm text-ink-800">
              <Icon name="lock" className="h-3.5 w-3.5 -mt-0.5" /> Problems hidden — {mixText(duel.mix)}. Neither of
              you sees them until the countdown ends.
            </p>
          )}
        </div>

        {/* ------------------------------- ready ----------------------------- */}
        <div className="border-t border-brand-100 px-5 py-4">
          {you.ready ? (
            <div className="text-center">
              <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
                </span>
                {waiting ? `Waiting for ${them.username}...` : "Starting..."}
              </p>
              <p className="mt-2 text-xs text-ink-500">
                The countdown begins the moment they are ready too.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={onReady}
              disabled={busy}
              className="btn-primary w-full justify-center py-3.5 text-base font-extrabold uppercase tracking-wide disabled:opacity-50"
            >
              {busy ? "..." : "I'm ready"}
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="mt-3 w-full text-center text-xs font-semibold text-ink-500 transition hover:text-rose-700"
          >
            Call the duel off
          </button>
        </div>
      </section>
    </main>
  );
}
