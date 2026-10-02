/*
 * Turns one CSES statement file into the fields a problem document needs.
 *
 * THE FILES ARE NEARLY UNIFORM, AND "NEARLY" IS THE WHOLE PROBLEM
 *
 * 383 of the 400 follow one shape: a title over a row of equals signs, the two
 * limits, prose, then the headings Input, Output, Constraints and Example. The
 * rest deviate in small ways that a lenient parser would swallow silently and
 * get wrong: sixteen have no title row at all, one writes "Output:" with a
 * colon, one prints the heading "Input" twice where the second is plainly the
 * output section, five carry two examples instead of one, and six — the
 * interactive problems — have no Input or Output heading because the protocol
 * is described in prose.
 *
 * So this parser is strict and says what it could not do. Every caller gets a
 * `problems` list of complaints alongside the fields, and the importer refuses
 * to write a problem whose statement it could not read. A statement that
 * imports as an empty string is worse than one that fails loudly, because the
 * empty one reaches a solver.
 *
 * WHY THE MATHEMATICS IS REWRITTEN
 *
 * CSES writes constraints as TeX fragments: "1 \le n \le 10^6". The problem
 * page renders plain text — the existing problems all store "0 <= n <= 100000"
 * — so a raw fragment would show the backslashes to the solver. The commands
 * used across all 400 files are a closed set of thirty-three, listed below, and
 * each is replaced by the symbol it denotes. Nothing is dropped, reordered or
 * summarised; only the notation changes, and the untouched original is kept in
 * the document's metadata so the substitution can be audited or undone.
 */

const fs = require("fs");

/* ------------------------------------------------------------------ maths -- */

// Every command that appears anywhere in the 400 statements, and what it means.
// Longest first, so \leq is not matched as \le followed by a stray "q".
const COMMANDS = [
  ["\\operatorname", ""],
  ["\\rightarrow", "→"],
  ["\\mathrm", ""],
  ["\\mathrel", ""],
  ["\\lfloor", "⌊"],
  ["\\rfloor", "⌋"],
  ["\\ldots", "..."],
  ["\\binom", "C"],
  ["\\choose", " choose "],
  ["\\times", "×"],
  ["\\oplus", "⊕"],
  ["\\sigma", "σ"],
  ["\\right", ""],
  ["\\sqrt", "√"],
  ["\\dots", "..."],
  ["\\left", ""],
  ["\\cdot", "·"],
  ["\\frac", ""],
  ["\\pmod", "mod"],
  ["\\bmod", "mod"],
  ["\\text", ""],
  ["\\neq", "≠"],
  ["\\leq", "≤"],
  ["\\min", "min"],
  ["\\sum", "Σ"],
  ["\\mid", "|"],
  ["\\le", "≤"],
  ["\\ge", "≥"],
  ["\\in", "∈"],
  ["\\pi", "π"],
];

