import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import Boundary from "../components/corecs/Boundary";
import QuestionCard from "../components/corecs/QuestionCard";
import { subjectById } from "../corecs";
import { DONE, IMPORTANCE, NONE, REVISE, UNANSWERED } from "../corecs/schema";
import useCoreCsProgress from "../useCoreCsProgress";

/*
 * One topic, as a stack of question cards.
 *
 * TWO MODES, ONE LIST
 *
 *   Study mode      every matching card on the page, each opening on its own.
 *                   This is what you want when reading through a topic.
 *
 *   Interview mode  one card at a time, answer hidden, keyboard-driven. This
 *                   is what you want the day before, because it forces you to
 *                   answer before you look.
 *
 * They share the same filtered list rather than being two screens, so toggling
 * does not lose your place or your filters.
 *
 * WHY THE FILTERS ARE CHIPS AND NOT A DROPDOWN
 *
 * Revising, you change filter constantly — high priority only, then just the
 * numericals, then everything you have not attempted. A dropdown costs two
 * clicks and hides the current state; chips cost one and show it.
 */

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "high", label: "Very important", test: (q) => q.importance === "high" },
  { id: "numerical", label: "Numericals", test: (q) => q.type === "numerical" },
  { id: "comparison", label: "Comparisons", test: (q) => q.type === "comparison" },
  { id: "mcq", label: "MCQs", test: (q) => q.type === "mcq" },
  { id: "unattempted", label: "Unattempted", test: (q, state) => state === NONE },
  { id: "revise", label: "To revise", test: (q, state) => state === REVISE },
  { id: "done", label: "Done", test: (q, state) => state === DONE },
];

