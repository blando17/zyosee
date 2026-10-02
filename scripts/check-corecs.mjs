/*
 * Structural check over the Core CS content.
 *
 * Exists because of one bug: a block field named `ref` was silently swallowed
 * by React — `ref` and `key` are reserved prop names — so the component got
 * `undefined`, threw, and blanked the whole topic page. The build was clean
 * and the unit of failure was a single character in a data file.
 *
 * A type system would catch that. Short of one, this walks every question and
 * every block and asserts the shape, so a content edit cannot take a page down
 * without something saying so first.
 *
 *   node scripts/check-corecs.mjs
 */

import OS_TOPICS from "../frontend/src/corecs/os/index.js";
import OOPS_TOPICS from "../frontend/src/corecs/oops/index.js";
import DBMS_TOPICS from "../frontend/src/corecs/dbms/index.js";
import SQL_TOPICS from "../frontend/src/corecs/sql/index.js";
import CN_TOPICS from "../frontend/src/corecs/cn/index.js";

/*
 * Every subject with content, checked in one pass.
 *
 * Question ids are the progress keys and are stored per subject, so they only
 * need to be unique within a subject — but they are checked globally here
 * anyway. A clash across subjects is never intentional and always a copy-paste.
 */
const SUBJECTS = [
  { id: "os", topics: OS_TOPICS },
  { id: "oops", topics: OOPS_TOPICS },
  { id: "dbms", topics: DBMS_TOPICS },
  { id: "sql", topics: SQL_TOPICS },
  { id: "cn", topics: CN_TOPICS },
];
const TOPICS = SUBJECTS.flatMap((s) => s.topics);
import { IMPORTANCE, TYPES, UNANSWERED, searchText } from "../frontend/src/corecs/schema.js";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

/*
 * Diagram names are read out of the source rather than imported.
 *
 * The definitions are JSX, which plain Node cannot parse, and pulling a build
 * step into a content check would be a poor trade for a list of strings. Each
 * subject file is a flat object literal, so a regex over the directory is
 * exact enough and keeps this a single `node` command.
 *
 * Reading the whole directory rather than one file also catches a name defined
 * twice across subjects — the registry is one flat namespace, so a duplicate
 * silently wins and the other subject's diagram vanishes.
 */
