/*
 * Denormalisation.
 *
 * Source: "DBMS Notes.pdf" pp.24-25, "Top 100 DBMS Interview Questions.pdf".
 *
 * The performance table on p24 gives concrete figures (100 ms per join versus
 * 10 ms flat, writes 5 ms to 20 ms, storage +50-200%). Those are the notes'
 * illustrative numbers rather than measurements of any particular system, and
 * they are reproduced below labelled as such.
 */

export default {
  id: "denormalization",
  name: "Denormalisation",
  importance: "med",
  icon: "trendUp",
  blurb:
    "Deliberately putting redundancy back, once you have measured that joins are the actual bottleneck.",
  source: "DBMS Notes pp.24-25",

  questions: [
    {
      id: "dbms-denorm-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is denormalisation, and when would you do it?",
      short:
        "Adding controlled redundancy to avoid joins on read-heavy paths — after measuring, not before.",
      answer: [
        { p: "Three ways it is normally done:" },
        {
          ol: [
            "**Combine tables** — fold a joined table's columns into the one that reads it.",
            "**Add derived columns** — store a total instead of recomputing it.",
            "**Materialised views** — persist the result of a query and refresh it on a schedule.",
          ],
        },
        { p: "**When it is justified:**" },
        {
          ul: [
            "**Heavy read, light write** — a dashboard read thousands of times a day, updated once a semester.",
            "**Aggregates reused constantly** — a monthly mess bill computed once and read for thirty days.",
            "**Analytics and reporting** — star schemas exist precisely because analytical queries join badly.",
          ],
        },
        {
          note: "The rule that matters: **denormalise only after measuring that joins are your bottleneck.** Doing it up front trades away correctness guarantees for a performance problem you have not demonstrated you have.",
        },
      ],
      tip: "Lead with 'after measuring'. Answering with the technique alone reads as though you would reach for it first.",
      tags: ["denormalisation", "performance", "materialised view"],
    },
    {
      id: "dbms-denorm-02",
      subtopic: "Trade-offs",
      type: "comparison",
      importance: "high",
      question: "What are the trade-offs of denormalising?",
      short:
        "Faster reads and simpler queries, paid for in slower writes, more storage and the risk of stale copies.",
      answer: [
        {
          table: {
            head: ["Metric", "Normalised", "Denormalised", "Effect"],
            rows: [
              ["Read", "~100 ms with joins", "~10 ms flat", "Roughly 10× faster"],
              ["Write", "~5 ms", "~20 ms plus sync", "Roughly 4× slower"],
              ["Storage", "100 GB", "150-300 GB", "+50 to 200%"],
              ["Consistency", "Immediate", "Eventual, batched", "Copies can be stale"],
            ],
          },
        },
        {
          note: "Those figures are the notes' illustration of the shape of the trade, not a measurement of any particular system. The ratios are the point: **reads get much faster, writes get somewhat slower, and correctness becomes your job rather than the database's.**",
        },
        { p: "**The cost that actually bites** is the last row. A duplicated column has no constraint keeping it true — it goes stale the moment a write updates one copy and not the other, and nothing complains." },
        {
          ul: [
            "**Good:** fewer joins, simpler reporting queries, lower CPU on a loaded server.",
            "**Bad:** storage, slower writes, update anomalies returning, and triggers or batch jobs to keep copies in step.",
          ],
        },
      ],
      tags: ["denormalisation", "trade-offs", "consistency"],
    },
    {
      id: "dbms-denorm-03",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "A results report joins four tables for 5,000 students every hour and takes far too long. How do you fix it?",
      short:
        "Try indexes and the query plan first. If joins really are the cost, build a flat table refreshed on a schedule.",
      answer: [
        { p: "**In order, cheapest first:**" },
        {
          ol: [
            "**Read the query plan.** `EXPLAIN` will say whether time goes on a sequential scan, a join, or sorting. Optimise what is actually slow.",
            "**Index the join columns.** A missing index on a foreign key turns a join into a nested scan, and this alone often ends the problem.",
            "**Select fewer columns and filter earlier.** Reducing rows before the join is usually worth more than any schema change.",
            "**Only then denormalise** — a `RESULT_FLAT` table carrying studentName, programme, courseName, credits and instructorName alongside the grade, refreshed nightly.",
          ],
        },
        {
          code: `-- The denormalised table: one scan instead of a four-way join
CREATE TABLE RESULT_FLAT (
    roll_no         INT,
    student_name    VARCHAR(50),   -- from STUDENT
    programme       CHAR(10),      -- from STUDENT
    course_code     CHAR(5),
    course_name     VARCHAR(50),   -- from COURSE
    credits         INT,           -- from COURSE
    instructor_name VARCHAR(50),   -- from INSTRUCTOR
    grade           DECIMAL(3,1),
    PRIMARY KEY (roll_no, course_code)
);`,
          lang: "sql",
        },
        {
          note: "**Keep the normalised tables as the source of truth.** `RESULT_FLAT` is a cache: it is rebuilt from them, writes never go to it directly, and if it is ever wrong you can throw it away and regenerate it. A denormalised table that has become the only copy of the data is no longer an optimisation.",
        },
        {
          p: "Say out loud how stale it may be. \"Refreshed nightly\" is a decision the business has to accept, not a detail.",
        },
      ],
      tip: "The interviewer is checking whether you reach for indexes or for a schema change. Indexes first, every time.",
      tags: ["scenario", "denormalisation", "indexing", "query plan"],
    },
    {
      id: "dbms-denorm-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Denormalisation typically makes:",
      options: [
        "Reads and writes both faster",
        "Reads faster and writes slower",
        "Reads slower and writes faster",
        "No difference to either",
      ],
      correct: 1,
      answer: [
        {
          p: "Reads faster, because joins disappear; writes slower, because the duplicated copies must be kept in step.",
        },
      ],
      tags: ["mcq", "denormalisation"],
    },
  ],
};