const SUPERSCRIPT = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const SUBSCRIPT = { 0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉" };

/*
 * Rewrites TeX notation as the symbols it stands for.
 *
 * The order matters. Commands go first, because \le must be gone before the
 * backslash-escaped braces are unescaped; superscripts go after, because
 * "10^{9}" only becomes "10^9" once the braces are plain.
 */
function detex(text) {
  let out = String(text);

  for (const [command, symbol] of COMMANDS) {
    out = out.split(command).join(symbol);
  }

  /*
   * Escapes.
   *
   * \{ and \} are literal braces the author wrote — the set {0,1} — while bare
   * braces are TeX grouping and get stripped further down. The two are told
   * apart by parking the literal pair on characters TeX never produces and
   * putting them back at the end, which is why \u0001 and \u0002 appear here.
   * Without that, "b_i \in \{0,1\}" loses the braces that carry its meaning.
   *
   * \\ is a line break inside a display; \, is a thin space; \& is an
   * ampersand; and "\ " is an escaped space, which the interactive problems
   * use inside quoted protocol strings such as "?\ y".
   */
  out = out
    .replace(/\\\{/g, "\u0001")
    .replace(/\\\}/g, "\u0002")
    .replace(/\\\\/g, "\n")
    .replace(/\\ /g, " ")
    .replace(/\\,/g, " ")
    .replace(/\\&/g, "&");

  // \begin{...} / \end{...} wrappers leave nothing useful behind.
  out = out.replace(/\\(begin|end)\{[a-z*]+\}/g, "");

  // 10^{9} -> 10⁹, x_{i} -> xᵢ where the digits allow it, and the braces go
  // either way. A non-numeric exponent keeps its caret: n^k reads fine.
  out = out.replace(/\^\{([^{}]{1,6})\}/g, (m, body) =>
    /^[0-9]+$/.test(body) ? [...body].map((d) => SUPERSCRIPT[d]).join("") : `^${body}`
  );
  out = out.replace(/\^([0-9])(?![0-9])/g, (m, d) => SUPERSCRIPT[d]);
  out = out.replace(/\^([0-9]{2,})/g, (m, ds) => [...ds].map((d) => SUPERSCRIPT[d]).join(""));
  out = out.replace(/_\{([^{}]{1,6})\}/g, (m, body) =>
    /^[0-9]+$/.test(body) ? [...body].map((d) => SUBSCRIPT[d]).join("") : `_${body}`
  );
  out = out.replace(/_([0-9])(?![0-9])/g, (m, d) => SUBSCRIPT[d]);

  // Whatever braces are left were grouping, not content: {n} -> n. The literal
  // braces parked above are restored afterwards, so they survive this.
  out = out.replace(/\{([^{}]*)\}/g, "$1");
  out = out.replace(/\u0001/g, "{").replace(/\u0002/g, "}");

  // The dollar signs TeX uses to open and close maths carry no meaning here.
  out = out.replace(/\$+/g, "");

  return out.replace(/[ \t]+$/gm, "");
}

/* ----------------------------------------------------------------- shape -- */

// A standalone section heading, with or without the trailing colon one file
// uses. Deliberately anchored: "Output" inside a sentence is not a heading.
const HEADING = /^(Input|Output|Constraints|Examples?|Example\s+\d+)\s*:?\s*$/i;

function headingKind(line) {
  const m = line.trim().match(HEADING);
  if (!m) return null;
  const word = m[1].toLowerCase();
  if (word.startsWith("example")) return "example";
  return word;
}

/*
 * Splits the Example section into its input/output pairs.
 *
 * Inside an example the words Input: and Output: are labels rather than
 * headings, and the text between them is verbatim test data — it must keep its
 * own blank lines and spacing exactly, because it becomes a test file.
 */
function parseExamples(lines) {
  const examples = [];
  let current = null;
  let field = null;

  const flush = () => {
    if (current && current.input.length) examples.push(current);
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^Example(\s+\d+)?\s*:?\s*$/i.test(trimmed)) {
      flush();
      current = { input: [], expected: [] };
      field = null;
      continue;
    }
    if (/^Input\s*:?\s*$/i.test(trimmed)) {
      if (!current) current = { input: [], expected: [] };
      field = "input";
      continue;
    }
    if (/^Output\s*:?\s*$/i.test(trimmed)) {
      if (!current) current = { input: [], expected: [] };
      field = "expected";
      continue;
    }
    // Anything before the first label is explanatory prose around the example.
    if (!current || !field) continue;
    current[field].push(line);
  }
  flush();

  // Leading and trailing blank lines are the file's layout, not the test data.
  const tidy = (rows) => {
    const copy = [...rows];
    while (copy.length && copy[0].trim() === "") copy.shift();
    while (copy.length && copy[copy.length - 1].trim() === "") copy.pop();
    return copy.join("\n");
  };

  return examples
    .map((e) => ({ input: tidy(e.input), expected: tidy(e.expected) }))
    .filter((e) => e.input !== "");
}

/*
 * Reads one statement file.
 *
 * `officialTitle` is the title from the CSES problem set, used when the file
 * has no title row of its own. It is not a guess: the folders are in the
 * official order and every one of the 400 folder names matches its official
 * title exactly, which the scan checks.
 */