const DIAGRAM_DIR = fileURLToPath(new URL("../frontend/src/components/corecs/diagrams/", import.meta.url));
const DIAGRAM_NAMES = [];
const DIAGRAM_DUPES = [];
for (const file of readdirSync(DIAGRAM_DIR)) {
  if (!file.endsWith(".jsx") || file === "primitives.jsx") continue;
  const src = readFileSync(DIAGRAM_DIR + file, "utf8");
  const registry = src.slice(src.indexOf("const DIAGRAMS = {"));
  for (const m of registry.matchAll(/^ {2}"?([a-z][a-z0-9-]*)"?:\s*\{/gm)) {
    if (DIAGRAM_NAMES.includes(m[1])) DIAGRAM_DUPES.push(`${m[1]} (again in ${file})`);
    DIAGRAM_NAMES.push(m[1]);
  }
}

const BLOCK_SHAPES = {
  p: "string",
  note: "string",
  ul: "array",
  ol: "array",
  code: "string",
  codePair: { left: "object", right: "object" },
  table: { head: "array", rows: "array" },
  formula: "array",
  gantt: { slices: "array" },
  frames: { refs: "array", rows: "array", faults: "array", total: "number" },
  seek: { head: "number", order: "array", total: "number" },
  diagram: "string",
};

// Keys React intercepts. A block field with one of these names never reaches
// the component it is spread onto.
const RESERVED = new Set(["ref", "key"]);

const problems = [];
DIAGRAM_DUPES.forEach((d) => problems.push(`diagram name defined twice: ${d}`));
const ids = new Set();
let questions = 0;
let blocks = 0;

function checkBlocks(where, list) {
  if (!Array.isArray(list)) {
    problems.push(`${where}: answer/solution is not an array`);
    return;
  }
  list.forEach((block, i) => {
    blocks += 1;
    const keys = Object.keys(block).filter((k) => k !== "tone" && k !== "lang");
    if (keys.length === 0) {
      problems.push(`${where} block ${i}: empty block`);
      return;
    }
    const kind = keys[0];
    const shape = BLOCK_SHAPES[kind];
    if (!shape) {
      problems.push(`${where} block ${i}: unknown block type "${kind}"`);
      return;
    }
    if (kind === "diagram" && !DIAGRAM_NAMES.includes(block.diagram)) {
      problems.push(`${where} block ${i}: unknown diagram "${block.diagram}"`);
    }
    if (typeof shape === "object") {
      /*
       * The deeper checks below index into these fields, so they can only run
       * once the fields are known to be the right type. An early version did
       * not gate them and CRASHED on the first malformed table instead of
       * reporting it — a checker that dies on bad input is no better than the
       * bug it was meant to describe.
       */
      let shapeOk = true;
      Object.entries(shape).forEach(([field, type]) => {
        const value = block[kind][field];
        const ok = type === "array" ? Array.isArray(value) : typeof value === type;
        if (!ok) {
          shapeOk = false;
          problems.push(`${where} block ${i} (${kind}): "${field}" should be ${type}`);
        }
      });
      Object.keys(block[kind]).forEach((field) => {
        if (RESERVED.has(field)) {
          problems.push(
            `${where} block ${i} (${kind}): field "${field}" is a reserved React prop and will be dropped`
          );
        }
      });
      // Every row of a table must be as wide as its header, or the table
      // renders ragged with no error anywhere.
      if (shapeOk && kind === "codePair") {
        ["left", "right"].forEach((side) => {
          const half = block.codePair[side];
          if (typeof half.code !== "string" || !half.code.trim())
            problems.push(`${where} block ${i} (codePair): "${side}.code" is missing`);
          if (typeof half.label !== "string" || !half.label.trim())
            problems.push(`${where} block ${i} (codePair): "${side}.label" is missing`);
        });
      }
      if (shapeOk && kind === "table") {
        block.table.rows.forEach((row, r) => {
          if (row.length !== block.table.head.length) {
            problems.push(
              `${where} block ${i} (table): row ${r} has ${row.length} cells, header has ${block.table.head.length}`
            );
          }
        });
      }
      // A frame trace must line up with its reference string column for column.
      if (shapeOk && kind === "frames") {
        const width = block.frames.refs.length;
        block.frames.rows.forEach((row, r) => {
          if (row.length !== width) {
            problems.push(`${where} block ${i} (frames): row ${r} is ${row.length} wide, expected ${width}`);
          }
        });
        if (block.frames.faults.length !== width) {
          problems.push(`${where} block ${i} (frames): fault row is not ${width} wide`);
        }
        const counted = block.frames.faults.filter(Boolean).length;
        if (counted !== block.frames.total) {
          problems.push(
            `${where} block ${i} (frames): total says ${block.frames.total}, the fault row has ${counted}`
          );
        }
      }
      // The seek total must equal the sum of the hops actually drawn.
      if (shapeOk && kind === "seek") {
        const path = [block.seek.head, ...block.seek.order];
        let sum = 0;
        for (let k = 1; k < path.length; k += 1) sum += Math.abs(path[k] - path[k - 1]);
        if (sum !== block.seek.total) {
          problems.push(`${where} block ${i} (seek): total says ${block.seek.total}, the path sums to ${sum}`);
        }
      }
    } else {
      const value = block[kind];
      const ok = shape === "array" ? Array.isArray(value) : typeof value === shape;
      if (!ok) problems.push(`${where} block ${i}: "${kind}" should be ${shape}`);
    }
  });
}

TOPICS.forEach((topic) => {
  if (!IMPORTANCE[topic.importance]) problems.push(`${topic.id}: bad topic importance`);
  topic.questions.forEach((q) => {
    questions += 1;
    const where = `${topic.id}/${q.id}`;
    if (ids.has(q.id)) problems.push(`${where}: duplicate question id`);
    ids.add(q.id);
    if (!q.question) problems.push(`${where}: no question text`);
    if (!TYPES[q.type]) problems.push(`${where}: unknown type "${q.type}"`);
    if (!IMPORTANCE[q.importance]) problems.push(`${where}: unknown importance "${q.importance}"`);
    if (q.type === "mcq") {
      if (!Array.isArray(q.options) || q.options.length < 2) problems.push(`${where}: mcq needs options`);
      else if (typeof q.correct !== "number" || !q.options[q.correct])
        problems.push(`${where}: mcq "correct" index is out of range`);
    }
    if (q.answer === UNANSWERED) return;
    // A worked problem is one with a `solution`, whatever its type — a traced
    // schedule is as much a worked problem as a scheduling numerical.
    if (q.type === "numerical" && !q.given) {
      problems.push(`${where}: numerical has no "given"`);
    }
    if (q.given && !q.solution) {
      problems.push(`${where}: has "given" data but no "solution"`);
    }
    checkBlocks(where, q.solution || q.answer);
    (q.followUps || []).forEach((f, i) => {
      if (!f.q || !f.a) problems.push(`${where}: follow-up ${i} is missing a question or answer`);
    });
  });
});

/*
 * Actually RUN the code over every question, not just inspect the data.
 *
 * This is here because the first version of this script did not, and missed a
 * crash it should have caught. `searchText` walked `question.answer` assuming
 * an array; an UNANSWERED question's answer is the string "unanswered", which
 * is truthy, so the `|| []` fallback never fired and `.forEach` threw. Every
 * shape assertion above passed — the data was fine, the code that consumed it
 * was not — and because it runs inside a render, typing into the search box
 * blanked the whole page.
 *
 * Checking shapes tells you the content is well formed. Only running the
 * consumers tells you the app can survive it.
 */
let searchable = 0;
TOPICS.forEach((topic) => {
  topic.questions.forEach((q) => {
    try {
      const text = searchText(q);
      if (typeof text !== "string") throw new Error("searchText did not return a string");
      if (!text.includes(q.question.toLowerCase().slice(0, 20)))
        problems.push(`${topic.id}/${q.id}: searchText does not include the question text`);
      searchable += 1;
    } catch (err) {
      problems.push(`${topic.id}/${q.id}: searchText threw — ${err.message}`);
    }
  });
});

SUBJECTS.forEach((s) => {
  const qs = s.topics.reduce((n, t) => n + t.questions.length, 0);
  console.log(`  ${s.id.padEnd(5)} ${String(s.topics.length).padStart(2)} topics · ${String(qs).padStart(3)} questions`);
});
console.log(
  `${TOPICS.length} topics · ${questions} questions · ${blocks} blocks · ${searchable} searchable`
);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.error("  " + p));
  process.exit(1);
}
console.log("All content checks passed.");
