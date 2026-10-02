import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { Link } from "react-router-dom";
import { authApi, compilerApi, errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import ActivityChart from "../components/ActivityChart";
import RatingChart from "../components/RatingChart";
import { relativeTime } from "../relativeTime";
import {
  dayIndex,
  dayBuckets,
  humanDuration,
  mean,
  median,
  retention,
  streaks,
  topicCoverage,
} from "../progressMaths";

/*
 * The progress page.
 *
 * Every number here is derived from submissions the judge actually ran. That
 * rules some things out, and the omissions are deliberate: there is no "time
 * spent studying" because nothing measures it, and nothing called mastery,
 * because a judge knows whether a solution was accepted and not whether the
 * person understood it.
 *
 * What is here, and exactly what it means:
 *
 *   Acceptance     accepted / submissions that ran. Ones that failed to
 *                  compile are in neither half — a missing semicolon is not a
 *                  wrong answer.
 *   Attempts       submissions up to and including the one that solved it.
 *   Time to solve  first attempt to first accept, as a MEDIAN, because that
 *                  clock keeps running through lunch.
 *   Streak         consecutive days with at least one accepted submission, in
 *                  the viewer's own timezone.
 */

const LEVELS = ["Easy", "Medium", "Hard"];

const LEVEL_STYLE = {
  Easy: { text: "text-emerald-700", bar: "bg-emerald-500" },
  Medium: { text: "text-amber-700", bar: "bg-amber-500" },
  Hard: { text: "text-rose-700", bar: "bg-rose-500" },
};

const BAND_STYLE = {
  strong: { dot: "bg-emerald-500", text: "text-emerald-800", panel: "bg-emerald-50 ring-emerald-200" },
  fading: { dot: "bg-amber-500", text: "text-amber-800", panel: "bg-amber-50 ring-amber-200" },
  rusty: { dot: "bg-rose-500", text: "text-rose-800", panel: "bg-rose-50 ring-rose-200" },
};

const TOPIC_BARS = ["bg-emerald-500", "bg-amber-500", "bg-sky-500", "bg-violet-500", "bg-rose-500"];

function Panel({ icon, title, subtitle, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-brand-200 bg-surface shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-3 px-5 pb-3 pt-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <Icon name={icon} className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold text-ink-900">{title}</h2>
          {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

function StatCard({ icon, tint, label, value, note }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-brand-200 bg-surface px-4 py-4 shadow-sm">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-accent-ink ${tint}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-500">{label}</p>
        <p className="font-display text-2xl font-extrabold leading-tight text-ink-900">{value}</p>
        {note && <p className="truncate text-xs text-ink-500">{note}</p>}
      </div>
    </div>
  );
}

export default function Progress() {
  const { user } = useAuth();

  const [problems, setProblems] = useState([]);
  const [progress, setProgress] = useState({ solved: [], attempted: [], lastSolved: {} });
  const [stats, setStats] = useState({ totals: { submissions: 0, judged: 0, accepted: 0 }, problems: {} });
  /*
   * Arena rating, from the accounts API rather than the compiler.
   *
   * The only thing on this page that is not derived from the submission log —
   * it comes from finished duels — so it is fetched separately and defaults to
   * an unplayed record. If that request fails the panel shows a starting
   * rating and an empty history, which is exactly what somebody who has never
   * duelled would see anyway, rather than breaking the page around it.
   */
  const [ratings, setRatings] = useState({ rating: 1200, start: 1200, points: [], played: 0, won: 0, lost: 0, drawn: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [span, setSpan] = useState(7);
  const [openBand, setOpenBand] = useState(null);
  const [allTopics, setAllTopics] = useState(false);

  useEffect(() => {
    let live = true;
    Promise.allSettled([
      compilerApi.get("/problems"),
      compilerApi.get("/me/problems"),
      compilerApi.get("/me/stats"),
      authApi.get("/duels/rating"),
    ])
      .then(([list, mine, figures, arena]) => {
        if (!live) return;
        if (list.status === "fulfilled") setProblems(list.value.data);
        else setError(errorMessage(list.reason, "Could not load the problems."));
        if (mine.status === "fulfilled") setProgress(mine.value.data);
        if (figures.status === "fulfilled") setStats(figures.value.data);
        if (arena.status === "fulfilled") setRatings(arena.value.data);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [user]);

  const solved = useMemo(() => new Set(progress.solved || []), [progress.solved]);

  const perProblem = stats.problems || {};
  const totals = stats.totals || { submissions: 0, judged: 0, accepted: 0 };

  /*
   * Only problems that still exist are counted. A problem deleted after being
   * solved would otherwise leave a solve behind and push the total over 100%.
   */
  const solvedCount = useMemo(() => {
    const slugs = new Set(problems.map((problem) => problem.slug));
    return [...solved].filter((slug) => slugs.has(slug)).length;
  }, [problems, solved]);

  const acceptance = totals.judged ? totals.accepted / totals.judged : null;

  const solveDays = useMemo(
    () =>
      Object.values(perProblem)
        .filter((row) => row.firstSolvedAt)
        .map((row) => dayIndex(row.firstSolvedAt)),
    [perProblem]
  );

  const streak = useMemo(() => streaks(solveDays), [solveDays]);
  const buckets = useMemo(() => dayBuckets(solveDays, span), [solveDays, span]);

  const averageAttempts = useMemo(
    () => mean(Object.values(perProblem).map((row) => row.attemptsToSolve)),
    [perProblem]
  );

  /*
   * Only problems that took more than one go.
   *
   * Time to solve is measured from the first attempt to the first accept, so a
   * problem solved first time took, by that definition, zero seconds. Those
   * are not fast solves — they are unmeasured ones, and leaving them in drags
   * the median to "0s" and says something plainly untrue about how long the
   * work takes.
   */
  const struggled = useMemo(
    () => Object.values(perProblem).filter((row) => row.attemptsToSolve > 1),
    [perProblem]
  );

  const medianSolveMs = useMemo(
    () => median(struggled.map((row) => row.timeToSolveMs)),
    [struggled]
  );

  const byLevel = useMemo(
    () =>
      LEVELS.map((level) => {
        const all = problems.filter((problem) => problem.difficulty === level);
        const done = all.filter((problem) => solved.has(problem.slug)).length;
        return { level, done, total: all.length, fraction: all.length ? done / all.length : 0 };
      }),
    [problems, solved]
  );

  const topics = useMemo(() => topicCoverage(problems, solved), [problems, solved]);
  const startedTopics = useMemo(() => topics.filter((topic) => topic.solved > 0), [topics]);
  const bands = useMemo(() => retention(problems, progress.lastSolved || {}), [problems, progress.lastSolved]);

  if (loading) {
    return <main className="mx-auto max-w-2xl px-6 py-24 text-center text-brand-700">Loading your progress...</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6">
      <header className="flex flex-wrap items-center gap-4 rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-100 via-brand-50 to-surface px-5 py-5 sm:px-7">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface shadow-sm">
          <Icon name="progress" className="h-7 w-7 text-brand-600" strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">Your progress</h1>
          <p className="mt-0.5 text-sm text-ink-800">
            Everything here comes from submissions the judge actually ran.
          </p>
        </div>
        <figure className="max-w-xs rounded-2xl border border-brand-200/80 bg-surface/70 px-4 py-3 backdrop-blur-sm">
          <blockquote className="text-sm font-semibold leading-snug text-ink-900">
            Small consistent progress leads to big results.
          </blockquote>
        </figure>
      </header>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="target" tint="bg-emerald-100"
          label="Problems solved"
          value={`${solvedCount} / ${problems.length}`}
          note={problems.length ? `${Math.round((solvedCount / problems.length) * 100)}% of the set` : "no problems yet"}
        />
        <StatCard
          icon="check" tint="bg-sky-100"
          label="Acceptance"
          value={acceptance === null ? "—" : `${Math.round(acceptance * 100)}%`}
          note={totals.judged ? `${totals.accepted} of ${totals.judged} that ran` : "nothing judged yet"}
        />
        <StatCard
          icon="fire" tint="bg-orange-100"
          label="Current streak"
          value={`${streak.current} ${streak.current === 1 ? "day" : "days"}`}
          note={streak.best ? `best: ${streak.best} ${streak.best === 1 ? "day" : "days"}` : "solve one to start"}
        />
        <StatCard
          icon="repeat" tint="bg-violet-100"
          label="Attempts per solve"
          value={averageAttempts === null ? "—" : averageAttempts.toFixed(1)}
          note={solvedCount ? "runs up to the one that worked" : "nothing solved yet"}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          icon="duel" title="Arena rating"
          subtitle="How it has moved, duel by duel."
          action={
            <Link to="/arena" className="text-xs font-bold text-brand-700 hover:text-brand-900">
              Duel Arena →
            </Link>
          }
        >
          <RatingChart history={ratings} />
        </Panel>

        <Panel icon="signal" title="By difficulty" subtitle="How much of each tier you have cleared.">
          <div className="space-y-4">
            {byLevel.map((row) => (
              <div key={row.level}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className={`font-bold ${LEVEL_STYLE[row.level].text}`}>{row.level}</span>
                  <span className="tabular-nums text-ink-800">
                    {row.done} / {row.total}
                    <span className="ml-2 text-xs text-ink-500">{Math.round(row.fraction * 100)}%</span>
                  </span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full bg-brand-100"
                  role="progressbar" aria-valuenow={row.done} aria-valuemin={0} aria-valuemax={row.total}
                  aria-label={`${row.level} problems solved`}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ${LEVEL_STYLE[row.level].bar}`}
                    style={{ width: `${row.fraction * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel
          icon="graduation" title="Topic coverage"
          subtitle="Problems solved out of those available, per topic."
          action={
            startedTopics.length > 5 ? (
              <button
                type="button"
                onClick={() => setAllTopics((value) => !value)}
                className="text-xs font-bold text-brand-700 hover:text-brand-900"
              >
                {allTopics ? "Show top 5" : `View all ${startedTopics.length} →`}
              </button>
            ) : null
          }
        >
          {startedTopics.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-500">
              Solve a problem and its topics will appear here.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {(allTopics ? startedTopics : startedTopics.slice(0, 5)).map((topic, index) => (
                <li key={topic.topic}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium capitalize text-ink-900">{topic.topic}</span>
                    <span className="shrink-0 tabular-nums text-xs text-ink-500">
                      {topic.solved}/{topic.total} · {Math.round(topic.fraction * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-100">
                    <div
                      className={`h-full rounded-full transition-[width] duration-700 ${TOPIC_BARS[index % TOPIC_BARS.length]}`}
                      style={{ width: `${topic.fraction * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel icon="calendar" title="Activity" subtitle="Problems solved per day.">
          <ActivityChart buckets={buckets} span={span} onSpanChange={setSpan} />
        </Panel>

        <Panel icon="timer" title="Solving" subtitle="What your submissions add up to.">
          <ul className="space-y-2.5 text-sm">
            {[
              [
                "Time to solve (median)",
                medianSolveMs === null ? "—" : humanDuration(medianSolveMs),
                struggled.length
                  ? `across ${struggled.length} that took more than one go`
                  : "nothing has taken a second attempt yet",
              ],
              ["Attempts per solve", averageAttempts === null ? "—" : averageAttempts.toFixed(1), "runs up to the one that worked"],
              ["Accepted", totals.accepted, "submissions"],
              ["Total submitted", totals.submissions, totals.submissions === totals.judged ? "all ran" : `${totals.submissions - totals.judged} did not compile`],
            ].map(([label, value, note]) => (
              <li key={label} className="flex items-baseline justify-between gap-3 border-b border-brand-100 pb-2 last:border-b-0">
                <span className="min-w-0">
                  <span className="block font-medium text-ink-900">{label}</span>
                  <span className="text-xs text-ink-500">{note}</span>
                </span>
                <span className="shrink-0 font-display text-lg font-extrabold tabular-nums text-ink-900">{value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        icon="think" title="Retention"
        subtitle="How recently you last solved something in each topic."
        className="mt-4"
        action={
          <Link
            to="/problems?status=solved&sort=stalest"
            className="btn-primary px-4 py-2 text-sm"
          >
            Start a review →
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {bands.map((band) => {
            const style = BAND_STYLE[band.id];
            const open = openBand === band.id;
            return (
              <div key={band.id}>
                <button
                  type="button"
                  onClick={() => setOpenBand(open ? null : band.id)}
                  aria-expanded={open}
                  disabled={!band.topics.length}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 transition ${style.panel} ${
                    band.topics.length ? "hover:brightness-[0.97]" : "opacity-60"
                  }`}
                >
                  <span className={`h-3 w-3 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-extrabold ${style.text}`}>{band.label}</span>
                    <span className="block text-[11px] text-ink-500">{band.caption}</span>
                  </span>
                  <span className={`font-display text-xl font-extrabold tabular-nums ${style.text}`}>
                    {band.topics.length}
                  </span>
                </button>

                {open && band.topics.length > 0 && (
                  <ul className="mt-2 space-y-1 rounded-xl border border-brand-100 bg-surface px-3 py-2">
                    {band.topics.map((entry) => (
                      <li key={entry.topic} className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="truncate capitalize text-ink-900">{entry.topic}</span>
                        <span className="shrink-0 text-ink-500">{relativeTime(entry.at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {bands.every((band) => band.topics.length === 0) && (
          <p className="mt-3 text-center text-sm text-ink-500">
            Nothing to review yet. Topics appear here once you have solved something in them.
          </p>
        )}
      </Panel>
    </main>
  );
}
