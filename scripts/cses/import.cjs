/*
 * Imports the provided CSES problem set into the problems collection.
 *
 *   node scripts/cses/import.cjs --dry-run    report what would happen
 *   node scripts/cses/import.cjs              do it
 *   node scripts/cses/import.cjs --only 1,2   just those folder numbers
 *
 * WHY THIS IS A SCRIPT AND NOT A CALL TO THE AUTHORING API
 *
 * POST /admin/problems is the way a person adds a problem, and it insists on a
 * reference solution because a hand-typed problem has no expected output until
 * a trusted program produces one. That is exactly right for authoring and
 * exactly wrong here: these problems arrive WITH their expected outputs, and
 * writing four hundred reference solutions to regenerate answers we already
 * have would be inventing the very data the task says to preserve.
 *
 * So the script writes the same document to the same collection, in the same
 * shape, with the same test manifest, into the same testdata/<slug>/ layout the
 * authoring API uses. Nothing downstream can tell the difference: the compiler
 * reads a manifest and files, and it gets a manifest and files.
 *
 * WHY THE TEST FILES ARE COPIED RATHER THAN READ
 *
 * The set is 4.6 GB. backend/services/testStore.js takes test bodies as
 * strings, which is fine for the few megabytes an author types and is not fine
 * here — one problem alone carries 82 MB, and a single expected output reaches
 * 13.8 MB. Every provided file is therefore copied with fs.copyFileSync and
 * measured with fs.statSync; no test body is ever held in memory. The manifest
 * that results is byte-identical in shape to the one writeCases returns.
 *
 * ORDER OF THE TESTS
 *
 * Samples first, then the provided files, which is the order the authoring API
 * already uses and the order the judge reports failures in. The samples come
 * from the Example block of the statement, and they matter for a second
 * reason: publicView only ever sends tests marked "sample" to the browser, so
 * without them the problem page would show a statement with no worked example.
 * The provided files are not samples — they are the hidden tests — and they do
 * not duplicate the examples: test 1 of Weird Algorithm is n=7, the statement's
 * example is n=3.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { TESTDATA_DIR, connect, slugify, official } = require("./lib.cjs");
const { scanAll } = require("./scan.cjs");
const { parseStatement } = require("./parse.cjs");

const DRY = process.argv.includes("--dry-run");
const ONLY = (() => {
  const i = process.argv.indexOf("--only");
  if (i === -1) return null;
  return new Set(String(process.argv[i + 1] || "").split(",").map(Number).filter(Boolean));
})();

const RECOVERED = path.join(__dirname, "recovered");

/*
 * Where the numbering starts.
 *
 * Asked for as 501-900. Nothing in the database currently reaches 500 — the
 * highest number in use is 73 — so 501 upward leaves a deliberate gap rather
 * than sitting next to the existing problems. That is what was asked for and it
 * is safe: the gap cannot collide with anything, and it makes an imported
 * problem's number recognisable at a glance.
 */
const NUMBER_BASE = 500;

/*
 * Difficulty, which CSES does not publish.
 *
 * The schema requires one of Easy, Medium or Hard, and the problem list filters
 * on it, so every problem needs one. There is no per-problem difficulty to
 * import — CSES states none — so rather than guess four hundred times, this
 * derives one from the official category the problem already belongs to. It is
 * a rule, applied uniformly, and metadata.difficultySource records that the
 * value was derived rather than taken from the source. Anyone who disagrees
 * with a category's placement can change one line here and re-run.
 */
const DIFFICULTY_BY_CATEGORY = {
  "Introductory Problems": "Easy",

  "Sorting and Searching": "Medium",
  "Dynamic Programming": "Medium",
  "Graph Algorithms": "Medium",
  "Range Queries": "Medium",
  "Tree Algorithms": "Medium",
  "Mathematics": "Medium",
  "String Algorithms": "Medium",
  "Sliding Window Problems": "Medium",
  "Bitwise Operations": "Medium",

  "Geometry": "Hard",
  "Advanced Techniques": "Hard",
  "Construction Problems": "Hard",
  "Advanced Graph Problems": "Hard",
  "Counting Problems": "Hard",
  "Interactive Problems": "Hard",
  "Additional Problems I": "Hard",
  "Additional Problems II": "Hard",
};

