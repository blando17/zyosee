import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import { Link } from "react-router-dom";
import { compilerApi, errorMessage, DRAFT_PREFIX } from "../api";
import CodeEditor from "./CodeEditor";
import ProblemDetail from "./ProblemDetail";
import VerdictBadge from "./Verdict";
import TestRow from "./TestRow";
import DuelTimer from "./DuelTimer";
import DuelStatusBar from "./DuelStatusBar";
import { starterFor } from "../starters";
import { DIFFICULTY_TINT, durationText, languageName, mixText, modeOf } from "../duelText";

/*
 * The match itself.
 *
 * ONE EDITOR, THREE FILES
 *
 * Each problem keeps its own draft, and switching tabs does not disturb the
 * others. That is not a nicety: a duel is three problems against one clock, and
 * an editor that forgot problem one the moment you looked at problem two would
 * make going back to it cost more than the clock could spare.
 *
 * The drafts are written to localStorage under the ordinary draft prefix, so a
 * refresh mid-match — or a laptop that goes to sleep — costs nothing, and
 * logging out clears them along with every other half-finished solution.
 *
 * RUNNING VERSUS SUBMITTING
 *
 * Run is free. It checks the worked examples from the statement, nothing is
 * recorded, and it costs no efficiency points — so there is never a reason to
 * submit blind.
 *
 * Submit is the scored act, and it carries the duel's id. The compiler checks
 * that id against the duel before it judges anything, so a submission after
 * the buzzer, or to a problem outside the match, is refused rather than
 * quietly judged and not counted.
 */

const POLL_INTERVAL_MS = 400;
const POLL_TIMEOUT_MS = 180000;

const draftKey = (duelId, slug) => `${DRAFT_PREFIX}duel:${duelId}:${slug}`;

function readDraft(duelId, slug, language) {
  try {
    const saved = localStorage.getItem(draftKey(duelId, slug));
    if (saved !== null) return saved;
  } catch (err) {
    // Storage blocked or full. A fresh skeleton is a fine fallback.
  }
  return starterFor(null, language);
}

