import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CodeEditor, { LANGUAGE_OPTIONS } from "../components/CodeEditor";
import VerdictBadge, { StatusMark } from "../components/Verdict";
import TestRow from "../components/TestRow";
import CustomTests from "../components/CustomTests";
import AiAnalysis from "../components/AiAnalysis";
import CodingAssistant from "../components/CodingAssistant";
import SplitLayout from "../components/SplitLayout";
import ThinkCard from "../components/ThinkCard";
import PairLabButton from "../components/PairLabButton";
import ResizablePanel from "../components/ResizablePanel";
import { useAuth } from "../context/AuthContext";
import { compilerApi, errorMessage, DRAFT_PREFIX } from "../api";
import { starterFor, isUntouchedStarter } from "../starters";
import Editorial from "../components/Editorial";

/*
 * One problem: the statement, an editor, and the two buttons from the sketch.
 *
 *   Run     is the custom test cases panel. It compiles once and runs your own
 *           cases, comparing against the expected output you typed when you
 *           typed one. No judging, no verdict. This is for trying things.
 *   Submit  sends the code to the judge, which runs it against the problem's
 *           own test cases and answers with a verdict.
 *
 * The difference matters: Run tells you what your program printed, Submit tells
 * you whether it was right.
 *
 * There used to be a single input box and an output panel beside them. The
 * custom cases do the same job and more, since a case with no expected output
 * simply shows what was printed, so the pair was two ways to do one thing.
 */

/*
 * Where a work-in-progress solution is kept between page loads.
 *
 * It matters most for the session banner: the only way back is through the
 * login page, and without this the round trip would throw away whatever you had
 * typed. It also survives a refresh or a stray click on a link, which is worth
 * having on its own.
 *
 * The key includes who wrote it. Without that, one browser has one draft per
 * problem, so signing out and signing in as somebody else showed them the
 * previous person's half-finished solution sitting in the editor. On a shared
 * machine that is someone else's work handed to a stranger; in a room full of
 * students sharing a computer it is a way to copy an answer without trying.
 *
 * Signed-out visitors get their own bucket rather than sharing one, since
 * browsing problems needs no account and whatever they type is still theirs.
 */
// A judge run is a second or two; this is a dozen requests, not a flood.
const JOB_POLL_INTERVAL_MS = 350;
// Well past the server's own 30s ceiling on one submission.
const JOB_POLL_TIMEOUT_MS = 90000;

function draftKey(userId, slug, language) {
  return `${DRAFT_PREFIX}${userId || "anon"}:${slug}:${language}`;
}

function readDraft(userId, slug, language) {
  try {
    return localStorage.getItem(draftKey(userId, slug, language));
  } catch (err) {
    // Private browsing and blocked site data both throw here. A missing draft
    // is not worth breaking the page over.
    return null;
  }
}

function writeDraft(userId, slug, language, code) {
  try {
    localStorage.setItem(draftKey(userId, slug, language), code);
  } catch (err) {
    // Out of quota, or storage disabled. Nothing to do but carry on.
  }
}

/*
 * Turns a judge result into the one shape the assistant understands, or null
 * when there is nothing to help with.
 *
 * Accepted returns null, which is what keeps the panel hidden on a clean run.
 * The check is `passed === total`, the same rule the server uses, so the panel
 * cannot appear on a submission the judge called Accepted.
 */
function failureFromJudge(result, { slug, language, code }) {
  if (!result || result.verdict === "accepted") return null;
  if (result.passed === result.total && result.total > 0) return null;

  const firstBad = (result.tests || []).find(
    (test) => test.status !== "passed" && test.status !== "skipped"
  );

  const headline =
    result.verdict === "compilation_error"
      ? "Your code did not compile"
      : `${result.passed ?? 0} of ${result.total ?? 0} tests passed`;

  return {
    source: "judge",
    index: firstBad?.index ?? 0,
    slug,
    language,
    code,
    verdict: result.verdict,
    passed: result.passed,
    total: result.total,
    timeLimitMs: result.timeLimitMs,
    headline,
    compilerOutput: result.verdict === "compilation_error" ? result.message : null,
    runtimeOutput: firstBad?.message || null,
    test: firstBad
      ? {
          index: firstBad.index,
          label: `Test ${firstBad.index}`,
          // A hidden test's data never left the server, so the assistant is
          // told that rather than being given blanks it might invent around.
          hidden: !firstBad.sample,
          input: firstBad.input,
          expected: firstBad.expected,
          actual: firstBad.actual,
          message: firstBad.message,
        }
      : null,
  };
}

