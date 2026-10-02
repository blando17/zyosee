import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import Boundary from "../components/corecs/Boundary";
import QuestionCard from "../components/corecs/QuestionCard";
import { subjectById } from "../corecs";
import { DONE, REVISE, byImportance } from "../corecs/schema";
import useCoreCsProgress from "../useCoreCsProgress";

/*
 * The revision queue: everything you flagged, one at a time.
 *
 * WHY THIS IS NOT JUST THE TOPIC PAGE WITH A FILTER
 *
 * The topic page is for reading. This is for the hour before an interview,
 * and it is built for a different job: no filter chips, no topic navigation,
 * no scrolling past things you already know — one question, keyboard-driven,
 * with the queue shrinking as you clear it.
 *
 * QUESTIONS LEAVE THE QUEUE WHEN YOU MARK THEM DONE, BUT NOT UNDER YOU.
 *
 * The list is captured when the session starts and held. If it re-filtered
 * live, marking the current question Done would remove it from the array and
 * the next question would slide into the same index — so pressing D would
 * silently skip one. Instead, the queue is fixed for the session and the
 * "cleared" count tracks progress through it.
 */

export default function CoreCsRevision() {
  const { subject: subjectId = "os" } = useParams();
  const subject = subjectById(subjectId);
  const { revise, stateOf, mark, loading, error } = useCoreCsProgress(subjectId);

  const [queue, setQueue] = useState(null);
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const flagged = useMemo(() => {
    if (!subject?.topics) return [];
    return subject.topics
      .flatMap((topic) =>
        topic.questions
          .filter((question) => revise.has(question.id))
          .map((question) => ({ ...question, topicName: topic.name, topicId: topic.id }))
      )
      .sort(byImportance);
  }, [subject, revise]);

  /*
   * Snapshot the queue once, after progress has loaded.
   *
   * `queue === null` means "not started yet" and is distinct from an empty
   * queue, which means "nothing to revise". Without that distinction the page
   * would flash the empty state for as long as the fetch takes.
   */
  useEffect(() => {
    if (loading || queue !== null) return;
    setQueue(flagged);
  }, [loading, queue, flagged]);

  useEffect(() => {
    setRevealed(false);
  }, [cursor]);

  useEffect(() => {
    if (!queue?.length) return undefined;

    function onKey(event) {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable) return;

      if (event.key === " ") {
        event.preventDefault();
        setRevealed((value) => !value);
      } else if (event.key === "ArrowRight") {
        setCursor((value) => Math.min(value + 1, queue.length - 1));
      } else if (event.key === "ArrowLeft") {
        setCursor((value) => Math.max(value - 1, 0));
      } else if (event.key.toLowerCase() === "d" && queue[cursor]) {
        mark(queue[cursor].id, DONE);
        setCursor((value) => Math.min(value + 1, queue.length - 1));
      } else if (event.key.toLowerCase() === "r" && queue[cursor]) {
        mark(queue[cursor].id, REVISE);
        setCursor((value) => Math.min(value + 1, queue.length - 1));
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [queue, cursor, mark]);

  if (!subject?.topics) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Not available</h1>
        <Link to="/corecs" className="btn-primary mt-4 inline-block">
          Back to Core CS
        </Link>
      </main>
    );
  }

  const cleared = queue ? queue.filter((question) => stateOf(question.id) !== REVISE).length : 0;
  const current = queue?.[cursor];

  return (
    <Boundary resetKey={current?.id}>
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        to={`/corecs/${subjectId}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 hover:text-brand-700"
      >
        <Icon name="arrowLeft" className="h-3.5 w-3.5" />
        {subject.name}
      </Link>

      <header className="mt-3">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          Revision
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
          Everything you flagged, hardest-hitting first. No filters, no scrolling — answer, reveal,
          move on.
        </p>
      </header>

      {error && (
        <p className="mt-4 rounded-xl border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {error}
        </p>
      )}

      {loading || queue === null ? (
        <p className="mt-10 text-center text-sm text-ink-500">Loading your queue…</p>
      ) : queue.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-brand-200 bg-surface px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-accent-ink">
            <Icon name="peace" className="h-6 w-6" />
          </span>
          <p className="mt-3 font-display text-lg font-extrabold text-ink-900">Queue is empty</p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-ink-500">
            Nothing is flagged for revision. As you work through a topic, press{" "}
            <span className="font-bold">Revise later</span> on anything you were shaky on and it
            will collect here.
          </p>
          <Link to={`/corecs/${subjectId}`} className="btn-primary mt-4 inline-block">
            Back to topics
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2">
            <p className="text-xs text-ink-700">
              <span className="font-bold tabular-nums">{queue.length - cleared}</span> left of{" "}
              <span className="tabular-nums">{queue.length}</span>
            </p>
            <p className="text-xs text-ink-500">
              <kbd className="rounded border border-brand-300 bg-surface px-1 font-mono">Space</kbd>{" "}
              reveal ·{" "}
              <kbd className="rounded border border-brand-300 bg-surface px-1 font-mono">D</kbd>{" "}
              done ·{" "}
              <kbd className="rounded border border-brand-300 bg-surface px-1 font-mono">→</kbd>{" "}
              next
            </p>
          </div>

          {current && (
            <>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-ink-500">
                {current.topicName}
              </p>
              <div className="mt-1.5">
                <QuestionCard
                  key={current.id}
                  question={current}
                  index={cursor}
                  total={queue.length}
                  state={stateOf(current.id)}
                  onMark={mark}
                  open={revealed}
                  onToggle={setRevealed}
                  interview
                />
              </div>
            </>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => setCursor((value) => Math.max(value - 1, 0))}
              disabled={cursor === 0}
              className="btn-ghost inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              <Icon name="arrowLeft" className="h-4 w-4" />
              Previous
            </button>
            <span className="text-xs font-bold tabular-nums text-ink-500">
              {cursor + 1} / {queue.length}
            </span>
            <button
              onClick={() => setCursor((value) => Math.min(value + 1, queue.length - 1))}
              disabled={cursor >= queue.length - 1}
              className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              Next
              <Icon name="arrowRight" className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </main>
    </Boundary>
  );
}
