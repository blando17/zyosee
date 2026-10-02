/*
 * Concurrency Problems.
 *
 * Source: "DBMS Notes copy.pdf" p15 (the step-by-step schedules),
 * "DBMS Notes.pdf" p29 (the isolation-problem table).
 *
 * The schedules below are reproduced from the cheat-sheet and each one was
 * traced through: the lost-update example does end at 1200 when it should end
 * at 1100, and the dirty-read example does leave T2 holding 500 when the true
 * value is 100.
 */

export default {
  id: "concurrency-problems",
  name: "Concurrency Problems",
  importance: "high",
  icon: "warning",
  blurb:
    "The four ways uncontrolled interleaving corrupts data — each one a specific schedule you should be able to trace.",
  source: "DBMS cheat-sheets p15 · DBMS Notes p29",

  questions: [
    {
      id: "dbms-cp-01",
      subtopic: "Overview",
      type: "conceptual",
      importance: "high",
      question: "What problems arise when transactions run concurrently?",
      short:
        "Lost update, dirty read, non-repeatable read and phantom read.",
      answer: [
        {
          table: {
            head: ["Problem", "What happens", "Prevented by"],
            rows: [
              ["**Lost update**", "Two transactions read the same value and the second write overwrites the first", "Locks, 2PL"],
              ["**Dirty read**", "One reads data another has written but not committed", "Read Committed and above"],
              ["**Non-repeatable read**", "The same row read twice in one transaction gives different values", "Repeatable Read and above"],
              ["**Phantom read**", "The same *query* run twice returns different *rows*", "Serializable only"],
            ],
          },
        },
        {
          note: "The distinction that gets asked: **non-repeatable read is about a row changing; phantom read is about the set of rows changing.** Re-reading one student's marks and getting a different number is the first. Re-running \"all students above 85%\" and getting an extra student is the second.",
        },
      ],
      tip: "Learn them in this order — it is the order the isolation levels fix them in, so one table answers both questions.",
      tags: ["concurrency", "anomalies", "dirty read", "phantom"],
    },
    {
      id: "dbms-cp-02",
      subtopic: "Lost update",
      type: "scenario",
      importance: "high",
      question: "Trace a lost update. What is the final balance, and what should it be?",
      short:
        "Final balance 1200; it should be 1100. T1's withdrawal is overwritten by T2's write.",
      given: {
        head: ["", "Value"],
        rows: [
          ["Initial balance", "1000"],
          ["T1", "withdraw 100"],
          ["T2", "deposit 200"],
        ],
      },
      find: ["The final balance", "The correct balance", "Which update was lost"],
      solution: [
        {
          table: {
            head: ["Step", "T1", "T2", "Balance on disk"],
            rows: [
              ["1", "Read balance → 1000", "", "1000"],
              ["2", "", "Read balance → 1000", "1000"],
              ["3", "balance = 1000 − 100 = 900", "", "1000"],
              ["4", "", "balance = 1000 + 200 = 1200", "1000"],
              ["5", "**Write 900**", "", "900"],
              ["6", "", "**Write 1200**", "**1200**"],
            ],
          },
        },
        {
          p: "**Final: 1200. Correct: 1100** (1000 − 100 + 200). T1's withdrawal has vanished — T2 read the balance *before* T1 wrote, so its write was computed from stale data and overwrote T1 entirely.",
        },
        {
          note: "Both transactions committed. Neither did anything wrong on its own. The corruption is entirely in the **interleaving**, which is why no amount of careful application code fixes this — it needs the database to serialise the access.",
        },
        { p: "**The fix**, with two-phase locking:" },
        {
          codePair: {
            left: {
              label: "Without locks — broken",
              code: `T1: Read  A = 1000
T2: Read  A = 1000
T1: Write A = 900
T2: Write A = 1200

Final: 1200   (lost update)`,
            },
            right: {
              label: "With locks — correct",
              code: `T1: Lock-X A
T1: Read  A = 1000
T1: Write A = 900
T1: Unlock A
T2: Lock-X A
T2: Read  A = 900
T2: Write A = 1100

Final: 1100   (correct)`,
            },
          },
        },
      ],
      tip: "Write the table out. Tracing the steps is what the question is testing, not the definition.",
      tags: ["lost update", "scenario", "locks", "2pl"],
    },
    {
      id: "dbms-cp-03",
      subtopic: "Dirty read",
      type: "scenario",
      importance: "high",
      question: "Trace a dirty read. What does T2 end up believing?",
      short:
        "T2 reads 500 from T1's uncommitted write; T1 then rolls back, so the real value is 100.",
      given: {
        head: ["", "Value"],
        rows: [
          ["Initial A", "100"],
          ["T1", "writes A = 500, then rolls back"],
          ["T2", "reads A in between"],
        ],
      },
      find: ["What T2 reads", "The actual value", "Why this is dangerous"],
      solution: [
        {
          table: {
            head: ["Step", "T1 (writer)", "T2 (reader)", "A"],
            rows: [
              ["1", "Write A = 500 *(not committed)*", "", "500"],
              ["2", "", "**Read A → 500**", "500"],
              ["3", "**Rollback** — A restored", "", "**100**"],
            ],
          },
        },
        {
          p: "T2 read **500**. The actual value is **100**. T2 is now acting on a number that never officially existed.",
        },
        {
          note: "The danger is not the wrong read on its own — it is what T2 does next. If T2 commits a decision based on 500, the database now holds a consequence of a transaction that was rolled back, and there is no record connecting the two. This is why a schedule permitting dirty reads is called **non-recoverable**.",
        },
        {
          p: "**The fix:** Read Committed isolation, or strict 2PL — T1 holds its exclusive lock until it commits or aborts, so T2 simply waits and then reads 100.",
        },
      ],
      tags: ["dirty read", "scenario", "rollback", "recoverable"],
    },
    {
      id: "dbms-cp-04",
      subtopic: "Non-repeatable read",
      type: "scenario",
      importance: "high",
      question: "Trace a non-repeatable read.",
      short:
        "T1 reads A twice and gets 100 then 200, because T2 committed an update in between.",
      given: {
        head: ["", "Value"],
        rows: [
          ["Initial A", "100"],
          ["T1", "reads A twice"],
          ["T2", "updates A to 200 and commits in between"],
        ],
      },
      find: ["What T1 reads each time", "Why it matters"],
      solution: [
        {
          table: {
            head: ["Step", "T1", "T2", "A"],
            rows: [
              ["1", "**Read A → 100**", "", "100"],
              ["2", "", "Update A = 200", "200"],
              ["3", "", "**Commit**", "200"],
              ["4", "**Read A → 200**", "", "200"],
            ],
          },
        },
        {
          p: "Same row, same transaction, two different answers. Nothing here is dirty — T2 committed properly — and T1 is still looking at an inconsistent picture of the world.",
        },
        {
          note: "Why it matters: a transaction that computes a total, then re-reads a component to check it, can find the two disagree. Its own view of the database changed underneath it, so any invariant it tried to verify is worthless.",
        },
        {
          p: "**The fix:** Repeatable Read isolation — T1 holds shared locks on everything it read until it finishes, so T2 must wait.",
        },
      ],
      tags: ["non-repeatable read", "scenario", "isolation"],
    },
    {
      id: "dbms-cp-05",
      subtopic: "Phantom read",
      type: "scenario",
      importance: "high",
      question: "What is a phantom read, and why does locking rows not prevent it?",
      short:
        "A re-run query returns new rows. Row locks cannot lock a row that did not exist yet — you need a range lock.",
      answer: [
        {
          table: {
            head: ["Step", "T1", "T2"],
            rows: [
              ["1", "`SELECT * FROM student WHERE cgpa > 8` → **12 rows**", ""],
              ["2", "", "`INSERT` a student with cgpa 8.5"],
              ["3", "", "**Commit**"],
              ["4", "`SELECT * FROM student WHERE cgpa > 8` → **13 rows**", ""],
            ],
          },
        },
        {
          p: "A row has appeared that T1 never read and could not have locked.",
        },
        {
          note: "**This is why phantom reads need a different mechanism.** Repeatable Read locks the rows a transaction has read — but the phantom row did not exist when those locks were taken, so there was nothing to lock. Preventing it requires a **range (predicate) lock** over `cgpa > 8` itself, which is what Serializable does.",
        },
        {
          p: "Concretely: you list every student above 85% attendance to book a bus, and while you are booking, two more clear their backlog and qualify. Your list was correct when you took it and is wrong when you act on it.",
        },
      ],
      tip: "The reason row locks fail here is the whole answer. 'Serializable fixes it' without that is a memorised line.",
      tags: ["phantom read", "range lock", "serializable"],
    },
    {
      id: "dbms-cp-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Reading data that another transaction has written but not committed is:",
      options: ["A lost update", "A dirty read", "A non-repeatable read", "A phantom read"],
      correct: 1,
      answer: [
        { p: "A dirty read. If that transaction then rolls back, you are holding a value that never existed." },
      ],
      tags: ["mcq", "dirty read"],
    },
    {
      id: "dbms-cp-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A phantom read differs from a non-repeatable read because:",
      options: [
        "It involves uncommitted data",
        "New rows appear, rather than an existing row changing",
        "It only happens with writes",
        "There is no difference",
      ],
      correct: 1,
      answer: [
        {
          p: "The set of rows changes rather than a row's value. That is why row locks cannot stop it — the new row was not there to be locked.",
        },
      ],
      tags: ["mcq", "phantom read"],
    },
  ],
};
