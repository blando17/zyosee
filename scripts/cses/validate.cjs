/*
 * Checks the CSES import against the database, the disk and the source tree.
 *
 *   node scripts/cses/validate.cjs            the report
 *   node scripts/cses/validate.cjs --deep     also compare every test file byte
 *                                             for byte with its source
 *
 * WHAT THIS IS FOR
 *
 * An importer that writes 400 documents and 5,257 test files will report
 * success whatever it actually wrote. The only way to know it wrote the right
 * thing is to go back to the three places the truth lives — the collection, the
 * files the judge will read, and the folders the data came from — and check
 * they agree. Everything below compares two of those three against each other.
 *
 * The default run stats every test file and compares its size to the manifest,
 * which catches a missing, truncated or mismatched file in seconds. --deep
 * hashes all 4.6 GB against the source instead, which catches a file that is
 * the right size and the wrong content; it takes minutes and is worth running
 * once.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { TESTDATA_DIR, connect, slugify, official } = require("./lib.cjs");
const { scanAll } = require("./scan.cjs");

const DEEP = process.argv.includes("--deep");

const EXPECTED_COUNT = 400;
const FIRST_NUMBER = 501;
const LAST_NUMBER = 900;

// The same rule import.cjs applies, repeated here on purpose: the validator
// checks what was written against the official list, not against the importer.
const topicTag = (category) =>
  category
    .toLowerCase()
    .split(" ")
    .map((word) => (/^i+$/.test(word) ? word.toUpperCase() : word))
    .join(" ");

const CATEGORIES = new Set(official().map((o) => topicTag(o.cat)));

function sha1(file) {
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

async function main() {
  const { client, problems } = await connect();
  try {
    const all = await problems.find({}).toArray();
    const imported = all.filter((d) => d.source === "cses-import");
    const others = all.filter((d) => d.source !== "cses-import");
    const off = official();
    const scanned = new Map(scanAll().map((s) => [s.number, s]));

    const fail = [];   // anything that makes the import wrong
    const warn = [];   // anything the maintainer should know about

    /* ------------------------------------------------------------ counts -- */

    if (imported.length !== EXPECTED_COUNT) {
      fail.push(`imported ${imported.length} problems, expected ${EXPECTED_COUNT}`);
    }

    /* ----------------------------------------------------------- numbers -- */

    const numbers = imported.map((d) => d.number);
    const missingNumbers = [];
    const seen = new Map();
    for (const n of numbers) seen.set(n, (seen.get(n) || 0) + 1);
    for (let n = FIRST_NUMBER; n <= LAST_NUMBER; n += 1) if (!seen.has(n)) missingNumbers.push(n);
    const duplicateNumbers = [...seen].filter(([, count]) => count > 1).map(([n]) => n);
    const outOfRange = numbers.filter((n) => !Number.isInteger(n) || n < FIRST_NUMBER || n > LAST_NUMBER);

    if (missingNumbers.length) fail.push(`missing numbers: ${missingNumbers.slice(0, 20).join(", ")}`);
    if (duplicateNumbers.length) fail.push(`duplicate numbers: ${duplicateNumbers.join(", ")}`);
    if (outOfRange.length) fail.push(`numbers outside ${FIRST_NUMBER}-${LAST_NUMBER}: ${outOfRange.join(", ")}`);

    /*
     * A number or a slug shared with a problem that was already here would mean
     * the import had landed on top of somebody else's problem. Checked against
     * the other documents rather than against a list written down beforehand,
     * so it stays true as the judge grows.
     */
    const theirNumbers = new Set(others.map((d) => d.number));
    const theirSlugs = new Set(others.map((d) => d.slug));
    const collidedNumbers = numbers.filter((n) => theirNumbers.has(n));
    const collidedSlugs = imported.map((d) => d.slug).filter((s) => theirSlugs.has(s));
    if (collidedNumbers.length) fail.push(`numbers shared with existing problems: ${collidedNumbers.join(", ")}`);
    if (collidedSlugs.length) fail.push(`slugs shared with existing problems: ${collidedSlugs.join(", ")}`);

    /* ------------------------------------------------------------ fields -- */

    let noDescription = 0, noTag = 0, noTopic = 0, noInput = 0, noOutput = 0,
        noConstraints = 0, unpublished = 0, badDifficulty = 0, titleMismatch = 0,
        duplicateSlugs = 0;

    const slugSeen = new Set();
    const DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);

    for (const doc of imported) {
      const index = doc.metadata?.officialIndex;
      const officialEntry = Number.isInteger(index) ? off[index - 1] : null;

      if (!String(doc.statement || "").trim()) { noDescription += 1; fail.push(`#${doc.number} ${doc.slug}: no statement`); }
      if (!(doc.tags || []).includes("cses")) { noTag += 1; fail.push(`#${doc.number} ${doc.slug}: no cses tag`); }

      const topics = (doc.tags || []).filter((t) => t !== "cses");
      if (!topics.length || !topics.every((t) => CATEGORIES.has(t))) {
        noTopic += 1;
        fail.push(`#${doc.number} ${doc.slug}: topic ${JSON.stringify(topics)} is not an official category`);
      }
      if (!DIFFICULTIES.has(doc.difficulty)) { badDifficulty += 1; fail.push(`#${doc.number} ${doc.slug}: difficulty ${JSON.stringify(doc.difficulty)}`); }
      if (doc.published === false) { unpublished += 1; warn.push(`#${doc.number} ${doc.slug}: not published`); }

      if (slugSeen.has(doc.slug)) { duplicateSlugs += 1; fail.push(`duplicate slug ${doc.slug}`); }
      slugSeen.add(doc.slug);

      if (officialEntry) {
        if (doc.title !== officialEntry.title) { titleMismatch += 1; fail.push(`#${doc.number}: title "${doc.title}" != official "${officialEntry.title}"`); }
        if (doc.slug !== `cses-${slugify(officialEntry.title)}`) fail.push(`#${doc.number}: slug ${doc.slug} does not match its title`);
        if (doc.number !== 500 + index) fail.push(`#${doc.number}: number does not match official index ${index}`);
        if ((doc.tags || [])[1] !== topicTag(officialEntry.cat)) fail.push(`#${doc.number}: category tag != official "${officialEntry.cat}"`);
      } else {
        fail.push(`${doc.slug}: no officialIndex in metadata`);
      }

      /*
       * A missing Input or Output section is a warning, not a failure. Six
       * problems genuinely have none — the interactive ones describe their
       * protocol in prose instead — and three have no constraints because CSES
       * states none. Treating those as errors would mean the report could
       * never pass without inventing text that is not in the source.
       */
      if (!String(doc.inputFormat || "").trim()) { noInput += 1; warn.push(`#${doc.number} ${doc.slug}: no input format`); }
      if (!String(doc.outputFormat || "").trim()) { noOutput += 1; warn.push(`#${doc.number} ${doc.slug}: no output format`); }
      if (!(doc.constraints || []).length) { noConstraints += 1; warn.push(`#${doc.number} ${doc.slug}: no constraints`); }
    }

    /* ------------------------------------------------------------- tests -- */

    let totalTests = 0, totalBytes = 0;
    let badTests = 0, noTests = 0, emptyInputs = 0, emptyExpected = 0;
    let duplicateTests = 0, deepChecked = 0, deepMismatch = 0;
    const missingFiles = [];
    const sizeMismatch = [];
    const indexProblems = [];

    for (const doc of imported) {
      const manifest = Array.isArray(doc.tests) ? doc.tests : [];
      totalTests += manifest.length;

      if (!manifest.length) {
        noTests += 1;
        warn.push(`#${doc.number} ${doc.slug}: no tests (${doc.metadata?.interactive ? "interactive" : "no usable source data"})`);
        continue;
      }

      // Indexes must run 1..n with no gaps: the judge reports "failed on test
      // 7" and a gap would make that number meaningless.
      const indexes = manifest.map((m) => m.index);
      const expectIndexes = manifest.map((_, i) => i + 1);
      if (JSON.stringify(indexes) !== JSON.stringify(expectIndexes)) {
        indexProblems.push(doc.slug);
        fail.push(`#${doc.number} ${doc.slug}: test indexes are ${indexes.slice(0, 5).join(",")}…`);
      }

      /*
       * Two tests with the same input AND the same expected output is one test
       * judged twice.
       *
       * Sizes are compared first and the pair is hashed only when another test
       * in the same problem already has both sizes. That makes the answer exact
       * — a size collision is not a duplicate until the bytes agree — without
       * hashing 4.6 GB to find out.
       */
      const bySize = new Map();

      for (const entry of manifest) {
        const inPath = path.join(TESTDATA_DIR, entry.inputFile);
        const outPath = path.join(TESTDATA_DIR, entry.expectedFile);

        if (!fs.existsSync(inPath) || !fs.existsSync(outPath)) {
          badTests += 1;
          missingFiles.push(`${doc.slug}/${entry.index}`);
          continue;
        }

        const inSize = fs.statSync(inPath).size;
        const outSize = fs.statSync(outPath).size;
        totalBytes += inSize + outSize;

        if (inSize !== entry.inputBytes || outSize !== entry.expectedBytes) {
          badTests += 1;
          sizeMismatch.push(`${doc.slug}/${entry.index} disk ${inSize}/${outSize} manifest ${entry.inputBytes}/${entry.expectedBytes}`);
        }

        /*
         * An empty input is always wrong — nothing in this set has one.
         *
         * An empty EXPECTED output is not: six problems include a case whose
         * input holds only update operations and no queries, so printing
         * nothing is the right answer. Those are counted and listed, and they
         * do not fail the run.
         */
        if (inSize === 0) { emptyInputs += 1; fail.push(`#${doc.number} ${doc.slug}: test ${entry.index} has an empty input`); }
        if (outSize === 0) emptyExpected += 1;

        const sizeKey = `${inSize}:${outSize}`;
        if (bySize.has(sizeKey)) {
          const mine = `${sha1(inPath)}:${sha1(outPath)}`;
          const clash = bySize.get(sizeKey).find((other) => other.hash === mine);
          if (clash) {
            duplicateTests += 1;
            warn.push(`#${doc.number} ${doc.slug}: test ${entry.index} is identical to test ${clash.index}`);
          }
          bySize.get(sizeKey).push({ index: entry.index, hash: mine });
        } else {
          bySize.set(sizeKey, [{ index: entry.index, hash: `${sha1(inPath)}:${sha1(outPath)}` }]);
        }

        /*
         * Does this hidden test still hold the bytes it came from, and is it
         * still paired with the right expected output?
         *
         * Identity is checked by inode rather than by position. Position would
         * be the obvious way and it is fragile: tests are numbered by their
         * place in the manifest, so dropping one shifts every later one, and
         * the check would have to re-derive the importer's exact filtering to
         * know which source file test 7 is supposed to be. Inodes need no such
         * reasoning — the file on disk either IS the source file or it is not.
         *
         * Both halves are matched against the SAME source pair, which is what
         * proves the pairing: a test whose input came from case 4 and whose
         * expected output came from case 9 would pass a content check on each
         * file separately and fail here.
         *
         * A file that was copied rather than linked has no shared inode, so it
         * falls back to hashing against every source pair of the same size.
         */
        if (DEEP && entry.kind === "manual") {
          const source = scanned.get(doc.metadata?.officialIndex);
          deepChecked += 1;
          const inStat = fs.statSync(inPath);
          const outStat = fs.statSync(outPath);

          let matched = (source ? source.pairs : []).find((pair) => {
            const a = fs.statSync(pair.input);
            return a.ino === inStat.ino && a.dev === inStat.dev;
          });
          if (matched) {
            const b = fs.statSync(matched.expected);
            if (b.ino !== outStat.ino || b.dev !== outStat.dev) {
              deepMismatch += 1;
              fail.push(`#${doc.number} ${doc.slug}: test ${entry.index} pairs input ${matched.stem}.in with the wrong expected output`);
            }
          } else {
            const mine = `${sha1(inPath)}:${sha1(outPath)}`;
            matched = (source ? source.pairs : []).find(
              (pair) =>
                fs.statSync(pair.input).size === inStat.size &&
                fs.statSync(pair.expected).size === outStat.size &&
                `${sha1(pair.input)}:${sha1(pair.expected)}` === mine
            );
            if (!matched) {
              deepMismatch += 1;
              fail.push(`#${doc.number} ${doc.slug}: test ${entry.index} matches no pair in ${source ? source.dirName : "its source folder"}`);
            }
          }
        }
      }
    }

    if (missingFiles.length) fail.push(`${missingFiles.length} tests are in the manifest but not on disk: ${missingFiles.slice(0, 5).join(", ")}`);
    if (sizeMismatch.length) fail.push(`${sizeMismatch.length} tests disagree with the manifest: ${sizeMismatch.slice(0, 3).join(" | ")}`);

    /* -------------------------------------------- source tree accounting -- */

    /*
     * Every pair in the source is either imported or deliberately skipped.
     *
     * This is the check that catches a whole folder being quietly missed: the
     * arithmetic only balances if each of the 4,917 provided pairs was either
     * written as a test or counted as one the import chose not to take.
     */
    let sourcePairs = 0, accountedFor = 0, accountedSkipped = 0, accountedDropped = 0;
    for (const s of scanned.values()) sourcePairs += s.pairs.length;
    for (const doc of imported) {
      accountedFor += doc.metadata?.importedProvidedTests || 0;
      accountedSkipped += doc.metadata?.skippedEmptyPairs || 0;
      accountedDropped += doc.metadata?.droppedAsDuplicateOfSample || 0;
    }
    if (accountedFor + accountedSkipped + accountedDropped !== sourcePairs) {
      fail.push(
        `source pairs ${sourcePairs} != imported ${accountedFor} + skipped ${accountedSkipped} + ` +
          `dropped as duplicate ${accountedDropped}`
      );
    }

    /* ------------------------------------------------------------ report -- */

    const orphans = fs
      .readdirSync(TESTDATA_DIR)
      .filter((d) => d.startsWith("cses-"))
      .filter((d) => !slugSeen.has(d));
    if (orphans.length) warn.push(`${orphans.length} testdata folders belong to no problem: ${orphans.slice(0, 5).join(", ")}`);

    const pad = (n) => String(n).padStart(6);
    console.log("CSES IMPORT VALIDATION");
    console.log("----------------------");
    console.log(`Expected problems:            ${pad(EXPECTED_COUNT)}`);
    console.log(`Imported problems:            ${pad(imported.length)}`);
    console.log("");
    console.log(`Problem range:                ${Math.min(...numbers)} - ${Math.max(...numbers)}`);
    console.log(`Missing numbers:              ${pad(missingNumbers.length)}`);
    console.log(`Duplicate numbers:            ${pad(duplicateNumbers.length)}`);
    console.log(`Duplicate slugs:              ${pad(duplicateSlugs)}`);
    console.log("");
    console.log(`Missing descriptions:         ${pad(noDescription)}`);
    console.log(`Missing topics:               ${pad(noTopic)}`);
    console.log(`Missing cses tags:            ${pad(noTag)}`);
    console.log(`Invalid difficulties:         ${pad(badDifficulty)}`);
    console.log(`Titles disagreeing with CSES: ${pad(titleMismatch)}`);
    console.log("");
    console.log(`Test cases imported:          ${pad(totalTests)}`);
    console.log(`Test bytes on disk:           ${pad((totalBytes / 1e9).toFixed(2))} GB`);
    console.log(`Problems with invalid tests:  ${pad(indexProblems.length + (missingFiles.length ? 1 : 0))}`);
    console.log(`Tests missing from disk:      ${pad(missingFiles.length)}`);
    console.log(`Tests disagreeing on size:    ${pad(sizeMismatch.length)}`);
    console.log(`Tests with an empty input:    ${pad(emptyInputs)}`);
    console.log(`Problems with missing tests:  ${pad(noTests)}`);
    console.log(`Duplicate tests:              ${pad(duplicateTests)}`);
    console.log("");
    console.log(`Source pairs provided:        ${pad(sourcePairs)}`);
    console.log(`  imported as hidden tests:   ${pad(accountedFor)}`);
    console.log(`  skipped, no usable data:    ${pad(accountedSkipped)}`);
    console.log(`  dropped, same as a sample:  ${pad(accountedDropped)}`);
    if (DEEP) {
      console.log(`Tests compared with source:   ${pad(deepChecked)}`);
      console.log(`Tests differing from source:  ${pad(deepMismatch)}`);
    }
    console.log("");
    console.log(`Existing problems:            ${pad(others.length)}`);
    console.log(`Existing problems overwritten:${pad(collidedNumbers.length + collidedSlugs.length)}`);
    console.log("");
    console.log(`STATUS: ${fail.length ? "FAIL" : "PASS"}`);

    if (warn.length) {
      console.log(`\n=== ${warn.length} note(s), none of which is an error ===`);
      warn.forEach((w) => console.log("  " + w));
    }
    if (fail.length) {
      console.log(`\n=== ${fail.length} FAILURE(S) ===`);
      fail.slice(0, 60).forEach((f) => console.log("  " + f));
      if (fail.length > 60) console.log(`  ... and ${fail.length - 60} more`);
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
