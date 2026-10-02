/*
 * Normalisation.
 *
 * Source: "DBMS Notes.pdf" pp.19-23, "DBMS Notes copy.pdf" p13.
 *
 * THE WORKED EXAMPLE IN THE NOTES INTRODUCES A TABLE ONE STEP EARLY.
 *
 * Its 2NF step already lists an INSTRUCTOR table, and then the 3NF step says
 * "create a new table: INSTRUCTOR". Splitting out instructorName is what
 * removes the transitive dependency, so it belongs to 3NF — at 2NF the
 * instructor's name is still sitting in COURSE. The walkthrough below puts it
 * where it belongs, which is also what makes the 3NF step demonstrate
 * anything.
 */

export default {
  id: "normalization",
  name: "Normalisation",
  importance: "high",
  icon: "scales",
  blurb:
    "Splitting tables until every fact lives in exactly one place — and the dependencies that tell you where to cut.",
  source: "DBMS Notes pp.19-23 · DBMS cheat-sheets p13",

  questions: [
    {
      id: "dbms-norm-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is normalisation, and what problems does it solve?",
      short:
        "Decomposing tables to remove redundancy — which removes the insert, update and delete anomalies redundancy causes.",
      answer: [
        {
          p: "Normalisation breaks large tables into smaller related ones so that each fact is stored **once**. The goal is not tidiness; it is eliminating three specific failures:",
        },
        {
          table: {
            head: ["Anomaly", "What goes wrong", "Example"],
            rows: [
              ["**Insert**", "You cannot record one fact without inventing another", "Cannot add a new course until some student enrols in it"],
              ["**Update**", "One change must be made in many rows, and might not be", "A department renames; you update 400 student rows, miss 3, and now the data disagrees with itself"],
              ["**Delete**", "Removing one fact silently destroys another", "The last student in a course leaves, and the course itself vanishes"],
            ],
          },
        },
        {
          note: "The update anomaly is the one to lead with. It is not that redundancy wastes space — space is cheap. It is that redundancy lets the database hold two different answers to the same question.",
        },
      ],
      tip: "Name the three anomalies. 'Removes redundancy' is the half-answer everyone gives.",
      tags: ["normalisation", "anomalies", "redundancy"],
    },
    {
      id: "dbms-norm-02",
      subtopic: "Dependencies",
      type: "conceptual",
      importance: "high",
      question: "What is a functional dependency, and what types are there?",
      short:
        "X → Y means X's value determines Y's. The types that matter for normalisation are partial and transitive.",
      answer: [
        {
          p: "**X → Y** means: if two rows agree on X, they must agree on Y. `rollNo → name` — the same roll number can never belong to two different names.",
        },
        {
          table: {
            head: ["Type", "Means", "Example", "Breaks"],
            rows: [
              ["Full functional", "Y depends on **all** of X, not a part", "(rollNo, courseCode) → grade", "—"],
              ["**Partial**", "Y depends on **part** of a composite key", "(rollNo, courseCode) → studentName, but rollNo alone suffices", "**2NF**"],
              ["**Transitive**", "A → B and B → C, so A → C indirectly", "courseCode → instructorId → instructorName", "**3NF**"],
              ["Trivial", "Y is contained in X", "(rollNo, name) → name", "Nothing — always true"],
              ["Non-trivial", "Y is not contained in X", "rollNo → deptName", "—"],
              ["Multivalued (↠)", "X determines a *set* of Y independently of Z", "rollNo ↠ hobbies, rollNo ↠ sports", "**4NF**"],
            ],
          },
        },
        {
          note: "Partial and transitive are worth memorising as a pair, because they map directly onto the normal forms: **partial dependency → fix with 2NF; transitive dependency → fix with 3NF.** Everything else is vocabulary.",
        },
      ],
      tags: ["functional dependency", "partial", "transitive", "multivalued"],
    },
    {
      id: "dbms-norm-03",
      subtopic: "Normal forms",
      type: "comparison",
      importance: "high",
      question: "What are 1NF, 2NF, 3NF and BCNF?",
      short:
        "1NF atomic values; 2NF no partial dependency; 3NF no transitive dependency; BCNF every determinant is a candidate key.",
      answer: [
        { diagram: "normal-forms" },
        {
          table: {
            head: ["Form", "Rule", "Removes"],
            rows: [
              ["**1NF**", "Every cell holds one atomic value; no repeating groups", "Lists inside cells"],
              ["**2NF**", "1NF **and** no non-prime attribute depends on part of a composite key", "Partial dependencies"],
              ["**3NF**", "2NF **and** no non-prime attribute depends transitively on the key", "Transitive dependencies"],
              ["**BCNF**", "For every dependency X → Y, X must be a **candidate key**", "The anomalies 3NF still permits"],
              ["4NF", "BCNF **and** no non-trivial multivalued dependency", "Independent multivalued facts in one table"],
            ],
          },
        },
        {
          p: "**A non-prime attribute** is one that is not part of any candidate key. 2NF and 3NF are both stated in terms of them — which is why a table whose key is a single column is automatically in 2NF: there is no *part* of the key to depend on.",
        },
        {
          note: "**3NF versus BCNF** is the distinction interviewers push on. 3NF lets a dependency X → Y stand if Y is itself part of a candidate key; BCNF does not. That gap is small, and it is where BCNF sometimes forces you to give up dependency preservation.",
        },
      ],
      tip: "The mnemonic: 1NF the values, 2NF the whole key, 3NF nothing but the key. BCNF is 3NF taken seriously.",
      tags: ["1nf", "2nf", "3nf", "bcnf", "normal forms"],
    },
    {
      id: "dbms-norm-n1",
      subtopic: "Worked example",
      type: "numerical",
      importance: "high",
      question: "Normalise this table from unnormalised form all the way to BCNF.",
      short:
        "Four tables: STUDENT, COURSE, INSTRUCTOR and RESULT.",
      given: {
        head: ["Roll No", "Student Name", "Programme", "Course List", "Grade List"],
        rows: [
          ["22104567", "Ananya Sharma", "BTech CSE", "CS101, MA102", "8.5, 7.0"],
          ["22104612", "Rajat Mehta", "BTech ECE", "EC101", "8.0"],
          ["22104755", "Farah Khan", "MBA", "MG201, MG202", "7.5, 8.2"],
        ],
      },
      find: ["1NF", "The functional dependencies", "2NF", "3NF", "BCNF"],
      solution: [
        {
          p: "**Step 1 — 1NF.** The violation is the multi-valued cells. Split each list into its own row so every cell is atomic.",
        },
        {
          table: {
            head: ["Roll No", "Student Name", "Programme", "Course Code", "Grade"],
            rows: [
              ["22104567", "Ananya Sharma", "BTech CSE", "CS101", "8.5"],
              ["22104567", "Ananya Sharma", "BTech CSE", "MA102", "7.0"],
              ["22104612", "Rajat Mehta", "BTech ECE", "EC101", "8.0"],
              ["22104755", "Farah Khan", "MBA", "MG201", "7.5"],
              ["22104755", "Farah Khan", "MBA", "MG202", "8.2"],
            ],
          },
        },
        {
          p: "Atomic now, but the student's name and programme repeat on every course row. The key is the composite **(rollNo, courseCode)**.",
        },
        { p: "**Step 2 — write down the dependencies.** This is the step that does the actual work." },
        {
          ul: [
            "**FD1:** rollNo → studentName, programme",
            "**FD2:** courseCode → courseName, credits, instructorId",
            "**FD3:** instructorId → instructorName",
            "**FD4:** (rollNo, courseCode) → grade",
          ],
        },
        {
          p: "**Step 3 — 2NF.** FD1 and FD2 are **partial** dependencies: each depends on only half of the composite key. Move them into their own tables.",
        },
        {
          table: {
            head: ["Table", "Columns", "From"],
            rows: [
              ["**STUDENT**", "rollNo **(PK)**, studentName, programme", "FD1"],
              ["**COURSE**", "courseCode **(PK)**, courseName, credits, instructorId, instructorName", "FD2 + FD3"],
              ["**RESULT**", "rollNo **(FK)**, courseCode **(FK)**, grade — PK = both", "FD4"],
            ],
          },
        },
        {
          p: "Every non-key column now depends on the whole key of its table. **But COURSE still has a problem.**",
        },
        {
          p: "**Step 4 — 3NF.** In COURSE, `courseCode → instructorId → instructorName`. That is a **transitive** dependency: instructorName depends on the key only by going through instructorId. Split it out.",
        },
        {
          table: {
            head: ["Table", "Columns"],
            rows: [
              ["**STUDENT**", "rollNo (PK), studentName, programme"],
              ["**COURSE**", "courseCode (PK), courseName, credits, instructorId **(FK)**"],
              ["**INSTRUCTOR**", "instructorId (PK), instructorName"],
              ["**RESULT**", "rollNo (FK), courseCode (FK), grade — PK = (rollNo, courseCode)"],
            ],
          },
        },
        {
          p: "**Step 5 — BCNF.** Check every dependency: is its left-hand side a candidate key of its table?",
        },
        {
          table: {
            head: ["Dependency", "In table", "Left side is the key?"],
            rows: [
              ["rollNo → studentName, programme", "STUDENT", "Yes ✓"],
              ["courseCode → courseName, credits, instructorId", "COURSE", "Yes ✓"],
              ["instructorId → instructorName", "INSTRUCTOR", "Yes ✓"],
              ["(rollNo, courseCode) → grade", "RESULT", "Yes ✓"],
            ],
          },
        },
        {
          p: "All four are candidate keys of their own tables, so **the schema is already in BCNF**. Reaching 3NF was enough here, which is the usual outcome.",
        },
        {
          note: "**When would it not be?** If the college enforced \"one instructor teaches exactly one course\", you would gain `instructorId → courseCode`. In COURSE, instructorId is not a candidate key, so that breaks BCNF and you would split out a TEACHES(instructorId PK, courseCode) table.",
        },
        {
          note: "Your notes list the INSTRUCTOR table in the **2NF** step and then say \"create a new table: INSTRUCTOR\" in the 3NF step. Splitting it out is what removes the transitive dependency, so it belongs to 3NF — at 2NF instructorName is still in COURSE. That ordering is what makes the 3NF step demonstrate something.",
          tone: "warn",
        },
      ],
      tip: "Always write the dependency list before decomposing. Every decision after that follows from it mechanically, and examiners award the working.",
      tags: ["normalisation", "worked example", "1nf", "2nf", "3nf", "bcnf"],
    },
    {
      id: "dbms-norm-04",
      subtopic: "Decomposition",
      type: "comparison",
      importance: "med",
      question: "What are lossless join and dependency preservation?",
      short:
        "Lossless join: rejoining the pieces recreates the original exactly. Dependency preservation: every FD can still be checked without a join.",
      answer: [
        {
          table: {
            head: ["Property", "Means", "If you lose it"],
            rows: [
              ["**Lossless join**", "Joining the decomposed tables gives back exactly the original rows — no more, no fewer", "**Non-negotiable.** Spurious rows appear and the data is simply wrong"],
              ["**Dependency preservation**", "Every original FD can be enforced on a single table", "Enforcing a constraint needs a join on every write — slow, and easy to skip"],
            ],
          },
        },
        {
          p: "A decomposition of R into R1 and R2 is **lossless** if the shared columns form a key of at least one of them — that is the test worth remembering.",
        },
        {
          note: "The trade that makes this a real question: **BCNF sometimes cannot be reached without losing dependency preservation, while 3NF can always be reached with both.** That is the practical argument for stopping at 3NF, and it is why 3NF is what most schemas actually are.",
        },
      ],
      tip: "If asked \"why not always BCNF\", this is the answer: because 3NF guarantees both properties and BCNF does not.",
      tags: ["lossless join", "dependency preservation", "decomposition"],
    },
    {
      id: "dbms-norm-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A partial dependency violates which normal form?",
      options: ["1NF", "2NF", "3NF", "BCNF"],
      correct: 1,
      answer: [
        {
          p: "2NF. A transitive dependency violates 3NF. A table with a single-column key is in 2NF automatically — there is no partial key to depend on.",
        },
      ],
      tags: ["mcq", "2nf"],
    },
    {
      id: "dbms-norm-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A table is in BCNF when:",
      options: [
        "It has no repeating groups",
        "Every non-prime attribute depends on the whole key",
        "Every determinant is a candidate key",
        "It has no multivalued dependencies",
      ],
      correct: 2,
      answer: [
        {
          p: "Every determinant — every left-hand side of a functional dependency — must be a candidate key. The last option describes 4NF.",
        },
      ],
      tags: ["mcq", "bcnf"],
    },
    {
      id: "dbms-norm-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which property of a decomposition is non-negotiable?",
      options: [
        "Dependency preservation",
        "Lossless join",
        "Reaching BCNF",
        "Having fewer tables",
      ],
      correct: 1,
      answer: [
        {
          p: "Lossless join. Without it the rejoined data contains rows that were never there, which is corruption. Dependency preservation is desirable but can be traded away.",
        },
      ],
      tags: ["mcq", "decomposition"],
    },
  ],
};