// The same, for a case the solver wrote themselves.
function failureFromCustomCase(item, { slug, language, code, timeLimitMs, compileError }) {
  if (compileError) {
    return {
      source: "custom",
      index: 0,
      slug,
      language,
      code,
      verdict: "compilation_error",
      timeLimitMs,
      headline: "Your code did not compile",
      compilerOutput: compileError,
      test: null,
    };
  }
  if (!item) return null;

  return {
    source: "custom",
    index: item.index,
    slug,
    language,
    code,
    verdict: item.status,
    timeLimitMs,
    headline: `Your test case ${item.index} failed`,
    runtimeOutput: item.message || null,
    test: {
      index: item.index,
      label: `Case ${item.index}`,
      hidden: false,
      input: item.input,
      expected: item.expected,
      actual: item.actual,
      message: item.message,
    },
  };
}

export default function Problem() {
  const { slug } = useParams();
  const { isLoggedIn, user } = useAuth();
  // Drafts belong to whoever wrote them, so the key carries the account id.
  const userId = user?._id || null;

  const [problem, setProblem] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");

  const [judgeResult, setJudgeResult] = useState(null);
  const [busy, setBusy] = useState(null);
  // null unless a submission is sitting in the queue or being judged by a
  // worker, so the page can say which rather than showing one blank spinner.
  const [queueState, setQueueState] = useState(null);
  // Whether the per-test list is open. Closed when everything passed, since
  // there is nothing to inspect, and open when something failed, because the
  // first thing anyone wants then is which test it was.
  const [showTests, setShowTests] = useState(false);
  // What the assistant is currently helping with, or null when there is
  // nothing wrong. Set by a failed submission or a failed custom run, and
  // cleared the moment a submission is Accepted.
  const [failure, setFailure] = useState(null);
  const [aiAvailable, setAiAvailable] = useState(false);

  useEffect(() => {
    compilerApi
      .get(`/problems/${slug}`)
      .then(({ data }) => {
        setProblem(data);
        setCode(readDraft(userId, slug, language) ?? starterFor(data, language));
      })
      .catch((err) => setLoadError(errorMessage(err, "Could not load this problem.")));
    // Deliberately keyed on the slug alone: switching language later must not
    // wipe out code the solver has written.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Whether the analyser has an API key behind it. Asked once, so the panel can
  // say what is missing instead of offering a button that can only fail.
  useEffect(() => {
    compilerApi
      .get("/")
      .then(({ data }) => setAiAvailable(Boolean(data?.ai?.available)))
      .catch(() => setAiAvailable(false));
  }, []);

  // Swapping language replaces the editor only while it still holds an
  // untouched starter, so nobody loses work to a dropdown.
  function handleLanguageChange(event) {
    const next = event.target.value;
    setLanguage(next);

    // A draft for the new language wins. Otherwise the starter, but only when
    // the editor still holds an untouched starter, so nobody loses work to a
    // dropdown.
    const draft = readDraft(userId, slug, next);
    if (draft !== null) {
      setCode(draft);
      return;
    }
    if (isUntouchedStarter(code, problem)) setCode(starterFor(problem, next));
  }

  // Saved as you type. localStorage writes are synchronous and tiny, so this
  // needs no debouncing at the size of a source file.
  useEffect(() => {
    if (!problem || code === "") return;
    writeDraft(userId, slug, language, code);
  }, [problem, userId, slug, language, code]);

  /*
   * Submitting, which now has two possible shapes.
   *
   * When the queue is running, POST /submit answers straight away with a job id
   * and this polls until a worker has judged it. When Redis is down there is no
   * queue, the server judges the submission inline, and the verdict is in that
   * first reply. The body says which: a jobId means poll, a verdict means done.
   *
   * Handling both is not defensive clutter. It is what lets the judge keep
   * working when Redis is unavailable, which was the condition for putting a
   * queue in front of it at all.
   */
  async function handleSubmit() {
    setBusy("submit");
    setJudgeResult(null);
    setQueueState(null);
    try {
      const { data } = await compilerApi.post("/submit", { slug, language, code });

      if (!data.jobId) {
        finishSubmit(data);
        return;
      }

      setQueueState({ status: "queued", waitingAhead: data.waitingAhead || 0 });
      const final = await pollJob(data.jobId);
      finishSubmit(final);
    } catch (err) {
      /*
       * The server's own verdict, when it gave one.
       *
       * Everything that goes wrong here used to be reported as a Server Error,
       * which is true of a crash and false of a refusal. A submission turned
       * away for arriving too fast comes back as `rate_limited`, and labelling
       * that "Server Error" would send somebody hunting for a bug in a solution
       * that is very possibly correct. Anything without a verdict of its own —
       * a dropped connection, a DNS failure — is still a server error, because
       * from here that is exactly what it looks like.
       */
      setJudgeResult({
        verdict: err?.response?.data?.verdict || "server_error",
        message: errorMessage(err),
      });
      setFailure(null);
    } finally {
      setBusy(null);
      setQueueState(null);
    }
  }

  // Three words for three different waits, so the button is never lying about
  // what the server is doing.
  const submitLabel =
    queueState?.status === "queued"
      ? "Queued..."
      : queueState?.status === "running"
        ? "Judging..."
        : "Submitting...";

  function finishSubmit(data) {
    setJudgeResult(data);
    setShowTests(data.verdict !== "accepted");
    setFailure(failureFromJudge(data, { slug, language, code }));
  }

  /*
   * Asks for the verdict until there is one.
   *
   * Polling rather than a websocket: a judge run takes a second or two, so this
   * is a dozen cheap requests and no connection to keep alive or reconnect. The
   * ceiling exists because a worker killed mid-job leaves its submission
   * "running" forever, and a spinner that never stops is worse than an error.
   */
  async function pollJob(jobId) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < JOB_POLL_TIMEOUT_MS) {
      await new Promise((resolve) => setTimeout(resolve, JOB_POLL_INTERVAL_MS));

      const { data } = await compilerApi.get(`/submit/${jobId}`);
      if (data.status === "queued" || data.status === "running") {
        setQueueState({ status: data.status, waitingAhead: data.waitingAhead || 0 });
        continue;
      }
      return data;
    }

    return {
      verdict: "server_error",
      message: "The judge did not answer in time. Your submission may still be running.",
    };
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{loadError}</p>
        <Link to="/problems" className="btn-ghost mt-6">
          Back to problems
        </Link>
      </main>
    );
  }

  if (!problem) {
    return <main className="mx-auto max-w-2xl px-6 py-24 text-center text-brand-700">Loading...</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <Link to="/problems" className="text-sm font-semibold text-brand-700 hover:underline">
        Problems
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-ink-900">{problem.title}</h1>
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
          {problem.difficulty}
        </span>
        <span className="text-xs text-ink-800">
          {problem.testCount} test cases · {problem.timeLimitMs} ms limit for C and C++
        </span>

        {/* Only for people with an account: a room needs someone to own it and
            someone to invite. */}
        {isLoggedIn && (
          <span className="ml-auto flex items-center gap-2">
            <PairLabButton slug={slug} language={language} code={code} />
          </span>
        )}
      </div>

      {/* What the problem is about. Already in problem.json and already sent to
          the browser; it was simply never shown. Knowing a problem wants a hash
          map is half of solving it, so it sits under the title rather than
          buried in a hint. */}
      {problem.tags?.length > 0 && (
        <div className="mt-4 rounded-xl border border-brand-200 bg-surface px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Related topics
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {problem.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium capitalize text-brand-800"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sits between what the problem is about and the editor, which is where
          the decision to plan or to dive in actually gets made. */}
      <ThinkCard slug={slug} userId={user?._id} signedIn={isLoggedIn} />

      <SplitLayout
        left={
          <>
            {/* self-start stops the grid stretching this card to match the column
                beside it. Without it the card grew to the full height of the
                editor, judge and test panels, leaving a tall blank area under the
                hint. */}
            {/* Drag the bottom edge to give the statement more or less of the
                page; anything past that scrolls inside it. */}
            <ResizablePanel minHeight={200} className="rounded-2xl">
              <section className="card space-y-5">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-900">
                {problem.statement}
              </p>

              {/*
                Each of the three is guarded, because a problem can genuinely
                have none of them.

                The Add Problem form insists on an input format, an output
                format and at least one constraint, so for a long time every
                problem had all three and an empty heading could not happen.
                The imported set breaks that assumption twice over: the six
                interactive problems describe their protocol in an Interaction
                section inside the statement and have no Input or Output
                section, and three more state no constraints because the
                source states none. A heading over nothing reads as a page
                that failed to load rather than a problem shaped differently.
              */}
              {problem.inputFormat && (
                <div>
                  <h2 className="mb-1 text-sm font-bold text-brand-800">Input</h2>
                  <p className="whitespace-pre-line text-sm text-ink-900">{problem.inputFormat}</p>
                </div>
              )}

              {problem.outputFormat && (
                <div>
                  <h2 className="mb-1 text-sm font-bold text-brand-800">Output</h2>
                  <p className="whitespace-pre-line text-sm text-ink-900">{problem.outputFormat}</p>
                </div>
              )}

              {problem.constraints?.length > 0 && (
                <div>
                  <h2 className="mb-1 text-sm font-bold text-brand-800">Constraints</h2>
                  <ul className="list-inside list-disc text-sm text-ink-900">
                    {problem.constraints.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              {problem.samples.map((sample) => (
                <div key={sample.index}>
                  <h2 className="mb-1 text-sm font-bold text-brand-800">Example {sample.index}</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <pre className="overflow-x-auto rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 font-mono text-xs">
                      {sample.input}
                    </pre>
                    <pre className="overflow-x-auto rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 font-mono text-xs">
                      {sample.expected}
                    </pre>
                  </div>
                  {sample.note && <p className="mt-1 text-xs text-ink-800">{sample.note}</p>}
                </div>
              ))}

              {problem.hint && (
                <details className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
                  <summary className="cursor-pointer text-sm font-bold text-brand-800">Hint</summary>
                  <p className="mt-2 text-sm text-ink-900">{problem.hint}</p>
                </details>
              )}
              </section>
            </ResizablePanel>
          </>
        }
        right={
          <>
            {/* Editor and results */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <select
                  value={language}
                  onChange={handleLanguageChange}
                  className="field w-40"
                  aria-label="Language"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleSubmit}
                  disabled={busy !== null || !isLoggedIn}
                  className="btn-primary"
                  title={isLoggedIn ? "Judge against every test case" : "Log in to submit"}
                >
                  {busy === "submit" ? submitLabel : "Submit"}
                </button>
              </div>

              {/* Says which of the two waits this is. "Waiting for a judge"
                  and "Judging" look the same from a spinner, and when a class
                  submits at once the first one can last a while. */}
              {queueState && (
                <p className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-800">
                  {queueState.status === "queued"
                    ? queueState.waitingAhead > 0
                      ? `Waiting for a judge. ${queueState.waitingAhead} submission${
                          queueState.waitingAhead === 1 ? "" : "s"
                        } ahead of yours.`
                      : "Waiting for a judge."
                    : "A judge is running your code against every test case."}
                </p>
              )}

              {!isLoggedIn && (
                <p className="rounded-lg bg-brand-100 px-4 py-2.5 text-sm text-brand-800">
                  <Link to="/login" className="font-semibold underline">
                    Log in
                  </Link>{" "}
                  to run or submit code. Your work stays here while you do.
                </p>
              )}

              <div className="card overflow-hidden p-0">
                <h2 className="border-b border-brand-200 bg-brand-100 px-4 py-2.5 text-sm font-bold text-brand-800">
                  Source
                </h2>
                <CodeEditor value={code} onChange={setCode} language={language} height="360px" />
              </div>


              {judgeResult && (
                <ResizablePanel minHeight={110} className="rounded-2xl">
                  <div className="card overflow-hidden p-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-200 bg-brand-100 px-4 py-2">
                    <h2 className="text-sm font-bold text-brand-800">Judge</h2>
                    <div className="flex items-center gap-2">
                      {typeof judgeResult.passed === "number" && (
                        <span className="text-xs font-semibold text-brand-800">
                          {judgeResult.passed}/{judgeResult.total} tests passed
                        </span>
                      )}
                      <StatusMark status={judgeResult.verdict} />
                      <VerdictBadge verdict={judgeResult.verdict} />
                    </div>
                  </div>

                  <div className="space-y-3 px-4 py-3">
                    {judgeResult.verdict === "compilation_error" ? (
                      <pre className="max-h-56 overflow-auto whitespace-pre-wrap font-mono text-xs text-red-800">
                        {judgeResult.message}
                      </pre>
                    ) : (
                      <>
                        {judgeResult.failedOn && (
                          <p className="text-sm text-ink-900">
                            First failure on test {judgeResult.failedOn}
                            {judgeResult.message ? `: ${judgeResult.message}` : "."}
                          </p>
                        )}

                        {/* Ten rows is a lot of page for a run where every one
                            passed, so the list folds away behind a summary. A
                            failed row still opens to show the data, but only for
                            the examples: a hidden test says so and shows nothing. */}
                        {judgeResult.tests?.length > 0 && (
                          <div className="rounded-lg border border-brand-200">
                            <button
                              type="button"
                              onClick={() => setShowTests(!showTests)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-brand-800"
                              aria-expanded={showTests}
                            >
                              <span
                                aria-hidden="true"
                                className={`inline-block transition-transform ${
                                  showTests ? "rotate-90" : ""
                                }`}
                              >
                                &#9656;
                              </span>
                              {judgeResult.tests.length} test cases
                              <span className="ml-auto text-xs font-normal text-ink-800">
                                {showTests ? "hide" : "show each one"}
                              </span>
                            </button>

                            {showTests && (
                              <div className="space-y-1.5 border-t border-brand-200 p-2">
                                {judgeResult.tests.map((test) => (
                                  <TestRow
                                    key={test.index}
                                    label={`Test ${test.index}`}
                                    status={test.status}
                                    runMs={test.runMs}
                                    detail={{
                                      input: test.input,
                                      expected: test.expected,
                                      actual: test.actual || (test.expected ? "(nothing)" : null),
                                      message: test.message,
                                    }}
                                    hidden={!test.sample}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {judgeResult.budgetSpent && (
                          <p className="text-xs text-amber-900">
                            Judging stopped early to stay inside its time budget. The tests marked
                            &quot;not run&quot; were not reached.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  </div>
                </ResizablePanel>
              )}

              {/* Only when something went wrong. An Accepted run leaves it hidden,
                  because there is nothing to help with. */}
              {failure && <CodingAssistant failure={failure} problemTitle={problem.title} />}

              {/* Same rule as the assistant: only after something failed.
                  Sitting under the statement it was on screen before anyone had
                  tried, which is the answer offered to someone who has not asked
                  for it. Here it appears once a submission has actually gone
                  wrong, below the assistant, because it gives away more. */}
              {failure && <Editorial editorial={problem.editorial} />}

              {/* Appears only once a submission has been judged, which is what
                  gives the analysis something to sit beside. */}
              {judgeResult && (
                <AiAnalysis language={language} code={code} available={aiAvailable} />
              )}

              {/* Several cases at once, each with its own expected output. Still
                  Run, not Submit: nothing here changes the verdict. */}
              <ResizablePanel minHeight={140} className="rounded-2xl">
                <CustomTests
                  slug={slug}
                language={language}
                code={code}
                samples={problem.samples}
                onResult={(result) => {
                  const failed = (result.cases || []).find(
                    (item) => item.status !== "passed" && item.status !== "ran" && item.status !== "skipped"
                  );
                  const compileError =
                    result.verdict === "compilation_error" ? result.message : null;
                  setFailure(
                    failed || compileError
                      ? failureFromCustomCase(failed, {
                          slug,
                          language,
                          code,
                          timeLimitMs: result.timeLimitMs,
                          compileError,
                        })
                      : null
                  );
                }}
                />
              </ResizablePanel>
            </section>
          </>
        }
      />
    </main>
  );
}
