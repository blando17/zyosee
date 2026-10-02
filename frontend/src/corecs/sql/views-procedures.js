/*
 * Views, Procedures, Functions and Triggers.
 *
 * Source: "Complete SQL.pdf" Q34-35, Q45-50, Q68, Q99,
 * "DBMS Notes.pdf" p35, "DBMS Notes copy.pdf" p18,
 * "Top 100 DBMS Interview Questions.pdf" (triggers, cursors, CTEs).
 */

export default {
  id: "views-procedures",
  name: "Views, Procedures & Triggers",
  importance: "med",
  icon: "gear",
  blurb:
    "The named things you store in the database — virtual tables, reusable logic, and code that fires on its own.",
  source: "Complete SQL Q34-35, 45-50 · DBMS Notes p35 · cheat-sheets p18",

  questions: [
    {
      id: "sql-vp-01",
      subtopic: "Views",
      type: "definition",
      importance: "high",
      question: "What is a view, and how does it differ from a table?",
      short:
        "A stored query that behaves like a table. It holds no data of its own — it runs every time you select from it.",
      answer: [
        {
          code: `CREATE VIEW v_toppers AS
SELECT roll_no, name, cgpa
FROM   student
WHERE  cgpa >= 9.0;

SELECT * FROM v_toppers;   -- runs the underlying query now`,
          lang: "sql",
        },
        {
          table: {
            head: ["", "Table", "View"],
            rows: [
              ["Stores data", "**Yes**", "**No** — only the query text"],
              ["Occupies space", "Yes", "Essentially none"],
              ["Always current", "It is the data", "Yes — re-runs each time"],
              ["Updatable", "Yes", "Sometimes — simple single-table views only"],
            ],
          },
        },
        { p: "**What views are for:**" },
        {
          ul: [
            "**Hiding complexity** — a four-table join becomes one name.",
            "**Security** — grant access to a view exposing three columns instead of the table's twenty.",
            "**A stable interface** — the underlying tables can be reorganised while the view keeps its shape.",
          ],
        },
        {
          note: "A **materialised view** is the different thing worth naming: it *does* store its result, so reads are fast and the data is as stale as the last refresh. An ordinary view trades speed for freshness; a materialised view trades the other way.",
        },
      ],
      tags: ["view", "materialised view", "security"],
    },
    {
      id: "sql-vp-02",
      subtopic: "Procedures",
      type: "comparison",
      importance: "high",
      question: "What is the difference between a stored procedure and a function?",
      short:
        "A function must return a value and can be used inside a query; a procedure need not, and cannot.",
      answer: [
        {
          table: {
            head: ["", "Function", "Stored procedure"],
            rows: [
              ["Must return a value", "**Yes**", "No — may return none or several via OUT params"],
              ["Callable inside a `SELECT`", "**Yes**", "**No**"],
              ["Can modify data", "Usually restricted", "**Yes**"],
              ["Can manage transactions", "No", "**Yes** — `COMMIT` / `ROLLBACK`"],
              ["Invoked with", "Used in an expression", "`CALL` / `EXEC`"],
              ["Try-catch / error handling", "Limited", "Yes"],
            ],
          },
        },
        {
          code: `-- Function: returns a value, usable in a query
SELECT name, calculate_bonus(salary) AS bonus FROM employees;

-- Procedure: performs work, called on its own
CALL transfer_funds(1, 2, 500);`,
          lang: "sql",
        },
        {
          note: "The distinction that drives the rest: **a function is an expression, a procedure is a statement.** Because a function can appear inside a `SELECT`, it may be evaluated once per row — so a function that writes data or manages transactions would make queries unpredictable, which is why most systems forbid it.",
        },
      ],
      tags: ["stored procedure", "function", "comparison"],
    },
    {
      id: "sql-vp-03",
      subtopic: "Triggers",
      type: "definition",
      importance: "med",
      question: "What is a trigger?",
      short:
        "Code that runs automatically when an INSERT, UPDATE or DELETE happens on a table.",
      answer: [
        {
          code: `CREATE TRIGGER log_salary_change
AFTER UPDATE ON employees
FOR EACH ROW
BEGIN
    INSERT INTO salary_audit (emp_id, old_salary, new_salary, changed_at)
    VALUES (OLD.id, OLD.salary, NEW.salary, NOW());
END;`,
          lang: "sql",
        },
        {
          table: {
            head: ["Dimension", "Options"],
            rows: [
              ["Timing", "`BEFORE` or `AFTER` the statement"],
              ["Event", "`INSERT`, `UPDATE`, `DELETE`"],
              ["Granularity", "`FOR EACH ROW`, or once per statement"],
              ["Access to values", "`OLD.col` and `NEW.col`"],
            ],
          },
        },
        {
          p: "Used for audit trails, enforcing rules too complex for a `CHECK`, and maintaining denormalised copies.",
        },
        {
          note: "**The reason to be sparing with them:** a trigger is invisible at the call site. Somebody reading an `UPDATE` has no way to tell that it also wrote three other tables, and triggers that fire triggers are genuinely hard to debug. Put logic in the application where you can see it, unless it must hold for *every* path into the table.",
        },
      ],
      tags: ["trigger", "audit", "before", "after"],
    },
    {
      id: "sql-vp-04",
      subtopic: "CTEs",
      type: "comparison",
      importance: "high",
      question: "What is a CTE, and how does it compare with a subquery or a temp table?",
      short:
        "A named result set defined with WITH, living for one statement. It makes nested queries readable.",
      answer: [
        {
          code: `WITH dept_avg AS (
    SELECT dept, AVG(salary) AS avg_salary
    FROM   employees
    GROUP  BY dept
)
SELECT e.name, e.salary, d.avg_salary
FROM   employees e
JOIN   dept_avg d ON e.dept = d.dept
WHERE  e.salary > d.avg_salary;`,
          lang: "sql",
        },
        {
          table: {
            head: ["", "CTE", "Derived table", "Temp table"],
            rows: [
              ["Lives for", "One statement", "One statement", "The session"],
              ["Named", "**Yes** — readable", "Inline, awkward to reuse", "Yes"],
              ["Reusable in the same query", "**Yes**", "No — repeat it", "Yes"],
              ["Indexable", "No", "No", "**Yes**"],
              ["Recursive", "**Yes**, with `WITH RECURSIVE`", "No", "No"],
            ],
          },
        },
        {
          note: "**Recursion is the thing only a CTE can do.** `WITH RECURSIVE` walks a hierarchy to arbitrary depth — a whole org chart, a bill of materials, a category tree — which no amount of joining can express when the depth is unknown.",
        },
        {
          p: "For anything big enough to want an index on the intermediate result, a temp table is the right choice; a CTE is for readability inside one statement.",
        },
      ],
      tip: "Rewriting a deeply nested subquery as a chain of CTEs is an easy way to show judgement about readability.",
      tags: ["cte", "with", "recursive", "temp table"],
    },
    {
      id: "sql-vp-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which can be used inside a `SELECT` list?",
      options: ["A stored procedure", "A function", "Both", "Neither"],
      correct: 1,
      answer: [
        {
          p: "A function — it is an expression and returns a value. A procedure is a statement, called with `CALL` or `EXEC`.",
        },
      ],
      tags: ["mcq", "function", "procedure"],
    },
    {
      id: "sql-vp-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A view stores:",
      options: ["A copy of the data", "The query definition only", "An index", "Nothing at all"],
      correct: 1,
      answer: [
        {
          p: "The query definition. It runs afresh on every access — unless it is a **materialised** view, which does store the result.",
        },
      ],
      tags: ["mcq", "view"],
    },
  ],
};
