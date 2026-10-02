import { Link } from "react-router-dom";
import StatusMark from "./StatusMark";
import { STALE_AFTER_DAYS, daysSince, relativeTime } from "../relativeTime";

/*
 * One problem, drawn as a table row or as a card.
 *
 * Both layouts show the same facts and are exported from one file because they
 * share the badge, the star and the acceptance figure. Two files would mean
 * changing a colour in one and forgetting the other.
 */

const DIFFICULTY_STYLES = {
  Easy: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-900 ring-amber-200",
  Hard: "bg-rose-50 text-rose-800 ring-rose-200",
};

function Badge({ difficulty }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
        DIFFICULTY_STYLES[difficulty] || "bg-brand-50 text-brand-800 ring-brand-200"
      }`}
    >
      {difficulty}
    </span>
  );
}

/*
 * Acceptance, or a dash.
 *
 * A problem nobody has submitted to has no acceptance rate, and printing 0%
 * would say the opposite of the truth — that everyone who tried got it wrong.
 */
function Acceptance({ stats }) {
  if (!stats || stats.acceptance === null || stats.acceptance === undefined) {
    return <span className="text-sm text-brand-400" title="No submissions yet">—</span>;
  }
  return (
    <span className="text-sm tabular-nums text-ink-800" title={`${stats.accepted} of ${stats.submissions} submissions`}>
      {(stats.acceptance * 100).toFixed(1)}%
    </span>
  );
}

function Star({ on, onToggle, title }) {
  /*
   * Stops the click reaching the row's link. Without this, starring a problem
   * also navigates to it, which is never what the star was pressed for.
   */
  function handle(event) {
    event.preventDefault();
    event.stopPropagation();
    onToggle();
  }

  if (!onToggle) return <span className="h-5 w-5" />;

  return (
    <button
      type="button"
      onClick={handle}
      title={title}
      aria-label={title}
      aria-pressed={on}
      className={`rounded transition hover:scale-110 ${on ? "text-brand-500" : "text-brand-300 hover:text-brand-400"}`}
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path strokeLinejoin="round" d="M10 2.5l2.35 4.76 5.25.77-3.8 3.7.9 5.23L10 14.49l-4.7 2.47.9-5.23-3.8-3.7 5.25-.77z" />
      </svg>
    </button>
  );
}

/*
 * The line under a problem's title.
 *
 * It used to read "17 test cases · 2000 ms", which is the same for almost every
 * problem and tells you nothing about yourself. What is worth the space is when
 * you last got this one accepted — that is the fact that decides whether to
 * open it again. A problem solved three weeks ago is flagged as worth another
 * go, because remembering that you solved something is not the same as still
 * being able to.
 *
 * Signed out there is no history to show, so it falls back to the old line
 * rather than leaving the row with nothing under its title.
 */
function Meta({ problem, withDifficulty, status, lastSolved, lastTried, signedIn }) {
  const difficulty = withDifficulty && (
    <span className="lg:hidden">{problem.difficulty} · </span>
  );

  if (signedIn && status === "solved" && lastSolved) {
    const days = daysSince(lastSolved);
    const stale = days !== null && days >= STALE_AFTER_DAYS;
    return (
      <span className={`text-xs font-medium ${stale ? "text-amber-700" : "text-emerald-700"}`}>
        {difficulty}
        Solved {relativeTime(lastSolved)}
        {stale && <span className="text-amber-700"> · worth another go</span>}
      </span>
    );
  }

  if (signedIn && status === "attempted" && lastTried) {
    return (
      <span className="text-xs font-medium text-amber-700">
        {difficulty}Tried {relativeTime(lastTried)}, not solved
      </span>
    );
  }

  if (signedIn) {
    return <span className="text-xs text-ink-500">{difficulty}Not attempted yet</span>;
  }

  return (
    <span className="text-xs text-brand-700">
      {difficulty}
      {problem.testCount} test cases · {problem.timeLimitMs} ms
    </span>
  );
}

function Topics({ tags, limit }) {
  const shown = tags.slice(0, limit);
  const rest = tags.length - shown.length;
  return (
    <>
      {shown.map((tag) => (
        <span
          key={tag}
          className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium capitalize text-brand-800 ring-1 ring-brand-100"
        >
          {tag}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-[11px] font-medium text-brand-600" title={tags.join(", ")}>
          +{rest}
        </span>
      )}
    </>
  );
}

export function ProblemRow({ problem, status, starred, onToggleStar, lastSolved, lastTried, signedIn }) {
  return (
    <Link
      to={`/problems/${problem.slug}`}
      /*
       * The extra columns appear at lg, not sm. Squeezing a difficulty badge,
       * a percentage and three topic chips alongside the title on a narrow
       * screen leaves the title itself truncated to a few characters, which
       * loses the one thing the row exists to show.
       */
      className="group grid grid-cols-[auto_auto_auto_minmax(0,1fr)_auto] items-center gap-3 border-b
                 border-brand-100 px-4 py-3 transition last:border-b-0 hover:bg-brand-50/70
                 lg:grid-cols-[auto_auto_3.5rem_minmax(0,1fr)_5.5rem_4.5rem_14rem_auto]"
    >
      <Star on={starred} onToggle={onToggleStar} title={starred ? "Remove from favourites" : "Add to favourites"} />
      <StatusMark status={status} />

      <span className="text-sm font-semibold tabular-nums text-brand-700">
        {problem.number ? `#${problem.number}` : ""}
      </span>

      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink-900 group-hover:text-brand-800">
          {problem.title}
        </span>
        <Meta problem={problem} withDifficulty status={status} lastSolved={lastSolved} lastTried={lastTried} signedIn={signedIn} />
      </span>

      <span className="hidden lg:block"><Badge difficulty={problem.difficulty} /></span>
      <span className="hidden text-right lg:block"><Acceptance stats={problem.stats} /></span>

      {/* Two, not three. The topic names here run to "Breadth-First Search",
          and a third chip wraps to a second line on most rows, which makes the
          table's row heights jump about. The rest are behind the +n. */}
      <span className="hidden flex-wrap items-center gap-1 lg:flex">
        <Topics tags={problem.tags} limit={2} />
      </span>

      <svg viewBox="0 0 20 20" className="h-4 w-4 text-brand-300 group-hover:text-brand-600" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
      </svg>
    </Link>
  );
}

export function ProblemCard({ problem, status, starred, onToggleStar, lastSolved, lastTried, signedIn }) {
  return (
    <Link
      to={`/problems/${problem.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-brand-200 bg-surface p-4
                 shadow-sm transition hover:border-brand-400 hover:shadow"
    >
      <div className="flex items-start gap-2">
        <StatusMark status={status} />
        <span className="text-sm font-semibold tabular-nums text-brand-700">
          {problem.number ? `#${problem.number}` : ""}
        </span>
        <span className="ml-auto">
          <Star on={starred} onToggle={onToggleStar} title={starred ? "Remove from favourites" : "Add to favourites"} />
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="truncate font-bold text-ink-900 group-hover:text-brand-800">{problem.title}</h3>
        <Meta problem={problem} status={status} lastSolved={lastSolved} lastTried={lastTried} signedIn={signedIn} />
      </div>

      <div className="flex flex-wrap gap-1">
        <Topics tags={problem.tags} limit={2} />
      </div>

      <div className="mt-auto flex items-center justify-between pt-1">
        <Badge difficulty={problem.difficulty} />
        <Acceptance stats={problem.stats} />
      </div>
    </Link>
  );
}
