/*
 * Keys.
 *
 * Source: "DBMS Notes.pdf" pp.17-18, "DBMS Notes copy.pdf" p5,
 * "Top 100 DBMS Interview Questions.pdf" (candidate key, unique key,
 * foreign key).
 */

export default {
  id: "keys",
  name: "Keys",
  importance: "high",
  icon: "lock",
  blurb:
    "Six kinds of key, one containment hierarchy, and the minimality test that tells them apart.",
  source: "DBMS Notes pp.17-18 · DBMS cheat-sheets p5",

  questions: [
    {
      id: "dbms-key-01",
      subtopic: "Types",
      type: "comparison",
      importance: "high",
      question: "What are the types of key in a DBMS?",
      short:
        "Super, candidate, primary, alternate, composite and foreign — plus surrogate in practice.",
      answer: [
        { diagram: "key-hierarchy" },
        {
          table: {
            head: ["Key", "Definition", "Example"],
            rows: [
              ["**Super key**", "Any set of columns that uniquely identifies a row — redundant columns allowed", "{rollNo}, {rollNo, mobileNo}, {email}"],
              ["**Candidate key**", "A **minimal** super key — drop any column and uniqueness is lost", "{rollNo}, {email}"],
              ["**Primary key**", "The candidate key chosen as the official identifier", "rollNo"],
              ["**Alternate key**", "Any candidate key not chosen as primary", "email"],
              ["**Composite key**", "A key made of two or more columns", "{rollNo, courseCode} in MARKS"],
              ["**Foreign key**", "A column set referencing another table's primary key", "MARKS.rollNo → STUDENT.rollNo"],
              ["**Surrogate key**", "A meaningless generated id used as primary key", "An auto-increment `id`"],
            ],
          },
        },
        {
          note: "**Every primary key is a candidate key, and every candidate key is a super key — never the other way round.** That containment is the whole question; the diagram above is worth being able to draw.",
        },
      ],
      tip: "If you can only say one thing: a super key is *unique*, a candidate key is *unique and minimal*, a primary key is *the chosen one*.",
      tags: ["keys", "super key", "candidate key", "primary key"],
    },
    {
      id: "dbms-key-02",
      subtopic: "Minimality",
      type: "how",
      importance: "high",
      question: "How do you test whether a key is a candidate key?",
      short:
        "Check it is unique, then remove each column in turn. If any removal keeps it unique, it was not minimal.",
      answer: [
        {
          ol: [
            "**Uniqueness** — no two rows share the same value for the whole set. Fail here and it is not a key at all.",
            "**Minimality** — drop one column and test again. If it is *still* unique, the dropped column was redundant, so the original set was a super key but not a candidate key.",
          ],
        },
        {
          p: "Worked through: in STUDENT, `{rollNo, mobileNo}` is unique. Drop `mobileNo` and `{rollNo}` is still unique — so the pair is **not minimal** and therefore not a candidate key. `{rollNo}` is.",
        },
        {
          p: "In MARKS the answer goes the other way. `{rollNo}` is not unique (a student has many marks) and `{courseCode}` is not unique (a course has many students), but `{rollNo, courseCode}` is — and dropping either breaks it. **That is a genuine composite candidate key.**",
        },
        {
          note: "The common trap: a composite key is *not* the same as a super key with extra columns. A composite key is minimal and happens to need several columns; a super key has columns it does not need.",
        },
      ],
      tags: ["candidate key", "minimality", "composite key"],
    },
    {
      id: "dbms-key-03",
      subtopic: "Comparison",
      type: "comparison",
      importance: "high",
      question: "Primary key vs unique key?",
      short:
        "One primary key per table, never NULL. Several unique keys allowed, and they may hold one NULL.",
      answer: [
        {
          table: {
            head: ["", "Primary key", "Unique key"],
            rows: [
              ["How many per table", "**One**", "**Many**"],
              ["NULL allowed", "**No** — entity integrity", "**Yes**, typically one NULL"],
              ["Default index", "Clustered, in most systems", "Non-clustered"],
              ["Purpose", "The row's identity", "Enforce uniqueness on another column"],
            ],
          },
        },
        {
          code: `CREATE TABLE STUDENT (
    roll_no INT PRIMARY KEY,        -- one, never NULL
    email   VARCHAR(50) UNIQUE,     -- unique, may be NULL
    aadhaar CHAR(12)    UNIQUE      -- another one is fine
);`,
          lang: "sql",
        },
        {
          note: "The NULL rule catches people. A unique constraint means \"no two rows share a value\", and NULL is not a value — so depending on the system, one NULL is allowed (SQL Server) or several are (PostgreSQL, MySQL). A primary key allows none either way.",
        },
      ],
      tags: ["primary key", "unique key", "null"],
    },
    {
      id: "dbms-key-04",
      subtopic: "Foreign keys",
      type: "scenario",
      importance: "high",
      question:
        "You try to delete a STUDENT row that MARKS still references. What happens, and what are your options?",
      short:
        "By default the delete is refused. `ON DELETE CASCADE` removes the marks too; `SET NULL` orphans them.",
      answer: [
        {
          p: "Referential integrity forbids a foreign key pointing at nothing, so the database must do one of three things — and you choose which when you declare the constraint.",
        },
        {
          table: {
            head: ["Clause", "On deleting the parent", "Use when"],
            rows: [
              ["`ON DELETE RESTRICT` / `NO ACTION`", "**Refuses** the delete. The default.", "The children matter and should block it"],
              ["`ON DELETE CASCADE`", "Deletes the child rows too", "The children cannot exist alone — a weak entity"],
              ["`ON DELETE SET NULL`", "Sets the foreign key to NULL", "The relationship is optional"],
            ],
          },
        },
        {
          code: `FOREIGN KEY (roll_no) REFERENCES STUDENT(roll_no)
    ON DELETE CASCADE      -- marks go with the student
    ON UPDATE CASCADE;     -- and follow a changed roll number`,
          lang: "sql",
        },
        {
          note: "`CASCADE` is convenient and worth being careful with: deleting one row can quietly remove thousands through a chain of cascades, and there is no confirmation step. `RESTRICT` makes you delete the children deliberately, which is often what you want.",
        },
      ],
      tags: ["foreign key", "cascade", "referential integrity", "scenario"],
    },
    {
      id: "dbms-key-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A minimal super key is called a:",
      options: ["Primary key", "Candidate key", "Foreign key", "Composite key"],
      correct: 1,
      answer: [
        {
          p: "A candidate key. The primary key is whichever candidate key you then choose as the identifier.",
        },
      ],
      tags: ["mcq", "candidate key"],
    },
    {
      id: "dbms-key-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "How many primary keys can a table have?",
      options: ["One", "Two", "As many as needed", "None"],
      correct: 0,
      answer: [
        {
          p: "Exactly one — though it may be composite, spanning several columns. Additional uniqueness is expressed with UNIQUE constraints.",
        },
      ],
      tags: ["mcq", "primary key"],
    },
  ],
};
