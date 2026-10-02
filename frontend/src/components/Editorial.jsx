import { useState } from "react";

/*
 * The editorial for a problem.
 *
 * Collapsed, and small, and shown only after a submission has failed. All three
 * are the same decision: an editorial is the full answer, so it should never be
 * the thing someone reads before they have tried.
 *
 * It sits below the coding assistant because it gives away more. The assistant
 * asks questions and points at a line; this hands over the whole approach and
 * the implementation. Someone who has read the hints and still wants it can
 * open it, which is the same bargain the assistant's own full-solution button
 * already makes.
 *
 * Sections render only when the problem has them, so a partial editorial looks
 * deliberate rather than broken.
 */

const SECTIONS = [
  { key: "understanding", title: "Understanding the problem" },
  { key: "approach", title: "Approach" },
  { key: "steps", title: "Step by step" },
  { key: "algorithm", title: "The algorithm" },
  { key: "whyItWorks", title: "Why it works" },
  { key: "complexity", title: "Complexity" },
  { key: "edgeCases", title: "Edge cases" },
];

function Body({ value }) {
  // A section is either prose or a list of points. Accepting both keeps the
  // writing natural instead of forcing every section into one shape.
  if (Array.isArray(value)) {
    return (
      <ol className="ml-4 list-outside list-decimal space-y-1.5 text-sm text-ink-900">
        {value.map((item, i) => (
          <li key={i} className="pl-1">{item}</li>
        ))}
      </ol>
    );
  }
  if (value && typeof value === "object") {
    return (
      <div className="space-y-1 text-sm text-ink-900">
        {value.time ? <p><span className="font-semibold text-brand-800">Time:</span> <span className="font-mono">{value.time}</span></p> : null}
        {value.space ? <p><span className="font-semibold text-brand-800">Space:</span> <span className="font-mono">{value.space}</span></p> : null}
        {value.explanation ? <p className="whitespace-pre-line">{value.explanation}</p> : null}
      </div>
    );
  }
  return <p className="whitespace-pre-line text-sm text-ink-900">{value}</p>;
}

export default function Editorial({ editorial }) {
  const [open, setOpen] = useState(false);
  if (!editorial) return null;

  const present = SECTIONS.filter(({ key }) => {
    const v = editorial[key];
    return v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0);
  });
  if (!present.length && !editorial.implementation) return null;

  return (
    <section className="rounded-xl border border-brand-200 bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="text-xs font-bold text-brand-800">Editorial</span>
        <span className="text-xs font-medium text-ink-600">
          {open ? "hide" : "full solution"}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-brand-200 px-4 py-3">
          {present.map(({ key, title }) => (
            <div key={key}>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">{title}</h3>
              <Body value={editorial[key]} />
            </div>
          ))}

          {editorial.implementation ? (
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-700">Reference implementation</h3>
              <pre className="overflow-x-auto rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 font-mono text-xs leading-relaxed text-ink-900">
                {editorial.implementation}
              </pre>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
