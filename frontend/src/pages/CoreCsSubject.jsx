import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import Reveal from "../components/Reveal";
import Boundary from "../components/corecs/Boundary";
import { subjectById } from "../corecs";
import { IMPORTANCE, searchText } from "../corecs/schema";
import useCoreCsProgress from "../useCoreCsProgress";

/*
 * A subject's dashboard: where you stand, and where to go next.
 *
 * WHY THE NUMBERS ARE COMPUTED, NEVER STORED
 *
 * Every figure here — completed, remaining, percentage, high-priority done —
 * is derived from two sets of question ids and the content modules. Nothing is
 * kept as a counter. Counters drift: reword a question, split a topic, remove
 * one, and a stored total is quietly wrong with nothing to notice it. Derived
 * numbers cannot be wrong, because there is nowhere for them to disagree.
 */

function StatTile({ icon, tint, label, value, note }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-surface px-3.5 py-3 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-accent-ink ${tint}`}>
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-ink-500">{label}</p>
        <p className="font-display text-xl font-extrabold leading-tight text-ink-900 tabular-nums">
          {value}
        </p>
        {note && <p className="truncate text-[11px] text-ink-500">{note}</p>}
      </div>
    </div>
  );
}

function Bar({ value, total, className = "" }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-brand-100 ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${value} of ${total} complete`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TopicRow({ subjectId, topic, done, revise }) {
  const total = topic.questions.length;
  const completed = topic.questions.filter((q) => done.has(q.id)).length;
  const queued = topic.questions.filter((q) => revise.has(q.id)).length;
  const importance = IMPORTANCE[topic.importance] || IMPORTANCE.low;
  const finished = completed === total && total > 0;

  return (
    <Link
      to={`/corecs/${subjectId}/${topic.id}`}
      className="group flex items-start gap-3 rounded-2xl border border-brand-200/80 bg-surface/90 px-4 py-3.5
                 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                    ${finished ? "bg-emerald-100 text-accent-ink" : "bg-brand-100 text-brand-700"}`}
      >
        <Icon name={finished ? "check" : topic.icon} className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-display text-sm font-extrabold leading-tight text-ink-900">
            {topic.name}
          </h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide
                        ${
                          topic.importance === "high"
                            ? "bg-rose-100 text-rose-800"
                            : topic.importance === "med"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-brand-100 text-brand-800"
                        }`}
          >
            <Icon name={importance.icon} className="h-2.5 w-2.5" />
            {importance.short}
          </span>
          {queued > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
              <Icon name="repeat" className="h-2.5 w-2.5" />
              {queued}
            </span>
          )}
        </div>

        <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{topic.blurb}</p>

        <div className="mt-2 flex items-center gap-2.5">
          <Bar value={completed} total={total} className="flex-1" />
          <span className="shrink-0 text-[11px] font-bold tabular-nums text-ink-500">
            {completed}/{total}
          </span>
        </div>
      </div>

      <Icon
        name="arrowRight"
        className="mt-3 h-4 w-4 shrink-0 text-ink-500 transition group-hover:translate-x-0.5 group-hover:text-brand-700"
      />
    </Link>
  );
}

