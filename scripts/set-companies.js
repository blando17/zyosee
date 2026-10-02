/*
 * Writes each problem's interview companies into MongoDB.
 *
 * The data lives in scripts/companies.txt rather than in this file, so the list
 * can be edited without touching code, and so a diff shows which problems
 * changed rather than one unreadable blob.
 *
 * Why this writes to Mongo directly, when the problem importer deliberately
 * does not: the importer goes through the admin route because everything it
 * writes has to be compiled and checked against a reference solution. Companies
 * are a label. There is nothing to verify by running, and routing them through
 * the authoring route would mean re-running every problem's tests to change a
 * list of names.
 *
 * It is written as its own field rather than folded into `tags`, because tags
 * describe the technique and drive the problem list's filtering. Mixing company
 * names in would make "Amazon" look like an algorithm.
 *
 * Safe to re-run: each problem's list is replaced with what the file says, so
 * the file is the truth and running twice changes nothing the first run did not.
 * It also survives a re-import, because the importer updates a fixed set of
 * fields with $set and never touches this one.
 *
 *   node scripts/set-companies.js            apply
 *   node scripts/set-companies.js --dry-run  report what would change
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
require(path.join(BACKEND, "node_modules/dotenv")).config({ path: path.join(BACKEND, ".env") });
const { MongoClient } = require(path.join(BACKEND, "node_modules/mongodb"));

if (process.env.DNS_SERVERS) {
  require("dns").setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
}

const DATA = path.join(__dirname, "companies.txt");
const DRY = process.argv.includes("--dry-run");

/*
 * Parses "Title - Company, Company, ...".
 *
 * Splitting on the first " - " with spaces on both sides, which is what keeps
 * hyphenated titles like N-Queens and Reverse Nodes in k-Group intact.
 */
function parse(text) {
  const rows = [];
  const problems = [];
  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;

    const at = line.indexOf(" - ");
    if (at === -1) {
      problems.push(`line ${i + 1}: no " - " separating the title from the companies`);
      return;
    }

    const title = line.slice(0, at).trim();
    const companies = line
      .slice(at + 3)
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (!title) problems.push(`line ${i + 1}: empty title`);
    if (!companies.length) problems.push(`line ${i + 1}: "${title}" lists no companies`);

    // A name repeated on one line is a typo, not two companies.
    const seen = new Set();
    const duplicates = companies.filter((c) => seen.size === seen.add(c).size);
    if (duplicates.length) {
      problems.push(`line ${i + 1}: "${title}" repeats ${duplicates.join(", ")}`);
    }

    rows.push({ line: i + 1, title, companies: [...seen] });
  });
  return { rows, problems };
}

function same(a = [], b = []) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

async function main() {
  const { rows, problems } = parse(fs.readFileSync(DATA, "utf8"));
  if (problems.length) {
    console.error("The data file has problems, so nothing was written:\n");
    for (const p of problems) console.error("  " + p);
    process.exit(1);
  }

  const duplicateTitles = rows
    .map((r) => r.title)
    .filter((t, i, all) => all.indexOf(t) !== i);
  if (duplicateTitles.length) {
    console.error("Two lines name the same problem, so nothing was written:");
    for (const t of new Set(duplicateTitles)) console.error("  " + t);
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  try {
    const problemsCollection = client.db(process.env.DB_NAME).collection("problems");
    const stored = await problemsCollection
      .find({}, { projection: { slug: 1, title: 1, companies: 1 } })
      .toArray();

    /*
     * Matched on the title, which is what the file is written in, but stored
     * against the slug. A title that matches nothing is reported rather than
     * guessed at: a near-miss quietly skipped is how a problem ends up with no
     * companies and nobody notices.
     */
    const byTitle = new Map(stored.map((p) => [p.title, p]));
    const unmatched = [];
    const writes = [];
    let unchanged = 0;

    for (const row of rows) {
      const problem = byTitle.get(row.title);
      if (!problem) {
        unmatched.push(row);
        continue;
      }
      if (same(problem.companies, row.companies)) {
        unchanged += 1;
        continue;
      }
      writes.push({
        updateOne: {
          filter: { _id: problem._id },
          update: { $set: { companies: row.companies, companiesUpdatedAt: new Date() } },
        },
      });
    }

    const covered = new Set(rows.map((r) => r.title));
    const missed = stored.filter((p) => !covered.has(p.title));

    if (unmatched.length) {
      console.log("=== lines matching no problem ===");
      for (const r of unmatched) console.log(`  line ${r.line}: ${r.title}`);
      console.log("");
    }
    if (missed.length) {
      console.log("=== problems no line covers ===");
      for (const p of missed) console.log(`  ${p.slug}  (${p.title})`);
      console.log("");
    }

    if (DRY) {
      console.log(`Dry run: ${writes.length} would change, ${unchanged} already correct.`);
      return;
    }

    if (writes.length) await problemsCollection.bulkWrite(writes, { ordered: false });

    const after = await problemsCollection.countDocuments({ companies: { $exists: true, $ne: [] } });
    const total = await problemsCollection.countDocuments({});
    console.log(`  updated            ${writes.length}`);
    console.log(`  already correct    ${unchanged}`);
    console.log(`  lines unmatched    ${unmatched.length}`);
    console.log(`  problems uncovered ${missed.length}`);
    console.log(`\n  ${after} of ${total} problems now carry companies.`);

    if (unmatched.length || missed.length) process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
