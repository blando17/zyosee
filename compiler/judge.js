const dotenv = require("dotenv");
dotenv.config();

const { generateFile, cleanupJob } = require("./generateFile");
const { compileJob, runJob, MAX_OUTPUT_BYTES } = require("./executeCode");
const { timeLimitFor } = require("./languages");

/*
 * The judge.
 *
 * Straight from the sketch:
 *
 *   a.cpp + P.in  ->  Sol.txt          run the submission on one test's input
 *   Sol.txt == P.out  ->  boolean      compare it against the expected output
 *   all ten boolean  ->  verdict       Accepted, or the first thing that failed
 *
 * It compiles once and then runs that one binary against every test. Compiling
 * per test would add a few hundred milliseconds to each of the ten and tell us
 * nothing new, since the source has not changed between them.
 *
 * Verdicts: Accepted, Wrong Answer, Compilation Error, Runtime Error,
 * Time Limit Exceeded, Output Limit Exceeded.
 */

// Ceiling on one whole submission. Ten tests that each sit at a six second
// Python limit would otherwise hold the request open for a minute.
const JUDGE_BUDGET_MS = Number(process.env.JUDGE_BUDGET_MS) || 30000;

/*
 * Compares a program's output with the expected output.
 *
 * Not a byte comparison. A trailing newline, or a space left at the end of a
 * line by a print loop, is not a wrong answer, and failing people for it is the
 * single most common way a judge wastes someone's afternoon. Trailing
 * whitespace goes from the end of every line, and blank lines go from the end
 * of the file. Everything else, including the spacing inside a line, still has
 * to match.
 */
