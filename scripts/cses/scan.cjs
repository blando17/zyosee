/*
 * Reads the cses_problems/ tree and reports exactly what is there.
 *
 * WHY THIS IS A SEPARATE STEP FROM THE IMPORT
 *
 * The folders are not uniform. Tests live one directory down under a
 * "<name> tests" folder for most problems, at the top level for some, inside a
 * differently-named subfolder for others; one statement file drops the number
 * prefix, one folder is named for a different spelling of its problem, and at
 * least one folder is empty. Writing an importer that assumes the common shape
 * would silently skip those and still report success, which is the one failure
 * mode that matters here.
 *
 * So this walks each problem directory to its leaves, finds every .in/.out
 * wherever it sits, finds the statement wherever it sits, and reports the
 * shape it found. The importer consumes the same scan, so what is reported is
 * what is imported.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..", "cses_problems");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function scanProblem(dirName) {
  const dir = path.join(ROOT, dirName);
  const files = walk(dir);

  const statements = files.filter((f) => f.toLowerCase().endsWith(".txt"));
  const ins = files.filter((f) => /\.in$/i.test(f));
  const outs = files.filter((f) => /\.out$/i.test(f));

  /*
   * Pairing is by (directory, stem), not by stem alone. Two problems in this
   * set keep tests in more than one directory; matching on the stem alone
   * would pair 1.in from one directory with 1.out from another and produce a
   * test whose expected output belongs to a different case.
   */
  const byKey = new Map();
  const key = (f) => `${path.dirname(f)}\u0000${path.basename(f).replace(/\.(in|out)$/i, "")}`;
  for (const f of ins) {
    const k = key(f);
    if (!byKey.has(k)) byKey.set(k, {});
    byKey.get(k).input = f;
  }
  for (const f of outs) {
    const k = key(f);
    if (!byKey.has(k)) byKey.set(k, {});
    byKey.get(k).expected = f;
  }

  const pairs = [];
  const orphanIn = [];
  const orphanOut = [];
  for (const [k, v] of byKey) {
    const stem = k.split("\u0000")[1];
    if (v.input && v.expected) pairs.push({ stem, input: v.input, expected: v.expected });
    else if (v.input) orphanIn.push(v.input);
    else orphanOut.push(v.expected);
  }

  // Numeric stems sort numerically, everything else alphabetically after them.
  pairs.sort((a, b) => {
    const na = Number(a.stem), nb = Number(b.stem);
    const aNum = Number.isFinite(na), bNum = Number.isFinite(nb);
    if (aNum && bNum) return na - nb;
    if (aNum) return -1;
    if (bNum) return 1;
    return a.stem.localeCompare(b.stem);
  });

  const empty = pairs.filter((p) => {
    const si = fs.statSync(p.input).size;
    const so = fs.statSync(p.expected).size;
    return si === 0 || so === 0;
  });

  return {
    dirName,
    number: Number(dirName.slice(0, 3)),
    statementFiles: statements,
    pairs,
    orphanIn,
    orphanOut,
    emptyPairs: empty,
    bytes: pairs.reduce((n, p) => n + fs.statSync(p.input).size + fs.statSync(p.expected).size, 0),
  };
}

function scanAll() {
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .map(scanProblem);
}

module.exports = { ROOT, scanAll, scanProblem };

if (require.main === module) {
  const all = scanAll();
  console.log(`problem folders: ${all.length}`);
  console.log(`total pairs:     ${all.reduce((n, p) => n + p.pairs.length, 0)}`);
  console.log(`total bytes:     ${(all.reduce((n, p) => n + p.bytes, 0) / 1e9).toFixed(2)} GB`);

  const noStatement = all.filter((p) => p.statementFiles.length === 0);
  const manyStatements = all.filter((p) => p.statementFiles.length > 1);
  const noPairs = all.filter((p) => p.pairs.length === 0);
  const orphans = all.filter((p) => p.orphanIn.length || p.orphanOut.length);
  const empties = all.filter((p) => p.emptyPairs.length);

  const show = (label, list, fmt = (p) => p.dirName) => {
    console.log(`\n${label}: ${list.length}`);
    list.slice(0, 20).forEach((p) => console.log("  " + fmt(p)));
    if (list.length > 20) console.log(`  ... and ${list.length - 20} more`);
  };

  show("folders with NO statement file", noStatement);
  show("folders with MORE THAN ONE statement file", manyStatements, (p) =>
    `${p.dirName}  ->  ${p.statementFiles.map((f) => path.relative(ROOT, f)).join(" | ")}`);
  show("folders with NO test pairs", noPairs);
  show("folders with orphaned .in/.out", orphans, (p) =>
    `${p.dirName}  in:${p.orphanIn.length} out:${p.orphanOut.length}  ` +
    [...p.orphanIn, ...p.orphanOut].slice(0, 3).map((f) => path.relative(ROOT, f)).join(", "));
  show("folders with EMPTY test files", empties, (p) =>
    `${p.dirName}  ${p.emptyPairs.length} empty of ${p.pairs.length}`);

  // Numbering: are the folder prefixes exactly 001..400?
  const nums = all.map((p) => p.number).sort((a, b) => a - b);
  const missing = [];
  for (let i = 1; i <= 400; i += 1) if (!nums.includes(i)) missing.push(i);
  console.log(`\nfolder numbers 001-400 missing: ${missing.length ? missing.join(", ") : "none"}`);
  const dupes = nums.filter((n, i) => nums.indexOf(n) !== i);
  console.log(`folder numbers duplicated:      ${dupes.length ? dupes.join(", ") : "none"}`);

  // Distinct directory layouts, so nothing is handled by accident.
  const shapes = new Map();
  for (const p of all) {
    if (!p.pairs.length) continue;
    const rel = path.relative(path.join(ROOT, p.dirName), path.dirname(p.pairs[0].input));
    const shape = rel === "" ? "<problem dir>" : rel === `${p.dirName} tests` ? "<dir> tests/" : rel;
    const label = rel === "" ? "(top level)" : rel.endsWith(" tests") ? "'<name> tests/'" : `other: ${shape}`;
    shapes.set(label, (shapes.get(label) || 0) + 1);
  }
  console.log("\ntest-directory layouts:");
  for (const [k, v] of [...shapes].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(4)}  ${k}`);
}
