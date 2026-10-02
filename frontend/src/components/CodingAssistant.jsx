import { useEffect, useRef, useState } from "react";
import { compilerApi } from "../api";

/*
 * The coding assistant: a mentor for a failed submission.
 *
 * It appears only when something went wrong, and never on an Accepted run.
 * There is nothing to help with when every test passed, and a panel that pops
 * up regardless would be noise.
 *
 * It will not hand over a working solution unless you press the button that
 * says so. That restraint is the point: an assistant that pastes the answer
 * after every failed submit turns a judge into a slow way of reading
 * solutions. The server enforces it too, so a chatty model cannot slip a whole
 * program through a hint.
 */

const HINT_LEVELS = 4;

// Only these ever reach Gemini, and every one of them passes the server's rate
// limiter first.
const ACTION_LABELS = {
  explain: "Explain the error",
  hint: "Show a hint",
  ask: "Ask",
  full: "Show the full solution",
};

function errorFor(err) {
  const payload = err?.response?.data;
  const status = err?.response?.status;
  return {
    status: status || 0,
    code: payload?.error || "unknown",
    message: payload?.message || err?.message || "Something went wrong.",
    retryAfterSeconds: payload?.retryAfterSeconds || null,
  };
}

function Avatar({ className = "h-11 w-11" }) {
  return (
    <img
      src="/coding-assistant.png"
      alt=""
      className={`${className} shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-brand-200`}
    />
  );
}

