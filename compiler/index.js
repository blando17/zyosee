const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const { stayAlive } = require("./stayAlive");
stayAlive("compiler");

const { generateFile, cleanupJob } = require("./generateFile");
const { executeCode, compileJob, runJob, RUN_TIMEOUT_MS } = require("./executeCode");
const { LANGUAGES, isSupported, timeLimitFor } = require("./languages");
const {
  listProblems,
  getProblem,
  getProblemBrief,
  publicView,
  countProblems,
  invalidate,
} = require("./problems");
const { judge, runCustomCases } = require("./judge");
const { isConfigured, MODEL, GeminiError } = require("./geminiClient");
const { analyse } = require("./aiAnalyser");
const { assist, isSupportedAction, HINT_LEVELS } = require("./aiAssistant");
const limits = require("./aiLimits");
// Two limiters, two jobs, and they are not interchangeable: `limits` rations the
// paid Gemini key, `runLimits` rations the judge. Kept under distinct names
// because a mix-up between them would be silent — both export a `record`.
const runLimits = require("./runLimits");
const queue = require("./judgeQueue");
const { record, progressFor, activityFor, statsFor, setFavourite } = require("./submissions");
const thinking = require("./thinking");
const { checkDuelSubmission } = require("./duelGate");

const app = express();

/*
 * Which browser origins may call this API.
 *
 * A list, not a single value, because Vite does not insist on port 5173: if
 * something else already holds it, Vite quietly starts on 5174 instead and says
 * so only in its own terminal. The browser then blocks every reply from this
 * API for coming from an origin it was not told about, and the page reports a
 * network error that looks like the server being down. Allowing the handful of
 * ports Vite actually falls back to keeps a port clash from breaking signup.
 */
