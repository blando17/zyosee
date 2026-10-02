/*
 * Subqueries.
 *
 * Source: "Complete SQL.pdf" Q26-28, Q55, Q97, "DBMS Notes.pdf" p35,
 * "DBMS Notes copy.pdf" p12.
 */

export default {
  id: "subqueries",
  name: "Subqueries",
  importance: "high",
  icon: "think",
  blurb:
    "A query inside a query — and the correlated kind that runs once per outer row.",
  source: "Complete SQL Q26-28, 55 · DBMS Notes p35 · cheat-sheets p12",

  questions: [
    {
      id: "sql-sub-01",
      subtopic: "Types",
      type: "comparison",
      importance: "high",
      question: "What kinds of subquery are there?",
      short:
        "Scalar (one value), multi-row, correlated (references the outer query), and derived tables in FROM.",
      answer: [
        {
          table: {
            head: ["Kind", "Returns", "Where it goes", "Runs"],
            rows: [
              ["**Scalar**", "Exactly one value", "Anywhere a value fits", "Once"],
              ["**Multi-row**", "A column of values", "With `IN`, `ANY`, `ALL`", "Once"],
              ["**Correlated**", "Depends on the outer row", "`WHERE`, `SELECT`", "**Once per outer row**"],
              ["**Derived table**", "A result set", "`FROM`", "Once"],
            ],
          },
        },
        {
          code: `-- Scalar: everyone earning above the company average
SELECT name FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Multi-row: everyone in a Bangalore department
SELECT name FROM employees
WHERE dept_id IN (SELECT dept_id FROM departments WHERE city = 'Bangalore');

-- Derived table: give a subquery a name and join to it
SELECT d.dept_name, t.avg_salary
FROM   departments d
JOIN  (SELECT dept_id, AVG(salary) AS avg_salary
       FROM employees GROUP BY dept_id) t
  ON   t.dept_id = d.dept_id;`,
          lang: "sql",
        },
        {
          note: "A **scalar** subquery must return exactly one row and one column. If it returns two rows the query fails at runtime — which is why `= (SELECT …)` is riskier than `IN (SELECT …)` when you are not certain.",
        },
      ],
      tags: ["subquery", "scalar", "derived table"],
    },
    {
      id: "sql-sub-02",
      subtopic: "Correlated",
      type: "how",
      importance: "high",
      question: "What is a correlated subquery?",
      short:
        "One that references a column from the outer query, so it must be re-evaluated for every outer row.",
      answer: [
        {
          code: `-- Employees earning more than their OWN department's average
SELECT e.name, e.salary, e.dept_id
FROM   employees e
WHERE  e.salary > ( SELECT AVG(salary)
                    FROM   employees
                    WHERE  dept_id = e.dept_id );   -- <- e, from outside`,
          lang: "sql",
        },
        {
          p: "The inner query mentions `e.dept_id`, which only exists in the outer query. It therefore cannot be computed once — it has to run again for each candidate row, with a different department each time.",
        },
        {
          table: {
            head: ["", "Ordinary subquery", "Correlated subquery"],
            rows: [
              ["References the outer query", "No", "**Yes**"],
              ["Executes", "Once", "**Once per outer row**"],
              ["Can run standalone", "Yes", "No — the outer column is undefined"],
              ["Cost", "Cheap", "Potentially expensive"],
            ],
          },
        },
        {
          note: "**The performance point is the answer interviewers want.** A correlated subquery over a million-row table can mean a million inner executions. A window function or a join to a grouped derived table usually gets the same answer in one pass — and that is the rewrite to suggest.",
        },
        {
          code: `-- The same question, without the per-row re-execution
SELECT name, salary, dept_id
FROM  (SELECT name, salary, dept_id,
              AVG(salary) OVER (PARTITION BY dept_id) AS dept_avg
       FROM employees) t
WHERE salary > dept_avg;`,
          lang: "sql",
        },
      ],
      tip: "Being able to rewrite a correlated subquery as a window function is a strong signal. Offer it unprompted.",
      tags: ["correlated subquery", "performance", "window function"],
    },
    {
      id: "sql-sub-03",
      subtopic: "IN vs EXISTS",
      type: "comparison",
      importance: "high",
      question: "What is the difference between IN and EXISTS?",
      short:
        "IN compares against a list of values; EXISTS just asks whether any row matched. EXISTS is NULL-safe.",
      answer: [
        {
          table: {
            head: ["", "`IN`", "`EXISTS`"],
            rows: [
              ["Tests", "Whether a value is in a returned list", "Whether the subquery returns **any** row"],
              ["Subquery returns", "A column of values", "Anything — `SELECT 1` is conventional"],
              ["Stops early", "No — builds the whole list", "**Yes** — stops at the first match"],
              ["NULL behaviour", "**`NOT IN` breaks on NULL**", "Safe"],
              ["Better when", "The inner list is small", "The inner table is large, or correlated"],
            ],
          },
        },
        {
          code: `-- IN
SELECT name FROM employees
WHERE dept_id IN (SELECT dept_id FROM departments WHERE city = 'Delhi');

-- EXISTS — correlated, short-circuits on the first hit
SELECT name FROM employees e
WHERE EXISTS (SELECT 1 FROM departments d
              WHERE d.dept_id = e.dept_id AND d.city = 'Delhi');`,
          lang: "sql",
        },
        {
          note: "**The NULL difference is the real answer.** `x NOT IN (1, 2, NULL)` is never true — comparing to NULL yields *unknown*, not false — so one NULL in the subquery makes the whole query return **no rows at all**, silently. `NOT EXISTS` has no such problem, which is why it is the safer default for an anti-join.",
        },
        {
          p: "On performance: modern optimisers often rewrite one into the other, so the difference is smaller than folklore suggests. The NULL semantics are not negotiable, though.",
        },
      ],
      tip: "Lead with the NULL trap. 'EXISTS is faster' is the answer everyone gives and is frequently untrue.",
      tags: ["in", "exists", "not in", "null"],
    },
    {
      id: "sql-sub-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A correlated subquery executes:",
      options: ["Once", "Once per outer row", "Once per table", "Never — it is optimised away"],
      correct: 1,
      answer: [
        {
          p: "Once per outer row, because it depends on a value from that row. That is what makes it potentially expensive.",
        },
      ],
      tags: ["mcq", "correlated subquery"],
    },
    {
      id: "sql-sub-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "`WHERE id NOT IN (SELECT mgr_id FROM employees)` returns no rows. The likeliest cause is:",
      options: [
        "The table is empty",
        "`mgr_id` contains a NULL",
        "A missing index",
        "`NOT IN` is invalid SQL",
      ],
      correct: 1,
      answer: [
        {
          p: "A NULL in `mgr_id`. Comparison against NULL is *unknown*, so `NOT IN` can never be true and the query silently returns nothing. `NOT EXISTS` avoids it.",
        },
      ],
      tags: ["mcq", "not in", "null"],
    },
  ],
};
