import Avatar from "./Avatar";
import { activityOf } from "../duelText";

/*
 * Where both players stand, at a glance, while the match runs.
 *
 * TWO KINDS OF FACT, AND THEY ARE NOT MIXED UP
 *
 * The ticks come from the JUDGE. A problem is marked solved because a
 * submission for it was accepted and recorded, and the score beside it was
 * computed by the server from the same log. Neither player's browser has any
 * say in it, which is why it is safe to show somebody their opponent's
 * progress.
 *
 * The little coloured word — Coding, Testing — is the opponent's own page
 * saying what they are up to. It is presence, it is not evidence, and nothing
 * is scored from it. It is styled quietly, next to the name rather than next
 * to the numbers, so the two are not read as the same kind of claim.
 *
 * WHY THE OPPONENT'S PROGRESS IS SHOWN AT ALL
 *
 * Because "you are 40 points behind with one problem left" is a match, and
 * "you are typing alone in a room" is not. It never reveals their CODE, only
 * whether their submissions were accepted, which is exactly what the
 * scoreboard of any contest shows.
 */

function ProblemPip({ row, index, active, onClick }) {
  const solved = row?.solved;
  const tried = !solved && (row?.attempts || 0) > 0;

  const look = solved
    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
    : tried
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : "border-brand-200 bg-surface text-ink-500";

  const mark = solved ? "✓" : tried ? "··" : "○";
  const said = solved ? "solved" : tried ? `${row.bestPassed}/${row.total} tests` : "not started";

  const content = (
    <>
      <span className="text-[9px] font-bold uppercase tracking-wide">P{index + 1}</span>
      <span className="font-display text-xs font-extrabold leading-none sm:text-sm" aria-hidden="true">
        {mark}
      </span>
      <span className="sr-only">{said}</span>
    </>
  );

  if (!onClick) {
    return (
      <span
        title={`Problem ${index + 1} — ${said}`}
        className={`flex w-9 flex-col items-center rounded-md border px-1 py-0.5 sm:w-11 ${look}`}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      title={`Problem ${index + 1} — ${said}`}
      className={`flex w-9 flex-col items-center rounded-md border px-1 py-0.5 transition hover:brightness-95 sm:w-11 ${look} ${
        active ? "ring-2 ring-brand-400 ring-offset-1" : ""
      }`}
    >
      {content}
    </button>
  );
}

function Side({ player, card, problems, activity, mine, activeIndex, onJump }) {
  const state = activityOf(activity?.state);

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <Avatar name={player.username} size="h-8 w-8" className="text-[11px]" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-extrabold text-ink-900">
            {mine ? "You" : player.username}
            {/* Your own name is spelled out only where there is room for it.
                At 375px it pushed the line below into truncating "0 subs"
                mid-word, and the avatar beside it already says whose side
                this is. */}
            {mine && (
              <span className="ml-1 hidden font-medium text-ink-500 sm:inline">
                ({player.username})
              </span>
            )}
          </p>
          <p className="flex items-center gap-1 truncate text-[10px] text-ink-500">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${state.dot}`} aria-hidden="true" />
            {state.label}
            <span aria-hidden="true">·</span>
            {player.rating}
            <span aria-hidden="true">·</span>
            {card?.submissions ?? 0} sub{(card?.submissions ?? 0) === 1 ? "" : "s"}
          </p>
        </div>

        <p className="font-display text-xl font-extrabold tabular-nums leading-none text-ink-900">
          {card?.total ?? 0}
        </p>
      </div>

      {/*
        The pips sit on their own row rather than beside the name.
        At 375px, one row of avatar, name, score and three pips does not fit,
        and letting it wrap turned this bar into four stacked blocks that ate a
        third of the screen — on the one screen where vertical space is the
        thing a player has least of.
      */}
      <div className="mt-1.5 flex gap-1">
        {problems.map((problem, index) => (
          <ProblemPip
            key={problem.index ?? index}
            index={index}
            row={card?.problems?.[index]}
            active={mine && activeIndex === index}
            onClick={mine ? onJump : null}
          />
        ))}
      </div>
    </div>
  );
}

export default function DuelStatusBar({ duel, activity, activeIndex, onJump, children }) {
  const you = duel.players.find((player) => player.isYou);
  const them = duel.players.find((player) => !player.isYou);
  const cards = duel.scores?.cards || {};
  const byUser = new Map((activity || []).map((row) => [row.userId, row]));
  const problems = duel.problems || [];

  return (
    <section className="sticky bottom-0 z-20 border-t border-brand-200 bg-surface/95 px-3 py-2 shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.25)] backdrop-blur sm:px-4 sm:py-2.5">
      <div className="mx-auto flex max-w-[110rem] items-center gap-2 sm:gap-4">
        <Side
          player={you}
          card={cards[you.id]}
          problems={problems}
          activity={byUser.get(you.id)}
          mine
          activeIndex={activeIndex}
          onJump={onJump}
        />

        <span className="h-12 w-px shrink-0 bg-brand-200" aria-hidden="true" />

        <Side
          player={them}
          card={cards[them.id]}
          problems={problems}
          activity={byUser.get(them.id)}
        />

        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </section>
  );
}
