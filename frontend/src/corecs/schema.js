/*
 * The shape every Core CS question has, and why it is this shape.
 *
 * CONTENT IS DATA, NOT COMPONENTS
 *
 * None of the question text lives in a .jsx file. A topic is a module
 * exporting an array of plain objects, and the renderer knows nothing about
 * operating systems. That is what makes adding OOPS, DBMS, SQL and CN a new
 * folder rather than a new set of screens — and it is why a typo in an answer
 * is a one-line edit somebody can make without touching React.
 *
 * ANSWERS ARE BLOCKS, NOT MARKDOWN
 *
 * The obvious choice is a markdown string and a markdown renderer. It was the
 * wrong one here, because half the answers in this subject are not prose: a
 * scheduling answer is a Gantt chart, a comparison answer is a table, a
 * numerical is a sequence of steps with a formula in the middle. Markdown can
 * only describe those as text, so the app would be parsing them back out
 * again to draw them.
 *
 * So an answer is an array of blocks, each a one-key object naming what it is.
 * The renderer switches on that key. Adding a new kind of answer content —
 * say, a memory map — is one case in Blocks.jsx and one key here, and every
 * existing question is untouched.
 *
 * THE BLOCK VOCABULARY
 *
 *   { p: "…" }                    a paragraph
 *   { ul: ["…", "…"] }            bullets
 *   { ol: ["…", "…"] }            a numbered list, for steps that are ordered
 *   { table: { head: [], rows: [] } }   a comparison
 *   { code: "…", lang: "c" }      pseudocode or a shell transcript
 *   { codePair: { left: {label, code}, right: {label, code} } }
 *                                 the same idea in two languages, side by side
 *   { formula: [{ name, expr, note }] } one or more formula cards
 *   { gantt: { slices: [{ p, from, to }], rows, note } }  CPU scheduling
 *   { frames: { refs, rows, faults, total } }             page replacement
 *   { seek: { head, order, total, low, high } }           disk scheduling
 *   { diagram: "id" }             an SVG from the diagram registry
 *   { note: "…", tone: "warn" }   a callout; "warn" is the errata voice
 *
 * Text inside any of these may use **bold** and `code`. That is the whole
 * inline vocabulary — deliberately tiny, because an answer that needs more
 * formatting than that is an answer that is too long to revise from.
 *
 * IMPORTANCE
 *
 * Three levels, taken from the priority list in the notes rather than guessed.
 * Importance changes ordering, visual weight and what the revision queue
 * surfaces first. It never hides a question: everything in the source material
 * is reachable, which is the point of marking rather than filtering.
 */

export const IMPORTANCE = {
  high: { label: "Very important", short: "High", rank: 0, icon: "fire" },
  med: { label: "Important", short: "Med", rank: 1, icon: "sparkle" },
  low: { label: "Good to know", short: "Low", rank: 2, icon: "peace" },
};

/*
 * Question types.
 *
 * `numerical` and `mcq` are the two the UI genuinely treats differently — one
 * gets a worked solution with a step reveal, the other gets options and an
 * answer key. The rest differ only in the label on the card, but they are
 * still worth distinguishing, because "show me only the comparison questions"
 * is how people actually revise the night before.
 */
export const TYPES = {
  definition: { label: "Definition", icon: "page" },
  conceptual: { label: "Concept", icon: "bulb" },
  why: { label: "Why", icon: "think" },
  how: { label: "How", icon: "gear" },
  comparison: { label: "Compare", icon: "scales" },
  scenario: { label: "Scenario", icon: "target" },
  numerical: { label: "Numerical", icon: "progress" },
  algorithm: { label: "Algorithm", icon: "repeat" },
  mcq: { label: "MCQ", icon: "check" },
};