function normalise(text) {
  return String(text)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

function outputMatches(actual, expected) {
  return normalise(actual) === normalise(expected);
}

// Enough of a mismatch to be useful, without pasting a 8000 byte answer into
// the page. Only ever shown for sample tests.
function preview(text, limit = 400) {
  const trimmed = normalise(text);
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit)}\n... ${trimmed.length - limit} more characters`;
}

async function judge({ language, code, problem }) {
  const job = generateFile(language, code);
  // The problem's own ceiling, measured from its reference solution when it was
  // authored. Problems written before this existed fall back to the default.
  const outputLimit = problem.outputLimitBytes || MAX_OUTPUT_BYTES;
  const startedAt = Date.now();
  const timeLimitMs = timeLimitFor(language, problem.timeLimitMs);

  try {
    let compileMs = 0;
    /*
     * A problem with no tests cannot be judged, and must not be accepted.
     *
     * Further down, "every test passed" is `passed === problem.tests.length`,
     * which is 0 === 0 for a problem with no tests — so a submission that
     * merely compiled came back Accepted, and counted towards the solver's
     * total. Six of the imported problems are interactive: the solver talks to
     * a grader instead of reading a fixed input, so there is no static test
     * data to import and none was invented. They are visible and readable, and
     * saying so plainly is the honest outcome; silently accepting anything is
     * not.
     */
    if (!problem.tests.length) {
      return {
        verdict: "invalid_request",
        message:
          "This problem has no test data, so a submission cannot be judged against it. " +
          "Interactive problems work this way: the solution talks to a grader rather than " +
          "reading a fixed input, which this judge does not run.",
        passed: 0,
        total: 0,
        timeLimitMs,
        compileMs: 0,
        tests: [],
      };
    }

    try {
      ({ compileMs } = await compileJob(language, job));
    } catch (err) {
      // Nothing ran, so there is no per-test story to tell.
      return {
        verdict: "compilation_error",
        message: err.message,
        passed: 0,
        total: problem.tests.length,
        timeLimitMs,
        compileMs: 0,
        tests: [],
      };
    }

    /*
     * One throwaway run before the tests are timed.
     *
     * macOS spends around 600 ms validating a newly written executable the
     * first time it runs, and the judge has just written one. Without this the
     * whole tax lands on test 1, which reads as a slow first test and, on a
     * tight limit, as a time limit failure for a program that is fast.
     */
    try {
      await runJob(language, job, problem.tests[0].input, timeLimitMs, outputLimit);
    } catch (err) {
      // A submission that fails on test 1 will fail again below, where the
      // outcome is recorded properly.
    }

    /*
     * Which tests a solver is allowed to see the detail of when they fail.
     *
     * Read from the manifest's own `kind`, which is where writeCases records
     * it. This used to be `test.index <= (problem.sampleCount || 0)`, and
     * nothing has ever written a `sampleCount` field — so the count was always
     * zero, every test counted as hidden, and a failed EXAMPLE showed no input,
     * no expected output and no actual output. Failing on the worked example
     * printed in the statement while being told nothing about why is the one
     * case where a solver most needs the diff.
     */
    const tests = [];
    let passed = 0;
    let budgetSpent = false;

    for (const test of problem.tests) {
      const isSample = test.kind === "sample";

      if (budgetSpent || Date.now() - startedAt > JUDGE_BUDGET_MS) {
        budgetSpent = true;
        tests.push({ index: test.index, status: "skipped", sample: isSample, runMs: null });
        continue;
      }

      try {
        const { stdout, runMs } = await runJob(language, job, test.input, timeLimitMs, outputLimit);
        const correct = outputMatches(stdout, test.expected);
        if (correct) passed += 1;

        tests.push({
          index: test.index,
          status: correct ? "passed" : "wrong_answer",
          sample: isSample,
          runMs: Math.round(runMs),
          // A hidden test never reveals its data, whatever the outcome. That
          // secrecy is the only thing separating a judge from a diff tool.
          ...(correct || !isSample
            ? {}
            : {
                input: preview(test.input),
                expected: preview(test.expected),
                actual: preview(stdout),
              }),
        });
      } catch (err) {
        tests.push({
          index: test.index,
          status: err.verdict || "runtime_error",
          sample: isSample,
          runMs: null,
          message: err.message,
        });
      }
    }

    // The verdict is whatever went wrong first, which is how every judge
    // reports it: "wrong answer on test 7" is actionable, a list of ten
    // statuses is not.
    const firstFailure = tests.find((test) => test.status !== "passed" && test.status !== "skipped");

    /*
     * Accepted requires every test to have passed, not merely that no test
     * failed. Those differ when the budget runs out: the tests that were never
     * reached are skipped, not failed, so looking only for a failure returned
     * Accepted for a submission that was judged eight tests out of ten. A
     * submission that ran the clock down is reported as a time limit, which is
     * what actually happened.
     */
    const everyTestPassed = passed === problem.tests.length;
    const verdict = firstFailure
      ? firstFailure.status
      : everyTestPassed
        ? "accepted"
        : "time_limit_exceeded";

    return {
      verdict,
      failedOn: firstFailure ? firstFailure.index : null,
      message: firstFailure ? firstFailure.message || null : null,
      passed,
      total: problem.tests.length,
      timeLimitMs,
      compileMs: Math.round(compileMs),
      maxRunMs: tests.reduce((slowest, test) => Math.max(slowest, test.runMs || 0), 0),
      budgetSpent,
      tests,
    };
  } finally {
    // The submission is deleted whatever happened, same as a plain run.
    cleanupJob(job);
  }
}

/*
 * Runs a submission against the solver's own test cases.
 *
 * Same machinery as judging and the same one compile for many runs, but the
 * expected output comes from whoever is sitting at the keyboard rather than
 * from the problem. Nothing here decides a verdict: these are for debugging,
 * and a passing custom case means nothing official.
 *
 * A case with no expected output is still run; it simply reports what the
 * program printed instead of comparing anything.
 */
async function runCustomCases({ language, code, cases, timeLimitMs, outputLimitBytes }) {
  const job = generateFile(language, code);
  // Matches judging, so a case that passes here is not killed on submission for
  // printing the same amount.
  const outputLimit = outputLimitBytes || MAX_OUTPUT_BYTES;
  const startedAt = Date.now();

  try {
    let compileMs = 0;
    try {
      ({ compileMs } = await compileJob(language, job));
    } catch (err) {
      return { verdict: "compilation_error", message: err.message, compileMs: 0, cases: [] };
    }

    // The same throwaway run as judging: macOS validates a newly written
    // executable on first use, and that cost would otherwise land on case 1.
    try {
      await runJob(language, job, cases[0]?.input || "", timeLimitMs, outputLimit);
    } catch (err) {
      // A failure here repeats below, where it is recorded properly.
    }

    const results = [];

    for (let i = 0; i < cases.length; i += 1) {
      const testCase = cases[i];
      const expected = (testCase.expected || "").trim();

      if (Date.now() - startedAt > JUDGE_BUDGET_MS) {
        results.push({ index: i + 1, status: "skipped", runMs: null });
        continue;
      }

      try {
        const { stdout, runMs } = await runJob(language, job, testCase.input || "", timeLimitMs, outputLimit);
        const compared = expected.length > 0;
        const correct = compared ? outputMatches(stdout, expected) : null;

        results.push({
          index: i + 1,
          status: !compared ? "ran" : correct ? "passed" : "wrong_answer",
          runMs: Math.round(runMs),
          input: preview(testCase.input || ""),
          expected: compared ? preview(expected) : null,
          actual: preview(stdout),
        });
      } catch (err) {
        results.push({
          index: i + 1,
          status: err.verdict || "runtime_error",
          runMs: null,
          message: err.message,
          input: preview(testCase.input || ""),
          expected: expected.length > 0 ? preview(expected) : null,
          actual: null,
        });
      }
    }

    return { verdict: "success", compileMs: Math.round(compileMs), cases: results };
  } finally {
    cleanupJob(job);
  }
}

module.exports = { judge, runCustomCases, outputMatches, normalise };
