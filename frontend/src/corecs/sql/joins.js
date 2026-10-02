/*
 * Joins.
 *
 * Source: "Complete SQL.pdf" Q12-18, Q60, "DBMS Notes.pdf" p34,
 * "DBMS Notes copy.pdf" p11.
 *
 * SQL Joins is starred on LIST.pdf, and it is the topic most likely to be
 * asked as a whiteboard exercise rather than a definition.
 */

export default {
  id: "joins",
  name: "Joins",
  importance: "high",
  icon: "pair",
  blurb:
    "Combining tables on a matching column — six kinds, and the one that catches people out on NULLs.",
  source: "Complete SQL Q12-18 · DBMS Notes p34 · cheat-sheets p11",

  questions: [
    {
      id: "sql-join-01",
      subtopic: "Types",
      type: "comparison",
      importance: "high",
      question: "What are the types of join in SQL?",
      short:
        "INNER, LEFT, RIGHT, FULL OUTER, SELF and CROSS.",
      answer: [
        { diagram: "join-types" },
        {
          table: {
            head: ["Join", "Returns", "Unmatched side becomes"],
            rows: [
              ["**INNER**", "Only rows matching in both tables", "Dropped"],
              ["**LEFT (OUTER)**", "All left rows, plus matches from the right", "NULLs on the right"],
              ["**RIGHT (OUTER)**", "All right rows, plus matches from the left", "NULLs on the left"],
              ["**FULL OUTER**", "All rows from both", "NULLs on whichever side is missing"],
              ["**SELF**", "A table joined to itself", "—"],
              ["**CROSS**", "Every row paired with every row", "— (no condition at all)"],
            ],
          },
        },
        {
          code: `SELECT e.name, d.dept_name
FROM   employees e
INNER JOIN departments d ON e.dept_id = d.dept_id;   -- matched only

SELECT e.name, d.dept_name
FROM   employees e
LEFT  JOIN departments d ON e.dept_id = d.dept_id;   -- every employee,
                                                     -- dept_name NULL if none`,
          lang: "sql",
        },
        {
          note: "**`RIGHT JOIN` is almost never used in practice.** `A RIGHT JOIN B` is `B LEFT JOIN A` with the tables swapped, and reading left to right is easier — so most teams write everything as `LEFT`.",
        },
      ],
      tip: "Draw the Venn diagrams if you are at a whiteboard. It is faster than describing them and interviewers recognise it instantly.",
      tags: ["joins", "inner join", "left join", "outer join"],
    },
    {
      id: "sql-join-02",
      subtopic: "Self join",
      type: "how",
      importance: "high",
      question: "What is a self join, and when do you need one?",
      short:
        "A table joined to itself with aliases — used for hierarchies like employee-to-manager.",
      answer: [
        {
          p: "Nothing special happens in the engine. You alias the same table twice so the query can treat the two copies as different tables.",
        },
        {
          code: `-- Every employee with their manager's name.
-- manager_id points at employee_id in the SAME table.
SELECT  e.name  AS employee,
        m.name  AS manager
FROM    employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id;`,
          lang: "sql",
        },
        {
          note: "**`LEFT JOIN`, not `INNER`, is the right choice here** and it is the detail interviewers watch for. With an inner join, anyone without a manager — the CEO — disappears from the results entirely. With a left join they appear with a NULL manager, which is the truth.",
        },
        {
          p: "Other uses: comparing rows within a table (who earns more than their own manager), and walking any parent-child hierarchy one level at a time.",
        },
      ],
      tags: ["self join", "hierarchy", "manager"],
    },
    {
      id: "sql-join-03",
      subtopic: "Comparison",
      type: "comparison",
      importance: "high",
      question: "What is the difference between a JOIN and a UNION?",
      short:
        "A join combines columns **sideways**; a union stacks rows **vertically**.",
      answer: [
        {
          table: {
            head: ["", "JOIN", "UNION"],
            rows: [
              ["Direction", "**Horizontal** — adds columns", "**Vertical** — adds rows"],
              ["Needs", "A related column to match on", "The same number of columns, compatible types"],
              ["Result width", "Columns of both tables", "The same columns as one input"],
              ["Result height", "Depends on matching", "Roughly the sum of both"],
            ],
          },
        },
        {
          code: `-- JOIN: one row per employee, now carrying the department name
SELECT e.name, d.dept_name FROM employees e JOIN departments d ON …

-- UNION: one list containing both sets of names
SELECT name FROM current_employees
UNION
SELECT name FROM former_employees;`,
          lang: "sql",
        },
        {
          note: "If you can only remember one thing: **a join makes the result wider, a union makes it taller.**",
        },
      ],
      tags: ["join", "union", "comparison"],
    },
    {
      id: "sql-join-04",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "high",
      question:
        "How do you find rows in table A that have no match in table B?",
      short:
        "LEFT JOIN and filter for NULL on the right side — the anti-join.",
      answer: [
        {
          code: `-- Employees who belong to no department
SELECT e.name
FROM   employees e
LEFT JOIN departments d ON e.dept_id = d.dept_id
WHERE  d.dept_id IS NULL;        -- the row had no match`,
          lang: "sql",
        },
        {
          p: "The `LEFT JOIN` keeps every employee; unmatched ones get NULLs for every `departments` column. Filtering for `IS NULL` on a column that can never be NULL in the source table isolates exactly those.",
        },
        {
          note: "**Test the right column.** Filter on `d.dept_id` — the join key or the right table's primary key — not on some nullable column like `d.manager_name`, which could legitimately be NULL in a row that *did* match. That mistake silently returns too many rows.",
        },
        { p: "The two alternatives, and why this one is usually preferred:" },
        {
          code: `-- NOT EXISTS: same result, often the same plan, reads well
SELECT e.name FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM departments d WHERE d.dept_id = e.dept_id);

-- NOT IN: DANGEROUS. If the subquery returns even one NULL,
-- the whole thing returns no rows at all.
SELECT e.name FROM employees e
WHERE e.dept_id NOT IN (SELECT dept_id FROM departments);`,
          lang: "sql",
        },
        {
          note: "The `NOT IN` trap is worth knowing: `x NOT IN (1, 2, NULL)` is never true, because comparing anything to NULL is *unknown* rather than false. A single NULL in the subquery makes the query return nothing, with no error.",
        },
      ],
      tip: "The anti-join pattern comes up constantly. Knowing why `NOT IN` breaks on NULLs is what marks out someone who has been bitten by it.",
      tags: ["anti-join", "not exists", "not in", "null", "scenario"],
    },
    {
      id: "sql-join-05",
      subtopic: "Cross join",
      type: "conceptual",
      importance: "med",
      question: "What is a CROSS JOIN, and when is it useful?",
      short:
        "Every row of A paired with every row of B. Usually an accident; occasionally exactly what you want.",
      answer: [
        {
          p: "A cross join has **no join condition**, so it produces the Cartesian product: m rows × n rows = m × n rows.",
        },
        {
          code: `-- Deliberate: every size in every colour
SELECT s.size, c.colour
FROM   sizes s
CROSS JOIN colours c;        -- 4 sizes × 5 colours = 20 combinations

-- Accidental: the old comma syntax with a forgotten WHERE
SELECT * FROM employees, departments;   -- every employee × every department`,
          lang: "sql",
        },
        {
          note: "**An accidental cross join is the classic cause of a query that hangs.** Two tables of 10,000 rows produce 100 million. If a query suddenly returns absurdly many rows, a missing or misspelled join condition is the first thing to check.",
        },
        { p: "Legitimate uses: generating combinations, building a calendar of every date × every store, and creating test data." },
      ],
      tags: ["cross join", "cartesian product"],
    },
    {
      id: "sql-join-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A LEFT JOIN returns:",
      options: [
        "Only matching rows",
        "All rows from the left table, with NULLs where the right has no match",
        "All rows from the right table",
        "Every possible pairing",
      ],
      correct: 1,
      answer: [
        { p: "All left rows regardless of a match; the right-hand columns come back NULL when there is none." },
      ],
      tags: ["mcq", "left join"],
    },
    {
      id: "sql-join-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Two tables of 1,000 rows each, joined with no ON condition, produce:",
      options: ["1,000 rows", "2,000 rows", "1,000,000 rows", "0 rows"],
      correct: 2,
      answer: [
        { p: "A million — the Cartesian product. This is what a forgotten join condition does." },
      ],
      tags: ["mcq", "cross join"],
    },
  ],
};
