/*
 * SELECT and Filtering.
 *
 * Source: "DBMS Notes.pdf" pp.40-43 (the practice-query table),
 * "Complete SQL.pdf" Q31, Q72, "DBMS Notes copy.pdf" pp.8-9.
 *
 * ONE PRACTICE QUERY IN THE NOTES DOES NOT PARSE.
 *
 * DBMS Notes p41 #18 reads:
 *   SELECT * FROM staff WHERE given_name LIKE '_____h'; AND LENGTH(...) = 6;
 * The semicolon in the middle ends the statement, so the AND is a syntax
 * error — and the length test is redundant anyway, since five underscores
 * plus 'h' already fixes the length at six.
 */

export default {
  id: "select-filter",
  name: "SELECT & Filtering",
  importance: "high",
  icon: "search",
  blurb:
    "Choosing rows and columns — the operators, the wildcards, and why NULL never equals anything.",
  source: "DBMS Notes pp.40-43 · Complete SQL Q31, 72 · cheat-sheets pp.8-9",

  questions: [
    {
      id: "sql-sel-01",
      subtopic: "Filtering",
      type: "conceptual",
      importance: "high",
      question: "What operators can you use in a WHERE clause?",
      short:
        "Comparison, BETWEEN, IN, LIKE, IS NULL, and AND/OR/NOT to combine them.",
      answer: [
        {
          table: {
            head: ["Operator", "Matches", "Example"],
            rows: [
              ["`=` `<>` `>` `<` `>=` `<=`", "Comparison", "`salary > 50000`"],
              ["`BETWEEN a AND b`", "A range, **inclusive** of both ends", "`salary BETWEEN 100000 AND 500000`"],
              ["`IN (…)`", "Any value in a list", "`name IN ('Arjun', 'Rohan')`"],
              ["`LIKE`", "A pattern", "`division LIKE 'Finan%'`"],
              ["`IS NULL` / `IS NOT NULL`", "Missing values — **not** `= NULL`", "`manager_id IS NULL`"],
              ["`AND` `OR` `NOT`", "Combines conditions", "`dept = 'CSE' AND cgpa > 8`"],
            ],
          },
        },
        {
          code: `SELECT * FROM staff WHERE division LIKE 'Finan%';      -- starts with
SELECT * FROM staff WHERE LOWER(given_name) LIKE '%a%'; -- contains
SELECT * FROM staff WHERE given_name LIKE '_____h';     -- 6 chars, ends 'h'
SELECT * FROM staff WHERE pay BETWEEN 100000 AND 500000;
SELECT * FROM staff WHERE given_name NOT IN ('Arjun', 'Rohan');`,
          lang: "sql",
        },
        {
          note: "**`%` matches any number of characters; `_` matches exactly one.** So `'_____h'` is five of anything followed by `h` — a six-character name. `BETWEEN` includes both endpoints, which is worth stating since half of people assume it does not.",
        },
        {
          note: "Your notes' practice query #18 is `... LIKE '_____h'; AND LENGTH(given_name) = 6;` — the semicolon in the middle ends the statement, so the `AND` is a syntax error. The length check is also redundant: the five underscores already fix the length.",
          tone: "warn",
        },
      ],
      tags: ["where", "like", "between", "in", "wildcards"],
    },
    {
      id: "sql-sel-02",
      subtopic: "NULL",
      type: "why",
      importance: "high",
      question: "Why does `WHERE salary = NULL` return nothing?",
      short:
        "NULL means unknown, so any comparison with it is unknown — never true. Use `IS NULL`.",
      answer: [
        {
          p: "NULL is not a value. It is the **absence** of one, so `salary = NULL` is asking \"is this unknown thing equal to that unknown thing\" — and the honest answer is *unknown*, which `WHERE` treats as not-true.",
        },
        {
          code: `SELECT * FROM employees WHERE salary = NULL;      -- always 0 rows
SELECT * FROM employees WHERE salary IS NULL;     -- correct
SELECT * FROM employees WHERE salary IS NOT NULL; -- correct`,
          lang: "sql",
        },
        {
          table: {
            head: ["Expression", "Result"],
            rows: [
              ["`NULL = NULL`", "**Unknown**, not true"],
              ["`NULL <> 5`", "Unknown"],
              ["`NULL + 10`", "**NULL** — it propagates through arithmetic"],
              ["`COUNT(col)`", "Skips NULLs"],
              ["`COUNT(*)`", "Counts the row anyway"],
              ["`x NOT IN (1, NULL)`", "**Never true** — the classic trap"],
            ],
          },
        },
        {
          note: "SQL uses **three-valued logic** — true, false, unknown — and that one fact explains every NULL surprise: the `NOT IN` trap, an `AVG` that skips rows, a `JOIN` that drops them, and a `CHECK` constraint that passes because unknown is not false.",
        },
        {
          p: "The tools for handling it: `COALESCE(col, fallback)` returns the first non-NULL argument and is standard SQL; `NVL` is Oracle's version and `IFNULL` MySQL's.",
        },
      ],
      tip: "Say 'three-valued logic'. It shows the behaviour is a rule you understand, not a quirk you have memorised.",
      tags: ["null", "three-valued logic", "coalesce", "is null"],
    },
    {
      id: "sql-sel-03",
      subtopic: "Output",
      type: "conceptual",
      importance: "med",
      question: "What do DISTINCT, ORDER BY and LIMIT do?",
      short:
        "DISTINCT removes duplicate rows, ORDER BY sorts, LIMIT takes a slice. LIMIT is meaningless without ORDER BY.",
      answer: [
        {
          code: `SELECT DISTINCT division FROM staff;                     -- unique values
SELECT * FROM staff ORDER BY given_name ASC, division DESC;
SELECT * FROM staff ORDER BY pay DESC LIMIT 10;          -- top 10
SELECT * FROM staff ORDER BY pay DESC LIMIT 10 OFFSET 20; -- rows 21-30`,
          lang: "sql",
        },
        {
          note: "**`LIMIT` without `ORDER BY` is not 'the first 10 rows' — it is 10 arbitrary rows.** A table has no inherent order, so the database may return whichever 10 are cheapest to produce, and that can change as the data or the plan changes. Paginating without a deterministic sort silently shows duplicates and skips rows.",
        },
        {
          p: "`DISTINCT` applies to the whole row, not one column: `SELECT DISTINCT dept, name` gives distinct *pairs*. Dialects differ on the slice syntax — `LIMIT` in MySQL and PostgreSQL, `TOP` in SQL Server, `FETCH FIRST n ROWS ONLY` in the standard.",
        },
      ],
      tags: ["distinct", "order by", "limit", "pagination"],
    },
    {
      id: "sql-sel-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "`WHERE pay BETWEEN 100 AND 200` includes:",
      options: ["Neither endpoint", "100 only", "200 only", "Both endpoints"],
      correct: 3,
      answer: [{ p: "Both. `BETWEEN` is inclusive at each end." }],
      tags: ["mcq", "between"],
    },
    {
      id: "sql-sel-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In `LIKE`, the `_` wildcard matches:",
      options: ["Any number of characters", "Exactly one character", "A digit only", "A literal underscore"],
      correct: 1,
      answer: [{ p: "Exactly one character. `%` is the any-number-of-characters wildcard." }],
      tags: ["mcq", "like"],
    },
  ],
};
