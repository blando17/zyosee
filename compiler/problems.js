/*
 * Problems, now read from MongoDB.
 *
 * They used to be folders read once at startup, which was right while the only
 * way to add one was to create a directory and restart. Problems are authored
 * through the Add Problem page now, so a problem can appear at any moment and a
 * startup-only load would never see it.
 *
 * The split is deliberate:
 *
 *   MongoDB   the problem itself, and a manifest of its tests: which exist, in
 *             what order, which are samples, how big each is, and the file each
 *             one lives in. Small, queryable, and what the UI needs.
 *
 *   Disk      the test inputs and expected outputs, under testdata/<slug>/.
 *             A single problem here is already four megabytes of test data, and
 *             a Mongo document may not exceed sixteen.
 *
 * Writes belong to the accounts API. This service only reads, so there is one
 * owner for the collection and no chance of two services disagreeing about what
 * a problem is.
 */

const { problemsCollection, isConfigured } = require("./db");
const { readCase } = require("./testStore");
const { allStats } = require("./submissions");

/*
 * Cache.
 *
 * Judging one submission reads every test, so re-reading those files per
 * submission would dominate the time the judge reports. Test contents are
 * therefore held in memory and reused.
 *
 * Freshness comes from `updatedAt` rather than a timer. Every lookup does one
 * small Mongo read for the document; if its `updatedAt` matches what was cached
 * the test files are not touched again. Editing a problem changes `updatedAt`,
 * which drops the cached copy on the next lookup. No stale tests, and no
 * re-reading megabytes for every submission.
 *
 * WHY THE CACHE IS NOW BOUNDED
 *
 * It used to be an unbounded Map, which was fine while every problem here was
 * hand-written and a large one held a few megabytes. The imported set changed
 * the arithmetic: its problems carry 4.6 GB of test data between them and the
 * largest single problem is 82 MB, so a cache that never evicts would grow
 * until the process died — not under load, but simply as people worked through
 * the list. It is now a least-recently-used cache with a ceiling on total
 * bytes, which is the same trade every judge makes.
 */
const CACHE_LIMIT_BYTES = Number(process.env.PROBLEM_CACHE_BYTES) || 256 * 1024 * 1024;

const cache = new Map();
let cachedBytes = 0;

function stamp(doc) {
  const value = doc.updatedAt || doc.createdAt;
  return value ? new Date(value).getTime() : 0;
}

function drop(slug) {
  const entry = cache.get(slug);
  if (!entry) return;
  cachedBytes -= entry.bytes;
  cache.delete(slug);
}

/*
 * Evicts until the newcomer fits.
 *
 * A Map iterates in insertion order, so the first key is the oldest; `remember`
 * re-inserts on every hit, which is what makes that order least-recently-used
 * rather than first-in-first-out.
 */
function remember(slug, problem, bytes) {
  drop(slug);
  /*
   * A problem larger than the whole ceiling is judged without being cached,
   * rather than evicting everything else to make room for something that will
   * be evicted in turn. It still judges correctly; it just re-reads its files.
   */
  if (bytes > CACHE_LIMIT_BYTES) return;
  for (const oldest of cache.keys()) {
    if (cachedBytes + bytes <= CACHE_LIMIT_BYTES) break;
    drop(oldest);
  }
  cache.set(slug, { stamp: problem.__stamp, problem, bytes });
  cachedBytes += bytes;
}

// What a manifest says a problem's tests weigh, without reading them. Used to
// decide whether the tests are worth caching before they are loaded.
function manifestBytes(doc) {
  return (Array.isArray(doc.tests) ? doc.tests : []).reduce(
    (n, entry) => n + (entry.inputBytes || 0) + (entry.expectedBytes || 0),
    0
  );
}

function withTests(doc) {
  const manifest = Array.isArray(doc.tests) ? doc.tests : [];
  const tests = manifest.map((entry) => {
    const { input, expected } = readCase(entry);
    return { index: entry.index, kind: entry.kind, label: entry.label, note: entry.note, input, expected };
  });
  return { ...doc, slug: doc.slug, tests };
}

/*
 * The whole problem, tests and all. This is what judging needs, and the only
 * thing that should ask for it — reading it costs however many megabytes the
 * problem's tests weigh.
 */
async function getProblem(slug) {
  if (!isConfigured()) return null;

  const collection = await problemsCollection();
  const doc = await collection.findOne({ slug, published: { $ne: false } });
  if (!doc) {
    drop(slug);
    return null;
  }

  const cached = cache.get(slug);
  if (cached && cached.stamp === stamp(doc)) {
    // Re-inserting moves this key to the end, which is how the Map's insertion
    // order becomes a recency order.
    cache.delete(slug);
    cache.set(slug, cached);
    return cached.problem;
  }

  const problem = withTests(doc);
  problem.__stamp = stamp(doc);
  remember(slug, problem, manifestBytes(doc));
  return problem;
}