export default function CoreCsTopic() {
  const { subject: subjectId = "os", topic: topicId } = useParams();
  const subject = subjectById(subjectId);
  const topic = subject?.topics?.find((t) => t.id === topicId) || null;

  const { stateOf, mark, error } = useCoreCsProgress(subjectId);
  const [filter, setFilter] = useState("all");
  const [interview, setInterview] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const questions = topic?.questions || [];

  const shown = useMemo(() => {
    const active = FILTERS.find((f) => f.id === filter) || FILTERS[0];
    return questions.filter((question) => active.test(question, stateOf(question.id)));
  }, [questions, filter, stateOf]);

  /*
   * Changing the filter must not leave the cursor past the end of the list.
   * Clamping on render rather than in the filter handler also covers the case
   * where marking a question removes it from an "unattempted" filter under you.
   */
  useEffect(() => {
    setCursor((value) => Math.min(value, Math.max(0, shown.length - 1)));
  }, [shown.length]);

  useEffect(() => {
    setRevealed(false);
  }, [cursor, filter, interview]);

  /*
   * Keyboard control, and only in interview mode.
   *
   * Binding Space and the arrow keys globally on a page full of cards would
   * fight with scrolling and with the browser's own behaviour. In interview
   * mode there is exactly one card and nothing to scroll, so the keys are
   * unambiguous — which is the only reason it is safe to take them.
   */
  useEffect(() => {
    if (!interview) return undefined;

    function onKey(event) {
      // Never steal keys from something the person is typing into.
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable) return;

      if (event.key === " ") {
        event.preventDefault();
        setRevealed((value) => !value);
      } else if (event.key === "ArrowRight") {
        setCursor((value) => Math.min(value + 1, shown.length - 1));
      } else if (event.key === "ArrowLeft") {
        setCursor((value) => Math.max(value - 1, 0));
      } else if (event.key.toLowerCase() === "d" && shown[cursor]) {
        mark(shown[cursor].id, DONE);
      } else if (event.key.toLowerCase() === "r" && shown[cursor]) {
        mark(shown[cursor].id, REVISE);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interview, shown, cursor, mark]);

  if (!topic) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Topic not found</h1>
        <Link to={`/corecs/${subjectId}`} className="btn-primary mt-4 inline-block">
          Back to {subject?.name || "Core CS"}
        </Link>
      </main>
    );
  }

  const completed = questions.filter((q) => stateOf(q.id) === DONE).length;
  const importance = IMPORTANCE[topic.importance] || IMPORTANCE.low;
  const numericals = questions.filter((q) => q.type === "numerical").length;
  const unanswered = questions.filter((q) => q.answer === UNANSWERED).length;
  const current = shown[cursor];

  return (
    <Boundary resetKey={topicId}>
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        to={`/corecs/${subjectId}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 hover:text-brand-700"
      >
        <Icon name="arrowLeft" className="h-3.5 w-3.5" />
        {subject.name}
      </Link>

      {/* -------------------------------------------------------- header -- */}
      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            {topic.name}
          </h1>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide
                        ${
                          topic.importance === "high"
                            ? "bg-rose-100 text-rose-800"
                            : topic.importance === "med"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-brand-100 text-brand-800"
                        }`}
          >
            <Icon name={importance.icon} className="h-3 w-3" />
            {importance.label}
          </span>
        </div>

        <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{topic.blurb}</p>

        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
          <span className="font-bold tabular-nums text-ink-800">
            {completed} / {questions.length} done
          </span>
          {numericals > 0 && <span className="tabular-nums">{numericals} numericals</span>}
          {unanswered > 0 && (
            <span className="tabular-nums text-amber-700">{unanswered} unanswered in your notes</span>
          )}
          <span className="text-ink-500">Source: {topic.source}</span>
        </p>
      </header>

      {error && (
        <p className="mt-4 rounded-xl border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {error}
        </p>
      )}

      {/* ---------------------------------------------- filters and mode -- */}
      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {FILTERS.map((option) => {
          const count = questions.filter((q) => option.test(q, stateOf(q.id))).length;
          if (count === 0 && option.id !== "all") return null;
          return (
            <button
              key={option.id}
              onClick={() => {
                setFilter(option.id);
                setCursor(0);
              }}
              className={`rounded-full border px-2.5 py-1 text-xs font-bold transition ${
                filter === option.id
                  ? "border-brand-500 bg-brand-200 text-ink-900"
                  : "border-brand-200 bg-surface text-ink-700 hover:border-brand-400"
              }`}
            >
              {option.label}
              <span className="ml-1 font-normal tabular-nums">{count}</span>
            </button>
          );
        })}

        <button
          onClick={() => {
            setInterview((value) => !value);
            setCursor(0);
          }}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
            interview
              ? "border-brand-600 bg-brand-500 text-accent-ink"
              : "border-brand-300 bg-surface text-ink-800 hover:border-brand-500"
          }`}
        >
          <Icon name="chat" className="h-3.5 w-3.5" />
          Interview mode
        </button>
      </div>

      {/* --------------------------------------------------------- cards -- */}
      {shown.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-brand-200 bg-surface px-4 py-10 text-center text-sm text-ink-500">
          Nothing here with that filter.
        </p>
      ) : interview ? (
        <section className="mt-5">
          <p className="mb-3 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-ink-700">
            <span className="font-bold">Answer out loud first.</span>{" "}
            <kbd className="rounded border border-brand-300 bg-surface px-1 font-mono">Space</kbd>{" "}
            reveals ·{" "}
            <kbd className="rounded border border-brand-300 bg-surface px-1 font-mono">←</kbd>{" "}
            <kbd className="rounded border border-brand-300 bg-surface px-1 font-mono">→</kbd> move ·{" "}
            <kbd className="rounded border border-brand-300 bg-surface px-1 font-mono">D</kbd> done ·{" "}
            <kbd className="rounded border border-brand-300 bg-surface px-1 font-mono">R</kbd> revise
          </p>

          {current && (
            <QuestionCard
              key={current.id}
              question={current}
              index={cursor}
              total={shown.length}
              state={stateOf(current.id)}
              onMark={mark}
              open={revealed}
              onToggle={setRevealed}
              interview
            />
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
              {cursor + 1} / {shown.length}
            </span>
            <button
              onClick={() => setCursor((value) => Math.min(value + 1, shown.length - 1))}
              disabled={cursor >= shown.length - 1}
              className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              Next
              <Icon name="arrowRight" className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : (
        <section className="mt-5 space-y-3">
          {shown.map((question, i) => (
            <div key={question.id} id={question.id} className="scroll-mt-20">
              <QuestionCard
                question={question}
                index={i}
                total={shown.length}
                state={stateOf(question.id)}
                onMark={mark}
              />
            </div>
          ))}
        </section>
      )}
    </main>
    </Boundary>
  );
}