export default function DuelLive({ duel, activity, serverNow, onRefresh, onReport, onEnd }) {
  const problems = duel.problems || [];
  const [index, setIndex] = useState(0);
  const [statements, setStatements] = useState({});
  const [code, setCode] = useState({});
  const [busy, setBusy] = useState(null);
  const [queue, setQueue] = useState(null);
  const [outcome, setOutcome] = useState({});
  const [error, setError] = useState("");
  const [showTests, setShowTests] = useState(true);
  // Two-step, so one stray click cannot end a match for two people.
  const [confirmEnd, setConfirmEnd] = useState(false);

  const current = problems[index];
  const slug = current?.slug;
  // The report goes out on a change of problem, not on every render, so the
  // ref is what lets the effect below see what it last said.
  const reported = useRef(null);

  /*
   * Every statement, fetched once when the problems are revealed.
   *
   * All of them together rather than one per tab: three small requests at the
   * start of a thirty minute match is nothing, and it means switching problems
   * is instant. Somebody deciding which of three to attempt first should not
   * be made to wait to find out what they are.
   */
  useEffect(() => {
    const wanted = problems.map((problem) => problem.slug).filter(Boolean);
    const missing = wanted.filter((one) => !statements[one]);
    if (!missing.length) return;

    let live = true;
    Promise.all(
      missing.map((one) =>
        compilerApi
          .get(`/problems/${one}`)
          .then(({ data }) => [one, data])
          .catch(() => [one, null])
      )
    ).then((pairs) => {
      if (!live) return;
      setStatements((current_) => {
        const next = { ...current_ };
        for (const [one, data] of pairs) if (data) next[one] = data;
        return next;
      });
      setCode((current_) => {
        const next = { ...current_ };
        for (const [one] of pairs) {
          if (next[one] === undefined) next[one] = readDraft(duel.id, one, duel.language);
        }
        return next;
      });
    });

    return () => {
      live = false;
    };
  }, [problems, statements, duel.id, duel.language]);

  /* Tell the room which problem this is, so the other player sees it move. */
  useEffect(() => {
    if (reported.current === index) return;
    reported.current = index;
    onReport(index, "coding");
  }, [index, onReport]);

  const setCurrentCode = useCallback(
    (text) => {
      setCode((current_) => ({ ...current_, [slug]: text }));
      try {
        localStorage.setItem(draftKey(duel.id, slug), text);
      } catch (err) {
        // Out of storage, or a private window. The draft lives in memory for
        // the rest of the match, which is the part that matters.
      }
    },
    [duel.id, slug]
  );

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

  /* The worked examples. Free, unrecorded, and not part of the score. */
  async function run() {
    const statement = statements[slug];
    if (!statement?.samples?.length) return;
    setBusy("run");
    setError("");
    onReport(index, "testing");
    try {
      const { data } = await compilerApi.post("/run-batch", {
        slug,
        language: duel.language,
        code: code[slug] ?? "",
        cases: statement.samples.map((sample) => ({ input: sample.input, expected: sample.expected })),
      });
      const cases = data.cases || [];
      const passed = cases.filter((one) => one.status === "passed").length;
      setOutcome((current_) => ({
        ...current_,
        [slug]: {
          kind: "run",
          verdict:
            data.verdict === "compilation_error"
              ? "compilation_error"
              : passed === cases.length && cases.length
                ? "passed"
                : "wrong_answer",
          passed,
          total: cases.length,
          message: data.message || "",
          cases,
        },
      }));
      setShowTests(true);
    } catch (err) {
      setError(errorMessage(err, "Could not run that."));
    } finally {
      setBusy(null);
      onReport(index, "coding");
    }
  }

  async function submit() {
    setBusy("submit");
    setQueue(null);
    setError("");
    onReport(index, "submitting");
    try {
      const { data } = await compilerApi.post("/submit", {
        slug,
        language: duel.language,
        code: code[slug] ?? "",
        // The duel's own id. Checked against the duel by the compiler before
        // anything is judged — this is a request to count it, not a claim that
        // it counts.
        duelId: duel.id,
      });
      const final = data.jobId ? await pollJob(data.jobId) : data;

      setOutcome((current_) => ({
        ...current_,
        [slug]: {
          kind: "submit",
          verdict: final.verdict,
          passed: final.passed || 0,
          total: final.total || 0,
          message: final.message || "",
          cases: final.tests || [],
        },
      }));
      setShowTests(true);
      // Nudge the server to re-read the log, so the opponent's screen shows
      // the tick now rather than on its next tick. The score itself is worked
      // out there, from the judge's record, whether this is sent or not.
      onRefresh();
    } catch (err) {
      setError(errorMessage(err, "That submission was not accepted."));
    } finally {
      setBusy(null);
      setQueue(null);
      onReport(index, "coding");
    }
  }

  const mode = modeOf(duel.mode);
  const statement = statements[slug];
  const result = outcome[slug];
  const you = duel.players.find((player) => player.isYou);
  const myCard = duel.scores?.cards?.[you.id];
  const opponentName = duel.players.find((player) => !player.isYou)?.username || "your opponent";

  const submitLabel =
    queue === "queued" ? "Queued..." : queue === "running" ? "Judging..." : "Submitting...";

  const tabs = useMemo(
    () =>
      problems.map((problem, position) => {
        const row = myCard?.problems?.[position];
        return {
          ...problem,
          position,
          solved: Boolean(row?.solved),
          tried: !row?.solved && (row?.attempts || 0) > 0,
        };
      }),
    [problems, myCard]
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <main className="mx-auto w-full max-w-[110rem] flex-1 px-3 pb-4 pt-4 sm:px-5">
        {/* ------------------------------ header ---------------------------- */}
        <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-200 bg-surface px-4 py-3 shadow-sm">
          <Icon name="duel" className="h-6 w-6 text-brand-600" />
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-center gap-2 font-display text-lg font-extrabold text-ink-900">
              DUEL #{duel.id.slice(-4).toUpperCase()}
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-800">
                <Icon name={mode.icon} className="h-3 w-3" /> {mode.label}
              </span>
            </h1>
            <p className="text-[11px] text-ink-500">
              {mixText(duel.mix)} · {durationText(duel.durationMs)} · {languageName(duel.language)}
            </p>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <DuelTimer endsAt={duel.endsAt} serverNow={serverNow} />
            {confirmEnd ? (
              /*
               * What it actually costs, said plainly, at the moment it is
               * being decided. Everything solved still counts and nobody is
               * penalised for stopping — but the other player loses the rest
               * of their time, and they did not agree to that.
               */
              <span className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5">
                <span className="text-xs font-semibold text-rose-800">
                  End now? It is scored as it stands, and {opponentName} loses their remaining time.
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmEnd(false)}
                  className="rounded-md px-2 py-1 text-xs font-bold text-ink-800 transition hover:bg-surface"
                >
                  Keep playing
                </button>
                <button
                  type="button"
                  onClick={onEnd}
                  className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-rose-700"
                >
                  End match
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmEnd(true)}
                className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                End match
              </button>
            )}
          </div>
        </header>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

        {/* ---------------------------- problem tabs ------------------------ */}
        <nav aria-label="Problems in this duel" className="mt-3 grid gap-2 sm:grid-cols-3">
          {tabs.map((tab) => {
            const active = tab.position === index;
            return (
              <button
                key={tab.slug || tab.index}
                type="button"
                onClick={() => setIndex(tab.position)}
                aria-current={active ? "true" : undefined}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-brand-400 bg-brand-50 ring-2 ring-brand-300"
                    : "border-brand-200 bg-surface hover:bg-brand-50"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                    tab.solved
                      ? "bg-emerald-100 text-emerald-700"
                      : tab.tried
                        ? "bg-amber-100 text-amber-800"
                        : "bg-brand-100 text-brand-800"
                  }`}
                  aria-hidden="true"
                >
                  {tab.solved ? "✓" : tab.position + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink-900">
                  {tab.title}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${
                    DIFFICULTY_TINT[tab.difficulty]
                  }`}
                >
                  {tab.difficulty}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ------------------------- statement and editor -------------------- */}
        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <section className="max-h-[68vh] overflow-y-auto rounded-2xl border border-brand-200 bg-surface p-5 shadow-sm">
            {statement ? (
              <ProblemDetail problem={statement} showOpenLink={false} />
            ) : (
              <p className="py-10 text-center text-sm text-ink-500">Loading the problem...</p>
            )}
          </section>

          <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-brand-200 bg-surface shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-brand-100 px-4 py-2.5">
              <span className="rounded-lg bg-brand-50 px-2.5 py-1 font-mono text-xs font-bold text-ink-800">
                {languageName(duel.language)}
              </span>
              {/* The language was agreed when the challenge was sent, and the
                  server refuses a submission in any other, so it is stated
                  here rather than offered as a choice that would only fail. */}
              <span className="text-[11px] text-ink-500">fixed for this duel</span>
              <button
                type="button"
                onClick={() => setCurrentCode(starterFor(statement, duel.language))}
                className="ml-auto text-xs font-bold text-brand-700 transition hover:text-brand-900"
              >
                Reset to skeleton
              </button>
            </div>

            <CodeEditor
              value={code[slug] ?? ""}
              onChange={setCurrentCode}
              language={duel.language}
              height="46vh"
              textareaId={`duel-editor-${index}`}
            />

            {/* ------------------------- run / submit ------------------------ */}
            <div className="flex flex-wrap items-center gap-2 border-t border-brand-100 px-4 py-2.5">
              <button
                type="button"
                onClick={run}
                disabled={Boolean(busy) || !statement?.samples?.length}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {busy === "run"
                  ? "Running..."
                  : `▷ Run examples${statement?.samples?.length ? ` (${statement.samples.length})` : ""}`}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={Boolean(busy)}
                className="btn-primary px-5 py-1.5 text-sm disabled:opacity-50"
              >
                {busy === "submit" ? submitLabel : "Submit"}
              </button>
              <span className="ml-auto text-[11px] text-ink-500">
                Examples are free. Each submission costs efficiency points.
              </span>
            </div>

            {result && (
              <div className="border-t border-brand-100 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <VerdictBadge verdict={result.verdict} />
                  <span className="text-sm font-semibold text-ink-900">
                    {result.passed}/{result.total || "?"} tests
                  </span>
                  <span className="text-[11px] text-ink-500">
                    {result.kind === "run" ? "examples only, not scored" : "counted in the duel"}
                  </span>
                  {result.cases?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowTests((open) => !open)}
                      className="ml-auto text-xs font-bold text-brand-700 hover:text-brand-900"
                    >
                      {showTests ? "Hide tests" : "Show tests"}
                    </button>
                  )}
                </div>
                {result.message && (
                  <p className="mt-1.5 whitespace-pre-line text-xs text-ink-800">{result.message}</p>
                )}
                {showTests && result.cases?.length > 0 && (
                  <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                    {result.cases.map((one, position) => (
                      <TestRow
                        key={one.index ?? position}
                        label={one.label || `Test ${one.index ?? position + 1}`}
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
          </section>
        </div>

        <p className="mt-3 text-center text-[11px] text-ink-500">
          Everything you submit here also counts towards your own{" "}
          <Link to="/progress" className="font-bold text-brand-700 hover:text-brand-900">
            progress
          </Link>{" "}
          — a problem solved in a duel is a problem solved.
        </p>
      </main>

      <DuelStatusBar duel={duel} activity={activity} activeIndex={index} onJump={setIndex} />
    </div>
  );
}