export default function CoreCsSubject() {
  const { subject: subjectId = "os" } = useParams();
  const subject = subjectById(subjectId);
  const { done, revise, loading, error } = useCoreCsProgress(subjectId);
  const [query, setQuery] = useState("");

  const topics = subject?.topics || [];

  const stats = useMemo(() => {
    const all = topics.flatMap((topic) => topic.questions);
    const high = all.filter((q) => q.importance === "high");
    return {
      questions: all.length,
      completed: all.filter((q) => done.has(q.id)).length,
      queued: all.filter((q) => revise.has(q.id)).length,
      topicsDone: topics.filter(
        (topic) => topic.questions.length > 0 && topic.questions.every((q) => done.has(q.id))
      ).length,
      highTotal: high.length,
      highDone: high.filter((q) => done.has(q.id)).length,
    };
  }, [topics, done, revise]);

  /*
   * Search runs across every question in the subject, not just topic names.
   *
   * Typing "deadlock" should surface the Banker's numerical and the lock
   * ordering scenario, not only the topic called Deadlocks — that is the
   * difference between search and a filter.
   */
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return null;

    return topics
      .map((topic) => ({
        topic,
        matches: topic.questions.filter((q) => searchText(q).includes(term)),
      }))
      .filter((group) => group.matches.length > 0);
  }, [query, topics]);

  if (!subject) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Subject not found</h1>
        <Link to="/corecs" className="btn-primary mt-4 inline-block">
          Back to Core CS
        </Link>
      </main>
    );
  }

  if (!subject.topics) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">{subject.name}</h1>
        <p className="mt-2 text-sm text-ink-500">
          Notes for this subject have not been processed yet.
        </p>
        <Link to="/corecs" className="btn-primary mt-4 inline-block">
          Back to Core CS
        </Link>
      </main>
    );
  }

  const pct = stats.questions ? Math.round((stats.completed / stats.questions) * 100) : 0;

  return (
    <Boundary resetKey={subjectId}>
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/corecs"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 hover:text-brand-700"
      >
        <Icon name="arrowLeft" className="h-3.5 w-3.5" />
        Core CS
      </Link>

      <header className="mt-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900">
          {subject.name}
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">{subject.blurb}</p>
      </header>

      {error && (
        <p className="mt-4 rounded-xl border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {error}
        </p>
      )}

      {/* ------------------------------------------------------ progress -- */}
      <section className="mt-5 rounded-2xl border border-brand-200 bg-surface/90 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-2xl font-extrabold text-ink-900 tabular-nums">
            {loading ? "—" : `${stats.completed} / ${stats.questions}`}
            <span className="ml-2 text-sm font-bold text-ink-500">questions done</span>
          </p>
          <p className="font-display text-2xl font-extrabold text-brand-700 tabular-nums">
            {loading ? "" : `${pct}%`}
          </p>
        </div>
        <Bar value={stats.completed} total={stats.questions} className="mt-2.5 h-2.5" />

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon="books"
            tint="bg-sky-100"
            label="Topics finished"
            value={`${stats.topicsDone} / ${topics.length}`}
          />
          <StatTile
            icon="fire"
            tint="bg-rose-100"
            label="High priority"
            value={`${stats.highDone} / ${stats.highTotal}`}
            note="the ones that decide interviews"
          />
          <StatTile
            icon="repeat"
            tint="bg-amber-100"
            label="To revise"
            value={stats.queued}
            note={stats.queued ? "queued by you" : "nothing queued"}
          />
          <StatTile
            icon="target"
            tint="bg-emerald-100"
            label="Remaining"
            value={stats.questions - stats.completed}
          />
        </div>

        {stats.queued > 0 && (
          <Link to={`/corecs/${subjectId}/revise`} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Icon name="repeat" className="h-4 w-4" />
            Start revision · {stats.queued}
          </Link>
        )}
      </section>

      {/* -------------------------------------------------------- search -- */}
      <div className="mt-6">
        <label className="sr-only" htmlFor="corecs-search">
          Search questions
        </label>
        <div className="relative">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
          />
          <input
            id="corecs-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search every question — deadlock, TLB, semaphore…"
            className="w-full rounded-xl border border-brand-300 bg-surface py-2.5 pl-9 pr-3 text-sm
                       text-ink-900 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ------------------------------------------------------- results -- */}
      {results ? (
        <section className="mt-5">
          {/* The count is suppressed when there are none, because "0 matches"
              directly above "Nothing matches" says the same thing twice. */}
          {results.length > 0 && (
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-500">
              {results.reduce((sum, group) => sum + group.matches.length, 0)} matches
            </p>
          )}
          {results.length === 0 ? (
            <p className="rounded-2xl border border-brand-200 bg-surface px-4 py-6 text-center text-sm text-ink-500">
              Nothing matches “{query}”.
            </p>
          ) : (
            <div className="space-y-4">
              {results.map(({ topic, matches }) => (
                <div key={topic.id}>
                  <Link
                    to={`/corecs/${subjectId}/${topic.id}`}
                    className="inline-flex items-center gap-1.5 font-display text-sm font-extrabold text-brand-700 hover:underline"
                  >
                    <Icon name={topic.icon} className="h-3.5 w-3.5" />
                    {topic.name}
                    <span className="text-ink-500">· {matches.length}</span>
                  </Link>
                  <ul className="mt-1.5 space-y-1 border-l-2 border-brand-200 pl-3">
                    {matches.slice(0, 6).map((question) => (
                      <li key={question.id}>
                        <Link
                          to={`/corecs/${subjectId}/${topic.id}#${question.id}`}
                          className="text-sm leading-snug text-ink-700 hover:text-brand-700"
                        >
                          {question.question}
                        </Link>
                      </li>
                    ))}
                    {matches.length > 6 && (
                      <li className="text-xs text-ink-500">and {matches.length - 6} more…</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="mt-5 space-y-3">
          {topics.map((topic, i) => (
            <Reveal key={topic.id} delay={Math.min(i, 6) * 40}>
              <TopicRow subjectId={subjectId} topic={topic} done={done} revise={revise} />
            </Reveal>
          ))}
        </section>
      )}
    </main>
    </Boundary>
  );
}
