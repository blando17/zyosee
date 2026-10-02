/*
 * Isolation Levels.
 *
 * Source: "DBMS Notes.pdf" pp.28-29, "DBMS Notes copy.pdf" p15.
 *
 * Both sources print the same anomaly matrix and they agree, which is worth
 * noting given how often the two documents disagree elsewhere.
 */

export default {
  id: "isolation-levels",
  name: "Isolation Levels",
  importance: "high",
  icon: "scales",
  blurb:
    "Four points on the dial between speed and safety, each one buying you a specific anomaly.",
  source: "DBMS Notes pp.28-29 · DBMS cheat-sheets p15",

  questions: [
    {
      id: "dbms-iso-01",
      subtopic: "The levels",
      type: "comparison",
      importance: "high",
      question: "What are the four SQL isolation levels, and what does each prevent?",
      short:
        "Read Uncommitted prevents nothing; Read Committed stops dirty reads; Repeatable Read stops non-repeatable reads; Serializable stops phantoms.",
      answer: [
        {
          table: {
            head: ["Level", "Dirty read", "Non-repeatable read", "Phantom read"],
            rows: [
              ["**Read Uncommitted**", "Possible", "Possible", "Possible"],
              ["**Read Committed**", "**Prevented**", "Possible", "Possible"],
              ["**Repeatable Read**", "**Prevented**", "**Prevented**", "Possible"],
              ["**Serializable**", "**Prevented**", "**Prevented**", "**Prevented**"],
            ],
          },
        },
        {
          table: {
            head: ["Level", "How it is implemented", "Lock scope"],
            rows: [
              ["Read Uncommitted", "No read locks at all", "—"],
              ["Read Committed", "Shared locks taken and released immediately", "Row"],
              ["Repeatable Read", "Shared locks **held** until commit", "Row + index"],
              ["Serializable", "**Range (predicate) locks**", "The predicate itself"],
            ],
          },
        },
        {
          note: "The pattern is worth seeing rather than memorising: each level **holds its locks for longer** than the one below. Read Committed releases a read lock immediately; Repeatable Read keeps it to the end; Serializable locks rows that do not exist yet. Longer locks, fewer anomalies, less concurrency.",
        },
      ],
      tip: "This table is the single most useful thing to memorise in the whole concurrency topic. It answers three different questions.",
      tags: ["isolation levels", "read committed", "repeatable read", "serializable"],
    },
    {
      id: "dbms-iso-02",
      subtopic: "Choosing",
      type: "scenario",
      importance: "high",
      question: "Which isolation level would you choose, and why?",
      short:
        "Read Committed for most things; Serializable where a wrong answer costs money; almost never Read Uncommitted.",
      answer: [
        {
          table: {
            head: ["Workload", "Level", "Reasoning"],
            rows: [
              ["Ordinary web application", "**Read Committed**", "The default in PostgreSQL, Oracle and SQL Server. Dirty reads gone, cheap"],
              ["Report reading many rows that must agree", "**Repeatable Read**", "The rows will not shift underneath a long transaction"],
              ["Money, stock levels, seat booking", "**Serializable**", "Phantom rows cause double-booking; correctness beats throughput"],
              ["Approximate analytics over huge tables", "Read Uncommitted", "Only when a slightly wrong number is genuinely acceptable"],
            ],
          },
        },
        {
          code: `-- Per transaction, not per connection
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
    UPDATE seats SET booked = TRUE WHERE id = 42 AND booked = FALSE;
COMMIT;`,
          lang: "sql",
        },
        {
          note: "Two facts that make this a real answer rather than a recital. **The defaults differ** — PostgreSQL and Oracle default to Read Committed, MySQL InnoDB to Repeatable Read — so \"the default\" is not portable. And **Serializable can abort your transaction**: under MVCC it detects a conflict at commit rather than blocking, so your code must be prepared to retry.",
        },
      ],
      tip: "Mentioning the retry requirement under Serializable is what separates someone who has used it from someone who has read the table.",
      tags: ["isolation levels", "scenario", "defaults", "retry"],
    },
    {
      id: "dbms-iso-03",
      subtopic: "Trade-offs",
      type: "why",
      importance: "med",
      question: "Why not always use Serializable?",
      short:
        "It holds the most locks for the longest, so concurrency collapses — and under MVCC it converts contention into aborted transactions.",
      answer: [
        {
          ul: [
            "**Throughput** — range locks block whole predicates, so transactions queue up where they would otherwise have run side by side.",
            "**Waiting** — locks held to commit mean everything behind a slow transaction waits for it.",
            "**Aborts** — MVCC implementations detect the conflict at commit time and roll one transaction back. Your application has to catch that and retry.",
            "**Deadlocks** — more locks held longer means more chances for a cycle.",
          ],
        },
        {
          note: "The engineering point: isolation is not a safety slider you turn to maximum and forget. A higher level **moves** the failure rather than removing it — from a wrong answer to a slow one, or to a transaction that has to be retried.",
        },
        {
          p: "The usual approach is Read Committed by default, raised deliberately on the few transactions where an anomaly would actually matter.",
        },
      ],
      tags: ["isolation", "trade-offs", "performance"],
    },
    {
      id: "dbms-iso-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which is the lowest isolation level that prevents dirty reads?",
      options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
      correct: 1,
      answer: [
        {
          p: "Read Committed — by definition it reads only committed data. The higher levels also prevent it, but they are not the lowest that does.",
        },
      ],
      tags: ["mcq", "isolation levels"],
    },
    {
      id: "dbms-iso-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Phantom reads are prevented only at:",
      options: ["Read Committed", "Repeatable Read", "Serializable", "Read Uncommitted"],
      correct: 2,
      answer: [
        {
          p: "Serializable. Preventing them needs a range lock over the predicate, because the phantom row did not exist to be locked individually.",
        },
      ],
      tags: ["mcq", "phantom read"],
    },
  ],
};
