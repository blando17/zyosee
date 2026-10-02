/*
 * Set Operations.
 *
 * Source: "Complete SQL.pdf" Q19-20, Q59, Q88, "DBMS Notes.pdf" p34.
 */

export default {
  id: "set-operations",
  name: "Set Operations",
  importance: "med",
  icon: "scales",
  blurb:
    "Stacking result sets — UNION, INTERSECT and EXCEPT, and the one that is quietly expensive.",
  source: "Complete SQL Q19-20, 59, 88 · DBMS Notes p34",

  questions: [
    {
      id: "sql-set-01",
      subtopic: "UNION",
      type: "comparison",
      importance: "high",
      question: "What is the difference between UNION and UNION ALL?",
      short:
        "UNION removes duplicates and therefore has to sort; UNION ALL keeps everything and is much faster.",
      answer: [
        {
          table: {
            head: ["", "`UNION`", "`UNION ALL`"],
            rows: [
              ["Duplicates", "**Removed**", "**Kept**"],
              ["Cost", "Higher — must sort or hash to find duplicates", "Low — just concatenates"],
              ["Order of results", "Not guaranteed", "Not guaranteed"],
              ["Use when", "Duplicates would be wrong", "You know there are none, or want them"],
            ],
          },
        },
        {
          code: `SELECT name FROM current_employees
UNION                       -- distinct names
SELECT name FROM former_employees;

SELECT name FROM current_employees
UNION ALL                   -- every row from both, duplicates included
SELECT name FROM former_employees;`,
          lang: "sql",
        },
        {
          note: "**Default to `UNION ALL` and only use `UNION` when you actually need de-duplication.** `UNION` has to compare every row against every other to find duplicates, which on large result sets is a sort you did not ask for and usually did not need.",
        },
        {
          p: "Both require the same number of columns, in the same order, with compatible types.",
        },
      ],
      tags: ["union", "union all", "performance"],
    },
    {
      id: "sql-set-02",
      subtopic: "Other operators",
      type: "conceptual",
      importance: "med",
      question: "What do INTERSECT and EXCEPT do?",
      short:
        "INTERSECT returns rows in both results; EXCEPT (MINUS in Oracle) returns rows in the first and not the second.",
      answer: [
        {
          table: {
            head: ["Operator", "Returns", "Oracle calls it"],
            rows: [
              ["`UNION`", "Rows in either, de-duplicated", "`UNION`"],
              ["`INTERSECT`", "Rows in **both**", "`INTERSECT`"],
              ["`EXCEPT`", "Rows in the first but **not** the second", "`MINUS`"],
            ],
          },
        },
        {
          code: `-- Common records in two tables, without a join
SELECT id FROM table_a
INTERSECT
SELECT id FROM table_b;

-- In A but not B
SELECT id FROM table_a
EXCEPT
SELECT id FROM table_b;`,
          lang: "sql",
        },
        {
          note: "All three remove duplicates by default, like `UNION`. MySQL only added `INTERSECT` and `EXCEPT` in version 8.0.31 — before that the equivalents were an inner join and a `NOT EXISTS`, which is worth knowing if the interview is about MySQL.",
        },
      ],
      tags: ["intersect", "except", "minus"],
    },
    {
      id: "sql-set-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "`UNION ALL` is faster than `UNION` because it:",
      options: [
        "Uses an index",
        "Does not need to find and remove duplicates",
        "Returns fewer rows",
        "Runs the two queries in parallel",
      ],
      correct: 1,
      answer: [
        {
          p: "It just concatenates. `UNION` has to sort or hash the combined result to eliminate duplicates.",
        },
      ],
      tags: ["mcq", "union all"],
    },
  ],
};
