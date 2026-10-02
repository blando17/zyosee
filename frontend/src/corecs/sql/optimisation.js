/*
 * Functions, NULLs and Optimisation.
 *
 * Source: "Complete SQL.pdf" Q38-44, Q66, Q72, Q91-98,
 * "Top 100 DBMS Interview Questions.pdf" (SQL injection, query optimisation).
 */

export default {
  id: "optimisation",
  name: "Functions & Optimisation",
  importance: "med",
  icon: "bulb",
  blurb:
    "CASE, COALESCE and the handful of habits that decide whether a query takes 10 milliseconds or 10 seconds.",
  source: "Complete SQL Q38-44, 91-98 · Top 100 DBMS",

  questions: [
    {
      id: "sql-opt-01",
      subtopic: "Functions",
      type: "conceptual",
      importance: "high",
      question: "What do CASE and COALESCE do?",
      short:
        "CASE is SQL's if-then-else. COALESCE returns the first non-NULL of its arguments.",
      answer: [
        {
          code: `SELECT name,
       salary,
       CASE
           WHEN salary >= 100000 THEN 'Senior'
           WHEN salary >=  50000 THEN 'Mid'
           ELSE                       'Junior'
       END                                  AS band,
       COALESCE(bonus, 0)                   AS bonus,      -- NULL becomes 0
       COALESCE(nickname, name, 'Unknown')  AS display_name -- first non-NULL
FROM   employees;`,
          lang: "sql",
        },
        {
          table: {
            head: ["Function", "Does", "Portable?"],
            rows: [
              ["`CASE WHEN … THEN … END`", "Conditional expression", "**Standard SQL**"],
              ["`COALESCE(a, b, c)`", "First non-NULL argument", "**Standard SQL**"],
              ["`NVL(a, b)`", "Two-argument COALESCE", "Oracle only"],
              ["`IFNULL(a, b)`", "Two-argument COALESCE", "MySQL only"],
              ["`ISNULL(a, b)`", "Two-argument COALESCE", "SQL Server only"],
              ["`NULLIF(a, b)`", "NULL when a = b — guards division by zero", "Standard SQL"],
            ],
          },
        },
        {
          note: "**Prefer `COALESCE`.** It is standard SQL, takes any number of arguments, and works everywhere; `NVL`, `IFNULL` and `ISNULL` are three vendors' names for a two-argument version of the same thing.",
        },
        {
          p: "`CASE` is also useful inside an aggregate for conditional counting: `SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)` counts paid rows without a second query.",
        },
      ],
      tags: ["case", "coalesce", "nvl", "nullif"],
    },
    {
      id: "sql-opt-02",
      subtopic: "Optimisation",
      type: "how",
      importance: "high",
      question: "How do you optimise a slow SQL query?",
      short:
        "Read the execution plan first, then index the filter and join columns, select fewer columns, and keep functions off indexed columns.",
      answer: [
        {
          ol: [
            "**Read the plan.** `EXPLAIN` (or `EXPLAIN ANALYZE`) tells you where the time goes. Everything else is guessing.",
            "**Index what you filter and join on.** A missing index on a foreign key turns a join into a scan per row.",
            "**Avoid `SELECT *`.** Fewer columns means less I/O, and may let an index answer the query without touching the table at all.",
            "**Keep functions off indexed columns.** `WHERE UPPER(name) = 'X'` cannot use an index on `name`.",
            "**Filter before joining**, so the join works on fewer rows.",
            "**`UNION ALL` over `UNION`** unless you genuinely need de-duplication.",
            "**`EXISTS` over `IN`** for large correlated subqueries — and always for `NOT IN`, because of NULLs.",
            "**Keep statistics current.** The planner chooses on estimates; stale ones produce bad plans.",
          ],
        },
        {
          code: `-- What is it actually doing?
EXPLAIN ANALYZE
SELECT e.name, d.dept_name
FROM   employees e
JOIN   departments d ON e.dept_id = d.dept_id
WHERE  e.salary > 50000;

-- "Seq Scan on employees" with a selective filter -> index it
CREATE INDEX idx_employees_salary ON employees(salary);`,
          lang: "sql",
        },
        {
          note: "**A covering index is the strongest version of point 3.** If the index contains every column the query needs, the database answers from the index and never reads the table — which is often an order of magnitude, not a few percent.",
        },
      ],
      tip: "Lead with `EXPLAIN`. A list of tips without measurement is the answer of someone who has read about optimisation rather than done it.",
      tags: ["optimisation", "explain", "index", "covering index"],
    },
    {
      id: "sql-opt-03",
      subtopic: "Security",
      type: "scenario",
      importance: "high",
      question: "What is SQL injection, and how do you prevent it?",
      short:
        "Untrusted input concatenated into a query, so it becomes code. Prevent it with parameterised queries.",
      answer: [
        {
          codePair: {
            left: {
              label: "Vulnerable",
              code: `// input glued into the SQL
const q =
  "SELECT * FROM users WHERE name = '"
  + userInput + "'";

// userInput = ' OR '1'='1
// SELECT * FROM users
// WHERE name = '' OR '1'='1'
//   -> returns every user`,
            },
            right: {
              label: "Safe",
              code: `// input sent separately from the SQL
db.query(
  "SELECT * FROM users WHERE name = ?",
  [userInput]
);

// the driver never mixes them,
// so input can only ever be
// a VALUE, never syntax`,
            },
          },
        },
        {
          p: "**Why parameterisation works** is the part worth saying: the query text is parsed and planned *before* the value is supplied, so the value cannot change the structure of the statement. Escaping tries to neutralise dangerous characters and is a list of things to remember; parameterisation removes the possibility.",
        },
        {
          ul: [
            "**Parameterised queries / prepared statements** — the real defence.",
            "**Least privilege** — the application's database user should not be able to `DROP TABLE`.",
            "**Validate input** — helpful, but not a substitute.",
            "**Never build SQL by string concatenation with user input.** Not even for an internal tool.",
          ],
        },
        {
          note: "An ORM helps because it parameterises by default — but any raw-SQL escape hatch reintroduces the risk, so the rule applies to those too.",
        },
      ],
      tip: "Explain *why* parameterisation is safe rather than just naming it. \"The query is planned before the value arrives\" is the sentence.",
      tags: ["sql injection", "security", "prepared statements", "scenario"],
    },
    {
      id: "sql-opt-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "`WHERE UPPER(name) = 'ANANYA'` on an indexed `name` column:",
      options: [
        "Uses the index normally",
        "Cannot use the index, because a function wraps the column",
        "Is a syntax error",
        "Is faster than comparing directly",
      ],
      correct: 1,
      answer: [
        {
          p: "The index is on `name`, not on `UPPER(name)`, so the planner falls back to a scan. A function-based index would fix it.",
        },
      ],
      tags: ["mcq", "index", "optimisation"],
    },
    {
      id: "sql-opt-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "The reliable defence against SQL injection is:",
      options: [
        "Escaping quotes in the input",
        "Parameterised queries",
        "Hiding error messages",
        "Validating input length",
      ],
      correct: 1,
      answer: [
        {
          p: "Parameterised queries — the statement is planned before the value arrives, so input cannot become syntax. The others help but are not sufficient.",
        },
      ],
      tags: ["mcq", "sql injection"],
    },
  ],
};
