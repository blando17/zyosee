const { exec, spawn } = require("child_process");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const { LANGUAGES } = require("./languages");

const COMPILE_TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS) || 10000;
const RUN_TIMEOUT_MS = Number(process.env.RUN_TIMEOUT_MS) || 5000;
const MAX_OUTPUT_BYTES = Number(process.env.MAX_OUTPUT_BYTES) || 65536;

// A first run faster than this is re-run once, and the quicker of the two is
// reported. Set WARM_UP_RUNS=0 to switch the behaviour off entirely.
const WARM_UP_ENABLED = process.env.WARM_UP_RUNS !== "0";
const WARM_UP_CEILING_MS = Number(process.env.WARM_UP_CEILING_MS) || 1500;

/*
 * Compiles and runs one submitted program, then reports a verdict.
 *
 * The two steps are timed apart. Compiling a C++ file costs a few hundred
 * milliseconds whatever the program does, so a single combined number is mostly
 * a measurement of the compiler rather than of the code.
 *
 * Verdicts: success, compilation_error, runtime_error, time_limit_exceeded,
 * output_limit_exceeded.
 */

class ExecutionError extends Error {
  constructor(verdict, message) {
    super(message);
    this.verdict = verdict;
  }
}

/*
 * Compiler errors and stack traces name the file they came from, which here is
 * an absolute path inside the server's home directory. Nobody submitting code
 * should learn where the server keeps its scratch files, and the UUID folder
 * name is noise to them anyway, so both are stripped before anything is
 * returned to the browser.
 */
function scrub(text, job) {
  if (!text) return text;
  return text
    .split(job.jobDir + path.sep)
    .join("")
    .split(job.jobDir)
    .join("")
    .split(job.binaryPath)
    .join("program");
}

// Wall-clock milliseconds, from a monotonic clock so a system time change
// cannot produce a negative duration.
function since(startedAt) {
  return Number(process.hrtime.bigint() - startedAt) / 1e6;
}

function compileJob(language, job) {
  const command = LANGUAGES[language].compile(job);

  // Interpreted languages have nothing to compile.
  if (!command) {
    return Promise.resolve({ compileMs: 0, warnings: "" });
  }

  const startedAt = process.hrtime.bigint();

  return new Promise((resolve, reject) => {
    exec(command, { timeout: COMPILE_TIMEOUT_MS }, (error, stdout, stderr) => {
      if (error) {
        // killed means the compiler itself ran past its timeout, which is a
        // different story from code that fails to compile.
        if (error.killed) {
          return reject(
            new ExecutionError(
              "compilation_error",
              `Compilation timed out after ${COMPILE_TIMEOUT_MS / 1000}s.`
            )
          );
        }
        return reject(
          new ExecutionError("compilation_error", scrub(stderr || error.message, job))
        );
      }
      // stderr on a successful compile is warnings, which are worth showing.
      resolve({ compileMs: since(startedAt), warnings: scrub(stderr || "", job) });
    });
  });
}

// timeoutMs lets the judge apply a problem's own limit instead of the service
// default, which is what the plain Run button still uses.
/*
 * maxOutputBytes is a parameter rather than the module constant because it
 * belongs to the problem, not to the service. "Print the rotated array" with
 * n up to 100000 has to print about 1.2 MB, and a fixed 64 KB ceiling would
 * kill every correct solution to it.
 *
 * It has to be the same number for judging and for the reference run that
 * produced the expected output. Raising it for one and not the other creates a
 * problem that can be authored and never solved.
 */
function runJob(language, job, input, timeoutMs = RUN_TIMEOUT_MS, maxOutputBytes = MAX_OUTPUT_BYTES) {
  const [command, args] = LANGUAGES[language].run(job);
  const startedAt = process.hrtime.bigint();

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: job.jobDir });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let outputCapped = false;
    let settled = false;

    const timer = setTimeout(() => {
      timedOut = true;
      // SIGKILL rather than SIGTERM: a program stuck in a tight loop can
      // ignore a polite signal, and this one has already had its chance.
      child.kill("SIGKILL");
    }, timeoutMs);

    function finish(fn, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    }

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > maxOutputBytes) {
        outputCapped = true;
        child.kill("SIGKILL");
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (stderr.length > maxOutputBytes) {
        outputCapped = true;
        child.kill("SIGKILL");
      }
    });

    // Fires when the binary or interpreter itself cannot be started, e.g.
    // python3 is not on PATH. Nothing to do with the user's code.
    child.on("error", (err) => {
      finish(reject, new ExecutionError("runtime_error", err.message));
    });

    child.on("close", (code, signal) => {
      const runMs = since(startedAt);

      if (outputCapped) {
        return finish(
          reject,
          new ExecutionError(
            "output_limit_exceeded",
            `Program printed more than ${maxOutputBytes} bytes.`
          )
        );
      }
      if (timedOut) {
        return finish(
          reject,
          new ExecutionError(
            "time_limit_exceeded",
            `Killed after ${(timeoutMs / 1000).toFixed(timeoutMs % 1000 ? 1 : 0)}s.`
          )
        );
      }
      if (signal) {
        // A segfault arrives as a signal with no exit code at all.
        return finish(
          reject,
          new ExecutionError(
            "runtime_error",
            scrub(stderr, job) || `Terminated by ${signal}.`
          )
        );
      }
      if (code !== 0) {
        return finish(
          reject,
          new ExecutionError(
            "runtime_error",
            scrub(stderr, job) || `Program exited with code ${code}.`
          )
        );
      }

      finish(resolve, { stdout, stderr: scrub(stderr, job), runMs });
    });

    // Writing to stdin can fail if the program exits without reading it,
    // which is normal and must not be treated as an error.
    child.stdin.on("error", () => {});
    if (input) child.stdin.write(input);
    child.stdin.end();
  });
}

async function executeCode(language, job, input) {
  const { compileMs, warnings } = await compileJob(language, job);

  let result = await runJob(language, job, input);

  /*
   * macOS validates a newly written executable the first time it is run, and
   * that costs roughly 600 ms. Every submission compiles a fresh binary, so
   * without this the timer reports about 500 ms for a program that adds two
   * numbers, and the same 500 ms for one that does real work. Running it a
   * second time and keeping the quicker measurement leaves the number meaning
   * what people read it as: how long the program itself took.
   *
   * Only worth doing when the first run was quick. A program that already takes
   * seconds is not being distorted by half a second of validation, and running
   * it twice would just double the wait.
   *
   * The one thing to know: a program with side effects, such as writing a file,
   * performs them twice. Inside the Docker sandbox this becomes moot, because
   * each run gets its own container.
   */
  if (WARM_UP_ENABLED && result.runMs < WARM_UP_CEILING_MS) {
    const second = await runJob(language, job, input);
    if (second.runMs < result.runMs) result = second;
  }

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    compilerWarnings: warnings,
    compileMs,
    runMs: result.runMs,
  };
}

module.exports = {
  executeCode,
  MAX_OUTPUT_BYTES,
  compileJob,
  runJob,
  ExecutionError,
  RUN_TIMEOUT_MS,
};