/*
 * The limit this judge enforces, as opposed to the one CSES states.
 *
 * Every one of the 400 states 1.00 s, measured on CSES's own hardware. This
 * judge compiles and runs inside a container on whatever machine it is hosted
 * on, and the problems already here use 2000 ms as their baseline for the same
 * class of work. Enforcing 1000 ms would fail correct solutions for running on
 * different hardware, which is not what the stated limit means.
 *
 * The stated limit is not discarded: metadata.statedTimeLimitSeconds keeps it,
 * so the original is recoverable and the substitution is auditable. Per
 * language the number is scaled again by the judge — Python gets three times
 * this, Java twice — which is where an interpreted solution gets its room.
 */
const TIME_LIMIT_MS = 2000;

// Floor and ceiling on what a submission may print. The floor is the house
// default; the ceiling is generous because one problem's expected output is
// 13.8 MB and a correct solution has to be allowed to reproduce it.
const MIN_OUTPUT_LIMIT = 65536;
const MAX_OUTPUT_LIMIT = 64 * 1024 * 1024;

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

/*
 * An optional ceiling on a single test's size, for deployments that cannot
 * carry 4.6 GB.
 *
 * Unset, nothing is dropped and the import is exactly as before. Set, any pair
 * whose input plus expected output exceeds it is left out — of the files AND of
 * the manifest, which is the part that matters: the judge works from the
 * manifest, so a file missing from disk but listed in Mongo is a broken
 * problem, not a smaller one.
 *
 * At 1 MB this keeps 79% of the tests in 261 MB, a 17x reduction, and every
 * problem still has tests. What it costs is the large stress cases, which are
 * precisely the ones that separate a fast solution from a slow one — so a
 * capped deployment accepts some solutions the full judge would reject on time.
 * That is a real trade and it belongs in the deployment notes, not hidden here.
 */
const MAX_TEST_BYTES = Number(process.env.MAX_TEST_BYTES) || 0;

/*
 * The official category, as a tag.
 *
 * Lower-cased, because that is the vocabulary the existing problems already
 * use — "dynamic programming", "graph algorithms" — and the problem list builds
 * one topic facet per distinct tag string. Storing "Dynamic Programming" would
 * put a second entry beside the existing "dynamic programming" and split one
 * topic into two filters showing half the problems each.
 *
 * Roman numerals keep their capitals. The tag is rendered with CSS
 * `capitalize`, which raises the first letter of each word and leaves the rest
 * alone, so a lower-cased "additional problems ii" reaches the page as
 * "Additional Problems Ii". Only two categories are affected and neither
 * collides with an existing tag, so nothing is split by this.
 */
function topicTag(category) {
  return category
    .toLowerCase()
    .split(" ")
    .map((word) => (/^i+$/.test(word) ? word.toUpperCase() : word))
    .join(" ");
}

/* --------------------------------------------------------------- helpers -- */

// The judge feeds a test file to stdin. A file that does not end in a newline
// leaves the last line unterminated, which some readers never return. The
// authoring API normalises the same way.
function endsWithNewline(file) {
  const size = fs.statSync(file).size;
  if (size === 0) return true;
  const fd = fs.openSync(file, "r");
  const buf = Buffer.alloc(1);
  fs.readSync(fd, buf, 0, 1, size - 1);
  fs.closeSync(fd);
  return buf[0] === 0x0a;
}

/*
 * Puts a provided test file where the judge expects it.
 *
 * LINKED RATHER THAN COPIED
 *
 * The set is 4.6 GB and the host it is being imported on has 8.7 GB free.
 * Copying would leave two full sets on one disk and take it to 99% — so each
 * file is hard-linked instead, which costs a directory entry and no data at
 * all. The two paths become the same file on disk, which is exactly what is
 * wanted here: these are immutable inputs that nothing writes to, the compiler
 * mounts testdata/ read-only for precisely that reason, and deleting the
 * source folder later leaves the judge's copy intact because the data outlives
 * the last link to it.
 *
 * A link can fail — a different filesystem, a volume that does not support
 * them — so a copy is the fallback, and the caller is told which happened.
 *
 * RE-RUNS SKIP BY IDENTITY, NOT BY SIZE
 *
 * A destination already holding this exact file is left alone, so re-running
 * the import is close to free rather than another 4.6 GB of work. "Exact" here
 * means the same inode on the same device — the two paths are literally the
 * same file — and not merely the same size. Size alone would be a real hazard:
 * the manifest is numbered by position, so dropping one test shifts every test
 * after it down by one, and a shifted neighbour that happened to weigh the same
 * would be left in place and judged as somebody else's expected output. Inodes
 * cannot coincide that way.
 *
 * A destination that was copied rather than linked has no shared inode, so it
 * is replaced; that costs a copy on a filesystem without hard links and is the
 * safe direction to be wrong in.
 */