export default function CodingAssistant({ failure, problemTitle }) {
  const [open, setOpen] = useState(true);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [question, setQuestion] = useState("");
  const [confirmingFull, setConfirmingFull] = useState(false);

  // A new failure is a new conversation. Without this, a hint about the last
  // submission would sit there looking like it was about this one.
  const failureKey = failure ? `${failure.source}:${failure.index}:${failure.verdict}` : null;
  const lastKey = useRef(failureKey);

  useEffect(() => {
    if (lastKey.current === failureKey) return;
    lastKey.current = failureKey;
    setAnswer(null);
    setError(null);
    setHintLevel(0);
    setQuestion("");
    setConfirmingFull(false);
    setOpen(true);
  }, [failureKey]);

  if (!failure) return null;

  async function run(action, options = {}) {
    // One request at a time. Three impatient clicks should not become three
    // paid calls; the server refuses them anyway, but there is no reason to
    // make it say so.
    if (busy) return;

    setBusy(action);
    setError(null);
    try {
      const { data } = await compilerApi.post("/assist", {
        slug: failure.slug,
        language: failure.language,
        code: failure.code,
        action,
        hintLevel: options.hintLevel,
        question: options.question,
        verdict: failure.verdict,
        passed: failure.passed,
        total: failure.total,
        timeLimitMs: failure.timeLimitMs,
        compilerOutput: failure.compilerOutput,
        runtimeOutput: failure.runtimeOutput,
        failedTest: failure.test,
      });
      setAnswer(data);
      if (action === "hint") setHintLevel(options.hintLevel);
      if (action === "full") setConfirmingFull(false);
    } catch (err) {
      setError(errorFor(err));
    } finally {
      setBusy(null);
    }
  }

  const nextHint = Math.min(hintLevel + 1, HINT_LEVELS);
  const hintsLeft = hintLevel < HINT_LEVELS;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-brand-300 bg-brand-100 px-4 py-3 text-left transition hover:bg-brand-200"
      >
        <Avatar className="h-9 w-9" />
        <span className="text-sm font-semibold text-brand-800">
          Open the coding assistant
        </span>
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-300 bg-surface shadow-sm">
      <div className="flex items-center gap-3 border-b border-brand-200 bg-brand-100 px-4 py-3">
        <Avatar />
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-900">Coding assistant</p>
          <p className="truncate text-xs text-brand-800">{failure.headline}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close the assistant"
          className="ml-auto rounded-lg px-2 py-1 text-lg leading-none text-brand-800 hover:bg-brand-200"
        >
          &times;
        </button>
      </div>

      <div className="space-y-4 px-4 py-4">
        {!answer && !error && (
          <p className="text-sm text-ink-800">
            I can look at what failed and help you work out why.
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">
              {error.status === 429
                ? "AI assistance is rate limited"
                : error.code === "not_configured"
                  ? "The assistant has no API key"
                  : "The assistant is unavailable"}
            </p>
            <p className="mt-1 text-sm text-ink-800">{error.message}</p>
            <p className="mt-2 text-xs text-ink-800">
              The judge is unaffected. The failing test and its details are still above.
            </p>
          </div>
        )}

        {answer && (
          <div className="space-y-3">
            {answer.summary && (
              <p className="text-sm font-semibold text-ink-900">{answer.summary}</p>
            )}

            {answer.line && (
              <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
                <p className="text-xs font-semibold text-brand-800">
                  Possible issue: line {answer.line}
                  {answer.lineEnd && answer.lineEnd !== answer.line ? ` to ${answer.lineEnd}` : ""}
                </p>
                {answer.lineText && (
                  <pre className="mt-1 overflow-x-auto font-mono text-xs text-ink-900">
                    {answer.lineText}
                  </pre>
                )}
              </div>
            )}

            {answer.explanation && (
              <p className="whitespace-pre-line text-sm text-ink-900">{answer.explanation}</p>
            )}

            {answer.hint && (
              <div className="rounded-lg border-l-4 border-brand-400 bg-brand-50 px-3 py-2">
                <p className="whitespace-pre-line text-sm text-ink-900">{answer.hint}</p>
              </div>
            )}

            {answer.nextStep && (
              <p className="text-sm text-ink-800">
                <span className="font-semibold text-brand-800">Try this: </span>
                {answer.nextStep}
              </p>
            )}

            {answer.snippet && (
              <pre className="overflow-x-auto rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 font-mono text-xs text-ink-900">
                {answer.snippet}
              </pre>
            )}

            {answer.fullSolution && (
              <div>
                <p className="mb-1 text-xs font-semibold text-brand-800">Complete solution</p>
                <pre className="max-h-72 overflow-auto rounded-lg border border-brand-300 bg-code px-3 py-2 font-mono text-xs text-brand-100">
                  {answer.fullSolution}
                </pre>
                <p className="mt-1 text-xs text-ink-800">
                  Copy it in yourself if you want it. The assistant never edits your editor.
                </p>
              </div>
            )}

            {answer.cached && (
              <p className="text-xs text-ink-800">
                Shown from the earlier answer, so this cost no AI request.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t border-brand-200 pt-3">
          <button
            type="button"
            onClick={() => run("explain")}
            disabled={Boolean(busy)}
            className="btn-ghost text-sm"
          >
            {busy === "explain" ? "Generating..." : ACTION_LABELS.explain}
          </button>

          {hintsLeft && (
            <button
              type="button"
              onClick={() => run("hint", { hintLevel: nextHint })}
              disabled={Boolean(busy)}
              className="btn-primary text-sm"
            >
              {busy === "hint"
                ? "Generating..."
                : hintLevel === 0
                  ? "Show a hint"
                  : `Next hint (${nextHint} of ${HINT_LEVELS})`}
            </button>
          )}
        </div>

        {/* Free-form question */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (question.trim()) run("ask", { question: question.trim() });
          }}
          className="flex gap-2"
        >
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about your code, for example: why does test 1 print nothing?"
            maxLength={400}
            className="field flex-1 text-sm"
          />
          <button
            type="submit"
            disabled={Boolean(busy) || !question.trim()}
            className="btn-ghost text-sm"
          >
            {busy === "ask" ? "..." : ACTION_LABELS.ask}
          </button>
        </form>

        {/* The full solution, behind a deliberate second click. */}
        <div className="border-t border-brand-200 pt-3">
          {confirmingFull ? (
            <div className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-2">
              <p className="text-sm text-ink-900">
                This gives you the whole corrected program. You will learn more from the hints.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => run("full")}
                  disabled={Boolean(busy)}
                  className="btn-primary text-sm"
                >
                  {busy === "full" ? "Generating..." : "Yes, show it"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingFull(false)}
                  className="btn-ghost text-sm"
                >
                  Keep trying
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingFull(true)}
              disabled={Boolean(busy)}
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              I give up, show the full solution
            </button>
          )}
        </div>

        {answer?.usage && (
          <p className="text-xs text-ink-800">
            AI requests used: {answer.usage.hour.used} of {answer.usage.hour.limit} this hour.
          </p>
        )}
      </div>
    </div>
  );
}