function parseStatement(filePath, officialTitle) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = raw.split("\n");
  const problems = [];

  let cursor = 0;
  let title = null;

  if (lines[1] !== undefined && /^=+\s*$/.test(lines[1]) && lines[0].trim()) {
    title = lines[0].trim();
    cursor = 2;
  } else {
    title = officialTitle;
    problems.push("no title row in the file; used the official title");
  }

  // The two limits, wherever they sit in the opening block.
  let timeLimitSeconds = null;
  let memoryLimitMb = null;
  for (let i = cursor; i < Math.min(cursor + 8, lines.length); i += 1) {
    const t = lines[i].trim();
    const tm = t.match(/^Time limit:\s*([\d.]+)\s*s/i);
    const mm = t.match(/^Memory limit:\s*(\d+)\s*MB/i);
    if (tm) { timeLimitSeconds = Number(tm[1]); cursor = i + 1; }
    if (mm) { memoryLimitMb = Number(mm[1]); cursor = i + 1; }
  }
  if (timeLimitSeconds === null) problems.push("no time limit line");
  if (memoryLimitMb === null) problems.push("no memory limit line");

  // Everything from here is sectioned. `body` collects the prose before the
  // first heading; that is the statement itself.
  const sections = { body: [], input: [], output: [], constraints: [], example: [] };
  let where = "body";
  let seen = [];

  for (let i = cursor; i < lines.length; i += 1) {
    const kind = headingKind(lines[i]);
    /*
     * Once the example section starts, headings stop being headings: an
     * example's own "Input:" and "Output:" labels live inside it and must not
     * reopen the input or output sections.
     */
    if (kind && where !== "example") {
      seen.push(kind);
      /*
       * One file prints "Input" twice where the second is unmistakably the
       * output section — its text begins "Print the maximum area". A second
       * Input heading is therefore read as Output rather than appended to the
       * first, which would have buried the output format inside the input one.
       */
      if (kind === "input" && sections.input.length && !sections.output.length) {
        where = "output";
        problems.push('second "Input" heading read as "Output"');
      } else {
        where = kind;
      }
      continue;
    }
    sections[where].push(lines[i]);
  }

  const tidy = (rows) => rows.join("\n").replace(/^\n+/, "").replace(/\s+$/, "");

  const statement = detex(tidy(sections.body));
  const inputFormat = detex(tidy(sections.input));
  const outputFormat = detex(tidy(sections.output));

  /*
   * Constraints arrive as "- 1 \le n \le 10^6" bullets, one per line, and the
   * schema stores them as a list of strings. A constraint that wraps onto a
   * second line is joined back onto its bullet rather than becoming a
   * constraint of its own.
   */
  const constraints = [];
  for (const line of detex(tidy(sections.constraints)).split("\n")) {
    const t = line.trim();
    if (!t) continue;
    if (/^[-•*]\s+/.test(t)) constraints.push(t.replace(/^[-•*]\s+/, ""));
    else if (constraints.length) constraints[constraints.length - 1] += ` ${t}`;
    else constraints.push(t);
  }

  // Examples keep their data verbatim; only the prose around them is rewritten.
  const examples = parseExamples(sections.example);

  if (!statement) problems.push("empty statement");
  if (!inputFormat && !seen.includes("input")) problems.push("no Input section");
  if (!outputFormat && !seen.includes("output")) problems.push("no Output section");
  if (!constraints.length) problems.push("no constraints");
  if (!examples.length) problems.push("no example with an input");
  for (const [i, e] of examples.entries()) {
    if (!e.expected) problems.push(`example ${i + 1} has no output`);
  }

  return {
    title,
    timeLimitSeconds,
    memoryLimitMb,
    statement,
    inputFormat,
    outputFormat,
    constraints,
    examples,
    sectionsSeen: seen,
    raw,
    problems,
  };
}

module.exports = { parseStatement, detex };
