import { useState } from "react";
import { compilerApi, errorMessage } from "../api";
import VerdictBadge from "./Verdict";
import TestRow from "./TestRow";

/*
 * Running and submitting from inside a room.
 *
 * The judging path is exactly the one the problem page uses — the same
 * endpoints, the same queue, the same verdict. Nothing about being in a room
 * changes how code is judged, which is the point: a solution that passes here
 * passes there.
 *
 * WHOSE SUBMISSION IT IS
 *
 * The person who presses the button. They are the one whose token goes to the
 * judge, so the submission is recorded against them and counts towards their
 * progress and their streak.
 *
 * The alternative — crediting everybody in the room — was tempting and wrong.
 * It would write submissions into somebody's history that they did not make,
 * which is inventing a record rather than keeping one. So the result says who
 * pressed it, plainly, and the other person can press it themselves if they
 * want the same solution on their own record.
 */

const POLL_INTERVAL_MS = 400;
const POLL_TIMEOUT_MS = 180000;

export default function RoomJudge({ slug, language, code, samples, onResult, lastResult, me }) {
  const [busy, setBusy] = useState(null);
  const [queue, setQueue] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [open, setOpen] = useState(true);

  async function pollJob(jobId) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      const { data } = await compilerApi.get(`/submit/${jobId}`);
      if (data.status === "queued" || data.status === "running") {
        setQueue(data.status);
        continue;
      }
      return data;
    }
    return { verdict: "server_error", message: "The judge did not answer in time." };
  }

  /* The examples from the statement, judged but not recorded. */
  async function run() {
    if (!samples?.length) return;
    setBusy("run");
    setOutcome(null);
    try {
      const { data } = await compilerApi.post("/run-batch", {
        slug,
        language,
        code,
        cases: samples.map((sample) => ({ input: sample.input, expected: sample.expected })),
      });

      const cases = data.cases || [];
      const passed = cases.filter((one) => one.status === "passed").length;
      const result = {
        kind: "run",
        verdict: data.verdict === "compilation_error" ? "compilation_error" : passed === cases.length && cases.length ? "passed" : "wrong_answer",
        passed,
        total: cases.length,
        message: data.message || "",
        cases,
      };
      setOutcome(result);
      setOpen(true);
      onResult(result);
    } catch (err) {
      const failed = { kind: "run", verdict: "server_error", message: errorMessage(err), passed: 0, total: 0 };
      setOutcome(failed);
      onResult(failed);
    } finally {
      setBusy(null);
    }
  }

  async function submit() {
    setBusy("submit");
    setOutcome(null);
    setQueue(null);
    try {
      const { data } = await compilerApi.post("/submit", { slug, language, code });
      // A jobId means the queue took it and this polls; a verdict in the first
      // reply means Redis was down and the judge ran it inline. Both happen.
      const final = data.jobId ? await pollJob(data.jobId) : data;

      const result = {
        kind: "submit",
        verdict: final.verdict,
        passed: final.passed || 0,
        total: final.total || 0,
        message: final.message || "",
        cases: final.tests || [],
      };
      setOutcome(result);
      setOpen(true);
      onResult(result);
    } catch (err) {
      const failed = { kind: "submit", verdict: "server_error", message: errorMessage(err), passed: 0, total: 0 };
      setOutcome(failed);
      onResult(failed);
    } finally {
      setBusy(null);
      setQueue(null);
    }
  }

  const submitLabel =
    queue === "queued" ? "Queued..." : queue === "running" ? "Judging..." : "Submitting...";

  /*
   * What the panel shows: our own detailed result if we just ran something,
   * otherwise whatever the room last reported. The partner's result has no
   * per-test detail — only what they chose to announce — so it is shown as a
   * one-line summary rather than pretending to more.
   */
  const theirs = !outcome && lastResult && lastResult.by?.id !== me?.id ? lastResult : null;

  return (
    <div className="border-t border-brand-100">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
        <button
          type="button"
          onClick={run}
          disabled={Boolean(busy) || !samples?.length}
          className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {busy === "run" ? "Running..." : `Run examples${samples?.length ? ` (${samples.length})` : ""}`}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={Boolean(busy)}
          className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50"
        >
          {busy === "submit" ? submitLabel : "Submit"}
        </button>

        <span className="ml-auto text-xs text-ink-500">
          Recorded against whoever presses Submit.
        </span>
      </div>

      {(outcome || theirs) && (
        <div className="border-t border-brand-100 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <VerdictBadge verdict={(outcome || theirs).verdict} />
            <span className="text-sm font-semibold text-ink-900">
              {(outcome || theirs).passed}/{(outcome || theirs).total || "?"} tests
            </span>

            {theirs ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: theirs.by.colour }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theirs.by.colour }} aria-hidden="true" />
                {theirs.kind === "run" ? "run" : "submitted"} by {theirs.by.username}
              </span>
            ) : (
              <span className="text-xs text-ink-500">
                {outcome.kind === "run" ? "examples only, not recorded" : "submitted by you"}
              </span>
            )}

            {outcome?.cases?.length > 0 && (
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="ml-auto text-xs font-bold text-brand-700 hover:text-brand-900"
              >
                {open ? "Hide tests" : "Show tests"}
              </button>
            )}
          </div>

          {(outcome || theirs).message && (
            <p className="mt-1.5 whitespace-pre-line text-xs text-ink-800">{(outcome || theirs).message}</p>
          )}

          {open && outcome?.cases?.length > 0 && (
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {outcome.cases.map((one, index) => (
                <TestRow
                  key={one.index ?? index}
                  label={one.label || `Test ${one.index ?? index + 1}`}
                  status={one.status}
                  runMs={one.runMs}
                  detail={one.message}
                  hidden={one.hidden}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
