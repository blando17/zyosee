/*
 * Gives every problem a number of its own.
 *
 * The problem list shows a number beside each title, the way a judge usually
 * does. It has to be the judge's own number: the imported problems carry the
 * number they had on the site they came from, and printing that on the page
 * would publish where they came from just as plainly as naming the site would.
 * That number stays in `metadata`, which never leaves the server.
 *
 * Numbering runs easiest first, then alphabetically — the same order the list
 * already sorts in, so the numbers read in order on a fresh install.
 *
 * Once assigned, a number never moves. A problem added later takes the next
 * free number rather than slotting into the middle and shifting everything
 * after it, because a number people have started quoting to each other is no
 * longer free to change. So the numbers stay in order only until the first
 * problem is added, which is the trade every judge makes.
 *
 *   node scripts/assign-numbers.js            assign
 *   node scripts/assign-numbers.js --dry-run  report what would change
 *   node scripts/assign-numbers.js --renumber  discard and reassign all
 */

const path = require("path");

const ROOT = path.join(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
require(path.join(BACKEND, "node_modules/dotenv")).config({ path: path.join(BACKEND, ".env") });
const { MongoClient } = require(path.join(BACKEND, "node_modules/mongodb"));

if (process.env.DNS_SERVERS) {
  require("dns").setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
}

const DRY = process.argv.includes("--dry-run");
const RENUMBER = process.argv.includes("--renumber");
const DIFFICULTY_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  try {
    const problems = client.db(process.env.DB_NAME).collection("problems");
    const all = await problems
      .find({}, { projection: { slug: 1, title: 1, difficulty: 1, number: 1 } })
      .toArray();

    const taken = new Set(RENUMBER ? [] : all.map((p) => p.number).filter(Number.isInteger));
    const needing = all
      .filter((p) => RENUMBER || !Number.isInteger(p.number))
      .sort(
        (a, b) =>
          (DIFFICULTY_ORDER[a.difficulty] ?? 9) - (DIFFICULTY_ORDER[b.difficulty] ?? 9) ||
          String(a.title).localeCompare(String(b.title))
      );

    let next = 1;
    const writes = [];
    for (const problem of needing) {
      while (taken.has(next)) next += 1;
      taken.add(next);
      writes.push({
        updateOne: { filter: { _id: problem._id }, update: { $set: { number: next } } },
      });
      if (DRY && writes.length <= 5) console.log(`  #${next}  ${problem.title}`);
      next += 1;
    }

    if (DRY) {
      if (writes.length > 5) console.log(`  ... and ${writes.length - 5} more`);
      console.log(`\nDry run: ${writes.length} would be numbered, ${all.length - writes.length} already are.`);
      return;
    }

    if (writes.length) await problems.bulkWrite(writes, { ordered: false });

    const numbered = await problems.countDocuments({ number: { $type: "int" } });
    console.log(`  assigned        ${writes.length}`);
    console.log(`  already had one ${all.length - writes.length}`);
    console.log(`\n  ${numbered} of ${all.length} problems are numbered.`);

    // A number nobody can rely on being unique is worse than no number at all.
    const duplicates = await problems
      .aggregate([
        { $match: { number: { $type: "int" } } },
        { $group: { _id: "$number", slugs: { $push: "$slug" } } },
        { $match: { "slugs.1": { $exists: true } } },
      ])
      .toArray();
    if (duplicates.length) {
      console.log("\n=== numbers used twice ===");
      for (const d of duplicates) console.log(`  #${d._id}: ${d.slugs.join(", ")}`);
      process.exitCode = 1;
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
