/*
 * Calls the compiler service to run an author's reference solution.
 *
 * This process has MongoDB and a writable disk; the compiler service has the
 * toolchains. Neither wants the other's job, so authoring a problem is a
 * conversation: we generate the inputs, the compiler runs the reference
 * solution over them, and we write what it printed to disk as the expected
 * outputs.
 *
 * Authentication is a short-lived service token rather than the admin's own.
 * Both are signed with the shared JWT_SECRET_KEY, but this one carries a scope
 * claim that no browser token has, so the compiler can tell a server calling it
 * from a user who found the route.
 */

const jwt = require("jsonwebtoken");

const COMPILER_URL = process.env.COMPILER_URL || "http://localhost:8000";
const CALL_TIMEOUT_MS = Number(process.env.REFERENCE_TIMEOUT_MS) || 240000;

class ReferenceError extends Error {
  constructor(code, message, detail) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}

function serviceToken() {
  return jwt.sign({ service: "accounts", scope: "run-reference" }, process.env.JWT_SECRET_KEY, {
    expiresIn: "10m",
  });
}

/*
 * Returns one output per input, in order.
 *
 * Anything that goes wrong is the author's problem, not the server's: their
 * solution did not compile, crashed on a generated input, or was too slow. All
 * three come back as a message they can act on rather than a 500.
 */
async function runBatch({ language, code, inputs, timeLimitMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${COMPILER_URL}/internal/run-reference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceToken()}`,
      },
      body: JSON.stringify({ language, code, inputs, timeLimitMs }),
      signal: controller.signal,
    });
  } catch (err) {
    throw new ReferenceError(
      "compiler_unreachable",
      `Could not reach the compiler service at ${COMPILER_URL}. Is it running?`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    // The compiler's error pages are HTML. Nobody wants a stack trace in a
    // form, so say what the status actually means and keep the rest out.
    const hint =
      response.status === 413
        ? "the generated inputs were too large for one request"
        : text.slice(0, 200).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    throw new ReferenceError("compiler_error", `Compiler service returned ${response.status}: ${hint}`);
  }

  const data = await response.json();
  if (data.error) throw new ReferenceError(data.error, data.message, data.results);
  return data;
}

/*
 * Returns one output per input, in order.
 *
 * Sent in batches rather than all at once. The largest case of a problem with
 * n up to 200000 is already a couple of megabytes, and ten of those in a single
 * request would be rejected by any sane body limit and would make this process
 * hold the lot in memory twice over while serialising it.
 *
 * The cost of batching is one recompile of the reference solution per batch,
 * a few hundred milliseconds. The batches are sized by total bytes rather than
 * by count, because a problem's cases differ in size by four orders of
 * magnitude and ten small ones cost less than one large one.
 *
 * Anything that goes wrong is the author's problem, not the server's: their
 * solution did not compile, crashed on a generated input, or was too slow.
 * All three come back as a message they can act on rather than a 500.
 */
const BATCH_BYTES = Number(process.env.REFERENCE_BATCH_BYTES) || 8 * 1024 * 1024;
const BATCH_COUNT = Number(process.env.REFERENCE_BATCH_COUNT) || 25;

async function runReference({ language, code, inputs, timeLimitMs }) {
  const batches = [];
  let current = [];
  let bytes = 0;

  for (const input of inputs) {
    const size = Buffer.byteLength(input);
    if (current.length && (bytes + size > BATCH_BYTES || current.length >= BATCH_COUNT)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(input);
    bytes += size;
  }
  if (current.length) batches.push(current);

  const outputs = [];
  const runs = [];
  let compileMs = 0;
  let largestOutputBytes = 0;

  for (const batch of batches) {
    const data = await runBatch({ language, code, inputs: batch, timeLimitMs });
    compileMs = Math.max(compileMs, data.compileMs || 0);
    for (const result of data.results) {
      outputs.push(result.output);
      runs.push({ index: outputs.length, runMs: result.runMs, outputBytes: result.outputBytes });
      largestOutputBytes = Math.max(largestOutputBytes, result.outputBytes || 0);
    }
  }

  return { compileMs, outputs, runs, largestOutputBytes, batches: batches.length };
}

module.exports = { runReference, ReferenceError };