/*
 * The problem WITHOUT its hidden tests.
 *
 * Everything that merely shows a problem — the problem page, the AI assistant,
 * a custom run borrowing the time limit, and /submit checking that the slug
 * exists before queueing — needs the statement and the samples and nothing
 * else. They all used to call getProblem, which meant opening a problem page
 * read every hidden test off disk: harmless at a few kilobytes each, and up to
 * 82 MB for one problem in the imported set.
 *
 * Only the sample tests are read here, and those are the ones that travel to
 * the browser anyway, so nothing downstream sees a difference. publicView is
 * given exactly what it publishes.
 */
async function getProblemBrief(slug) {
  if (!isConfigured()) return null;

  const collection = await problemsCollection();
  const doc = await collection.findOne({ slug, published: { $ne: false } });
  if (!doc) return null;

  const manifest = Array.isArray(doc.tests) ? doc.tests : [];
  const samples = manifest
    .filter((entry) => entry.kind === "sample")
    .map((entry) => {
      const { input, expected } = readCase(entry);
      return { index: entry.index, kind: entry.kind, label: entry.label, note: entry.note, input, expected };
    });

  // testCount has to be the real total, not the number of samples: the page
  // prints "n tests" and publicView counts this array.
  return { ...doc, tests: samples, hiddenTestCount: manifest.length - samples.length };
}

/*
 * The list page. Projected rather than fetched whole: the statement and the
 * test manifest are both large and neither is shown on a list of titles.
 */
async function listProblems() {
  if (!isConfigured()) return [];

  const collection = await problemsCollection();
  const docs = await collection
    .find(
      { published: { $ne: false } },
      {
        projection: {
          slug: 1, title: 1, difficulty: 1, tags: 1, timeLimitMs: 1, number: 1, companies: 1,
          testCount: { $size: { $ifNull: ["$tests", []] } },
        },
      }
    )
    .toArray();

  /*
   * The counters live in their own collection, so they are fetched separately
   * and stitched on. See submissions.js for why they are not a field on the
   * problem: these change on every submission, and problems are cached.
   */
  const stats = await allStats();

  return docs
    .sort(
      (a, b) =>
        (DIFFICULTY_ORDER[a.difficulty] ?? 9) - (DIFFICULTY_ORDER[b.difficulty] ?? 9) ||
        String(a.title).localeCompare(String(b.title))
    )
    .map((doc) => ({
      slug: doc.slug,
      // The judge's own number, assigned by scripts/assign-numbers.js. Nothing
      // to do with where a problem came from, which is not published anywhere.
      number: doc.number ?? null,
      title: doc.title,
      difficulty: doc.difficulty,
      tags: doc.tags || [],
      companies: doc.companies || [],
      testCount: doc.testCount || 0,
      timeLimitMs: doc.timeLimitMs,
      stats: stats[doc.slug] || { submissions: 0, accepted: 0, solvers: 0, acceptance: null },
    }));
}

async function countProblems() {
  if (!isConfigured()) return 0;
  const collection = await problemsCollection();
  return collection.countDocuments({ published: { $ne: false } });
}

/*
 * What the browser is allowed to see.
 *
 * The hidden tests are the whole point of a judge, so they never leave this
 * process: only the tests marked as samples travel to the client, and only the
 * count is disclosed for the rest.
 */
function publicView(problem) {
  const samples = (problem.tests || []).filter((test) => test.kind === "sample");

  return {
    slug: problem.slug,
    number: problem.number ?? null,
    title: problem.title,
    difficulty: problem.difficulty,
    tags: problem.tags || [],
    // Where the question has been asked in interviews. A label on the problem,
    // like its tags — and unrelated to `metadata`, which stays internal.
    companies: problem.companies || [],
    statement: problem.statement,
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    constraints: problem.constraints || [],
    hint: problem.hint,
    timeLimitMs: problem.timeLimitMs,
    /*
     * The real total, samples plus hidden.
     *
     * getProblemBrief loads only the samples and reports how many it left
     * behind, so the two together are the count the page means by "n tests".
     * Reading it off `tests` alone would say "1 test" for a problem with one
     * example and forty hidden cases.
     */
    testCount: (problem.tests || []).length + (problem.hiddenTestCount || 0),
    /*
     * The editorial travels; the metadata deliberately does not.
     *
     * `metadata` records where an imported problem came from, which is an
     * administrative fact. Listing it here would put the original source on
     * every problem page, so it stays in the database and never leaves this
     * process — the same rule the hidden tests follow.
     */
    editorial: problem.editorial || null,
    starter: problem.starter || {},
    samples: samples.map((test) => ({
      index: test.index,
      input: test.input,
      expected: test.expected,
      note: test.note || null,
    })),
  };
}

// Easiest first, then alphabetically.
const DIFFICULTY_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

// Called by the generation route once it has rewritten a problem's tests, so
// the next submission reloads them instead of judging against the old files.
function invalidate(slug) {
  if (slug) {
    drop(slug);
  } else {
    cache.clear();
    cachedBytes = 0;
  }
}

module.exports = {
  listProblems,
  getProblem,
  getProblemBrief,
  publicView,
  countProblems,
  invalidate,
};
