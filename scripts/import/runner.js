/*
 * Imports authored problems into the judge.
 *
 * It posts each problem to the accounts API's /admin/problems route rather than
 * writing to MongoDB itself, and that is the whole design. Going through the
 * route means every imported problem takes exactly the same path as one typed
 * into the Add Problem page:
 *
 *   - the reference solution is compiled by the real compiler
 *   - expected outputs come from running it, never from anything written here
 *   - the examples are checked against it and the import fails if they disagree
 *   - test files are written by the existing store, with the existing manifest
 *   - the per-problem output limit is measured, not guessed
 *
 * Writing to Mongo directly would be faster and would quietly skip all of that,
 * which is how a judge ends up with problems whose expected output nobody ever
 * verified.
 *
 * Idempotent: each problem carries a problemId, and the route updates a problem
 * that already has that id instead of duplicating or refusing it. Re-running
 * the whole import is safe, and problems not in the import are untouched.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const BACKEND = path.join(ROOT, "backend");
require(path.join(BACKEND, "node_modules/dotenv")).config({ path: path.join(BACKEND, ".env") });
const jwt = require(path.join(BACKEND, "node_modules/jsonwebtoken"));
const { MongoClient, ObjectId } = require(path.join(BACKEND, "node_modules/mongodb"));

const API = process.env.ACCOUNTS_URL || `http://localhost:${process.env.PORT || 5001}`;
const PROBLEM_DIR = path.join(__dirname, "problems");

if (process.env.DNS_SERVERS) {
  require("dns").setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
}

/*
 * A token for a real administrator.
 *
 * The route checks the caller's email against ADMIN_EMAILS, so the script
 * cannot invent an identity: it finds the first allow-listed account that
 * actually exists and signs a short token for it. If nobody matches, that is a
 * configuration problem worth stopping for rather than working around.
 */
async function adminToken() {
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!allowed.length) {
    throw new Error("ADMIN_EMAILS is empty in backend/.env, so no account may import problems.");
  }

  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  try {
    const users = client.db(process.env.DB_NAME).collection("users");
    const user = await users.findOne({ email: { $in: allowed } }, { projection: { _id: 1, email: 1 } });
    if (!user) {
      throw new Error(
        `No account exists for any of ADMIN_EMAILS (${allowed.join(", ")}). ` +
          `Sign up with one of them first.`
      );
    }
    /*
     * Also read what is already stored, so the import can leave alone anything
     * it did not create.
     *
     * two-sum and three-sum were authored before this import existed and have
     * test data tuned by hand — a brute-force solution is meant to time out on
     * exactly test 9. Silently overwriting them with a fresh import would throw
     * that away. Anything whose slug is taken by a problem carrying a different
     * problemId is reported and skipped instead.
     */
    const existing = await client
      .db(process.env.DB_NAME)
      .collection("problems")
      .find({}, { projection: { slug: 1, problemId: 1 } })
      .toArray();

    return {
      token: jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET_KEY, { expiresIn: "2h" }),
      email: user.email,
      existing,
    };
  } finally {
    await client.close();
  }
}

function loadProblems(filter) {
  if (!fs.existsSync(PROBLEM_DIR)) return [];
  return fs
    .readdirSync(PROBLEM_DIR)
    .filter((f) => f.endsWith(".js"))
    .sort()
    .map((f) => {
      const mod = require(path.join(PROBLEM_DIR, f));
      mod.__file = f;
      return mod;
    })
    .filter((p) => !filter || p.slug.includes(filter) || String(p.problemId).includes(filter));
}

// The route's own shape. Kept in one place so a schema change is one edit.
function toRequest(p) {
  return {
    problemId: p.problemId,
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    tags: p.topics || [],
    statement: p.statement,
    inputFormat: p.inputFormat,
    outputFormat: p.outputFormat,
    constraints: p.constraints,
    hint: p.hint || "",
    timeLimitMs: p.timeLimitMs || 2000,
    examples: p.examples,
    manualTests: p.curated || [],
    referenceSolution: p.reference,
    generator: p.generator || null,
    editorial: p.editorial || null,
    metadata: p.metadata || null,
    starter: p.starter || {},
    upsert: true,
  };
}

async function main() {
  const filter = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;
  const problems = loadProblems(filter);

  if (!problems.length) {
    console.log(`No problem modules found in ${PROBLEM_DIR}${filter ? ` matching "${filter}"` : ""}.`);
    return;
  }

  const { token, email, existing } = await adminToken();
  const bySlug = new Map(existing.map((e) => [e.slug, e]));
  console.log(`Importing ${problems.length} problem(s) as ${email} via ${API}\n`);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const summary = { created: 0, updated: 0, skipped: 0, failed: 0, tests: 0, curated: 0, generated: 0, samples: 0 };
  const failures = [];
  const skipped = [];

  for (const p of problems) {
    const started = Date.now();
    process.stdout.write(`  ${String(p.problemId).padEnd(9)} ${p.slug.padEnd(38)} `);

    const clash = bySlug.get(p.slug);
    if (clash && clash.problemId !== p.problemId) {
      summary.skipped += 1;
      skipped.push({ slug: p.slug, reason: "a problem already uses this slug and was not created by this import" });
      console.log("skipped  already exists, left untouched");
      continue;
    }

    try {
      const res = await fetch(`${API}/admin/problems`, {
        method: "POST", headers, body: JSON.stringify(toRequest(p)),
      });
      const data = await res.json();

      if (!res.ok) {
        summary.failed += 1;
        failures.push({ slug: p.slug, message: data.message, detail: data.disagreements });
        console.log(`FAILED  ${String(data.message).slice(0, 80)}`);
        continue;
      }

      summary[data.action === "updated" ? "updated" : "created"] += 1;
      summary.tests += data.testCount || 0;
      summary.curated += data.manual || 0;
      summary.generated += data.generated || 0;
      summary.samples += data.samples || 0;
      console.log(
        `${(data.action || "created").padEnd(7)} ${String(data.testCount).padStart(3)} tests ` +
          `(${data.samples}s/${data.manual}c/${data.generated}g) ` +
          `${((data.bytes || 0) / 1024 / 1024).toFixed(2)}MB  ${Date.now() - started}ms`
      );
    } catch (err) {
      summary.failed += 1;
      failures.push({ slug: p.slug, message: err.message });
      console.log(`ERROR   ${err.message}`);
    }
  }

  console.log("\n=== summary ===");
  console.log(`  created            ${summary.created}`);
  console.log(`  updated            ${summary.updated}`);
  console.log(`  skipped            ${summary.skipped}`);
  console.log(`  failed             ${summary.failed}`);
  console.log(`  test cases written ${summary.tests} (${summary.samples} sample, ${summary.curated} curated, ${summary.generated} generated)`);

  if (skipped.length) {
    console.log("\n=== skipped, existing problems left untouched ===");
    for (const s2 of skipped) console.log(`  ${s2.slug}: ${s2.reason}`);
  }

  if (failures.length) {
    console.log("\n=== needs attention ===");
    for (const f of failures) {
      console.log(`  ${f.slug}: ${f.message}`);
      if (f.detail) for (const d of f.detail) {
        console.log(`      ${d.label}: you wrote ${JSON.stringify(d.youWrote)}, reference printed ${JSON.stringify(d.referencePrinted)}`);
      }
    }
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
