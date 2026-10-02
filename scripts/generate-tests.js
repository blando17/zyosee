/*
 * Builds the test cases for every problem, from reference solutions rather than
 * by hand, so an expected output is never a typo.
 *
 * Seeded: running this again produces byte-identical files. Run it from the
 * project root with `node scripts/generate-tests.js`.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "compiler", "problems");
const OUTPUT_CAP = 65536; // the compiler service kills a program past this

// Seeded, so re-running this script reproduces byte-identical tests.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function writeTest(slug, index, input, output) {
  const dir = path.join(ROOT, slug, "tests");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${index}.in`), input);
  fs.writeFileSync(path.join(dir, `${index}.out`), output);
  if (output.length > OUTPUT_CAP * 0.6) {
    throw new Error(`${slug} test ${index} output is ${output.length} bytes, too close to the cap`);
  }
}

/* ---------- Two Sum ---------- */
function twoSumSolve(a, target) {
  const seen = new Map();
  for (let i = 0; i < a.length; i += 1) {
    const need = target - a[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(a[i], i);
  }
  return null;
}

function pairCount(a, target) {
  // Counting by value rather than by scanning every pair, so the large cases
  // do not take minutes to build.
  const freq = new Map();
  for (const v of a) freq.set(v, (freq.get(v) || 0) + 1);
  let count = 0;
  for (const [v, c] of freq) {
    const need = target - v;
    if (!freq.has(need)) continue;
    if (need === v) count += (c * (c - 1)) / 2;
    else if (v < need) count += c * freq.get(need);
  }
  return count;
}

// `late` puts the answering pair in the last slice of the array. A pair sitting
// early lets a nested-loop search stop almost immediately, so without this the
// big tests measure luck rather than the algorithm: a quadratic solution that
// happens to find the pair on its second outer step finishes in 300ms.
function makeTwoSum(n, rand, spread, late = false) {
  for (let attempt = 0; attempt < 5000; attempt += 1) {
    const a = Array.from({ length: n }, () => Math.floor(rand() * spread * 2) - spread);
    const floor = late ? Math.floor(n * 0.97) : 0;
    const span = n - floor;
    const i = floor + Math.floor(rand() * span);
    let j = floor + Math.floor(rand() * span);
    while (j === i) j = floor + Math.floor(rand() * span);
    const target = a[i] + a[j];
    // The statement promises exactly one answer, so reject any draw with more.
    if (pairCount(a, target) !== 1) continue;
    const answer = twoSumSolve(a, target);
    return { input: `${n}\n${a.join(" ")}\n${target}\n`, output: `${answer[0]} ${answer[1]}\n` };
  }
  throw new Error(`could not build a unique Two Sum case at n=${n}`);
}

/* ---------- Three Sum ---------- */
function threeSumSolve(a) {
  const sorted = [...a].sort((x, y) => x - y);
  const found = new Set();
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] === sorted[i - 1]) continue;
    let lo = i + 1;
    let hi = sorted.length - 1;
    while (lo < hi) {
      const sum = sorted[i] + sorted[lo] + sorted[hi];
      if (sum === 0) {
        found.add(`${sorted[i]} ${sorted[lo]} ${sorted[hi]}`);
        lo += 1;
        hi -= 1;
      } else if (sum < 0) lo += 1;
      else hi -= 1;
    }
  }
  const triplets = [...found].map((s) => s.split(" ").map(Number));
  triplets.sort((p, q) => p[0] - q[0] || p[1] - q[1] || p[2] - q[2]);
  return triplets;
}

function formatThreeSum(a) {
  const triplets = threeSumSolve(a);
  const lines = triplets.map((t) => t.join(" "));
  return {
    input: `${a.length}\n${a.join(" ")}\n`,
    output: `${triplets.length}\n${lines.length ? lines.join("\n") + "\n" : ""}`,
    count: triplets.length,
  };
}

/* ---------- build ---------- */

// Samples are written by hand. They are the only tests a solver sees, so they
// have to teach the format, and a randomly drawn case that happens to contain
// no triplets at all teaches nothing.
const twoSumSamples = [
  { a: [2, 7, 11, 15], target: 9 },
  { a: [3, 2, 4], target: 6 },
];
twoSumSamples.forEach((sample, index) => {
  const answer = twoSumSolve(sample.a, sample.target);
  writeTest(
    "two-sum",
    index + 1,
    `${sample.a.length}\n${sample.a.join(" ")}\n${sample.target}\n`,
    `${answer[0]} ${answer[1]}\n`
  );
});

// Hidden cases climb to a size where a quadratic scan cannot finish in time,
// while a single hash-map pass is instant. That difference is the point.
const twoSumRand = mulberry32(20260921);
const twoSumShapes = [
  { n: 8, spread: 20 },
  { n: 40, spread: 120 },
  { n: 200, spread: 2000 },
  { n: 2000, spread: 100000, late: true },
  { n: 20000, spread: 10000000, late: true },
  { n: 60000, spread: 100000000, late: true },
  { n: 120000, spread: 1000000000, late: true },
  { n: 200000, spread: 1000000000, late: true },
];
twoSumShapes.forEach((shape, index) => {
  const { input, output } = makeTwoSum(shape.n, twoSumRand, shape.spread, shape.late);
  writeTest("two-sum", index + 3, input, output);
});

const threeSumSamples = [[-1, 0, 1, 2, -1, -4], [0, 1, 1]];
threeSumSamples.forEach((a, index) => {
  const { input, output } = formatThreeSum(a);
  writeTest("three-sum", index + 1, input, output);
});

// Spread widens with n so the answer stays small enough to print. A cubic
// search still fails on the big cases: it is the input size that defeats it,
// not the number of triplets.
const threeSumRand = mulberry32(19260817);
const threeSumShapes = [
  { n: 12, spread: 8 },
  { n: 40, spread: 25 },
  { n: 120, spread: 500 },
  { n: 300, spread: 5000 },
  { n: 800, spread: 50000 },
  { n: 2000, spread: 1000000 },
  { n: 3000, spread: 10000000 },
  { n: 4000, spread: 20000000 },
];
threeSumShapes.forEach((shape, index) => {
  const a = Array.from({ length: shape.n }, () => Math.floor(threeSumRand() * shape.spread * 2) - shape.spread);
  const { input, output } = formatThreeSum(a);
  writeTest("three-sum", index + 3, input, output);
});

for (const slug of ["two-sum", "three-sum"]) {
  console.log(`${slug}:`);
  for (let i = 1; i <= 10; i += 1) {
    const dir = path.join(ROOT, slug, "tests");
    const inBytes = fs.statSync(path.join(dir, `${i}.in`)).size;
    const out = fs.readFileSync(path.join(dir, `${i}.out`), "utf8");
    const first = out.split("\n")[0];
    console.log(
      `  test ${String(i).padStart(2)}  in ${String(inBytes).padStart(7)}B  out ${String(out.length).padStart(6)}B  answer starts "${first}"`
    );
  }
}