function placeFile(from, to) {
  const source = fs.statSync(from);
  try {
    const existing = fs.statSync(to);
    if (existing.ino === source.ino && existing.dev === source.dev) {
      return { bytes: existing.size, placed: false };
    }
    fs.rmSync(to, { force: true });
  } catch {
    /* destination missing: fall through and place it */
  }

  try {
    fs.linkSync(from, to);
  } catch {
    fs.copyFileSync(from, to);
  }
  return { bytes: fs.statSync(to).size, placed: true };
}

// Whole-file digest, read in chunks so a 13.8 MB expected output never becomes
// a 13.8 MB string.
function digest(file) {
  const hash = crypto.createHash("sha1");
  const fd = fs.openSync(file, "r");
  const buf = Buffer.alloc(1 << 20);
  let read;
  let pos = 0;
  while ((read = fs.readSync(fd, buf, 0, buf.length, pos)) > 0) {
    hash.update(buf.subarray(0, read));
    pos += read;
  }
  fs.closeSync(fd);
  return hash.digest("hex");
}

function writeText(to, text) {
  const body = text.endsWith("\n") ? text : `${text}\n`;
  let existing = null;
  try {
    existing = fs.readFileSync(to, "utf8");
  } catch {
    /* not there yet */
  }
  if (existing !== body) fs.writeFileSync(to, body);
  return Buffer.byteLength(body);
}

/* ---------------------------------------------------------------- build -- */

function buildProblem(scanned, officialEntry) {
  const notes = [];
  const number = scanned.number;

  /*
   * Two folders cannot supply a statement, and both are recorded rather than
   * papered over. 202 holds a byte-for-byte copy of 142 — the wrong statement
   * and the wrong tests — and 360 is an empty directory. Their statements come
   * from the official problem set instead; see recovered/README.md.
   */
  let statementFile = scanned.statementFiles[0] || null;
  let statementSource = "provided folder";
  const recovered = path.join(RECOVERED, `${scanned.dirName}.txt`);
  if (fs.existsSync(recovered)) {
    statementFile = recovered;
    statementSource = "official problem set (the provided folder could not supply one)";
    notes.push(
      number === 202
        ? "The provided folder holds a byte-for-byte copy of problem 142, Range Queries and Copies — the wrong statement and the wrong tests. Its tests are therefore not imported."
        : "The provided folder is empty: no statement and no tests."
    );
  }
  if (!statementFile) throw new Error(`${scanned.dirName}: no statement file`);

  const parsed = parseStatement(statementFile, officialEntry.title);

  const slug = `cses-${slugify(officialEntry.title)}`;
  if (!SLUG_RE.test(slug)) throw new Error(`${scanned.dirName}: unusable slug ${JSON.stringify(slug)}`);

  const difficulty = DIFFICULTY_BY_CATEGORY[officialEntry.cat];
  if (!difficulty) throw new Error(`${scanned.dirName}: no difficulty rule for category "${officialEntry.cat}"`);

  const interactive = officialEntry.cat === "Interactive Problems";

  /*
   * Which provided files become tests, and why an empty file is not one rule.
   *
   * An empty .out means two completely different things in this set, and
   * treating them alike would either throw away real tests or accept wrong
   * submissions:
   *
   *   Interactive problems (270-275). Every .out is zero bytes because there
   *   is no static answer to an interaction — the answer depends on what the
   *   solver asks. Keeping those would mean judging a program against an empty
   *   expected output, so any program that printed nothing would be marked
   *   correct. Every pair is skipped, and the problem carries a note saying so.
   *
   *   Everything else. Six problems have a test whose input contains updates
   *   and no queries at all, so printing nothing IS the right answer; that was
   *   checked by counting the query operations in each of those inputs. Those
   *   pairs are kept, because both the input and the expected output are real.
   *
   * A zero-byte INPUT is skipped everywhere: there is no such thing as a test
   * with no input in this set, so one is a truncated file rather than a case.
   */
  const usable = [];
  let skippedEmpty = 0;
  let skippedTooLarge = 0;
  for (const pair of scanned.pairs) {
    if (statementSource !== "provided folder" || interactive) { skippedEmpty += 1; continue; }
    const inBytes = fs.statSync(pair.input).size;
    if (inBytes === 0) { skippedEmpty += 1; continue; }
    if (MAX_TEST_BYTES && inBytes + fs.statSync(pair.expected).size > MAX_TEST_BYTES) {
      skippedTooLarge += 1;
      continue;
    }
    usable.push(pair);
  }

  if (interactive) {
    notes.push(
      "An interactive problem. The solver talks to a grader rather than reading a fixed input, " +
        "so there is no static test data to import and this judge cannot mark it."
    );
  }

  /*
   * Problems whose statement says any valid answer is accepted.
   *
   * This judge compares output to expected output, so a correct but different
   * answer is marked wrong. Flagged rather than hidden: it is a property of the
   * problem, it is worth knowing before spending an evening on one, and a
   * special judge added later can find every one of them with a single query.
   */
  const prose = [parsed.statement, parsed.outputFormat].join("\n");
  const multipleAnswers = /any of them|any of these|any one of them|print any|any valid|several solutions/i.test(prose);

  return {
    scanned, officialEntry, parsed, slug, difficulty, usable, skippedEmpty, skippedTooLarge,
    interactive, multipleAnswers, statementSource, notes,
    number: NUMBER_BASE + number,
  };
}

