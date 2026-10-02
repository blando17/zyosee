import { useState } from "react";
import Icon from "./Icon";
import { Link } from "react-router-dom";

/*
 * A problem, in full, for reading beside something else.
 *
 * The same facts the problem page shows — topics, formats, constraints, every
 * example with its note, and the hint — so nobody in a room has to open a
 * second tab to check the input format. The hint stays folded away: it is a
 * nudge somebody should choose to take, not something to trip over while
 * reading the statement.
 */

const DIFFICULTY_TINT = {
  Easy: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-900 ring-amber-200",
  Hard: "bg-rose-50 text-rose-800 ring-rose-200",
};

/*
 * `showOpenLink` exists for the Duel Arena.
 *
 * In a Pair Lab room, "open this on its own" is exactly right: running and
 * submitting live on the problem page, and the room is a place to work on it
 * together. In a duel it would be a trap. A submission made on the problem
 * page carries no duel id, so the judge accepts it, records it against you —
 * and it scores nothing in the match you are currently losing. The link is
 * therefore not shown there rather than shown with a warning, because the
 * warning would have to be read to help.
 */
export default function ProblemDetail({ problem, showOpenLink = true }) {
  const [hintOpen, setHintOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-extrabold text-ink-900">
            {problem.number ? `#${problem.number} ` : ""}
            {problem.title}
          </h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${DIFFICULTY_TINT[problem.difficulty] || "bg-brand-50 text-brand-800 ring-brand-200"}`}>
            {problem.difficulty}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink-500">
          {problem.testCount} test cases · {problem.timeLimitMs} ms limit for C and C++
        </p>
        {showOpenLink && (
          <Link
            to={`/problems/${problem.slug}`}
            className="mt-1 inline-block text-xs font-bold text-brand-700 hover:text-brand-900"
          >
            Open on its own to run and submit →
          </Link>
        )}
      </div>

      {problem.tags?.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {problem.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-medium capitalize text-brand-800">
              {tag}
            </li>
          ))}
        </ul>
      )}

      <p className="whitespace-pre-line text-sm leading-relaxed text-ink-900">{problem.statement}</p>

      {/*
        Guarded, because a problem can genuinely have neither.

        The Add Problem form insists on both, so for a long time every problem
        had them and a bare heading was impossible. The six interactive
        problems in the imported set describe their protocol in an Interaction
        section inside the statement and have no Input or Output section at
        all — printing the headings over nothing tells the reader the page is
        broken rather than that the problem is shaped differently.
      */}
      {problem.inputFormat && (
        <div>
          <h3 className="mb-1 text-sm font-bold text-brand-800">Input</h3>
          <p className="whitespace-pre-line text-sm text-ink-900">{problem.inputFormat}</p>
        </div>
      )}
      {problem.outputFormat && (
        <div>
          <h3 className="mb-1 text-sm font-bold text-brand-800">Output</h3>
          <p className="whitespace-pre-line text-sm text-ink-900">{problem.outputFormat}</p>
        </div>
      )}

      {problem.constraints?.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-bold text-brand-800">Constraints</h3>
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-ink-900">
            {problem.constraints.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
      )}

      {(problem.samples || []).map((sample, index) => (
        <div key={sample.index}>
          <h3 className="mb-1 text-sm font-bold text-brand-800">Example {index + 1}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Input</p>
              <pre className="overflow-x-auto rounded-lg bg-brand-50 p-2 text-xs text-ink-900">{sample.input}</pre>
            </div>
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Output</p>
              <pre className="overflow-x-auto rounded-lg bg-brand-50 p-2 text-xs text-ink-900">{sample.expected}</pre>
            </div>
          </div>
          {sample.note && <p className="mt-1 text-xs text-ink-500">{sample.note}</p>}
        </div>
      ))}

      {problem.hint && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2">
          <button
            type="button"
            onClick={() => setHintOpen((open) => !open)}
            aria-expanded={hintOpen}
            className="flex w-full items-center gap-2 text-left text-sm font-bold text-brand-800"
          >
            <Icon name="bulb" className="h-4 w-4" />
            Hint
            <span className="ml-auto text-xs font-semibold">{hintOpen ? "Hide" : "Show"}</span>
          </button>
          {hintOpen && <p className="mt-2 whitespace-pre-line text-sm text-ink-900">{problem.hint}</p>}
        </div>
      )}
    </div>
  );
}
