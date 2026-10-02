import { Link } from "react-router-dom";
import StatusMark from "./StatusMark";
import { VERDICTS } from "./Verdict";
import { relativeTime } from "../relativeTime";

/*
 * The fuller progress view, for the profile page.
 *
 * No headline ring here. The problem list header carries one because that is
 * all that fits beside a table, and the dedicated progress page opens with
 * one — but on the profile it sat directly above a difficulty breakdown
 * saying the same thing twice over. What is left is the detail: how far
 * through each tier somebody is, how their submissions have gone, and what
 * they last sent.
 *
 * Everything is derived from judged submissions. Nothing counts because a page
 * was opened or an editor typed in.
 */

const LEVELS = [
  { name: "Easy", bar: "bg-emerald-500" },
  { name: "Medium", bar: "bg-amber-500" },
  { name: "Hard", bar: "bg-rose-500" },
];

const LANGUAGES = { cpp: "C++", c: "C", py: "Python", java: "Java" };

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
      <p className="text-xl font-bold leading-none text-ink-900">{value}</p>
      <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-brand-800">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-brand-700">{hint}</p>}
    </div>
  );
}

export default function ProgressPanel({ problems, solved, attempted, totals, recent, loading, action }) {
  const titles = new Map(problems.map((p) => [p.slug, p]));

  const byLevel = LEVELS.map((level) => {
    const all = problems.filter((p) => p.difficulty === level.name);
    const done = all.filter((p) => solved.has(p.slug)).length;
    return { ...level, done, total: all.length };
  });

  /*
   * Null, not zero, until something has actually been judged. A brand new
   * account showing "0% accepted" would be reporting a failure that never
   * happened.
   */
  const acceptance = totals.judged ? totals.accepted / totals.judged : null;

  return (
    <div className="space-y-6">
      <div className="card">
        {/* `action` is where the page this sits on offers a way deeper in —
            supplied by the caller rather than hardcoded, so the panel stays a
            presentational thing that knows nothing about routes. */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink-900">Solved by difficulty</h2>
          {action}
        </div>

        <div className="mt-4 space-y-3">
          {byLevel.map((level) => (
            <div key={level.name}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold text-ink-900">{level.name}</span>
                <span className="tabular-nums text-brand-800">
                  {level.done} / {level.total}
                </span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-100"
                role="progressbar"
                aria-valuenow={level.done}
                aria-valuemin={0}
                aria-valuemax={level.total}
                aria-label={`${level.name} problems solved`}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ${level.bar}`}
                  style={{ width: `${level.total ? (level.done / level.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Submissions" value={totals.submissions} />
          <Stat label="Accepted" value={totals.accepted} />
          <Stat
            label="Acceptance"
            value={acceptance === null ? "—" : `${(acceptance * 100).toFixed(0)}%`}
            hint={totals.judged ? `of ${totals.judged} that ran` : "nothing judged yet"}
          />
          <Stat label="In progress" value={attempted.size} hint="tried, not yet solved" />
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-ink-900">Recent submissions</h2>

        {loading && <p className="mt-4 text-sm text-brand-700">Loading...</p>}

        {!loading && !recent.length && (
          <p className="mt-3 text-sm text-ink-800">
            Nothing yet.{" "}
            <Link to="/problems" className="font-semibold text-brand-700 hover:text-brand-900">
              Pick a problem
            </Link>{" "}
            and send it to the judge.
          </p>
        )}

        {!loading && recent.length > 0 && (
          <ul className="mt-3 divide-y divide-brand-100">
            {recent.map((entry, index) => {
              const style = VERDICTS[entry.verdict] || VERDICTS.server_error;
              const problem = titles.get(entry.slug);
              return (
                <li key={`${entry.slug}-${entry.createdAt}-${index}`} className="py-2.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <StatusMark status={entry.verdict === "accepted" ? "solved" : "attempted"} />

                    <Link
                      to={`/problems/${entry.slug}`}
                      className="min-w-0 flex-1 truncate font-semibold text-ink-900 hover:text-brand-800"
                    >
                      {problem ? problem.title : entry.slug}
                    </Link>

                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}>
                      {style.label}
                    </span>
                  </div>

                  <p className="mt-0.5 pl-8 text-xs text-brand-700">
                    {LANGUAGES[entry.language] || entry.language}
                    {entry.total ? ` · ${entry.passed}/${entry.total} tests` : ""} ·{" "}
                    {relativeTime(entry.createdAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
