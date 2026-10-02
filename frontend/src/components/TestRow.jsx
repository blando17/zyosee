import { useState } from "react";
import { verdictOf, StatusMark, outcomeOf } from "./Verdict";

/*
 * One line of a result list: which test, whether it passed, how long it took.
 *
 * A failed row opens to show what went in, what was expected, and what came
 * out, which is the whole of debugging a wrong answer. A passing row has
 * nothing to open, and neither does a hidden test: its data stays on the
 * server whatever the outcome, because that secrecy is the only thing
 * separating a judge from a diff tool.
 */
export default function TestRow({ label, status, runMs, detail, hidden = false }) {
  const [open, setOpen] = useState(false);
  const style = verdictOf(status);
  const outcome = outcomeOf(status);

  const panels = [
    ["Input", detail?.input],
    ["Expected output", detail?.expected],
    ["Your output", detail?.actual],
  ].filter(([, body]) => body);

  /*
   * Openable whenever there is something to show, not only on failure. A case
   * with no expected output has no pass or fail to report, so seeing what it
   * printed is the only way to judge it, and a passing custom case is worth
   * being able to check too.
   *
   * A passing hidden test stays shut because the server sends no data for it.
   */
  const canOpen = panels.length > 0 || (outcome === "fail" && (hidden || detail?.message));

  /*
   * An added case has no expected answer, so what it printed is the result and
   * belongs on the row itself. For most of these problems that is a handful of
   * characters, and making someone click to read "1 2" would be silly. Longer
   * or multi-line output stays behind the details toggle.
   */
  const printed = status === "ran" ? (detail?.actual ?? "").trim() : "";
  const inlineOutput =
    printed && printed.length <= 40 && !printed.includes("\n") ? printed : null;
  const outputTooBig = status === "ran" && printed && !inlineOutput;

  const rowTint =
    outcome === "pass"
      ? "border-green-200 bg-green-50/60"
      : outcome === "fail"
        ? "border-red-200 bg-red-50/60"
        : "border-brand-200 bg-brand-50";

  return (
    <div className={`rounded-lg border ${rowTint}`}>
      <button
        type="button"
        onClick={() => canOpen && setOpen(!open)}
        disabled={!canOpen}
        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${
          canOpen ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <StatusMark status={status} />
        <span className="w-24 shrink-0 whitespace-nowrap font-semibold text-ink-900">{label}</span>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${style.className}`}>
          {style.label}
        </span>
        {inlineOutput && (
          <span className="truncate rounded bg-surface px-2 py-0.5 font-mono text-xs text-ink-900">
            {inlineOutput}
          </span>
        )}
        {outputTooBig && <span className="text-xs text-ink-800">see details</span>}
        {status === "ran" && !printed && (
          <span className="text-xs italic text-ink-800">printed nothing</span>
        )}
        <span className="ml-auto font-mono text-xs text-ink-800">
          {runMs === null || runMs === undefined ? "" : `${runMs} ms`}
        </span>
        {canOpen && (
          <span className="text-xs font-semibold text-brand-700">{open ? "hide" : "details"}</span>
        )}
      </button>

      {open && (
        <div
          className={`border-t px-3 py-3 ${
            outcome === "fail" ? "border-red-200" : "border-brand-200"
          }`}
        >
          {detail?.message && (
            <pre className="mb-3 max-h-32 overflow-auto whitespace-pre-wrap rounded border border-red-200 bg-surface px-2 py-1 font-mono text-xs text-red-800">
              {detail.message}
            </pre>
          )}

          {hidden ? (
            <p className="text-xs text-ink-800">
              This is a hidden test. Its input and expected output stay on the server, so that
              solving the problem cannot be replaced by reading the answers.
            </p>
          ) : (
            /* Written out rather than built from panels.length: Tailwind scans
               the source for whole class names, so an interpolated one is never
               generated and the grid silently stays one column. */
            <div
              className={`grid gap-2 ${
                panels.length === 3 ? "sm:grid-cols-3" : panels.length === 2 ? "sm:grid-cols-2" : ""
              }`}
            >
              {panels.map(([title, body]) => (
                <div key={title}>
                  <p className="mb-1 text-xs font-semibold text-ink-800">{title}</p>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded border border-brand-200 bg-surface px-2 py-1 font-mono text-xs">
                    {body}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
