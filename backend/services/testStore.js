/*
 * Writes test files to disk.
 *
 * The write side lives in the accounts API rather than in the compiler service
 * on purpose. The compiler runs in a container with testdata/ mounted
 * read-only, because submitted code runs in that same container and must never
 * be able to rewrite the expected output it is being judged against. Handing
 * the judge a writable mount so it could also author tests would give away
 * exactly the protection the read-only mount buys.
 *
 * So: this process generates and writes, the compiler only ever reads.
 * They agree on one directory, compiler/testdata/, and on the manifest shape
 * stored in MongoDB alongside the problem.
 */

const fs = require("fs/promises");
const path = require("path");

const TESTDATA_DIR =
  process.env.TESTDATA_DIR || path.join(__dirname, "..", "..", "compiler", "testdata");

// A slug arrives in an HTTP body and is about to become a path component.
// Anything outside the shape a slug may have is refused rather than escaped.
function safeSlug(slug) {
  if (typeof slug !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(slug)) {
    throw new Error(`Invalid problem slug: ${JSON.stringify(slug)}`);
  }
  return slug;
}

function slugify(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/*
 * Writes every case for a problem and returns the manifest that goes into
 * MongoDB. Test files are numbered from 1 in the order given, which is the
 * order the judge runs them: samples first, then curated edge cases, then the
 * generated ladder. That ordering is what makes a slow solution fail late
 * rather than on test 1, and it is what the per-test UI shows.
 */
async function writeCases(slug, cases) {
  const dir = path.join(TESTDATA_DIR, safeSlug(slug));
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });

  const manifest = [];
  for (const test of cases) {
    const index = manifest.length + 1;
    await fs.writeFile(path.join(dir, `${index}.in`), test.input);
    await fs.writeFile(path.join(dir, `${index}.out`), test.expected);

    manifest.push({
      index,
      kind: test.kind,
      label: test.label || null,
      note: test.note || null,
      inputFile: `${slug}/${index}.in`,
      expectedFile: `${slug}/${index}.out`,
      inputBytes: Buffer.byteLength(test.input),
      expectedBytes: Buffer.byteLength(test.expected),
    });
  }
  return manifest;
}

async function removeProblem(slug) {
  await fs.rm(path.join(TESTDATA_DIR, safeSlug(slug)), { recursive: true, force: true });
}

function totalBytes(manifest = []) {
  return manifest.reduce((sum, e) => sum + (e.inputBytes || 0) + (e.expectedBytes || 0), 0);
}

module.exports = { TESTDATA_DIR, writeCases, removeProblem, safeSlug, slugify, totalBytes };