/* ---------------------------------------------------------------- write -- */

function writeTests(built) {
  const dir = path.join(TESTDATA_DIR, built.slug);

  /*
   * A problem with nothing to store gets no directory.
   *
   * The six interactive problems have no examples and no usable test files, so
   * creating a folder for them left six empty directories under testdata/ that
   * nothing ever reads — the judge works from the manifest, and theirs is
   * empty. An empty directory is not a neutral placeholder here; it reads as a
   * problem whose tests went missing, which is exactly the fault the validator
   * is meant to detect.
   */
  if (!built.parsed.examples.length && !built.usable.length) {
    fs.rmSync(dir, { recursive: true, force: true });
    return { manifest: [], copied: 0, largestExpected: 0, droppedAsDuplicate: 0 };
  }

  fs.mkdirSync(dir, { recursive: true });

  const manifest = [];
  let copied = 0;
  let largestExpected = 0;
  let droppedAsDuplicate = 0;

  // Samples first: the examples printed in the statement, and the only tests
  // the browser is ever shown.
  built.parsed.examples.forEach((example, i) => {
    const index = manifest.length + 1;
    const inputBytes = writeText(path.join(dir, `${index}.in`), example.input);
    const expectedBytes = writeText(path.join(dir, `${index}.out`), example.expected);
    largestExpected = Math.max(largestExpected, expectedBytes);
    manifest.push({
      index,
      kind: "sample",
      label: `Example ${i + 1}`,
      note: null,
      inputFile: `${built.slug}/${index}.in`,
      expectedFile: `${built.slug}/${index}.out`,
      inputBytes,
      expectedBytes,
    });
  });

  /*
   * A provided test identical to one of the samples is dropped.
   *
   * For 62 of the 400 the example printed in the statement turns out to be one
   * of the provided cases as well, byte for byte. Keeping both would make the
   * judge run the same test twice — wasted time out of a submission's 30
   * second budget, and a test count that overstates how much a solution was
   * actually checked against. The sample is the copy that stays, because it is
   * the one the browser is allowed to see.
   *
   * Sizes are compared first and the files are only hashed when both sizes
   * match a sample's, so this costs nothing on the 4.6 GB that cannot possibly
   * collide with a handful of kilobytes.
   */
  const sampleSizes = new Map();
  for (const entry of manifest) {
    const key = `${entry.inputBytes}:${entry.expectedBytes}`;
    if (!sampleSizes.has(key)) sampleSizes.set(key, []);
    sampleSizes.get(key).push(entry);
  }
  const sampleDigest = (entry) =>
    `${digest(path.join(dir, `${entry.index}.in`))}:${digest(path.join(dir, `${entry.index}.out`))}`;

  const provided = built.usable.filter((pair) => {
    const key = `${fs.statSync(pair.input).size}:${fs.statSync(pair.expected).size}`;
    const candidates = sampleSizes.get(key);
    if (!candidates) return true;
    const mine = `${digest(pair.input)}:${digest(pair.expected)}`;
    return !candidates.some((entry) => sampleDigest(entry) === mine);
  });
  droppedAsDuplicate = built.usable.length - provided.length;

  // Then the provided files, hidden from the browser, in their own numeric
  // order. "manual" is the authoring API's word for a curated hidden test,
  // which is exactly what these are.
  provided.forEach((pair, i) => {
    const index = manifest.length + 1;
    const a = placeFile(pair.input, path.join(dir, `${index}.in`));
    const b = placeFile(pair.expected, path.join(dir, `${index}.out`));
    if (a.placed || b.placed) copied += 1;
    largestExpected = Math.max(largestExpected, b.bytes);
    manifest.push({
      index,
      kind: "manual",
      label: `Test ${i + 1}`,
      note: null,
      inputFile: `${built.slug}/${index}.in`,
      expectedFile: `${built.slug}/${index}.out`,
      inputBytes: a.bytes,
      expectedBytes: b.bytes,
    });
  });

  /*
   * Anything left over from a previous run with more tests than this one.
   *
   * Without this an import that produced fewer tests would leave the extra
   * files behind, and the next one to grow the manifest would silently adopt
   * them as its own — a test whose expected output belongs to an older import.
   */
  for (const name of fs.readdirSync(dir)) {
    const m = name.match(/^(\d+)\.(in|out)$/);
    if (!m || Number(m[1]) > manifest.length) fs.rmSync(path.join(dir, name), { force: true });
  }

  return { manifest, copied, largestExpected, droppedAsDuplicate };
}

