import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import Reveal from "../components/Reveal";
import { SUBJECTS } from "../corecs";

/*
 * The Core CS landing page: pick a subject.
 *
 * Four of the five have no content, and they are shown anyway. Hiding them
 * would make the section look finished at a fifth of its size — somebody
 * arriving needs to know whether this is worth coming back to, and five cards
 * with four honestly marked "not yet" answers that in one glance.
 */

function SubjectCard({ subject }) {
  const ready = Boolean(subject.topics);
  const questionCount = ready
    ? subject.topics.reduce((sum, topic) => sum + topic.questions.length, 0)
    : 0;

  const body = (
    <>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                      ${ready ? "bg-brand-200 text-brand-800" : "bg-brand-100 text-ink-500"}`}
        >
          <Icon name={subject.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-extrabold leading-tight text-ink-900">
              {subject.name}
            </h2>
            {!ready && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                Coming soon
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">{subject.blurb}</p>
        </div>
      </div>

      {ready ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-ink-500">
          <span className="tabular-nums">{subject.topics.length} topics</span>
          <span className="tabular-nums">{questionCount} questions</span>
          <span className="inline-flex items-center gap-1 text-brand-700">
            Start <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </span>
        </p>
      ) : (
        <p className="mt-3 text-xs text-ink-500">
          Notes for this subject have not been processed yet.
        </p>
      )}
    </>
  );

  const shell =
    "block rounded-2xl border bg-surface/90 p-4 shadow-sm backdrop-blur-sm transition";

  // A card that goes nowhere should not look like a link or respond to a
  // hover. An unavailable option that invites a click is worse than one that
  // plainly says it is not ready.
  return ready ? (
    <Link to={`/corecs/${subject.id}`} className={`${shell} border-brand-200/80 hover:-translate-y-0.5 hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={`${shell} border-brand-200/50 opacity-70`} aria-disabled="true">
      {body}
    </div>
  );
}

export default function CoreCS() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Reveal>
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
            Interview preparation
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            Core CS
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
            The theory half of a technical interview, organised the way you would revise it rather
            than the way a textbook is laid out. Reveal an answer, mark it done, and anything you
            were shaky on goes into a revision queue that follows your account.
          </p>
        </header>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2">
        {SUBJECTS.map((subject, i) => (
          <Reveal key={subject.id} delay={i * 60}>
            <SubjectCard subject={subject} />
          </Reveal>
        ))}
      </div>
    </main>
  );
}
