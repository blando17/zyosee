/*
 * Transactions and ACID.
 *
 * Source: "DBMS Notes.pdf" pp.26-27, "DBMS Notes copy.pdf" p14.
 *
 * ACID is starred on LIST.pdf.
 */

export default {
  id: "transactions",
  name: "Transactions & ACID",
  importance: "high",
  icon: "package",
  blurb:
    "A unit of work the database treats as indivisible, and the four promises it makes about it.",
  source: "DBMS Notes pp.26-27 · DBMS cheat-sheets p14",

  questions: [
    {
      id: "dbms-txn-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is a transaction?",
      short:
        "A sequence of operations the database treats as one indivisible unit — all of it happens, or none of it does.",
      answer: [
        {
          p: "A transaction groups several statements into one logical job. Like a registered parcel: the courier delivers the whole thing or brings it back — never half of it.",
        },
        {
          p: "Publishing exam results, for instance, must do three things together:",
        },
        {
          ol: [
            "Insert the new grade for every subject.",
            "Recalculate each student's CGPA.",
            "Set the flag `Result Published = YES`.",
          ],
        },
        {
          p: "If power fails after step 1, the grades exist but the CGPAs do not match them. The database therefore undoes step 1 as well, leaving everything exactly as it was.",
        },
        {
          code: `BEGIN TRANSACTION;
    UPDATE accounts SET balance = balance - 500 WHERE id = 1;
    UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;                 -- both, or
-- ROLLBACK;            -- neither`,
          lang: "sql",
        },
      ],
      tags: ["transaction", "commit", "rollback"],
    },
    {
      id: "dbms-txn-02",
      subtopic: "ACID",
      type: "conceptual",
      importance: "high",
      question: "What are the ACID properties?",
      short:
        "Atomicity all-or-nothing, Consistency rules always hold, Isolation transactions do not interfere, Durability commits survive crashes.",
      answer: [
        {
          table: {
            head: ["Property", "Promise", "Enforced by", "Failure it prevents"],
            rows: [
              ["**Atomicity**", "All operations succeed, or none do", "Undo log, rollback", "Money leaves one account and never arrives at the other"],
              ["**Consistency**", "Every constraint holds before and after", "Constraints, triggers, the application's own rules", "A student in no department; a negative balance"],
              ["**Isolation**", "Concurrent transactions do not see each other's half-done work", "Locking, MVCC, isolation levels", "Reading a value that is later rolled back"],
              ["**Durability**", "Once committed, it survives a crash", "**Write-ahead logging**, replication", "A confirmed booking lost when the server dies"],
            ],
          },
        },
        {
          note: "**Consistency is the odd one out** and worth saying so. The other three are guarantees the database provides on its own. Consistency is a *joint* responsibility: the DBMS enforces the constraints you declared, but only the application knows that a transfer should preserve the total. It cannot invent that rule for you.",
        },
        { p: "**What ACID costs:** logging and locking add overhead, the storage engine gets substantially more complex, and enforcing it across many machines is hard enough that distributed systems often relax it." },
      ],
      tip: "Give one concrete failure per property. Reciting the four words is what everybody does.",
      tags: ["acid", "atomicity", "consistency", "isolation", "durability"],
    },
    {
      id: "dbms-txn-03",
      subtopic: "Lifecycle",
      type: "conceptual",
      importance: "med",
      question: "What states does a transaction pass through?",
      short:
        "Active → partially committed → committed, or Active → failed → aborted.",
      answer: [
        { diagram: "transaction-states" },
        {
          table: {
            head: ["State", "Meaning"],
            rows: [
              ["**Active**", "Statements are running"],
              ["**Partially committed**", "The last statement has finished; log records are being flushed"],
              ["**Committed**", "Durable and permanent; the user has been told it succeeded"],
              ["**Failed**", "Something went wrong and normal execution cannot continue"],
              ["**Aborted**", "Every change has been undone; the database is as it was"],
            ],
          },
        },
        {
          note: "**Partially committed is where durability is won or lost.** The work is done in memory but the log may not have reached disk. A crash here means the transaction never happened — which is correct, because the user was never told it succeeded.",
        },
      ],
      tags: ["transaction states", "commit", "abort"],
    },
    {
      id: "dbms-txn-04",
      subtopic: "Durability",
      type: "how",
      importance: "high",
      question: "How does a database guarantee durability?",
      short:
        "Write-ahead logging — the log record reaches disk before the data page, so any crash is recoverable.",
      answer: [
        { diagram: "wal-recovery" },
        {
          p: "**The WAL rule:** a change's log record must be on disk *before* the modified data page is. Writing a data page is expensive and random; appending to a log is cheap and sequential.",
        },
        {
          ul: [
            "The log holds the **old value** (enough to undo) and the **new value** (enough to redo).",
            "On commit, only the **log** must be flushed — the data pages can be written lazily afterwards.",
            "On restart, the database **redoes** committed transactions from the log and **undoes** uncommitted ones.",
          ],
        },
        {
          note: "The insight worth stating: durability does not mean the data is written, it means the *intent* is written. A crash one millisecond after commit loses the data page and loses nothing at all, because the log can reconstruct it.",
        },
        {
          p: "**Checkpointing** bounds how much log has to be replayed: the database periodically flushes dirty pages and notes how far it got, so recovery starts from the last checkpoint rather than the beginning of time.",
        },
      ],
      tip: "'Write-ahead logging' is the phrase being listened for. Add why the log is cheaper than the data page and the answer is complete.",
      tags: ["durability", "wal", "logging", "checkpoint", "recovery"],
    },
    {
      id: "dbms-txn-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which ACID property is a shared responsibility between the database and the application?",
      options: ["Atomicity", "Consistency", "Isolation", "Durability"],
      correct: 1,
      answer: [
        {
          p: "Consistency. The DBMS enforces the constraints you declared; only your application knows the business rules that were never declared.",
        },
      ],
      tags: ["mcq", "acid"],
    },
    {
      id: "dbms-txn-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Durability is primarily achieved through:",
      options: ["Locking", "Write-ahead logging", "Normalisation", "Indexing"],
      correct: 1,
      answer: [
        {
          p: "Write-ahead logging — the log reaches disk before the data, so a crash can be redone or undone from it. Locking provides isolation, not durability.",
        },
      ],
      tags: ["mcq", "durability"],
    },
  ],
};