function documentFor(built, manifest, largestExpected) {
  const { parsed, officialEntry, scanned } = built;
  const now = new Date();

  return {
    slug: built.slug,
    problemId: `cses-${officialEntry.id}`,
    title: officialEntry.title,
    number: built.number,
    difficulty: built.difficulty,

    /*
     * Tags carry both the required marker and the topic.
     *
     * There is no separate topic field in this schema: the problem list builds
     * its topic facet out of `tags`, and the existing problems put things like
     * "dynamic programming" there. So the official category goes in as a tag,
     * lower-cased to match the vocabulary already in use, alongside "cses".
     */
    tags: ["cses", topicTag(officialEntry.cat)],

    statement: parsed.statement,
    inputFormat: parsed.inputFormat,
    outputFormat: parsed.outputFormat,
    constraints: parsed.constraints,
    hint: "",
    starter: {},

    timeLimitMs: TIME_LIMIT_MS,
    outputLimitBytes: Math.min(Math.max(MIN_OUTPUT_LIMIT, largestExpected * 2), MAX_OUTPUT_LIMIT),
    tests: manifest,

    editorial: null,

    /*
     * Internal only — publicView never returns it. Everything here is either
     * administrative (where a problem came from, so the import can be re-run
     * and audited) or a caveat the maintainer needs and a solver does not.
     */
    metadata: {
      origin: "cses",
      taskId: officialEntry.id,
      officialTitle: officialEntry.title,
      officialCategory: officialEntry.cat,
      officialIndex: scanned.number,
      sourceFolder: scanned.dirName,
      statementSource: built.statementSource,
      difficultySource: "derived from the official category",
      statedTimeLimitSeconds: parsed.timeLimitSeconds,
      statedMemoryLimitMb: parsed.memoryLimitMb,
      enforcedTimeLimitMs: TIME_LIMIT_MS,
      providedPairs: scanned.pairs.length,
      importedProvidedTests: built.usable.length - (built.droppedAsDuplicate || 0),
      skippedEmptyPairs: built.skippedEmpty,
      // Provided cases dropped because the statement's example already covers
      // them byte for byte; the sample is kept instead.
      droppedAsDuplicateOfSample: built.droppedAsDuplicate || 0,
      // Only meaningful when MAX_TEST_BYTES was set; 0 on a full import.
      skippedTooLarge: built.skippedTooLarge,
      maxTestBytes: MAX_TEST_BYTES || null,
      sampleTests: parsed.examples.length,
      interactive: built.interactive,
      multipleAnswers: built.multipleAnswers,
      parserNotes: parsed.problems,
      notes: built.notes,
      importedAt: now,
    },

    // No reference solution: the expected outputs arrived with the problem and
    // were not produced here. Recorded as null rather than omitted so the shape
    // stays the same as an authored problem's.
    referenceSolution: null,
    generator: null,

    published: true,
    source: "cses-import",
  };
}

