/*
 * Classic Query Puzzles.
 *
 * Source: "Complete SQL.pdf" Q32-33, Q63-64, Q75-90 — the "Advanced Level"
 * and "Real-Time Scenarios" sections, which are almost entirely these.
 *
 * These are the queries that actually get set in interviews, so each one is
 * given with the window-function answer AND the classic answer, since some
 * interviewers ask for the version that works without window functions.
 */

export default {
  id: "puzzles",
  name: "Classic Query Puzzles",
  importance: "high",
  icon: "target",
  blurb:
    "The handful of queries that come up again and again — Nth highest salary, duplicates, per-group maximum.",
  source: "Complete SQL Q32-33, 63-64, 75-90",

  questions: [
    {
      id: "sql-puz-01",
      subtopic: "Nth highest",
      type: "scenario",
      importance: "high",
      question: "How do you find the second highest salary?",
      short:
        "DENSE_RANK, or a subquery for the max below the max. Both need care about ties.",
      answer: [
        { p: "**The window-function answer** — clearest, and generalises to Nth immediately:" },
        {
          code: `SELECT DISTINCT salary
FROM  (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
       FROM employees) t
WHERE rnk = 2;`,
          lang: "sql",
        },
        { p: "**Without window functions**, which is often what is being asked for:" },
        {
          code: `-- The largest salary that is not the largest salary
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Or with LIMIT/OFFSET (MySQL, PostgreSQL)
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;`,
          lang: "sql",
        },
        {
          note: "**The `DISTINCT` matters.** If three people earn the top salary, `LIMIT 1 OFFSET 1` without `DISTINCT` returns the *same* top salary again — it is skipping a row, not a salary. `DENSE_RANK` and the `MAX` version both handle ties correctly.",
        },
        {
          p: "**For the Nth highest**, only the number changes — which is the reason to prefer the ranking version:",
        },
        {
          code: `SELECT DISTINCT salary
FROM  (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
       FROM employees) t
WHERE rnk = 5;              -- fifth distinct salary`,
          lang: "sql",
        },
      ],
      tip: "Ask what should happen with ties before writing anything. That question alone impresses more than the query.",
      tags: ["nth highest", "dense_rank", "ties", "scenario"],
    },
    {
      id: "sql-puz-02",
      subtopic: "Duplicates",
      type: "scenario",
      importance: "high",
      question: "How do you find duplicate records, and then delete them?",
      short:
        "GROUP BY with HAVING COUNT(*) > 1 to find them; ROW_NUMBER to delete all but one.",
      answer: [
        { p: "**Finding them** — group by whatever makes a row a duplicate:" },
        {
          code: `-- Duplicate emails, with how many times each appears
SELECT email, COUNT(*) AS occurrences
FROM   employees
GROUP  BY email
HAVING COUNT(*) > 1;`,
          lang: "sql",
        },
        { p: "**Deleting all but one** — number the copies and delete everything after the first:" },
        {
          code: `WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
    FROM   employees
)
DELETE FROM employees
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);`,
          lang: "sql",
        },
        {
          note: "**`ROW_NUMBER`, not `RANK`.** `RANK` gives every tied row the same number, so `rn > 1` would delete none of them — or with a different grouping, all of them. `ROW_NUMBER` guarantees exactly one row per group gets number 1, which is precisely the one you keep.",
        },
        {
          p: "The classic no-window-function version, keeping the lowest id:",
        },
        {
          code: `DELETE FROM employees
WHERE id NOT IN (SELECT MIN(id) FROM employees GROUP BY email);`,
          lang: "sql",
        },
        {
          note: "Run the `SELECT` before the `DELETE`, every time. A de-duplication query that groups on the wrong columns deletes real data, and there is no undo outside a transaction.",
        },
      ],
      tip: "Say you would wrap it in a transaction and check the count first. That is what the question is really testing.",
      tags: ["duplicates", "row_number", "delete", "scenario"],
    },
    {
      id: "sql-puz-03",
      subtopic: "Per-group max",
      type: "scenario",
      importance: "high",
      question: "How do you find the highest-paid employee in each department?",
      short:
        "Rank within each department and take rank 1 — a window function partitioned by department.",
      answer: [
        {
          code: `SELECT dept, name, salary
FROM  (SELECT dept, name, salary,
              RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rnk
       FROM   employees) t
WHERE rnk = 1;`,
          lang: "sql",
        },
        { p: "**Without window functions**, joining back to the per-department maximum:" },
        {
          code: `SELECT e.dept, e.name, e.salary
FROM   employees e
JOIN  (SELECT dept, MAX(salary) AS max_salary
       FROM employees GROUP BY dept) m
  ON   e.dept = m.dept AND e.salary = m.max_salary;`,
          lang: "sql",
        },
        {
          note: "**Both return every tied top earner**, which is usually right. If you want exactly one per department, `ROW_NUMBER()` instead of `RANK()` picks one arbitrarily — and you should say which tie-break you used rather than leaving it to chance.",
        },
        {
          p: "The common wrong answer is `SELECT dept, name, MAX(salary) FROM employees GROUP BY dept`. That is invalid in standard SQL — `name` is neither grouped nor aggregated — and MySQL historically returned an **arbitrary** name with the correct maximum salary, which is worse than an error because it looks like it worked.",
        },
      ],
      tip: "Mention the broken `GROUP BY` version and why it is wrong. Interviewers often plant it to see if you notice.",
      tags: ["per-group max", "rank", "partition by", "scenario"],
    },
    {
      id: "sql-puz-04",
      subtopic: "Self comparison",
      type: "scenario",
      importance: "med",
      question: "How do you find employees who earn more than their manager?",
      short: "Self join on manager_id and compare the two salary columns.",
      answer: [
        {
          code: `SELECT e.name AS employee, e.salary, m.name AS manager, m.salary AS mgr_salary
FROM   employees e
JOIN   employees m ON e.manager_id = m.employee_id
WHERE  e.salary > m.salary;`,
          lang: "sql",
        },
        {
          note: "An **`INNER JOIN` is correct here**, unlike the general self-join case. Someone with no manager cannot earn more than their manager, so dropping those rows is the intended behaviour rather than a bug.",
        },
      ],
      tags: ["self join", "scenario"],
    },
    {
      id: "sql-puz-05",
      subtopic: "Row selection",
      type: "scenario",
      importance: "med",
      question: "How do you fetch alternate rows, or the last N rows?",
      short:
        "Number the rows first — position is not a property a table has.",
      answer: [
        {
          code: `-- Odd-numbered rows
SELECT * FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM employees) t
WHERE MOD(rn, 2) = 1;

-- The last 3 rows, back in the original order
SELECT * FROM (SELECT * FROM employees ORDER BY id DESC LIMIT 3) t
ORDER BY id ASC;`,
          lang: "sql",
        },
        {
          note: "**A table has no row order.** \"The last 3 rows\" only means something once you name a column to order by — the trick is to sort descending, take 3, then sort back. Without an `ORDER BY` the database is free to return rows in any order it likes, and it will change as the data does.",
        },
      ],
      tags: ["row_number", "limit", "ordering", "scenario"],
    },
    {
      id: "sql-puz-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "To delete duplicates keeping one row per group, you should use:",
      options: ["RANK()", "DENSE_RANK()", "ROW_NUMBER()", "COUNT()"],
      correct: 2,
      answer: [
        {
          p: "`ROW_NUMBER()` — it is the only one guaranteed to give exactly one row per group the number 1. `RANK` gives every tied row the same number, so `rn > 1` would delete none of them.",
        },
      ],
      tags: ["mcq", "duplicates", "row_number"],
    },
  ],
};
