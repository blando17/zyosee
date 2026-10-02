/*
 * Authoring problems.
 *
 * Creating a problem is the one operation here that does real work, so it is
 * worth saying what the steps are before reading the code:
 *
 *   1. validate what the form sent
 *   2. assemble the ordered list of test INPUTS
 *        samples    the examples the author typed, shown in the statement
 *        manual     edge cases the author typed, hidden from solvers
 *        generated  built from the constraints, seeded, climbing in size
 *   3. run the author's reference solution over every input, via the compiler
 *   4. check the reference agrees with the examples the author typed
 *   5. write the test files to disk, and the problem plus its manifest to Mongo
 *
 * Step 4 is the one that earns its place. If an author writes "input 4 / output
 * 0 1" in an example and their reference solution prints something else, one of
 * the two is wrong, and finding out now is far better than finding out from a
 * solver whose correct answer was marked wrong.
 */

const { ObjectId } = require("mongodb");
const { problemsCollection } = require("../config/db");
const { generateInputs, validateSpec, specFromConstraints } = require("../services/testGenerator");
const { writeCases, removeProblem, slugify, totalBytes } = require("../services/testStore");
const { runReference, ReferenceError } = require("../services/referenceRunner");

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const LANGUAGES = ["cpp", "c", "py", "java"];
const MIN_EXAMPLES = 2;

// The usual ceiling on what one program may print, and the most an author may
// end up with. A problem printing more than 8 MB per test is almost always a
// mistake in the reference solution rather than a real requirement.
const DEFAULT_OUTPUT_LIMIT = Number(process.env.MAX_OUTPUT_BYTES) || 65536;
const MAX_OUTPUT_LIMIT = Number(process.env.MAX_PROBLEM_OUTPUT_BYTES) || 8 * 1024 * 1024;

