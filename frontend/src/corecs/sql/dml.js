/*
 * DML and Transaction Control.
 *
 * Source: "Complete SQL.pdf" Q10, Q52-54, Q56, Q65, "DBMS Notes.pdf" p32.
 */

export default {
  id: "dml",
  name: "DML & Transactions",
  importance: "high",
  icon: "pen",
  blurb:
    "Changing data — and the three-way DELETE/TRUNCATE/DROP comparison that gets asked in nearly every SQL interview.",
  source: "Complete SQL Q10, 52-56, 65 · DBMS Notes p32",

  questions: [
    {
      id: "sql-dml-01",
      subtopic: "Comparison",
      type: "comparison",
      importance: "high",
      question: "What is the difference between DELETE, TRUNCATE and DROP?",
      short:
        "DELETE removes chosen rows and can be rolled back; TRUNCATE empties the table; DROP removes the table itself.",
      answer: [
        {
          table: {
            head: ["", "`DELETE`", "`TRUNCATE`", "`DROP`"],
            rows: [
              ["Family", "**DML**", "**DDL**", "**DDL**"],
              ["Removes", "Chosen rows", "All rows", "Rows **and the table**"],
              ["`WHERE` clause", "**Yes**", "No", "No"],
              ["Rollback", "**Yes**", "**No** — auto-commits", "**No**"],
              ["Fires triggers", "Yes", "No", "No"],
              ["Resets AUTO_INCREMENT", "No", "**Yes**", "—"],
              ["Speed", "Slow — row by row, logged", "Fast — deallocates pages", "Fastest"],
              ["Table afterwards", "Exists, possibly emptied", "Exists, empty", "**Gone**"],
            ],
          },
        },
        {
          code: `DELETE FROM employees WHERE dept_id = 5;   -- some rows; rollback possible
TRUNCATE TABLE employees;                  -- all rows; no going back
DROP TABLE employees;                      -- the table itself`,
          lang: "sql",
        },
        {
          note: "**The rollback row is the one that matters, and it follows from the family.** `DELETE` is DML, so it lives inside your transaction and `ROLLBACK` undoes it. `TRUNCATE` is DDL, so it commits the moment it runs — which is also why it is so much faster: it is not logging a million individual row deletions.",
        },
      ],
      tip: "Lead with DML versus DDL. Every other row in the table follows from it, and that reads as understanding rather than memorisation.",
      tags: ["delete", "truncate", "drop", "ddl", "dml"],
    },
    {
      id: "sql-dml-02",
      subtopic: "Transactions",
      type: "conceptual",
      importance: "high",
      question: "What are COMMIT, ROLLBACK and SAVEPOINT?",
      short:
        "COMMIT makes changes permanent, ROLLBACK undoes them, SAVEPOINT marks a point you can roll back to partially.",
      answer: [
        {
          code: `BEGIN;
    UPDATE accounts SET balance = balance - 500 WHERE id = 1;
    SAVEPOINT after_debit;

    UPDATE accounts SET balance = balance + 500 WHERE id = 2;
    -- something is wrong with the credit only
    ROLLBACK TO SAVEPOINT after_debit;   -- the debit survives

    UPDATE accounts SET balance = balance + 500 WHERE id = 99;
COMMIT;                                   -- now both are permanent`,
          lang: "sql",
        },
        {
          table: {
            head: ["Command", "Effect"],
            rows: [
              ["`COMMIT`", "Every change since the transaction began becomes permanent and visible to others"],
              ["`ROLLBACK`", "Undoes everything since the transaction began"],
              ["`SAVEPOINT name`", "Marks a point inside the transaction"],
              ["`ROLLBACK TO name`", "Undoes back to that point only — the transaction stays open"],
            ],
          },
        },
        {
          note: "A savepoint is **not** a commit. Nothing is durable and nothing is visible to other sessions until `COMMIT` runs; a savepoint only gives you a partial undo inside your own transaction.",
        },
      ],
      tags: ["commit", "rollback", "savepoint", "tcl"],
    },
    {
      id: "sql-dml-03",
      subtopic: "Safety",
      type: "scenario",
      importance: "high",
      question: "You are about to run an UPDATE on a production table. What do you do first?",
      short:
        "Run it as a SELECT with the same WHERE, wrap it in a transaction, and check the affected row count.",
      answer: [
        {
          ol: [
            "**Turn it into a `SELECT` first.** Same `WHERE`, and look at what comes back. This catches a wrong or missing condition before it costs anything.",
            "**Check the row count** against what you expected. 'About 40' turning out to be 40,000 is the signal to stop.",
            "**Wrap it in a transaction**, run the update, verify, and only then commit.",
            "**Have a backup** — or at minimum, know that one exists and when it was taken.",
          ],
        },
        {
          code: `-- 1. See what you are about to change
SELECT * FROM employees WHERE dept_id = 5;

-- 2. Change it, reversibly
BEGIN;
    UPDATE employees SET salary = salary * 1.1 WHERE dept_id = 5;
    -- 42 rows affected — is that right?
    SELECT * FROM employees WHERE dept_id = 5;
COMMIT;   -- or ROLLBACK;`,
          lang: "sql",
        },
        {
          note: "**The failure mode this prevents is an `UPDATE` with no `WHERE`**, which updates every row in the table and is one of the most common serious mistakes in this job. Some clients have a \"safe update\" mode that refuses an `UPDATE` or `DELETE` without a key in the `WHERE` — worth leaving on.",
        },
      ],
      tip: "Interviewers ask this to find out whether you have worked on a live system. The SELECT-first habit is the answer.",
      tags: ["update", "transaction", "safety", "scenario"],
    },
    {
      id: "sql-dml-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which of these can be rolled back?",
      options: ["TRUNCATE", "DROP", "DELETE", "All three"],
      correct: 2,
      answer: [
        {
          p: "`DELETE` — it is DML and lives inside your transaction. `TRUNCATE` and `DROP` are DDL and auto-commit.",
        },
      ],
      tags: ["mcq", "delete", "truncate"],
    },
    {
      id: "sql-dml-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "`TRUNCATE` compared with `DELETE` on a full table is faster because it:",
      options: [
        "Uses an index",
        "Deallocates pages instead of logging each row",
        "Runs in parallel",
        "Skips constraint checks",
      ],
      correct: 1,
      answer: [
        {
          p: "It deallocates the data pages rather than logging a million individual row deletions — which is also exactly why it cannot be rolled back.",
        },
      ],
      tags: ["mcq", "truncate"],
    },
  ],
};
