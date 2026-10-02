/*
 * SQL Foundations.
 *
 * Source: "Complete SQL.pdf" Q1-3, Q24, Q62, "DBMS Notes.pdf" p32,
 * "DBMS Notes copy.pdf" p7.
 */

export default {
  id: "foundations",
  name: "SQL Foundations",
  importance: "med",
  icon: "page",
  blurb:
    "The four command families, what SQL actually is, and the execution order that explains most beginner errors.",
  source: "Complete SQL Q1-3 · DBMS Notes p32 · cheat-sheets p7",

  questions: [
    {
      id: "sql-found-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is SQL, and what are its command families?",
      short:
        "A declarative language for relational data, split into DDL, DML, DCL and TCL.",
      answer: [
        {
          p: "**Structured Query Language** is how you talk to a relational database. It is **declarative**: you state the result you want, not the steps to get it. The optimiser decides how.",
        },
        { diagram: "sql-families" },
        {
          table: {
            head: ["Family", "Purpose", "Commands", "Auto-commits?"],
            rows: [
              ["**DDL**", "Define the schema", "`CREATE`, `ALTER`, `DROP`, `TRUNCATE`", "**Yes** — cannot be rolled back"],
              ["**DML**", "Change the rows", "`SELECT`, `INSERT`, `UPDATE`, `DELETE`", "No — inside a transaction"],
              ["**DCL**", "Control access", "`GRANT`, `REVOKE`", "Yes"],
              ["**TCL**", "Manage transactions", "`COMMIT`, `ROLLBACK`, `SAVEPOINT`", "—"],
            ],
          },
        },
        {
          note: "**The auto-commit column is the one that catches people.** `TRUNCATE` is DDL, so it commits immediately and cannot be rolled back. `DELETE` is DML, so it can. That single difference is behind the most-asked SQL comparison question.",
        },
      ],
      tip: "Name the four families with one example each. If you add which ones auto-commit, you have pre-answered the DELETE/TRUNCATE question.",
      tags: ["sql", "ddl", "dml", "dcl", "tcl"],
    },
    {
      id: "sql-found-02",
      subtopic: "Execution order",
      type: "how",
      importance: "high",
      question: "In what order does a SQL query actually execute?",
      short:
        "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. Not the order you write it.",
      answer: [
        { diagram: "query-order" },
        {
          ol: [
            "**FROM / JOIN** — assemble the source rows.",
            "**WHERE** — discard rows that fail the condition.",
            "**GROUP BY** — collapse what is left into groups.",
            "**HAVING** — discard whole groups.",
            "**SELECT** — evaluate the output columns, including aliases.",
            "**ORDER BY** — sort.",
            "**LIMIT / OFFSET** — take a slice.",
          ],
        },
        {
          note: "**This explains two errors people hit constantly.** `SELECT` runs *fifth*, so a column alias defined there does not exist yet in `WHERE` — but it does in `ORDER BY`, which runs sixth. And `WHERE` runs before grouping, so it cannot see an aggregate; that is what `HAVING` is for.",
        },
        {
          code: `SELECT dept, COUNT(*) AS headcount
FROM   employees
WHERE  salary > 50000        -- filters ROWS, before grouping
GROUP  BY dept
HAVING COUNT(*) > 5          -- filters GROUPS; cannot say "headcount" here
ORDER  BY headcount DESC     -- but CAN here — SELECT has already run
LIMIT  10;`,
          lang: "sql",
        },
      ],
      tip: "This one fact answers 'why can't I use my alias in WHERE' and 'WHERE vs HAVING' at the same time. Learn the order.",
      tags: ["execution order", "alias", "where", "having"],
    },
    {
      id: "sql-found-03",
      subtopic: "Basics",
      type: "comparison",
      importance: "med",
      question: "What is the difference between SQL and MySQL?",
      short:
        "SQL is the language. MySQL is a database product that implements it.",
      answer: [
        {
          table: {
            head: ["", "SQL", "MySQL"],
            rows: [
              ["Is", "A **language**, standardised by ANSI/ISO", "A **relational database management system**"],
              ["Made by", "The standards body", "Oracle (originally MySQL AB)"],
              ["Versions", "SQL-92, SQL:1999, SQL:2016 …", "MySQL 5.7, 8.0 …"],
              ["Comparable to", "English", "A particular newspaper written in it"],
            ],
          },
        },
        {
          p: "Other products implementing SQL: PostgreSQL, Oracle Database, SQL Server, SQLite, MariaDB. Each adds its own extensions, which is why a query that runs on one may not run on another.",
        },
        {
          note: "The practical consequence worth mentioning: **there is standard SQL and there is each product's dialect.** `LIMIT` is MySQL and PostgreSQL; SQL Server wants `TOP`; Oracle historically wanted `ROWNUM`. Saying which dialect you are writing in is a good habit in an interview.",
        },
      ],
      tags: ["sql", "mysql", "rdbms", "dialect"],
    },
    {
      id: "sql-found-04",
      subtopic: "Basics",
      type: "conceptual",
      importance: "low",
      question: "Is SQL case sensitive?",
      short:
        "Keywords are not. Whether *data* comparison is depends on the column's collation.",
      answer: [
        {
          ul: [
            "**Keywords** — never case sensitive. `SELECT`, `select` and `SeLeCt` are the same.",
            "**Identifiers** — depends. MySQL table names follow the filesystem (case sensitive on Linux, not on Windows); PostgreSQL folds unquoted names to lower case.",
            "**String data** — depends on **collation**. A `_ci` collation is case-insensitive, `_cs` and `_bin` are not.",
          ],
        },
        {
          code: `-- Same query either way
SELECT * FROM employees;
select * from EMPLOYEES;

-- Whether this matches 'ANANYA' depends on the column's collation
SELECT * FROM employees WHERE name = 'Ananya';`,
          lang: "sql",
        },
        {
          note: "The convention nearly everyone follows: **keywords in upper case, identifiers in lower case**. It is purely for readability — the parser does not care.",
        },
      ],
      tags: ["case sensitivity", "collation"],
    },
    {
      id: "sql-found-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which clause executes FIRST?",
      options: ["SELECT", "FROM", "WHERE", "ORDER BY"],
      correct: 1,
      answer: [
        {
          p: "`FROM` — the source rows have to exist before anything can filter or project them. `SELECT` is fifth.",
        },
      ],
      tags: ["mcq", "execution order"],
    },
    {
      id: "sql-found-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "`TRUNCATE` belongs to which command family?",
      options: ["DML", "DDL", "DCL", "TCL"],
      correct: 1,
      answer: [
        {
          p: "DDL — which is why it auto-commits and cannot be rolled back, unlike `DELETE`.",
        },
      ],
      tags: ["mcq", "ddl", "truncate"],
    },
  ],
};
