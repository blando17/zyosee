import { Link } from "react-router-dom";
import Icon from "./Icon";
import Avatar from "./Avatar";
import { relativeTime } from "../relativeTime";
import { DIFFICULTY_TINT, durationText, languageName, mixText, modeOf } from "../duelText";

/*
 * One challenge, waiting on somebody.
 *
 * The same card whichever end of it you are, because the facts are the same
 * and only the buttons differ. What changes is the sentence at the top: "so
 * and so challenged you" against "waiting for so and so", which is the one
 * thing a person needs to know before reading anything else.
 *
 * WHAT IT IS ALLOWED TO SHOW
 *
 * A custom challenge names its problems, because agreeing to a match without
 * being told what is in it is not a choice worth offering. It does NOT link to
 * them, and the server does not send the slugs, so there is no head start in
 * knowing. A random challenge shows only the recipe — two Easy and a Medium —
 * which is all either player knows until the countdown ends.
 */
export default function DuelChallengeCard({ duel, direction, onAccept, onDecline, onCancel, busy }) {
  const mode = modeOf(duel.mode);
  const them = duel.players.find((player) => !player.isYou) || duel.players[0];
  const incoming = direction === "incoming";

  return (
    <article className="overflow-hidden rounded-2xl border border-brand-200 bg-surface shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-brand-100 bg-gradient-to-r from-brand-100 to-brand-50 px-4 py-3">
        <Icon name={mode.icon} className="h-4 w-4 text-brand-700" />
        <span className="font-display text-sm font-extrabold uppercase tracking-wide text-ink-900">
          {mode.label}
        </span>
        <span className="ml-auto text-xs text-ink-500">{relativeTime(duel.createdAt)}</span>
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={them.username} size="h-10 w-10" className="text-sm" />
          <p className="min-w-0 text-sm text-ink-800">
            <span className="font-bold text-ink-900">{them.username}</span>{" "}
            {incoming ? "challenged you." : "has not answered yet."}
            <span className="block text-xs text-ink-500">
              {them.rating} rating · you {duel.players.find((p) => p.isYou)?.rating}
            </span>
          </p>
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-brand-50 px-2 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-500">Problems</dt>
            <dd className="font-display text-sm font-extrabold text-ink-900">{duel.problemCount}</dd>
          </div>
          <div className="rounded-xl bg-brand-50 px-2 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-500">Time</dt>
            <dd className="font-display text-sm font-extrabold text-ink-900">
              {durationText(duel.durationMs)}
            </dd>
          </div>
          <div className="rounded-xl bg-brand-50 px-2 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-500">Language</dt>
            <dd className="font-display text-sm font-extrabold text-ink-900">
              {languageName(duel.language)}
            </dd>
          </div>
        </dl>

        {duel.problems ? (
          <ul className="mt-3 space-y-1">
            {duel.problems.map((problem) => (
              <li
                key={problem.index}
                className="flex items-center gap-2 rounded-lg bg-brand-50/70 px-3 py-1.5 text-sm"
              >
                <span className="font-display text-xs font-extrabold text-brand-600">
                  {problem.index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold text-ink-900">
                  {problem.title}
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
        ) : (
          <p className="mt-3 rounded-lg bg-brand-50/70 px-3 py-2 text-sm text-ink-800">
            <Icon name="lock" className="h-3.5 w-3.5 -mt-0.5" /> Problems hidden — {mixText(duel.mix)}, revealed when
            the match starts.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {incoming ? (
            <>
              <button
                type="button"
                onClick={() => onDecline(duel)}
                disabled={busy}
                className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-brand-50 disabled:opacity-50"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => onAccept(duel)}
                disabled={busy}
                className="btn-primary flex-1 py-2 text-sm disabled:opacity-50"
              >
                {busy ? "Accepting..." : "Accept challenge"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onCancel(duel)}
                disabled={busy}
                className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-semibold text-ink-800 transition hover:bg-brand-50 disabled:opacity-50"
              >
                Withdraw
              </button>
              <Link to={`/duels/${duel.id}`} className="btn-ghost flex-1 py-2 text-sm">
                View
              </Link>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
