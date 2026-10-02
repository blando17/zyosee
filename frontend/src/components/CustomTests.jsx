import { useState } from "react";
import TestRow from "./TestRow";
import { compilerApi, errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";

/*
 * The solver's own test cases.
 *
 * Deliberately separate from Submit, and it never produces a verdict. These are
 * for debugging against input you made up, and passing them means nothing
 * official. Only the problem's own tests decide Accepted.
 *
 * Two kinds of case, because they answer different questions.
 *
 * The problem's examples are seeded in with their known answers, so those run
 * as real tests and report passed or failed. A case you add yourself has no
 * known answer, so it takes input only: it compiles, runs, and shows you what
 * your program printed. Asking you to type an expected output for input you
 * just invented would be asking you to know the answer before running it.
 *
 * The whole batch goes to the server in one request, which compiles once and
 * runs every case against that binary. Sending them one at a time would pay the
 * compiler's several hundred milliseconds for each.
 */

const MAX_CASES = 10;

export default function CustomTests({ slug, language, code, samples = [], onResult }) {
  // Running code needs a token, same as submitting. Checking here keeps the
  // button honest rather than letting the click fail at the server.
  const { isLoggedIn } = useAuth();
  // Seeded from the problem's examples, so there is something runnable in here
  // the moment the page loads rather than two empty boxes.
  const [cases, setCases] = useState(() =>
    samples.length
      ? samples.map((sample) => ({
          input: sample.input,
          expected: sample.expected,
          fromSample: true,
        }))
      : [{ input: "", expected: "", fromSample: false }]
  );
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  /*
   * Every one of these updates from the previous state rather than from the
   * `cases` variable captured when the component rendered. Two clicks on Add in
   * the same tick both read that captured array, so the second overwrote the
   * first and only one case appeared.
   */
  function update(index, field, value) {
    setCases((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function add() {
    setCases((prev) =>
      prev.length >= MAX_CASES ? prev : [...prev, { input: "", expected: "", fromSample: false }]
    );
  }

  function remove(index) {
    // Never leave the list empty; there would be nothing to type into.
    setCases((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [{ input: "", expected: "", fromSample: false }];
    });
    setResult(null);
  }

  async function runAll() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      // fromSample is a display detail; the server only needs input and
      // expected, and an added case sends no expected at all.
      const payload = cases.map(({ input, expected, fromSample }) => ({
        input,
        expected: fromSample ? expected : "",
      }));
      const { data } = await compilerApi.post("/run-batch", { slug, language, code, cases: payload });
      setResult(data);
      // The page decides what to do with a failure; this only reports it.
      if (onResult) onResult(data);
    } catch (err) {
      setError(errorMessage(err, "Could not run the custom tests."));
    } finally {
      setBusy(false);
    }
  }

  const usable = cases.some((item) => item.input.trim() !== "") && isLoggedIn;

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-200 bg-brand-100 px-4 py-2.5">
        <h2 className="text-sm font-bold text-brand-800">Custom test cases</h2>
        <span className="text-xs text-brand-800">
          {cases.length} of {MAX_CASES}
        </span>
      </div>

      <div className="space-y-3 px-4 py-3">
        {cases.map((item, index) => (
          <div key={index} className="rounded-lg border border-brand-200">
            <div className="flex items-center justify-between border-b border-brand-200 bg-brand-50 px-3 py-1.5">
              <span className="text-xs font-bold text-brand-800">
                {item.fromSample ? `Example ${index + 1}` : `Test case ${index + 1}`}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs font-semibold text-red-700 hover:underline"
              >
                Remove
              </button>
            </div>

            {/* An example ships with its answer, so it gets a second box and a
                real pass or fail. One you added does not, so it takes input
                only and reports what the program printed. */}
            <div className={item.fromSample ? "grid gap-0 sm:grid-cols-2" : ""}>
              <div
                className={
                  item.fromSample ? "border-b border-brand-200 sm:border-b-0 sm:border-r" : ""
                }
              >
                <p className="px-3 pt-2 text-xs font-semibold text-ink-800">Input</p>
                <textarea
                  value={item.input}
                  onChange={(event) => update(index, "input", event.target.value)}
                  placeholder="What the program reads"
                  className="h-20 min-h-[56px] w-full resize-y border-0 bg-transparent px-3 py-1.5 font-mono text-sm focus:outline-none"
                />
              </div>

              {item.fromSample && (
                <div>
                  <p className="px-3 pt-2 text-xs font-semibold text-ink-800">Expected output</p>
                  <textarea
                    value={item.expected}
                    onChange={(event) => update(index, "expected", event.target.value)}
                    placeholder="The answer this input should produce"
                    className="h-20 min-h-[56px] w-full resize-y border-0 bg-transparent px-3 py-1.5 font-mono text-sm focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={add}
            disabled={cases.length >= MAX_CASES}
            className="btn-ghost text-sm"
          >
            Add test case
          </button>
          <button
            type="button"
            onClick={runAll}
            disabled={busy || !usable}
            className="btn-primary text-sm"
            title={
              !isLoggedIn
                ? "Log in to run code"
                : usable
                  ? "Run every case above"
                  : "Type some input first"
            }
          >
            {busy ? "Running..." : "Run all custom tests"}
          </button>
        </div>

        {!isLoggedIn && (
          <p className="rounded-lg bg-brand-100 px-4 py-2.5 text-sm text-brand-800">
            Log in to run these.
          </p>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
        )}

        {result?.verdict === "compilation_error" && (
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-800">
            {result.message}
          </pre>
        )}

        {result?.cases?.length > 0 && (
          <div className="space-y-2 border-t border-brand-200 pt-3">
            <p className="text-xs font-bold text-brand-800">
              Results · compiled in {result.compileMs} ms · {result.timeLimitMs} ms limit per case
            </p>
            {result.cases.map((item) => (
              <TestRow
                key={item.index}
                label={cases[item.index - 1]?.fromSample ? `Example ${item.index}` : `Case ${item.index}`}
                status={item.status}
                runMs={item.runMs}
                detail={item}
              />
            ))}
            <p className="text-xs text-ink-800">
              These are yours, not the problem&apos;s. Passing them all does not make a
              submission Accepted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
