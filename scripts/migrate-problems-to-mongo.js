/*
 * Moves the two file-based problems into MongoDB, once.
 *
 * The folders under compiler/problems/ were the only source of problems until
 * the Add Problem page existed. Rather than keep two code paths alive forever,
 * this reads those folders and writes them into the database in the shape the
 * new code expects: the problem as a document, its tests as files under
 * compiler/testdata/ with a manifest in the document pointing at them.
 *
 * Safe to run twice. Each problem is upserted by slug, so a second run
 * overwrites rather than duplicating. Nothing is deleted from compiler/problems/
 * either, so the originals stay until you remove them yourself.
 *
 *   node scripts/migrate-problems-to-mongo.js
 */

const fs = require("fs");
const path = require("path");

const COMPILER = path.join(__dirname, "..", "compiler");
require(path.join(COMPILER, "node_modules/dotenv")).config({ path: path.join(COMPILER, ".env") });
const { MongoClient } = require(path.join(COMPILER, "node_modules/mongodb"));

const SOURCE = path.join(COMPILER, "problems");
const TESTDATA = process.env.TESTDATA_DIR || path.join(COMPILER, "testdata");

function readTests(slug) {
  const dir = path.join(SOURCE, slug, "tests");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".in"))
    .map((name) => Number(name.replace(".in", "")))
    .filter(Number.isInteger)
    .sort((a, b) => a - b)
    .map((index) => ({
      index,
      input: fs.readFileSync(path.join(dir, `${index}.in`), "utf8"),
      expected: fs.readFileSync(path.join(dir, `${index}.out`), "utf8"),
    }));
}

async function main() {
  if (!process.env.MONGODB_URI || !process.env.DB_NAME) {
    throw new Error("MONGODB_URI and DB_NAME must be set in compiler/.env");
  }
  if (!fs.existsSync(SOURCE)) {
    console.log("Nothing to migrate: compiler/problems does not exist.");
    return;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const problems = client.db(process.env.DB_NAME).collection("problems");
  await problems.createIndex({ slug: 1 }, { unique: true });

  for (const slug of fs.readdirSync(SOURCE)) {
    const definition = path.join(SOURCE, slug, "problem.json");
    if (!fs.existsSync(definition)) continue;

    const problem = JSON.parse(fs.readFileSync(definition, "utf8"));
    const tests = readTests(slug);
    if (!tests.length) {
      console.log(`  ${slug}: no tests, skipped`);
      continue;
    }

    // Copy the test files across rather than move them, so compiler/problems
    // still works if this needs to be undone.
    const dir = path.join(TESTDATA, slug);
    fs.mkdirSync(dir, { recursive: true });

    const sampleCount = problem.sampleCount || 0;
    const sampleNotes = problem.sampleNotes || [];

    const manifest = tests.map((test, position) => {
      fs.writeFileSync(path.join(dir, `${test.index}.in`), test.input);
      fs.writeFileSync(path.join(dir, `${test.index}.out`), test.expected);
      return {
        index: test.index,
        // The first sampleCount tests were the ones shown in the statement.
        // Everything after came out of scripts/generate-tests.js.
        kind: position < sampleCount ? "sample" : "generated",
        label: position < sampleCount ? `Example ${position + 1}` : null,
        note: position < sampleCount ? sampleNotes[position] || null : null,
        inputFile: `${slug}/${test.index}.in`,
        expectedFile: `${slug}/${test.index}.out`,
        inputBytes: Buffer.byteLength(test.input),
        expectedBytes: Buffer.byteLength(test.expected),
      };
    });

    const now = new Date();
    await problems.updateOne(
      { slug },
      {
        $set: {
          slug,
          title: problem.title,
          difficulty: problem.difficulty,
          tags: problem.tags || [],
          statement: problem.statement,
          inputFormat: problem.inputFormat,
          outputFormat: problem.outputFormat,
          constraints: problem.constraints || [],
          hint: problem.hint || "",
          starter: problem.starter || {},
          timeLimitMs: problem.timeLimitMs,
          tests: manifest,
          published: true,
          // These two came from files written by hand and by the old script, so
          // there is no reference solution or generator spec to record.
          referenceSolution: null,
          generator: null,
          source: "migrated-from-files",
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now, createdBy: null },
      },
      { upsert: true }
    );

    const bytes = manifest.reduce((n, e) => n + e.inputBytes + e.expectedBytes, 0);
    console.log(
      `  ${slug}: ${manifest.length} tests (${manifest.filter((m) => m.kind === "sample").length} samples), ` +
        `${(bytes / 1024 / 1024).toFixed(2)} MB written to testdata/${slug}/`
    );
  }

  const total = await problems.countDocuments();
  console.log(`problems collection now holds ${total} document(s).`);
  await client.close();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
