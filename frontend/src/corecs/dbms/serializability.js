/*
 * Schedules and Serializability.
 *
 * Source: "DBMS Notes.pdf" pp.27-29, "DBMS Notes copy.pdf" p15.
 */

export default {
  id: "serializability",
  name: "Schedules & Serializability",
  importance: "high",
  icon: "repeat",
  blurb:
    "Interleaving transactions safely — the graph test that proves a schedule is equivalent to running them one at a time.",
  source: "DBMS Notes pp.27-29 · DBMS cheat-sheets p15",

  questions: [
    {
      id: "dbms-ser-01",
      subtopic: "Schedules",
      type: "comparison",
      importance: "high",
      question: "What is a schedule, and what is serializability?",
      short:
        "A schedule is an interleaving of operations. It is serializable if its result matches some serial order.",
      answer: [
        {
          table: {
            head: ["Kind", "Meaning", "Trade"],
            rows: [
              ["**Serial**", "One transaction runs completely, then the next", "Always correct; terrible throughput"],
              ["**Interleaved**", "Operations mixed together", "Good throughput; may corrupt data"],
              ["**Serializable**", "Interleaved, but the outcome equals *some* serial order", "Both — this is the goal"],
            ],
          },
        },
        {
          p: "The key word is **some**. A serializable schedule need not match the order the transactions started in; it only has to be equivalent to one of the possible serial orders.",
        },
        {
          note: "This is the whole bargain of concurrency control: you want interleaving for speed, and correctness defined as \"indistinguishable from not interleaving\". Serializability is the formal statement of that.",
        },
      ],
      tags: ["schedule", "serial", "serializable"],
    },
    {
      id: "dbms-ser-02",
      subtopic: "Conflict serializability",
      type: "how",
      importance: "high",
      question: "How do you test whether a schedule is conflict serializable?",
      short:
        "Build a precedence graph of conflicting operations. No cycle means serializable.",
      answer: [
        {
          p: "**Two operations conflict** when they are from different transactions, touch the same data item, and **at least one is a write**:",
        },
        {
          table: {
            head: ["Pair", "Conflict?"],
            rows: [
              ["Read(X) — Read(X)", "**No** — reads never conflict"],
              ["Read(X) — Write(X)", "Yes"],
              ["Write(X) — Read(X)", "Yes"],
              ["Write(X) — Write(X)", "Yes"],
            ],
          },
        },
        { p: "**The test:**" },
        {
          ol: [
            "Draw a node for each transaction.",
            "Draw an edge Tᵢ → Tⱼ whenever an operation of Tᵢ conflicts with a *later* operation of Tⱼ.",
            "Look for a cycle. **No cycle → conflict serializable**, and a topological sort of the graph gives you an equivalent serial order.",
          ],
        },
        { diagram: "precedence-graph" },
        {
          note: "A cycle means T1 must come before T2 *and* T2 before T1 — which no serial order can satisfy. That is the proof, and it is why the graph test is not a heuristic.",
        },
      ],
      tip: "If asked to test a schedule, draw the graph. Writing the conflicting pairs out first makes the edges obvious.",
      tags: ["conflict serializability", "precedence graph", "cycle"],
    },
    {
      id: "dbms-ser-03",
      subtopic: "View serializability",
      type: "comparison",
      importance: "med",
      question: "Conflict serializable vs view serializable?",
      short:
        "View serializability is the weaker, larger class. Every conflict serializable schedule is view serializable; the extra ones involve blind writes.",
      answer: [
        {
          table: {
            head: ["", "Conflict serializable", "View serializable"],
            rows: [
              ["Test", "Precedence graph — no cycle", "Compare reads-from and final writes with a serial schedule"],
              ["Cost", "Efficient", "**NP-complete** in general"],
              ["Class size", "Smaller", "**Superset** — includes every conflict serializable schedule"],
              ["Used in practice", "Yes", "No — theory only"],
            ],
          },
        },
        { p: "A schedule is **view equivalent** to a serial one when all three hold:" },
        {
          ol: [
            "Each transaction reads the **same initial values**.",
            "Each transaction **reads from the same writer** in both schedules.",
            "The **same transaction performs the final write** of each item.",
          ],
        },
        {
          note: "The gap between the two is exactly **blind writes** — writing an item without reading it first. A blind write overwrites whatever was there, so the order of the writes before it stops mattering, which can make a cyclic schedule view serializable anyway.",
        },
        {
          p: "Real systems test for conflict serializability only, because view serializability is NP-complete and the extra schedules it admits are rare.",
        },
      ],
      tags: ["view serializability", "blind write", "conflict"],
    },
    {
      id: "dbms-ser-04",
      subtopic: "Recoverability",
      type: "comparison",
      importance: "high",
      question: "What are recoverable, cascadeless and strict schedules?",
      short:
        "Three increasing restrictions on when a transaction may commit, or read, relative to another.",
      answer: [
        {
          table: {
            head: ["Schedule", "Rule", "Prevents"],
            rows: [
              ["**Non-recoverable**", "T2 reads T1's uncommitted data and commits first", "Nothing — **avoid.** If T1 aborts there is no way back"],
              ["**Recoverable**", "If T2 read from T1, T2 may commit only after T1 commits", "Committing on data that was later rolled back"],
              ["**Cascadeless (ACA)**", "A transaction may read only **committed** data", "Cascading aborts — one rollback dragging down a chain"],
              ["**Strict**", "No reading **or writing** an item until the writer commits or aborts", "Both of the above; makes rollback simple"],
            ],
          },
        },
        {
          p: "Each is stricter than the last: **strict ⊂ cascadeless ⊂ recoverable**.",
        },
        {
          note: "Why strict is the one real systems aim for: if nobody can even *write* over an uncommitted value, undoing a transaction is just restoring its before-images. Without that, rolling back T1 might overwrite a value T2 legitimately wrote afterwards. **Strict 2PL is how most databases get there.**",
        },
        {
          p: "Serializability and recoverability answer different questions. Serializability decides whether the **order** was safe; recoverability decides whether the **commit timing** was.",
        },
      ],
      tip: "The one-liner from your notes is worth keeping: serializability decides order, recoverability decides commit timing, strict says hands off my data until I am done.",
      tags: ["recoverable", "cascadeless", "strict schedule", "cascading abort"],
    },
    {
      id: "dbms-ser-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which pair of operations does NOT conflict?",
      options: ["Read(X) and Write(X)", "Write(X) and Read(X)", "Read(X) and Read(X)", "Write(X) and Write(X)"],
      correct: 2,
      answer: [
        { p: "Two reads. Neither changes anything, so their order cannot affect the outcome." },
      ],
      tags: ["mcq", "conflict"],
    },
    {
      id: "dbms-ser-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A cycle in the precedence graph means the schedule is:",
      options: [
        "Conflict serializable",
        "Not conflict serializable",
        "Recoverable",
        "Strict",
      ],
      correct: 1,
      answer: [
        {
          p: "Not conflict serializable — the cycle says T1 must precede T2 and T2 precede T1, which no serial order can do.",
        },
      ],
      tags: ["mcq", "precedence graph"],
    },
    {
      id: "dbms-ser-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A cascadeless schedule guarantees a transaction reads only:",
      options: ["Its own writes", "Committed data", "Data it has locked", "Data from serial schedules"],
      correct: 1,
      answer: [
        {
          p: "Committed data — which is what makes cascading aborts impossible, since nothing it read can later be rolled back.",
        },
      ],
      tags: ["mcq", "cascadeless"],
    },
  ],
};
