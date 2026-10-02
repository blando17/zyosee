/*
 * Constraints and Keys in SQL.
 *
 * Source: "Complete SQL.pdf" Q4-9, Q25, "DBMS Notes copy.pdf" p6.
 *
 * The DBMS subject covers keys as a modelling idea; this covers how you
 * actually declare and enforce them.
 */

export default {
  id: "constraints",
  name: "Constraints & Keys",
  importance: "high",
  icon: "lock",
  blurb:
    "Declaring the rules in the schema so the database enforces them instead of your application forgetting to.",
  source: "Complete SQL Q4-9, 25 · cheat-sheets p6",

  questions: [
    {
      id: "sql-con-01",
      subtopic: "Constraints",
      type: "conceptual",
      importance: "high",
      question: "What constraints can you put on a column?",
      short:
        "PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, DEFAULT and CHECK.",
      answer: [
        {
          table: {
            head: ["Constraint", "Enforces", "NULL allowed?"],
            rows: [
              ["`PRIMARY KEY`", "Unique **and** not null — the row's identity", "**No**"],
              ["`FOREIGN KEY`", "The value exists in another table's key", "Yes — means the relationship is optional"],
              ["`UNIQUE`", "No two rows share a value", "Yes, typically one"],
              ["`NOT NULL`", "A value must be supplied", "No"],
              ["`DEFAULT`", "Supplies a value when none is given", "—"],
              ["`CHECK`", "An arbitrary condition on the value", "—"],
            ],
          },
        },
        {
          code: `CREATE TABLE employees (
    id       INT          PRIMARY KEY,
    name     VARCHAR(50)  NOT NULL,
    email    VARCHAR(100) UNIQUE,
    salary   DECIMAL(10,2) DEFAULT 5000 CHECK (salary > 0),
    dept_id  INT,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);`,
          lang: "sql",
        },
        {
          note: "The argument for declaring these rather than checking in application code: **a constraint cannot be forgotten.** Application checks are bypassed by a migration script, a second service, or somebody at a console. A `CHECK (salary > 0)` is enforced against every path into the table, forever.",
        },
      ],
      tags: ["constraints", "check", "default", "not null"],
    },
    {
      id: "sql-con-02",
      subtopic: "Keys",
      type: "comparison",
      importance: "high",
      question: "What is the difference between a PRIMARY KEY and a UNIQUE key?",
      short:
        "One primary key per table and it cannot be NULL. Several unique keys, and they may hold a NULL.",
      answer: [
        {
          table: {
            head: ["", "PRIMARY KEY", "UNIQUE"],
            rows: [
              ["Per table", "**One**", "**Many**"],
              ["NULL", "**Never**", "Allowed — usually one"],
              ["Index created", "Unique **clustered** (in most products)", "Unique **non-clustered**"],
              ["Purpose", "Identifies the row", "Enforces uniqueness on another column"],
            ],
          },
        },
        {
          note: "The NULL rule follows from what each one means. A primary key **identifies** a row, and NULL identifies nothing. A unique constraint only says no two rows share a value — and since NULL is not a value, it does not conflict with anything, including another NULL.",
        },
        {
          p: "How many NULLs a unique column accepts is product-specific: SQL Server allows one, PostgreSQL and MySQL allow many.",
        },
      ],
      tags: ["primary key", "unique key", "null"],
    },
    {
      id: "sql-con-03",
      subtopic: "Auto increment",
      type: "conceptual",
      importance: "med",
      question: "What is AUTO_INCREMENT, and what should you know about it?",
      short:
        "The database generates the next number for you. Gaps are normal and do not indicate a problem.",
      answer: [
        {
          codePair: {
            left: {
              label: "MySQL",
              code: `CREATE TABLE employees (
    id   INT AUTO_INCREMENT,
    name VARCHAR(50),
    PRIMARY KEY (id)
);

INSERT INTO employees (name)
VALUES ('Ananya');   -- id assigned`,
            },
            right: {
              label: "PostgreSQL",
              code: `CREATE TABLE employees (
    id   SERIAL PRIMARY KEY,
    -- or, SQL standard:
    -- id INT GENERATED ALWAYS AS IDENTITY
    name VARCHAR(50)
);

INSERT INTO employees (name)
VALUES ('Ananya');   -- id assigned`,
            },
          },
        },
        {
          note: "**Gaps are expected.** A rolled-back transaction still consumes its number, because the counter is not transactional — undoing that would mean serialising every insert. An auto-increment id is an identifier, not a count, and treating a gap as missing data is a common mistake.",
        },
        {
          p: "It is also a poor sharding key, for the reason in the DBMS subject: it is monotonic, so every new row lands on the newest shard.",
        },
      ],
      tags: ["auto_increment", "serial", "identity", "surrogate key"],
    },
    {
      id: "sql-con-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which can contain a NULL?",
      options: ["PRIMARY KEY", "UNIQUE", "Both", "Neither"],
      correct: 1,
      answer: [
        {
          p: "`UNIQUE`. A primary key identifies the row, and NULL identifies nothing — so entity integrity forbids it.",
        },
      ],
      tags: ["mcq", "constraints", "null"],
    },
  ],
};
