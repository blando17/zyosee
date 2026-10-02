/*
 * Aggregation and Grouping.
 *
 * Source: "Complete SQL.pdf" Q11, Q29-30, "DBMS Notes.pdf" pp.33-34,
 * "DBMS Notes copy.pdf" p10.
 */

export default {
  id: "aggregation",
  name: "Aggregation & Grouping",
  importance: "high",
  icon: "progress",
  blurb:
    "Collapsing many rows into one number — and the WHERE/HAVING distinction that follows from when each runs.",
  source: "Complete SQL Q11, 29-30 · DBMS Notes pp.33-34",

  questions: [
    {
      id: "sql-agg-01",
      subtopic: "Aggregates",
      type: "conceptual",
      importance: "high",
      question: "What are the aggregate functions, and how do they treat NULL?",
      short:
        "COUNT, SUM, AVG, MIN, MAX. All of them ignore NULLs — except COUNT(*).",
      answer: [
        {
          table: {
            head: ["Function", "Returns", "NULL handling"],
            rows: [
              ["`COUNT(*)`", "Number of **rows**", "**Counts every row**, NULLs included"],
              ["`COUNT(col)`", "Number of non-NULL values in that column", "Skips NULLs"],
              ["`COUNT(DISTINCT col)`", "Number of distinct non-NULL values", "Skips NULLs"],
              ["`SUM(col)`", "Total", "Skips NULLs"],
              ["`AVG(col)`", "Mean", "Skips NULLs — **divides by the non-NULL count**"],
              ["`MIN` / `MAX`", "Smallest / largest", "Skips NULLs"],
            ],
          },
        },
        {
          note: "**`AVG` is the trap.** With values 10, 20 and NULL, `AVG` returns 15, not 10. It sums 30 and divides by **2**, not 3 — so a column full of missing data quietly reports a higher average than the business expects. `AVG(COALESCE(col, 0))` is the version that treats NULL as zero.",
        },
        {
          code: `-- salaries: 100, 200, NULL
SELECT COUNT(*),        -- 3  (rows)
       COUNT(salary),   -- 2  (non-NULL values)
       SUM(salary),     -- 300
       AVG(salary)      -- 150, not 100
FROM employees;`,
          lang: "sql",
        },
      ],
      tip: "`COUNT(*)` versus `COUNT(column)` is asked constantly, and the AVG-and-NULL follow-up separates the answers.",
      tags: ["aggregate", "count", "avg", "null"],
    },
    {
      id: "sql-agg-02",
      subtopic: "GROUP BY",
      type: "how",
      importance: "high",
      question: "How does GROUP BY work, and what may appear in the SELECT list?",
      short:
        "It collapses rows into one per distinct combination. SELECT may only hold grouped columns and aggregates.",
      answer: [
        {
          code: `SELECT   dept, COUNT(*) AS headcount, AVG(salary) AS avg_salary
FROM     employees
GROUP BY dept;`,
          lang: "sql",
        },
        {
          p: "Every row with the same `dept` collapses into one. The output has one row per distinct department.",
        },
        {
          note: "**The rule for the SELECT list:** every column must either appear in `GROUP BY`, or be wrapped in an aggregate. Anything else is ambiguous — if a department has 40 employees, which of the 40 names would `SELECT name` return? Standard SQL rejects it; MySQL historically returned an arbitrary one, which is worse, because it looks like it worked.",
        },
        {
          code: `-- ERROR in standard SQL: which name?
SELECT dept, name, COUNT(*) FROM employees GROUP BY dept;

-- Fine: name is grouped too, so now it is one row per (dept, name)
SELECT dept, name, COUNT(*) FROM employees GROUP BY dept, name;`,
          lang: "sql",
        },
      ],
      tags: ["group by", "aggregate"],
    },
    {
      id: "sql-agg-03",
      subtopic: "WHERE vs HAVING",
      type: "comparison",
      importance: "high",
      question: "What is the difference between WHERE and HAVING?",
      short:
        "WHERE filters rows before grouping; HAVING filters groups after. Only HAVING can see an aggregate.",
      answer: [
        { diagram: "where-vs-having" },
        {
          table: {
            head: ["", "WHERE", "HAVING"],
            rows: [
              ["Filters", "**Individual rows**", "**Whole groups**"],
              ["Runs", "**Before** `GROUP BY`", "**After** `GROUP BY`"],
              ["Can use aggregates", "**No**", "**Yes** — that is its purpose"],
              ["Needs GROUP BY", "No", "Normally yes"],
            ],
          },
        },
        {
          code: `SELECT   dept, COUNT(*) AS headcount
FROM     employees
WHERE    salary > 50000       -- keep only well-paid employees (rows)
GROUP BY dept
HAVING   COUNT(*) > 5;        -- keep only departments with 6+ of them (groups)`,
          lang: "sql",
        },
        {
          note: "The two do different jobs and the query above needs both. `WHERE salary > 50000` narrows which employees are counted; `HAVING COUNT(*) > 5` decides which departments survive. Swapping them is not a style choice — `WHERE COUNT(*) > 5` is an error, because at that point no groups exist.",
        },
        {
          p: "**Put a condition in `WHERE` whenever you can.** Filtering before grouping means fewer rows to group, which is almost always faster than grouping everything and discarding groups afterwards.",
        },
      ],
      tip: "Give the combined example. Explaining both in one query is stronger than defining them separately.",
      tags: ["where", "having", "group by", "comparison"],
    },
    {
      id: "sql-agg-04",
      subtopic: "Comparison",
      type: "comparison",
      importance: "med",
      question: "GROUP BY vs ORDER BY?",
      short:
        "GROUP BY collapses rows into groups; ORDER BY only sorts the output.",
      answer: [
        {
          table: {
            head: ["", "GROUP BY", "ORDER BY"],
            rows: [
              ["Does", "Collapses rows into one per group", "Sorts rows"],
              ["Changes the row count", "**Yes**", "**No**"],
              ["Runs", "Third", "Sixth — almost last"],
              ["Used with", "Aggregate functions", "Anything, including SELECT aliases"],
            ],
          },
        },
        {
          p: "Because `ORDER BY` runs after `SELECT`, it is the one clause that **can** use a column alias — which `WHERE` and `GROUP BY` cannot.",
        },
      ],
      tags: ["group by", "order by"],
    },
    {
      id: "sql-agg-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "For salaries 100, 200 and NULL, `AVG(salary)` returns:",
      options: ["100", "150", "300", "NULL"],
      correct: 1,
      answer: [
        {
          p: "150. `AVG` ignores NULL entirely — it sums 300 and divides by the 2 non-NULL values, not by 3.",
        },
      ],
      tags: ["mcq", "avg", "null"],
    },
    {
      id: "sql-agg-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which clause can filter on `COUNT(*) > 5`?",
      options: ["WHERE", "HAVING", "Either", "Neither"],
      correct: 1,
      answer: [
        {
          p: "`HAVING`. `WHERE` runs before grouping, so no counts exist yet for it to test.",
        },
      ],
      tags: ["mcq", "having"],
    },
  ],
};