// Same comparison the judge uses. Trailing whitespace on a line and blank lines
// at the end of a file are not differences, and treating them as such here
// would reject examples the judge would happily accept.
function normalise(text) {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

function asList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (typeof value === "string") {
    return value.split("\n").map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

/*
 * The editorial, kept as named sections.
 *
 * Anything missing becomes null rather than an empty string, so the page can
 * tell "this problem has no editorial" apart from "this section was left
 * blank", and show the right thing in each case.
 */
const EDITORIAL_SECTIONS = [
  "understanding", "approach", "steps", "algorithm", "whyItWorks",
  "complexity", "edgeCases", "implementation",
];

function normaliseEditorial(value) {
  if (!value || typeof value !== "object") return null;
  const out = {};
  let any = false;
  for (const key of EDITORIAL_SECTIONS) {
    const v = value[key];
    if (v === undefined || v === null || v === "") { out[key] = null; continue; }
    out[key] = v;
    any = true;
  }
  return any ? out : null;
}

function validate(body) {
  const errors = [];
  const title = String(body.title || "").trim();

  if (title.length < 3) errors.push("Question needs a title of at least 3 characters.");
  if (!String(body.statement || "").trim()) errors.push("Description is required.");
  if (!String(body.inputFormat || "").trim()) errors.push("Input format is required.");
  if (!String(body.outputFormat || "").trim()) errors.push("Output format is required.");
  if (!DIFFICULTIES.includes(body.difficulty)) errors.push("Difficulty must be Easy, Medium or Hard.");
  if (!asList(body.constraints).length) errors.push("Add at least one constraint.");

  const examples = Array.isArray(body.examples) ? body.examples : [];
  const usable = examples.filter((e) => String(e.input || "").trim() && String(e.expected || "").trim());
  if (usable.length < MIN_EXAMPLES) {
    errors.push(`Add at least ${MIN_EXAMPLES} examples, each with an input and an expected output.`);
  }

  const reference = body.referenceSolution || {};
  if (!LANGUAGES.includes(reference.language)) {
    errors.push("Reference solution needs a language.");
  }
  if (!String(reference.code || "").trim()) {
    errors.push(
      "A reference solution is required. Generated inputs have no expected output until a " +
        "trusted solution produces one."
    );
  }

  const timeLimitMs = Number(body.timeLimitMs);
  if (!Number.isInteger(timeLimitMs) || timeLimitMs < 200 || timeLimitMs > 15000) {
    errors.push("Time limit must be between 200 and 15000 ms.");
  }

  // The generator is optional: a problem may ship with only curated tests.
  const spec = body.generator;
  const wantsGenerated = spec && Number(spec.cases) > 0 && (spec.fields || []).length > 0;
  if (wantsGenerated) errors.push(...validateSpec(spec));

  return { errors, wantsGenerated };
}

/*
 * Turns the form into the ordered list of inputs the judge will run, and
 * remembers what each one is for. Order matters: samples first so test 1 is
 * something a solver can see, generated last so the big cases decide whether a
 * slow solution times out.
 */
function assembleInputs(body, wantsGenerated) {
  const plan = [];

  (body.examples || [])
    .filter((e) => String(e.input || "").trim() && String(e.expected || "").trim())
    .forEach((example, position) => {
      plan.push({
        kind: "sample",
        label: `Example ${position + 1}`,
        note: String(example.note || "").trim() || null,
        input: String(example.input).replace(/\r\n/g, "\n").replace(/\n*$/, "\n"),
        authorExpected: String(example.expected),
      });
    });

  (body.manualTests || [])
    .filter((t) => String(t.input || "").trim())
    .forEach((test, position) => {
      plan.push({
        kind: "manual",
        label: String(test.label || "").trim() || `Curated ${position + 1}`,
        note: null,
        input: String(test.input).replace(/\r\n/g, "\n").replace(/\n*$/, "\n"),
        authorExpected: String(test.expected || "").trim() || null,
      });
    });

  if (wantsGenerated) {
    generateInputs(body.generator).forEach((input, position) => {
      plan.push({
        kind: "generated",
        label: `Generated ${position + 1}`,
        note: null,
        input,
        authorExpected: null,
      });
    });
  }

  return plan;
}

async function createProblem(req, res) {
  try {
    const { errors, wantsGenerated } = validate(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const slug = slugify(req.body.slug || req.body.title);
    if (!slug) return res.status(400).json({ message: "Could not build a URL slug from that title." });

    const problems = await problemsCollection();

    /*
     * Re-running an import must update, not duplicate or fail.
     *
     * A problem is identified by problemId, falling back to slug for anything
     * authored through the form before problemId existed. Without `upsert` the
     * route still refuses a duplicate, which is what the Add Problem page
     * wants: somebody typing a title that already exists has made a mistake,
     * not asked for an overwrite.
     */
    const problemId = String(req.body.problemId || slug);
    const existing = await problems.findOne({ $or: [{ problemId }, { slug }] });
    const upsert = req.body.upsert === true;

    if (existing && !upsert) {
      return res.status(409).json({ message: `A problem with the slug "${slug}" already exists.` });
    }
    if (existing && existing.slug !== slug) {
      // The same problemId under a new slug would orphan the old test files and
      // leave two URLs for one problem. Refuse rather than guess.
      return res.status(409).json({
        message:
          `Problem "${problemId}" is already stored as "${existing.slug}". ` +
          `Delete it first if the slug really should change to "${slug}".`,
      });
    }

    let plan;
    try {
      plan = assembleInputs(req.body, wantsGenerated);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!plan.length) return res.status(400).json({ message: "No test cases to build." });

    // Ground truth for every input, from the author's own solution.
    const { outputs, compileMs, largestOutputBytes } = await runReference({
      language: req.body.referenceSolution.language,
      code: req.body.referenceSolution.code,
      inputs: plan.map((p) => p.input),
      timeLimitMs: Number(req.body.timeLimitMs),
    });

    // Does the reference agree with the examples the author wrote by hand?
    const disagreements = [];
    plan.forEach((entry, i) => {
      if (entry.authorExpected === null) return;
      if (normalise(outputs[i]) !== normalise(entry.authorExpected)) {
        disagreements.push({
          label: entry.label,
          youWrote: normalise(entry.authorExpected).slice(0, 200),
          referencePrinted: normalise(outputs[i]).slice(0, 200),
        });
      }
    });
    if (disagreements.length) {
      return res.status(400).json({
        message:
          `Your reference solution disagrees with ${disagreements.length} of the outputs you typed. ` +
          `Fix whichever is wrong before saving, or every solver will be judged against the reference.`,
        disagreements,
      });
    }

    const cases = plan.map((entry, i) => ({
      kind: entry.kind,
      label: entry.label,
      note: entry.note,
      input: entry.input,
      // The reference's output is what gets stored, even for the examples, so
      // the file on disk and the program that produced it can never drift.
      expected: outputs[i],
    }));

    const manifest = await writeCases(slug, cases);
    const now = new Date();

    /*
     * How much a submission to this problem may print.
     *
     * Measured rather than asked for. The reference solution just printed the
     * correct answer to every test, so the largest of those is exactly what a
     * correct submission has to be allowed to produce. Doubling it leaves room
     * for a different but equally valid formatting, and the floor keeps small
     * problems on the usual 64 KB.
     *
     * This is one number used in two places, and it has to be: the ceiling for
     * judging and the ceiling for the run that produced the expected output.
     * Raising one without the other is how a problem becomes unsolvable.
     */
    const outputLimitBytes = Math.min(
      Math.max(DEFAULT_OUTPUT_LIMIT, largestOutputBytes * 2),
      MAX_OUTPUT_LIMIT
    );

    const document = {
      slug,
      // A stable identity that survives a title change, and the key the
      // importer upserts on so re-running it updates rather than duplicates.
      problemId: String(req.body.problemId || slug),
      title: String(req.body.title).trim(),
      difficulty: req.body.difficulty,
      tags: asList(req.body.tags),
      statement: String(req.body.statement).trim(),
      inputFormat: String(req.body.inputFormat).trim(),
      outputFormat: String(req.body.outputFormat).trim(),
      constraints: asList(req.body.constraints),
      hint: String(req.body.hint || "").trim(),
      starter: req.body.starter && typeof req.body.starter === "object" ? req.body.starter : {},
      timeLimitMs: Number(req.body.timeLimitMs),
      outputLimitBytes,
      tests: manifest,
      /*
       * An editorial, when the author wrote one. Stored as structured sections
       * rather than one blob so the page can lay them out, and so a missing
       * section is visibly missing rather than silently absent from prose.
       */
      editorial: normaliseEditorial(req.body.editorial),
      /*
       * Internal only. Where a problem came from is an administrative fact
       * useful for re-running an import; it is not something a solver should
       * ever see, so publicView never returns it.
       */
      metadata: req.body.metadata && typeof req.body.metadata === "object" ? req.body.metadata : null,
      // Kept so a problem can be rebuilt rather than backed up: the same spec
      // and seed reproduce byte-identical inputs, and the same reference
      // solution reproduces the outputs.
      referenceSolution: {
        language: req.body.referenceSolution.language,
        code: req.body.referenceSolution.code,
      },
      generator: wantsGenerated ? req.body.generator : null,
      published: req.body.published !== false,
      source: "authored",
      createdBy: req.admin ? { id: req.admin.id, email: req.admin.email } : null,
      createdAt: now,
      updatedAt: now,
    };

    if (existing) {
      // createdAt and createdBy belong to the first import, not this one.
      const { createdAt, createdBy, ...changes } = document;
      await problems.updateOne({ _id: existing._id }, { $set: changes });
    } else {
      await problems.insertOne(document);
    }

    res.status(existing ? 200 : 201).json({
      action: existing ? "updated" : "created",
      problemId,
      slug,
      title: document.title,
      testCount: manifest.length,
      samples: manifest.filter((m) => m.kind === "sample").length,
      manual: manifest.filter((m) => m.kind === "manual").length,
      generated: manifest.filter((m) => m.kind === "generated").length,
      bytes: totalBytes(manifest),
      outputLimitBytes,
      largestOutputBytes,
      compileMs,
    });
  } catch (err) {
    if (err instanceof ReferenceError) {
      return res.status(400).json({ message: err.message, code: err.code, detail: err.detail });
    }
    console.error("Creating a problem failed:", err);
    res.status(500).json({ message: "Server error" });
  }
}

/*
 * A dry run of the generator, for the form's "Preview" button.
 *
 * Inputs only, no reference solution and nothing written. It answers the one
 * question an author has while filling in ranges: does this spec produce the
 * shape of input I meant? Cheap enough to press repeatedly.
 */
async function previewTests(req, res) {
  try {
    const spec = req.body.generator;
    const errors = validateSpec(spec);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const inputs = generateInputs(spec);
    res.json({
      count: inputs.length,
      totalBytes: inputs.reduce((n, s) => n + Buffer.byteLength(s), 0),
      cases: inputs.map((input, i) => ({
        index: i + 1,
        bytes: Buffer.byteLength(input),
        // Enough to see the shape without shipping two megabytes to a form.
        preview: input.length > 400 ? input.slice(0, 400) + "\n…" : input,
      })),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Turns the constraint lines the author already typed into a starting spec, so
// the generator section arrives partly filled in rather than empty.
async function suggestSpec(req, res) {
  res.json(specFromConstraints(asList(req.body.constraints)));
}

// The admin list: everything, including unpublished, with counts rather than
// the tests themselves.
async function listAll(req, res) {
  try {
    const problems = await problemsCollection();
    const docs = await problems
      .find({}, { projection: { statement: 0, referenceSolution: 0, starter: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(
      docs.map((doc) => ({
        slug: doc.slug,
        title: doc.title,
        difficulty: doc.difficulty,
        tags: doc.tags || [],
        published: doc.published !== false,
        source: doc.source || "authored",
        testCount: (doc.tests || []).length,
        bytes: totalBytes(doc.tests || []),
        createdAt: doc.createdAt,
      }))
    );
  } catch (err) {
    console.error("Listing problems failed:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteProblem(req, res) {
  try {
    const problems = await problemsCollection();
    const doc = await problems.findOne({ slug: req.params.slug });
    if (!doc) return res.status(404).json({ message: "No such problem." });

    await problems.deleteOne({ slug: req.params.slug });
    // Files after the document, so a failure here leaves orphaned files rather
    // than a problem whose tests have vanished from under it.
    await removeProblem(req.params.slug);
    res.json({ message: `Deleted "${doc.title}".` });
  } catch (err) {
    console.error("Deleting a problem failed:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createProblem, previewTests, suggestSpec, listAll, deleteProblem };
