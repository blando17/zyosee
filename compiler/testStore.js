/*
 * Where test cases actually live.
 *
 * Not in MongoDB. A single problem here already carries four megabytes of test
 * input, and a document has a hard 16 MB ceiling, so a handful of generated
 * problems would hit it. Worse, every read of a problem would drag every test
 * across the wire when judging needs them one at a time.
 *
 * So the files stay files, under testdata/<slug>/, exactly the layout the
 * hand-written problems already used. Mongo stores the manifest: which tests
 * exist, in what order, which are samples, and how big each one is. That is
 * small, queryable, and the part the UI actually needs.
 *
 * This module is the READ half. The compiler container mounts testdata/
 * read-only, because submitted code runs in that same container and must never
 * be able to rewrite the expected output it is judged against. Authoring a
 * problem therefore writes through the accounts API instead, which owns
 * backend/services/testStore.js and the same directory on the host.
 */

const fs = require("fs");
const path = require("path");

const TESTDATA_DIR = process.env.TESTDATA_DIR || path.join(__dirname, "testdata");

// Reading is synchronous on purpose. It happens when a problem is pulled into
// the judge's cache, not per submission, and the callers around it are already
// written straight-line.
function readCase(entry) {
  const inputPath = path.join(TESTDATA_DIR, entry.inputFile);
  const expectedPath = path.join(TESTDATA_DIR, entry.expectedFile);

  if (!fs.existsSync(inputPath) || !fs.existsSync(expectedPath)) {
    throw new Error(
      `Test ${entry.index} is listed in the database but its files are missing. ` +
        `Expected ${entry.inputFile} and ${entry.expectedFile} under ${TESTDATA_DIR}.`
    );
  }
  return {
    index: entry.index,
    input: fs.readFileSync(inputPath, "utf8"),
    expected: fs.readFileSync(expectedPath, "utf8"),
  };
}

module.exports = { TESTDATA_DIR, readCase };