/* ----------------------------------------------------------------- main -- */

async function main() {
  const off = official();
  if (off.length !== 400) throw new Error(`official.json holds ${off.length} problems, expected 400`);

  const scanned = scanAll();
  if (scanned.length !== 400) throw new Error(`found ${scanned.length} problem folders, expected 400`);

  const { client, problems } = await connect();
  try {
    // Every existing slug and number, so nothing here can land on one.
    const existing = await problems
      .find({}, { projection: { slug: 1, number: 1, problemId: 1, source: 1 } })
      .toArray();
    const mine = new Set(existing.filter((d) => d.source === "cses-import").map((d) => d.slug));
    const theirSlugs = new Set(existing.filter((d) => d.source !== "cses-import").map((d) => d.slug));
    const theirNumbers = new Set(
      existing.filter((d) => d.source !== "cses-import").map((d) => d.number).filter(Number.isInteger)
    );

    let created = 0, updated = 0, filesCopied = 0, tests = 0, bytes = 0;
    const failures = [];

    for (const entry of scanned) {
      if (ONLY && !ONLY.has(entry.number)) continue;
      const officialEntry = off[entry.number - 1];

      try {
        const built = buildProblem(entry, officialEntry);

        if (theirSlugs.has(built.slug)) {
          throw new Error(`slug "${built.slug}" already belongs to a problem that is not part of this import`);
        }
        if (theirNumbers.has(built.number)) {
          throw new Error(`number ${built.number} already belongs to a problem that is not part of this import`);
        }

        if (DRY) {
          const samples = built.parsed.examples.length;
          console.log(
            `  #${built.number}  ${built.slug.padEnd(38)} ${String(samples)}+${String(built.usable.length).padStart(3)} tests  ` +
              `${built.difficulty.padEnd(6)} ${officialEntry.cat}` +
              (built.notes.length ? `  <- ${built.notes.length} note(s)` : "")
          );
          continue;
        }

        const { manifest, copied, largestExpected, droppedAsDuplicate } = writeTests(built);
        built.droppedAsDuplicate = droppedAsDuplicate;
        filesCopied += copied;
        tests += manifest.length;
        bytes += manifest.reduce((n, m) => n + m.inputBytes + m.expectedBytes, 0);

        const doc = documentFor(built, manifest, largestExpected);
        const was = await problems.findOne({ problemId: doc.problemId }, { projection: { _id: 1, createdAt: 1, createdBy: 1 } });

        if (was) {
          // createdAt belongs to the first import, not this one.
          const { ...changes } = doc;
          await problems.updateOne({ _id: was._id }, { $set: { ...changes, updatedAt: new Date() } });
          updated += 1;
        } else {
          await problems.insertOne({ ...doc, createdBy: null, createdAt: new Date(), updatedAt: new Date() });
          created += 1;
        }
        mine.add(doc.slug);

        if ((created + updated) % 25 === 0) {
          process.stdout.write(`  ${created + updated} / 400  (${(bytes / 1e9).toFixed(2)} GB)\n`);
        }
      } catch (err) {
        failures.push(`#${entry.number} ${entry.dirName}: ${err.message}`);
      }
    }

    console.log("");
    if (DRY) {
      console.log("Dry run. Nothing was written.");
    } else {
      console.log(`  created        ${created}`);
      console.log(`  updated        ${updated}`);
      console.log(`  tests written  ${tests}`);
      console.log(`  files placed   ${filesCopied} tests needed files written or linked`);
      console.log(`  test bytes     ${(bytes / 1e9).toFixed(2)} GB`);
    }
    if (failures.length) {
      console.log(`\n=== ${failures.length} FAILED ===`);
      failures.forEach((f) => console.log("  " + f));
      process.exitCode = 1;
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
