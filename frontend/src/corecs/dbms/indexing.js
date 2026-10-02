/*
 * Indexing and B+ Trees.
 *
 * Source: "DBMS Notes copy.pdf" p16, "DBMS Notes.pdf" pp.36-37.
 *
 * Both Indexing and B+ Tree are starred on LIST.pdf. The cheat-sheet page is
 * much the stronger of the two sources here — it has the B-tree/B+ tree
 * comparison, the clustered/non-clustered tables and the index-type matrix.
 */

export default {
  id: "indexing",
  name: "Indexing & B+ Trees",
  importance: "high",
  icon: "search",
  blurb:
    "The data structure that turns a full table scan into a few page reads — and the write cost you pay for it.",
  source: "DBMS cheat-sheets p16 · DBMS Notes pp.36-37",

  questions: [
    {
      id: "dbms-idx-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is an index, and what does it cost?",
      short:
        "A sorted structure of key values and row pointers. It makes reads fast and every write slower.",
      answer: [
        {
          p: "An index is a separate data structure holding a sorted copy of one or more columns, each entry pointing at the row it came from — exactly like the index at the back of a textbook.",
        },
        {
          table: {
            head: ["", "Without an index", "With an index"],
            rows: [
              ["Finding one row", "Scan the whole table — O(n)", "A few page reads — O(log n)"],
              ["Range query", "Scan everything", "Find the start, then walk the leaves"],
              ["INSERT / UPDATE / DELETE", "Touch the table", "Touch the table **and every index on it**"],
              ["Storage", "Just the table", "Plus the index"],
            ],
          },
        },
        {
          note: "**Indexes are not free, and this is the answer interviewers want.** Every index has to be maintained on every write, so a table with six indexes does seven pieces of work per insert. Indexing everything makes a database slower, not faster.",
        },
      ],
      tip: "Always mention the write cost. 'Indexes make queries fast' is half the answer and the uninteresting half.",
      tags: ["index", "performance", "write cost"],
    },
    {
      id: "dbms-idx-02",
      subtopic: "Types",
      type: "comparison",
      importance: "high",
      question: "Clustered vs non-clustered index?",
      short:
        "A clustered index *is* the table's physical order — one per table. A non-clustered index is a separate structure pointing into it.",
      answer: [
        { diagram: "clustered-index" },
        {
          table: {
            head: ["", "Clustered", "Non-clustered"],
            rows: [
              ["How many per table", "**One** — the rows can only be in one order", "**Many**"],
              ["Data rows", "Stored **in** index order", "Stored separately, in any order"],
              ["Extra lookup", "No — the row is right there", "Yes — follow the pointer to the row"],
              ["Range queries", "**Very fast** — the rows are adjacent", "Slower — pointers scatter"],
              ["Usually built on", "The primary key", "Any other searched column"],
            ],
          },
        },
        {
          p: "**Why only one clustered index:** it defines the physical order of the rows themselves, and rows can only be stored in one order at a time. Everything else has to be a separate structure.",
        },
        {
          note: "The related pair: a **primary index** is built on the primary key of a sorted file, and a **secondary index** on any non-key column — so a secondary index may contain duplicate keys and needs a list of pointers per value.",
        },
      ],
      tags: ["clustered index", "non-clustered", "primary index", "secondary index"],
    },
    {
      id: "dbms-idx-03",
      subtopic: "B+ trees",
      type: "comparison",
      importance: "high",
      question: "B-tree vs B+ tree — and why do databases use B+ trees?",
      short:
        "A B+ tree keeps all data in the leaves and links them together, which makes range scans a sequential walk.",
      answer: [
        { diagram: "btree-vs-bplus" },
        {
          table: {
            head: ["", "B-tree", "B+ tree"],
            rows: [
              ["Data stored in", "Internal **and** leaf nodes", "**Leaf nodes only**"],
              ["Internal nodes hold", "Keys and data", "**Keys only** — so more fit per node"],
              ["Leaves linked", "No", "**Yes**, left to right"],
              ["All leaves at the same depth", "Not necessarily", "Yes"],
              ["Range scan", "Awkward — traverse repeatedly", "**A sequential walk along the leaves**"],
              ["Fan-out", "Lower", "**Higher** — so the tree is shallower"],
            ],
          },
        },
        { p: "**Two reasons databases chose B+ trees**, and both come back to disk:" },
        {
          ol: [
            "**Higher fan-out.** Internal nodes carry keys only, so far more fit in one disk page. More children per node means a shallower tree, and depth is the number of disk reads a lookup costs.",
            "**Linked leaves.** `WHERE cgpa BETWEEN 8 AND 9` finds the first leaf and then walks sideways. In a B-tree the same query means climbing up and down repeatedly.",
          ],
        },
        {
          note: "The framing that makes this click: a B+ tree is optimised for **disk**, not for comparisons. A node is sized to a disk page, and every design choice exists to reduce the number of pages touched. Comparing it to a binary search tree misses the point — a BST of a million rows is 20 disk seeks deep, a B+ tree is 3.",
        },
      ],
      tip: "Fan-out and linked leaves. Those two words answer 'why B+ tree' completely.",
      tags: ["b-tree", "b+ tree", "fan-out", "range query"],
    },
    {
      id: "dbms-idx-04",
      subtopic: "Usage",
      type: "scenario",
      importance: "high",
      question: "Why might a query ignore an index you added?",
      short:
        "Usually because a function wraps the column, the index is not selective enough, or the leading column of a composite index is missing.",
      answer: [
        {
          table: {
            head: ["Cause", "Example", "Fix"],
            rows: [
              ["**Function on the column**", "`WHERE UPPER(name) = 'ANANYA'`", "Query the raw column, or build a function-based index"],
              ["**Implicit type conversion**", "Comparing a `VARCHAR` column to a number", "Match the types"],
              ["**Leading edge missing**", "Index on (a, b); query filters on `b` alone", "Reorder the index, or add another"],
              ["**Low selectivity**", "Indexing a gender column — half the table matches", "Do not index it; a scan is genuinely cheaper"],
              ["**`LIKE '%foo'`**", "A leading wildcard has no sorted prefix to seek on", "Full-text index, or restructure the query"],
              ["**Stale statistics**", "The planner thinks the table is small", "Re-analyse the table"],
            ],
          },
        },
        {
          note: "**Low selectivity is the one that surprises people.** If a query returns 40% of the table, using the index means reading the index *and* then jumping to nearly every row anyway — two random reads per row instead of one sequential scan. The planner is right to refuse; the index is the wrong tool.",
        },
        {
          p: "The way to answer this in practice is always the same: run `EXPLAIN` and see what the planner actually chose, rather than guessing.",
        },
      ],
      tip: "'Functions on the indexed column' is the answer to give first. It is by far the most common cause in real code.",
      tags: ["index", "query plan", "selectivity", "explain", "scenario"],
    },
    {
      id: "dbms-idx-05",
      subtopic: "Optimisation",
      type: "conceptual",
      importance: "med",
      question: "How would you speed up a slow query?",
      short:
        "Read the plan, index the filter and join columns, select fewer columns, filter before joining.",
      answer: [
        {
          table: {
            head: ["Technique", "Why"],
            rows: [
              ["**Read `EXPLAIN` first**", "Optimise what is actually slow, not what you assume is"],
              ["Avoid `SELECT *`", "Fewer columns means less I/O — and may let an index answer the query outright"],
              ["Filter early, join later", "Joining two small sets beats joining two large ones"],
              ["Index the `WHERE` and `JOIN ON` columns", "A missing index on a foreign key turns a join into a scan per row"],
              ["Keep functions off indexed columns", "A function hides the index from the planner"],
              ["`LIMIT` what the interface shows", "A top-10 list should not sort a million rows fully"],
              ["Keep statistics current", "The planner chooses on estimates; stale ones give bad plans"],
            ],
          },
        },
        {
          note: "A **covering index** is the strongest version of the second row: if an index contains every column the query needs, the database answers from the index and never touches the table at all.",
        },
      ],
      tags: ["query optimisation", "explain", "covering index"],
    },
    {
      id: "dbms-idx-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "How many clustered indexes can a table have?",
      options: ["One", "Two", "As many as you like", "None"],
      correct: 0,
      answer: [
        {
          p: "One — it defines the physical order of the rows, and they can only be in one order at a time.",
        },
      ],
      tags: ["mcq", "clustered index"],
    },
    {
      id: "dbms-idx-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In a B+ tree, actual data records are stored in:",
      options: ["Internal nodes only", "Leaf nodes only", "Both", "The root"],
      correct: 1,
      answer: [
        {
          p: "Leaf nodes only. Internal nodes carry keys as signposts, which is why more of them fit per page and the tree stays shallow.",
        },
      ],
      tags: ["mcq", "b+ tree"],
    },
    {
      id: "dbms-idx-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Adding many indexes to a table primarily slows down:",
      options: ["SELECT", "INSERT, UPDATE and DELETE", "Nothing", "Joins"],
      correct: 1,
      answer: [
        {
          p: "Writes. Every index has to be updated on every modification, so six indexes mean seven structures touched per insert.",
        },
      ],
      tags: ["mcq", "index", "write cost"],
    },
  ],
};
