/*
 * Locking and Two-Phase Locking.
 *
 * Source: "DBMS Notes copy.pdf" p15, "DBMS Notes.pdf" p30.
 *
 * THE TWO SOURCES DISAGREE ABOUT STRICT 2PL, AND THE 46-PAGE NOTES ARE WRONG.
 *
 * `DBMS Notes.pdf` p30 says 2PL "guarantees serializability if no lock is
 * acquired after any lock is released (strict 2PL)". That parenthesis is the
 * error: "no lock acquired after any released" is the definition of PLAIN
 * 2PL. Strict 2PL is that rule PLUS holding every exclusive lock until commit
 * or abort — which is what buys you cascadeless recovery.
 *
 * The cheat-sheet on p15 states it correctly ("Hold all write locks till
 * commit/rollback. Prevents cascading rollbacks."), so this is a discrepancy
 * between your own two documents rather than an outside claim. 2PL is starred
 * on LIST.pdf, which is why it is worth being precise about.
 */

export default {
  id: "locking",
  name: "Locking & 2PL",
  importance: "high",
  icon: "lock",
  blurb:
    "Shared and exclusive locks, the two-phase rule that makes them safe, and the deadlock it can cause.",
  source: "DBMS cheat-sheets p15 · DBMS Notes p30",

  questions: [
    {
      id: "dbms-lock-01",
      subtopic: "Locks",
      type: "conceptual",
      importance: "high",
      question: "What are shared and exclusive locks?",
      short:
        "Shared (S) for reading — many at once. Exclusive (X) for writing — one only, and it excludes readers too.",
      answer: [
        { diagram: "lock-compatibility" },
        {
          table: {
            head: ["", "Shared (S)", "Exclusive (X)"],
            rows: [
              ["Taken for", "Reading", "Writing"],
              ["How many at once", "**Many**", "**One**"],
              ["Compatible with S", "Yes", "No"],
              ["Compatible with X", "No", "No"],
            ],
          },
        },
        {
          p: "The rule in one line: **many readers or one writer, never both.** Reads do not interfere with each other, so there is no reason to serialise them.",
        },
        {
          note: "Lock **granularity** is the trade-off underneath. A row lock allows maximum concurrency and costs the most bookkeeping; a table lock is cheap and blocks everyone. Most databases escalate from row to table when a transaction takes too many row locks.",
        },
      ],
      tags: ["locks", "shared lock", "exclusive lock", "granularity"],
    },
    {
      id: "dbms-lock-02",
      subtopic: "2PL",
      type: "conceptual",
      importance: "high",
      question: "What is two-phase locking?",
      short:
        "Every transaction acquires all its locks before releasing any. Growing phase, then shrinking phase.",
      answer: [
        { diagram: "two-phase-locking" },
        {
          ul: [
            "**Growing phase** — the transaction acquires locks and releases none.",
            "**Lock point** — the moment it takes its last lock.",
            "**Shrinking phase** — it releases locks and acquires none.",
          ],
        },
        {
          p: "Obeying that single rule **guarantees conflict serializability**. The lock points impose an order on the transactions, and that order is a valid serial schedule.",
        },
        {
          note: "What plain 2PL does **not** guarantee is recoverability. A transaction may release its locks in the shrinking phase and then abort — by which time another transaction has read the value it wrote, and must abort too. That is a **cascading abort**, and it is why plain 2PL is not enough on its own.",
        },
      ],
      tip: "'Growing and shrinking' is the shape. That it guarantees serializability but not recoverability is the point of the next question.",
      tags: ["2pl", "two-phase locking", "serializability"],
    },
    {
      id: "dbms-lock-03",
      subtopic: "2PL",
      type: "comparison",
      importance: "high",
      question: "What is the difference between 2PL, strict 2PL and rigorous 2PL?",
      short:
        "Strict 2PL holds exclusive locks until commit; rigorous 2PL holds all locks until commit.",
      answer: [
        {
          table: {
            head: ["Variant", "Rule", "Guarantees"],
            rows: [
              ["**Basic 2PL**", "No lock acquired after any lock is released", "Serializability only"],
              ["**Strict 2PL**", "Basic 2PL **plus** all **exclusive** locks held until commit or abort", "Serializability **and** cascadeless, strict recovery"],
              ["**Rigorous 2PL**", "**All** locks — shared and exclusive — held until commit", "The same, and transactions serialise in commit order"],
              ["Conservative 2PL", "Acquire every lock up front, before starting", "**Deadlock-free** — but needs to know everything in advance"],
            ],
          },
        },
        {
          note: "Your `DBMS Notes.pdf` p30 says 2PL \"guarantees serializability if no lock is acquired after any lock is released (**strict** 2PL)\". That parenthesis is wrong — the rule quoted **is** plain 2PL. Strict 2PL is that rule *plus* holding exclusive locks to commit. Your own cheat-sheet states it correctly: \"Hold all write locks till commit/rollback. Prevents cascading rollbacks.\"",
          tone: "warn",
        },
        {
          p: "**Strict 2PL is what real databases use.** Holding write locks to commit means nobody can read or overwrite an uncommitted value, which makes every schedule strict — so rolling back is just restoring before-images, and cascading aborts cannot happen.",
        },
      ],
      tip: "If you say only one thing about the variants: strict 2PL holds *write* locks until commit, and that is what stops cascading aborts.",
      tags: ["strict 2pl", "rigorous 2pl", "conservative 2pl", "cascading abort"],
    },
    {
      id: "dbms-lock-04",
      subtopic: "Deadlock",
      type: "scenario",
      importance: "high",
      question: "Two transactions each hold a lock the other wants. What is this, and how do databases handle it?",
      short:
        "Deadlock. Databases detect it with a wait-for graph and abort one transaction as the victim.",
      answer: [
        {
          table: {
            head: ["Step", "T1", "T2"],
            rows: [
              ["1", "Lock-X on A ✓", ""],
              ["2", "", "Lock-X on B ✓"],
              ["3", "Request Lock-X on B — **waits**", ""],
              ["4", "", "Request Lock-X on A — **waits**"],
            ],
          },
        },
        {
          p: "Neither can proceed and neither will release. All four Coffman conditions hold — the same deadlock as in an operating system, with rows instead of resources.",
        },
        { p: "**How databases deal with it:**" },
        {
          table: {
            head: ["Approach", "How"],
            rows: [
              ["**Detection** (the usual choice)", "Build a **wait-for graph**; a cycle is a deadlock. Abort a victim and let the others proceed"],
              ["**Timeout**", "Abort anything waiting too long. Crude, cheap, and sometimes kills innocent transactions"],
              ["**Prevention — wait-die**", "An older transaction waits for a younger one; a younger one requesting from an older **dies** and restarts"],
              ["**Prevention — wound-wait**", "An older transaction **wounds** (aborts) a younger holder; a younger one waits"],
              ["**Avoidance**", "Conservative 2PL — take all locks up front, so no cycle can form"],
            ],
          },
        },
        {
          note: "Databases mostly **detect and recover** rather than prevent, because a transaction can be safely aborted and retried — which an operating system process generally cannot. That is why an OS runs the ostrich algorithm and a database does not.",
        },
        {
          p: "The practical fix in your own code is the same as anywhere else: **acquire locks in a consistent order**, so the cycle cannot form.",
        },
      ],
      tip: "Connect it to OS deadlock and then say why databases handle it differently. That contrast is the strongest part of the answer.",
      tags: ["deadlock", "wait-for graph", "wait-die", "wound-wait", "scenario"],
    },
    {
      id: "dbms-lock-05",
      subtopic: "Alternatives",
      type: "comparison",
      importance: "med",
      question: "What alternatives to locking exist?",
      short:
        "Timestamp ordering, optimistic concurrency control and MVCC — which is what most modern databases actually run.",
      answer: [
        {
          table: {
            head: ["Technique", "Idea", "Suits"],
            rows: [
              ["**Timestamp ordering**", "Each transaction gets a timestamp; conflicting access is resolved in timestamp order, the loser restarts", "Few conflicts"],
              ["**Optimistic (OCC)**", "Read freely with no locks; validate at commit and roll back if there was a conflict", "Read-heavy workloads where clashes are rare"],
              ["**MVCC**", "Keep multiple versions of each row; readers see a consistent snapshot and never block writers", "**Almost everything** — PostgreSQL, Oracle, MySQL InnoDB"],
            ],
          },
        },
        {
          note: "**MVCC is the one to know.** Its central property is that *readers never block writers and writers never block readers* — a read gets the version that was current when it started, so it needs no lock at all. That removes most lock contention outright.",
        },
        {
          p: "The cost is storage and cleanup: old versions accumulate and have to be garbage-collected, which is what PostgreSQL's `VACUUM` is for.",
        },
      ],
      tags: ["mvcc", "timestamp ordering", "optimistic concurrency"],
    },
    {
      id: "dbms-lock-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In two-phase locking, the shrinking phase is when a transaction:",
      options: [
        "Acquires locks only",
        "Releases locks only",
        "Both acquires and releases",
        "Commits",
      ],
      correct: 1,
      answer: [
        {
          p: "Releases only. Once it has released its first lock it may never acquire another — that is the rule that guarantees serializability.",
        },
      ],
      tags: ["mcq", "2pl"],
    },
    {
      id: "dbms-lock-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Strict 2PL differs from basic 2PL by additionally:",
      options: [
        "Acquiring all locks before starting",
        "Holding exclusive locks until commit or abort",
        "Using timestamps instead of locks",
        "Allowing dirty reads",
      ],
      correct: 1,
      answer: [
        {
          p: "Holding every exclusive lock to commit or abort — which is what prevents cascading rollbacks. Acquiring everything up front is conservative 2PL.",
        },
      ],
      tags: ["mcq", "strict 2pl"],
    },
    {
      id: "dbms-lock-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In MVCC, a reader:",
      options: [
        "Blocks writers",
        "Is blocked by writers",
        "Neither blocks nor is blocked by writers",
        "Must take a shared lock",
      ],
      correct: 2,
      answer: [
        {
          p: "Neither. The reader sees the version that was current when it started, so it needs no lock and interferes with nobody.",
        },
      ],
      tags: ["mcq", "mvcc"],
    },
  ],
};