function allowedOrigins() {
  const configured = (process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return configured.length
    ? configured
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
}


app.use(cors({ origin: allowedOrigins() }));
/*
 * 256 KB is generous for a submission: the code itself is capped far below that
 * and custom test inputs are typed by hand. Keeping the public limit low means
 * a browser cannot make this process buffer megabytes.
 *
 * Generating a problem's tests is the one case that genuinely carries more. Its
 * route gets its own parser below, after a service token has been checked.
 */
const publicJson = express.json({ limit: "256kb" });

// Only the internal generation route. A problem whose largest case holds two
// hundred thousand integers is already two megabytes of input, and several of
// those arrive in one call.
const referenceBodyParser = express.json({
  limit: process.env.REFERENCE_BODY_LIMIT || "24mb",
});

/*
 * The public parser has to skip /internal, not merely run before a larger one.
 * Body parsing happens once, at the first parser that matches, so a global
 * express.json would reject a generation request for being over 256 KB long
 * before the route's own parser was ever reached.
 */
app.use((req, res, next) => {
  if (req.path.startsWith("/internal/")) return next();
  return publicJson(req, res, next);
});

const MAX_CODE_LENGTH = 100000;

/*
 * This service verifies tokens but never issues them. It shares JWT_SECRET_KEY
 * with the accounts API on port 5001, which is why the two .env files must
 * carry the same value. Running code is for logged-in users only.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Log in to run code." });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Log in to run code." });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);
    next();
  } catch (err) {
    // `reason` tells the browser this 403 is about the TOKEN, not about
    // permission. Without it, every ordinary refusal reads as a dead session.
    // See backend/middleware/authMiddleware.js for the full account.
    return res.status(403).json({ message: "Invalid or expired token!", reason: "token" });
  }
}

/*
 * A liveness check that touches nothing.
 *
 * "/" below is a status page: it counts problems, asks Redis for the queue
 * depth, and reports whether the AI key works. That makes it a fine thing for a
 * human to open and a bad thing for a platform to poll, because it answers only
 * as fast as its slowest dependency — and if one of them never answers, neither
 * does it.
 *
 * That is not hypothetical. A malformed MONGODB_URI left this service with the
 * port bound and every request to "/" hanging on a driver that would never
 * resolve. Render's port scan saw silence, concluded there was no HTTP server
 * at all, and failed the deploy eighteen minutes later with "no open HTTP ports
 * detected" — which points at networking, when the fault was one wrong
 * environment variable.
 *
 * So the health check gets its own route that proves exactly one thing: this
 * process is up and serving. Whether its dependencies are healthy is a question
 * for "/", where a slow answer is informative rather than fatal.
 */
app.get("/healthz", (req, res) => {
  res.json({ status: "ok", service: "online-judge-compiler" });
});

app.get("/", async (req, res) => {
  res.json({
    service: "online-judge-compiler",
    status: "ok",
    languages: Object.keys(LANGUAGES),
    limits: { runTimeoutMs: RUN_TIMEOUT_MS },
    problems: await countProblems(),
    // "inline" means no workers are involved and /submit answers directly.
    queue: {
      mode: queue.isAvailable() ? "queued" : "inline",
      waiting: (await queue.depth()) ?? 0,
    },
    // The page uses this to decide whether to offer the analyser at all, rather
    // than showing a button that can only fail.
    ai: {
      available: isConfigured(),
      model: MODEL,
      hintLevels: HINT_LEVELS,
      limits: { perHour: limits.CONFIG.perHour, perDay: limits.CONFIG.perDay },
      // "memory" means limits reset whenever this process restarts.
      limitStore: limits.backend(),
    },
  });
});

/*
 * The judge lives here rather than in the accounts API because it needs the
 * compiler that is already in this process. A submission is the same compile
 * and run as the Run button, only repeated once per test case with the output
 * checked instead of displayed.
 *
 * Nothing about a submission is stored. Writing the verdict to a submissions
 * collection means giving this service database credentials, and keeping the
 * database to one owner is worth more right now than a submission history.
 */

// Browsing problems needs no account; only submitting does.
app.get("/problems", async (req, res) => {
  res.json(await listProblems());
});

app.get("/problems/:slug", async (req, res) => {
  // Brief: the statement and its samples. Showing a problem has no business
  // reading its hidden tests, and for the largest imported problem that would
  // be 82 MB off disk to render a page.
  const problem = await getProblemBrief(req.params.slug);
  if (!problem) {
    return res.status(404).json({ message: `No problem called "${req.params.slug}".` });
  }
  // publicView keeps the hidden tests in this process.
  res.json(publicView(problem));
});

/*
 * One solver's standing across the whole problem set.
 *
 * Everything the problem list needs to colour itself in, in one request rather
 * than one per problem: which problems this person has solved, which they have
 * tried without solving, and which they starred.
 *
 * Only slugs. The page already has the problems; this says what to draw on top
 * of them. It is also strictly this user's own data — the token decides whose,
 * never a parameter — so nobody can ask for somebody else's progress.
 */
app.get("/me/problems", requireAuth, async (req, res) => {
  res.json(await progressFor(req.user.id));
});

/*
 * The same person's submission history, for their profile page.
 *
 * Separate from /me/problems because the problem list has no use for it and
 * asks on every visit; this is a heavier query wanted on one page.
 */
app.get("/me/activity", requireAuth, async (req, res) => {
  res.json(await activityFor(req.user.id, req.query.limit));
});

/*
 * The thinking board and plan for one problem.
 *
 * Always this user's own: the token decides whose, never a parameter, so no
 * amount of guessing at URLs reaches somebody else's working out.
 */
app.get("/me/thinking/:slug", requireAuth, async (req, res) => {
  try {
    res.json((await thinking.load(req.user.id, req.params.slug)) || { items: [], plan: null, updatedAt: null });
  } catch (err) {
    console.error("Could not load thinking:", err.message);
    res.status(503).json({ message: "Could not reach your saved notes." });
  }
});

app.put("/me/thinking/:slug", requireAuth, async (req, res) => {
  try {
    const outcome = await thinking.save(req.user.id, req.params.slug, req.body || {});
    // If a newer copy was already stored, hand it back rather than a bare
    // rejection: the page can then show what it should have been showing.
    if (!outcome.written) {
      const stored = await thinking.load(req.user.id, req.params.slug);
      return res.status(409).json({ message: "A newer version is already saved.", stored });
    }
    res.json({ saved: true, bytes: outcome.bytes });
  } catch (err) {
    if (err.tooLarge) return res.status(413).json({ message: err.message });
    console.error("Could not save thinking:", err.message);
    res.status(503).json({ message: "Could not save to your account." });
  }
});

app.delete("/me/thinking/:slug", requireAuth, async (req, res) => {
  await thinking.remove(req.user.id, req.params.slug);
  res.json({ deleted: true });
});

/*
 * Per-problem figures for the progress page: attempts, when it was first
 * solved, how long it took. Separate from /me/problems because the problem
 * list asks for that on every visit and has no use for any of this.
 */
app.get("/me/stats", requireAuth, async (req, res) => {
  res.json(await statsFor(req.user.id));
});

app.put("/me/favourites/:slug", requireAuth, async (req, res) => {
  await setFavourite(req.user.id, req.params.slug, true);
  res.json({ slug: req.params.slug, favourite: true });
});

app.delete("/me/favourites/:slug", requireAuth, async (req, res) => {
  await setFavourite(req.user.id, req.params.slug, false);
  res.json({ slug: req.params.slug, favourite: false });
});

app.post("/submit", requireAuth, async (req, res) => {
  const { language = "cpp", code, slug, duelId = null } = req.body;

  /*
   * Brief first, because most submissions never need more.
   *
   * Everything below this point until the inline judge is validation: does the
   * problem exist, is the code sane, does the duel allow it. A queued
   * submission returns before any test is read, and the worker loads the full
   * problem itself. Loading every hidden test here to answer "does this slug
   * exist" was reading megabytes per submission and throwing them away.
   */
  const brief = await getProblemBrief(slug);
  if (!brief) {
    return res.status(404).json({ verdict: "invalid_request", message: `No problem called "${slug}".` });
  }
  if (typeof code !== "string" || code.trim() === "") {
    return res.status(400).json({ verdict: "invalid_request", message: "Empty code!" });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({
      verdict: "invalid_request",
      message: `Code is longer than ${MAX_CODE_LENGTH} characters.`,
    });
  }
  if (!isSupported(language)) {
    return res.status(400).json({
      verdict: "invalid_request",
      message: `Unsupported language "${language}".`,
    });
  }

  /*
   * The rate limit, here rather than at the top of the handler.
   *
   * Above this line is validation that costs nothing — a projected read and
   * three string checks. Below it is the expensive half: a database round trip
   * for the duel, a queue slot, and on the inline path a compile and up to
   * thirty seconds of execution. Gating at this point means a malformed request
   * is told what is actually wrong with it instead of being refused for going
   * too fast, and a well-formed one is counted before anything costly happens.
   */
  if (!(await runLimits.gate("submit", req, res))) return;

  /*
   * A submission claiming to belong to a duel.
   *
   * Checked against the duel document before anything is judged, and refused
   * outright if the claim does not hold. Refusing rather than stripping the id
   * and judging anyway is the whole point: somebody who submits after the
   * buzzer, or to a problem that is not in their match, needs to be told that
   * it did not count while they can still do something about it.
   */
  if (duelId) {
    let gate;
    try {
      gate = await checkDuelSubmission({ duelId, userId: req.user.id, slug, language });
    } catch (err) {
      console.error("Could not check a duel submission:", err.message);
      return res
        .status(503)
        .json({ verdict: "invalid_request", message: "Could not reach the duel. Try again." });
    }
    if (!gate.ok) {
      return res.status(gate.status).json({ verdict: "invalid_request", message: gate.message });
    }
  }

  /*
   * Queued when there is a queue, judged here when there is not.
   *
   * A submission that runs inline holds this connection for as long as it takes
   * — five seconds for one that times out — and nothing caps how many do that
   * at once. Handing the job to a worker bounds the number of compilers running
   * at once to the number of workers.
   *
   * The reply tells the browser which happened: a body with a jobId is one to
   * poll, a body with a verdict is the answer. Redis being down therefore
   * degrades the judge to exactly what it was before the queue existed, rather
   * than breaking it.
   */
  /*
   * Counted here, where the submission is genuinely about to be judged.
   *
   * Not at the gate above. Everything between the two — the duel check — can
   * still refuse this submission, and a person told their duel has already
   * finished should not also have paid for the privilege out of their hourly
   * allowance.
   */
  await runLimits.record("submit", req.user.id);

  if (queue.isAvailable()) {
    const job = await queue.enqueue({ userId: req.user.id, slug, language, code, duelId });
    if (job) {
      const waiting = await queue.depth();
      return res.status(202).json({
        jobId: job.id,
        status: "queued",
        waitingAhead: Math.max(0, (waiting ?? 1) - 1),
        slug,
        language,
      });
    }
    // Redis went away between the check and the write. Fall through and judge.
  }

  try {
    // The inline path is the one that actually judges, so this is where the
    // hidden tests are finally worth reading.
    const problem = await getProblem(slug);
    if (!problem) {
      return res.status(404).json({ verdict: "invalid_request", message: `No problem called "${slug}".` });
    }
    const result = await judge({ language, code, problem });
    res.json({ ...result, slug, language });
    // The other half of the pair in worker.js. Both judging paths record, so
    // history does not depend on whether Redis happened to be up.
    await record({ userId: req.user.id, slug, language, result, duelId });
  } catch (err) {
    console.error("Unexpected judging failure:", err);
    res.status(500).json({ verdict: "server_error", message: "Server error" });
  }
});

/*
 * How a queued submission is collected.
 *
 * Polled rather than pushed. A websocket or an SSE stream would save a handful
 * of requests, and would also mean holding a connection per waiting solver and
 * a reconnection story for every dropped one. A judge run takes a second or
 * two; polling every few hundred milliseconds is a dozen cheap requests and no
 * new failure mode.
 */
app.get("/submit/:jobId", requireAuth, async (req, res) => {
  const outcome = await queue.getJob(req.params.jobId, req.user.id);

  if (outcome.unavailable) {
    return res.status(503).json({
      verdict: "server_error",
      message: "The queue is unavailable. Submit again to be judged directly.",
    });
  }
  if (outcome.missing) {
    return res.status(404).json({
      verdict: "server_error",
      message: "That submission has expired. Submit again.",
    });
  }
  // Somebody else's job. Same answer as a missing one would be tidier, but a
  // 403 is the truth and this is not a secret worth lying about.
  if (outcome.forbidden) {
    return res.status(403).json({ verdict: "server_error", message: "Not your submission." });
  }

  res.json(outcome.job);
});

app.post("/run", requireAuth, async (req, res) => {
  const { language = "cpp", code, input = "" } = req.body;

  if (typeof code !== "string" || code.trim() === "") {
    return res.status(400).json({ verdict: "invalid_request", message: "Empty code!" });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({
      verdict: "invalid_request",
      message: `Code is longer than ${MAX_CODE_LENGTH} characters.`,
    });
  }
  if (!isSupported(language)) {
    return res.status(400).json({
      verdict: "invalid_request",
      message: `Unsupported language "${language}".`,
    });
  }

  /*
   * Limited too, and on a looser budget than submitting.
   *
   * /run compiles and executes exactly as /submit does, so a limit on
   * submissions alone would be one anybody could step around by pressing Run
   * in a loop instead. The budget is the larger of the two because running
   * against your own input is how people get to a submission — rationing it
   * tightly would be a limit on working, not on abuse.
   */
  if (!(await runLimits.gate("run", req, res))) return;
  await runLimits.record("run", req.user.id);

  // Written to disk, compiled, run, then deleted. Nothing about this
  // submission is persisted anywhere.
  const job = generateFile(language, code);

  try {
    const result = await executeCode(language, job, input);
    res.json({
      verdict: "success",
      output: result.stdout,
      stderr: result.stderr,
      compilerWarnings: result.compilerWarnings,
      // Reported apart rather than as one number. Compiling a C++ file costs a
      // few hundred milliseconds whatever the program does, so a combined
      // figure is mostly a measurement of the compiler.
      compileMs: Math.round(result.compileMs),
      runMs: Math.round(result.runMs),
    });
  } catch (err) {
    // Anything thrown by executeCode carries a verdict; anything else is our
    // own bug and should not be echoed back to the browser.
    if (err.verdict) {
      return res.status(200).json({
        verdict: err.verdict,
        output: "",
        message: err.message,
      });
    }
    console.error("Unexpected execution failure:", err);
    res.status(500).json({ verdict: "server_error", message: "Server error" });
  } finally {
    cleanupJob(job);
  }
});

/*
 * Running a reference solution over generated inputs.
 *
 * This is how a new problem gets its expected outputs. Constraints describe
 * what an input may look like; nothing in them says what the right answer is.
 * So the author supplies a solution they trust, the accounts API generates the
 * inputs, and this route runs one against the other. Whatever the reference
 * prints becomes the expected output, which is the same definition of "correct"
 * the hand-written problems used.
 *
 * Called by the accounts API, never by a browser, and gated on a service token
 * rather than a user token. Both are signed with the same secret, but a service
 * token carries a scope claim that nothing handed to a browser ever has, so a
 * logged-in user cannot reach this route with the token in their localStorage.
 *
 * It writes nothing. testdata/ is mounted read-only here on purpose, and the
 * caller is the one that owns the files.
 */
function requireServiceToken(scope) {
  return function (req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Service token required." });

    try {
      const claims = jwt.verify(token, process.env.JWT_SECRET_KEY);
      if (claims.scope !== scope) {
        return res.status(403).json({ message: "Token is not valid for this route." });
      }
      req.service = claims;
      next();
    } catch (err) {
      return res.status(403).json({ message: "Invalid or expired service token." });
    }
  };
}

// Generating a large problem means running the reference solution on inputs
// that climb to the size limit, so this budget is far larger than a judge run.
const REFERENCE_BUDGET_MS = Number(process.env.REFERENCE_BUDGET_MS) || 180000;
const MAX_REFERENCE_INPUTS = Number(process.env.MAX_REFERENCE_INPUTS) || 60;

app.post(
  "/internal/run-reference",
  requireServiceToken("run-reference"),
  referenceBodyParser,
  async (req, res) => {
  const { language = "cpp", code, inputs = [], timeLimitMs } = req.body;

  if (typeof code !== "string" || code.trim() === "") {
    return res.status(400).json({ error: "invalid_request", message: "Reference solution is empty." });
  }
  if (!isSupported(language)) {
    return res.status(400).json({ error: "invalid_request", message: `Unsupported language "${language}".` });
  }
  if (!Array.isArray(inputs) || !inputs.length) {
    return res.status(400).json({ error: "invalid_request", message: "No inputs to run." });
  }
  if (inputs.length > MAX_REFERENCE_INPUTS) {
    return res.status(400).json({
      error: "invalid_request",
      message: `At most ${MAX_REFERENCE_INPUTS} inputs per call.`,
    });
  }

  const job = generateFile(language, code);
  const startedAt = Date.now();

  try {
    let compileMs = 0;
    try {
      ({ compileMs } = await compileJob(language, job));
    } catch (err) {
      // The author's own solution does not compile. That is their bug, and the
      // message is the compiler's, so it goes back verbatim.
      return res.status(200).json({
        error: "compilation_error",
        message: err.message,
        compileMs: 0,
        results: [],
      });
    }

    // A reference solution gets a far longer leash than a submission. It is
    // trusted code being asked to produce ground truth, and it runs on the
    // largest input the problem allows, which is exactly the case a solver is
    // expected to only just finish.
    const perInputMs = Math.max(Number(timeLimitMs) || 0, 10000);

    /*
     * A generous ceiling, not the judging one. This run exists to find out how
     * much a correct solution prints; capping it at the default would refuse
     * every problem whose answer is large, which is exactly the case this
     * number is needed for. The caller turns the measured sizes into the
     * problem's real limit.
     */
    const referenceOutputLimit =
      Number(process.env.REFERENCE_OUTPUT_LIMIT_BYTES) || 16 * 1024 * 1024;
    const results = [];

    for (let i = 0; i < inputs.length; i += 1) {
      if (Date.now() - startedAt > REFERENCE_BUDGET_MS) {
        return res.status(200).json({
          error: "budget_exceeded",
          message:
            `Generation stopped after ${Math.round(REFERENCE_BUDGET_MS / 1000)}s, at input ` +
            `${i + 1} of ${inputs.length}. Use fewer or smaller cases, or a faster reference solution.`,
          compileMs: Math.round(compileMs),
          results,
        });
      }

      try {
        const { stdout, runMs } = await runJob(
          language, job, inputs[i], perInputMs, referenceOutputLimit
        );
        results.push({
          index: i + 1,
          output: stdout,
          runMs: Math.round(runMs),
          outputBytes: Buffer.byteLength(stdout),
        });
      } catch (err) {
        return res.status(200).json({
          error: err.verdict || "runtime_error",
          message: `Reference solution failed on input ${i + 1}: ${err.message}`,
          compileMs: Math.round(compileMs),
          results,
        });
      }
    }

    res.json({ compileMs: Math.round(compileMs), results });
    } catch (err) {
      console.error("Unexpected reference run failure:", err);
      res.status(500).json({ error: "server_error", message: "Server error" });
    } finally {
      cleanupJob(job);
    }
  }
);

/*
 * Running the solver's own test cases.
 *
 * Separate from /submit on purpose, and it never produces a verdict. Run is for
 * debugging against input you made up; Submit is the official answer against
 * the problem's tests. Mixing them would let a page claim Accepted because
 * three cases the solver wrote themselves happened to pass.
 *
 * One compile for all the cases, same as judging.
 */
const MAX_CUSTOM_CASES = 10;

app.post("/run-batch", requireAuth, async (req, res) => {
  const { language = "cpp", code, cases, slug } = req.body;

  if (typeof code !== "string" || code.trim() === "") {
    return res.status(400).json({ verdict: "invalid_request", message: "Empty code!" });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({
      verdict: "invalid_request",
      message: `Code is longer than ${MAX_CODE_LENGTH} characters.`,
    });
  }
  if (!isSupported(language)) {
    return res.status(400).json({ verdict: "invalid_request", message: `Unsupported language "${language}".` });
  }
  if (!Array.isArray(cases) || cases.length === 0) {
    return res.status(400).json({ verdict: "invalid_request", message: "No test cases to run." });
  }
  if (cases.length > MAX_CUSTOM_CASES) {
    return res.status(400).json({
      verdict: "invalid_request",
      message: `At most ${MAX_CUSTOM_CASES} custom test cases at a time.`,
    });
  }

  /*
   * The same budget as /run, not a separate one.
   *
   * This is the same activity — your code, your input — and the only difference
   * is that up to ten cases go in one request. Giving it a budget of its own
   * would mean a person who had exhausted /run could carry straight on here,
   * running ten cases at a time instead of one.
   */
  if (!(await runLimits.gate("run", req, res))) return;
  await runLimits.record("run", req.user.id);

  // A custom run borrows the problem's time limit when there is a problem, so
  // a case that would time out officially times out here too.
  const problem = slug ? await getProblemBrief(slug) : null;
  const timeLimitMs = problem
    ? timeLimitFor(language, problem.timeLimitMs)
    : RUN_TIMEOUT_MS;
  const outputLimitBytes = problem ? problem.outputLimitBytes : undefined;

  try {
    const result = await runCustomCases({ language, code, cases, timeLimitMs, outputLimitBytes });
    res.json({ ...result, timeLimitMs });
  } catch (err) {
    console.error("Unexpected custom run failure:", err);
    res.status(500).json({ verdict: "server_error", message: "Server error" });
  }
});

/*
 * The AI features.
 *
 * Two of them, the complexity reading and the coding assistant, and both go
 * through one gate: the same rate limiter, the same cache, the same error
 * mapping. Adding a third would mean another entry in AI_ACTIONS and nothing
 * else.
 *
 * None of this is required for judging. If Gemini is down, rate limited, or has
 * no key, /submit and /run-batch carry on exactly as before. That separation is
 * deliberate: a judge that cannot decide a verdict without a language model
 * would be a judge that stops working when someone else's service does.
 */

const MAX_QUESTION_CHARS = 400;

// Maps an error from the Gemini client onto an HTTP status. The caller sees a
// 503 for "we are not set up", a 429 for "too busy", and a 502 for "the model
// refused", which are three different things to do something about.
function statusForGeminiError(code) {
  if (code === "not_configured") return 503;
  if (code === "busy") return 429;
  return 502;
}

/*
 * Everything an AI request has to pass before it costs anything.
 *
 * The order matters. The cache is consulted before the rate limiter, so asking
 * the same question twice about unchanged code is free and does not eat into
 * anyone's hourly allowance.
 */
async function runAiRequest({ req, res, fingerprintParts, work }) {
  if (!isConfigured()) {
    return res.status(503).json({
      error: "not_configured",
      message:
        "No Gemini API key. Add GEMINI_API_KEY to compiler/.env and restart the compiler service.",
    });
  }

  const who = req.user.id;
  const key = limits.fingerprint(fingerprintParts);

  const hit = await limits.cached(key);
  if (hit) {
    return res.json({ ...hit, cached: true, usage: await limits.usageFor(who) });
  }

  const verdict = await limits.check(who);
  if (!verdict.ok) {
    return res.status(429).json({
      error: verdict.reason,
      message: verdict.message,
      retryAfterSeconds: verdict.retryAfterSeconds,
      usage: await limits.usageFor(who),
    });
  }

  /*
   * begin() returns false when somebody else already holds this person's one
   * slot. check() asked the same question a moment ago, but between the two
   * lines a second request can arrive, and only the claim itself is atomic.
   * Without this, two clicks a millisecond apart both pass the check and both
   * reach Gemini.
   */
  if (!(await limits.begin(who))) {
    return res.status(429).json({
      error: "in_flight",
      message: "An AI request is already running. Wait for it to finish.",
      retryAfterSeconds: 3,
      usage: await limits.usageFor(who),
    });
  }

  try {
    const answer = await work();
    // Counted only now: a call that never reached Gemini should not use up an
    // allowance.
    await limits.record(who);
    await limits.remember(key, answer);
    res.json({ ...answer, cached: false, usage: await limits.usageFor(who) });
  } catch (err) {
    if (err instanceof GeminiError || err.code) {
      return res
        .status(statusForGeminiError(err.code))
        .json({ error: err.code, message: err.message, usage: await limits.usageFor(who) });
    }
    console.error("Unexpected AI failure:", err);
    res.status(500).json({ error: "server_error", message: "Server error" });
  } finally {
    await limits.end(who);
  }
}

// Time complexity, best, average and worst.
app.post("/analyse", requireAuth, async (req, res) => {
  const { language = "cpp", code } = req.body;

  if (typeof code !== "string" || code.trim() === "") {
    return res.status(400).json({ error: "invalid_request", message: "Empty code!" });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({
      error: "invalid_request",
      message: `Code is longer than ${MAX_CODE_LENGTH} characters.`,
    });
  }
  if (!isSupported(language)) {
    return res.status(400).json({ error: "invalid_request", message: `Unsupported language "${language}".` });
  }

  await runAiRequest({
    req,
    res,
    fingerprintParts: { kind: "analyse", language, code },
    work: () => analyse({ language, code }),
  });
});

/*
 * The coding assistant.
 *
 * The browser sends what failed; this adds the problem, because the statement
 * and the hidden tests live here and should not be shipped to the page just so
 * it can send them back.
 */
app.post("/assist", requireAuth, async (req, res) => {
  const {
    slug,
    language = "cpp",
    code,
    action = "explain",
    hintLevel = 1,
    question = "",
    verdict = "wrong_answer",
    passed,
    total,
    timeLimitMs,
    compilerOutput,
    runtimeOutput,
    failedTest,
  } = req.body;

  if (typeof code !== "string" || code.trim() === "") {
    return res.status(400).json({ error: "invalid_request", message: "Empty code!" });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({
      error: "invalid_request",
      message: `Code is longer than ${MAX_CODE_LENGTH} characters.`,
    });
  }
  if (!isSupported(language)) {
    return res.status(400).json({ error: "invalid_request", message: `Unsupported language "${language}".` });
  }
  if (!isSupportedAction(action)) {
    return res.status(400).json({ error: "invalid_request", message: `Unknown action "${action}".` });
  }
  if (action === "ask" && !String(question).trim()) {
    return res.status(400).json({ error: "invalid_request", message: "Ask the AI a question first." });
  }

  const problem = slug ? await getProblemBrief(slug) : null;
  const publicProblem = problem ? publicView(problem) : null;

  const context = {
    action,
    hintLevel: Number(hintLevel) || 1,
    question: String(question).slice(0, MAX_QUESTION_CHARS),
    language,
    code,
    problem: publicProblem,
    verdict,
    passed,
    total,
    timeLimitMs,
    compilerOutput,
    runtimeOutput,
    failedTest,
  };

  await runAiRequest({
    req,
    res,
    // The fingerprint is everything that would change the answer. Same code,
    // same failing test, same question: same answer, no second call.
    fingerprintParts: {
      kind: "assist",
      slug: slug || null,
      language,
      code,
      action,
      hintLevel: context.hintLevel,
      question: context.question,
      verdict,
      test: failedTest?.index ?? null,
      testLabel: failedTest?.label ?? null,
    },
    work: () => assist(context),
  });
});

/*
 * Body parser failures, answered in JSON.
 *
 * Express's default handler renders an HTML error page. Every caller here is
 * fetch() expecting JSON, so a request that was merely too long came back as
 * "<!DOCTYPE ..." and the page showed a parse error instead of the reason.
 * Registered last, so it catches errors thrown by the parsers that run first.
 */
app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      message: "That request is larger than this service accepts. Send less in one go.",
    });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "That request body was not valid JSON." });
  }
  return next(err);
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Compiler service listening on port ${PORT}`);
});