/*
 * A question the source notes ask but never answer.
 *
 * `Os.pdf` ends with forty-three interview prompts and no answers, and six
 * topics on the priority list are named in it but covered nowhere. Dropping
 * them would hide real interview questions; writing answers for them would be
 * inventing material the notes do not contain.
 *
 * So they ship as questions carrying this flag, and the card says plainly that
 * the answer is not in the source. In interview mode that is close to ideal —
 * the whole exercise there is answering before you look.
 */
export const UNANSWERED = "unanswered";

/* The three states a question can be in for one person. */
export const DONE = "done";
export const REVISE = "revise";
export const NONE = "none";

/*
 * Sorts questions for display: important first, and stable within a level.
 *
 * Stable matters more than it looks. Questions inside a topic are authored in
 * a teaching order — you cannot understand SRTF before SJF — and a sort that
 * reshuffled equals would scatter that. Array.prototype.sort is specified as
 * stable, so comparing rank alone preserves the authored order within a level.
 */
export function byImportance(a, b) {
  return (IMPORTANCE[a.importance]?.rank ?? 9) - (IMPORTANCE[b.importance]?.rank ?? 9);
}

/*
 * Everything a question can be searched by, flattened to one lowercase string.
 *
 * Built once per question and cached on the object, because the search box
 * filters on every keystroke across a few hundred questions and re-walking
 * every answer block each time is work nobody needs to do twice.
 */
/*
 * A table's cells as a flat list of strings, defensively.
 *
 * Shared by the answer walk and the numerical `given` block, and tolerant of a
 * malformed table for the same reason the walk is: this runs during render, so
 * anything it throws takes the page with it.
 */
function flatTable(table) {
  const out = [];
  if (Array.isArray(table?.head)) out.push(table.head.join(" "));
  if (Array.isArray(table?.rows)) {
    table.rows.forEach((row) => {
      if (Array.isArray(row)) out.push(row.join(" "));
    });
  }
  return out;
}

export function searchText(question) {
  if (question._search !== undefined) return question._search;

  const parts = [question.question, question.short, question.subtopic, ...(question.tags || [])];

  /*
   * Array.isArray, not `|| []`, and that distinction was a real bug.
   *
   * An UNANSWERED question's `answer` is the STRING "unanswered", not an
   * array. A string is truthy, so `(blocks || [])` handed it straight through
   * and `.forEach` threw — and because this runs inside a render, the thrown
   * error unmounted the whole subject page. Typing two characters into the
   * search box turned the section black.
   *
   * `|| []` guards against absent. It does not guard against present and the
   * wrong type, which is the case that actually occurred.
   */
  const walk = (blocks) => {
    if (!Array.isArray(blocks)) return;
    blocks.forEach((block) => {
      if (block.p) parts.push(block.p);
      if (block.note) parts.push(block.note);
      if (block.ul) parts.push(...block.ul);
      if (block.ol) parts.push(...block.ol);
      if (block.code) parts.push(block.code);
      if (block.codePair) {
        parts.push(block.codePair.left?.label, block.codePair.left?.code);
        parts.push(block.codePair.right?.label, block.codePair.right?.code);
      }
      if (block.table) parts.push(...flatTable(block.table));
      if (block.formula) block.formula.forEach((f) => parts.push(f.name, f.expr, f.note));
    });
  };

  walk(question.answer);
  walk(question.solution);

  /*
   * A numerical's data is part of the question, so it has to be searchable.
   * Somebody looking for "first fit" or "Banker's" is looking for the worked
   * example, and until this was added the only text being indexed was the
   * one-line prompt above it.
   */
  if (question.given) parts.push(...flatTable(question.given));
  if (question.find) parts.push(...question.find);
  if (question.options) parts.push(...question.options);
  if (question.tip) parts.push(question.tip);

  (question.followUps || []).forEach((f) => parts.push(f.q, f.a));

  // Non-enumerable so the cache never shows up in a spread, a JSON dump or a
  // React key warning — it is an implementation detail of this function.
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  Object.defineProperty(question, "_search", { value: text, enumerable: false });
  return text;
}
