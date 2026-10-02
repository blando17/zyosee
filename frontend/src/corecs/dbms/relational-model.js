/*
 * Relational Model.
 *
 * Source: "DBMS Notes.pdf" pp.15-16, "DBMS Notes copy.pdf" pp.4, 6.
 */

export default {
  id: "relational-model",
  name: "Relational Model",
  importance: "high",
  icon: "problems",
  blurb:
    "Tables, rows and columns with rules attached — and the three integrity constraints that stop the rules being broken.",
  source: "DBMS Notes pp.15-16 · DBMS cheat-sheets pp.4, 6",

  questions: [
    {
      id: "dbms-rel-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What are the building blocks of the relational model?",
      short: "Domain → attribute → tuple → relation. A relation is a table of tuples over the same attributes.",
      answer: [
        {
          table: {
            head: ["Block", "Is", "Example"],
            rows: [
              ["**Domain**", "The set of valid values for a column", "rollNo ∈ 8-digit integers from 21000000"],
              ["**Attribute**", "A named column, drawing values from one domain", "`name VARCHAR(30)`"],
              ["**Tuple**", "One row — one real-world item", "One student's record"],
              ["**Relation**", "The whole table — a set of tuples", "The STUDENT table"],
            ],
          },
        },
        {
          table: {
            head: ["Roll_No", "Name", "Programme"],
            rows: [
              ["22104567", "Parikshit Sharma", "BTech CSE"],
              ["22104612", "Rajat Mehta", "BTech ECE"],
              ["22104755", "Sakshi Bansal", "MBA"],
            ],
          },
        },
        {
          note: "Two terms that get asked as a pair: the **degree** of a relation is its number of *columns* (3 here), and its **cardinality** is its number of *rows* (3 here too, by coincidence). Degree is a property of the schema and rarely changes; cardinality changes with every insert.",
        },
      ],
      tip: "Remember the ladder: domain → attribute → tuple → relation. It answers several questions at once.",
      tags: ["relational model", "tuple", "relation", "degree", "cardinality"],
    },
    {
      id: "dbms-rel-02",
      subtopic: "Integrity",
      type: "conceptual",
      importance: "high",
      question: "What are the integrity constraints in the relational model?",
      short:
        "Key (values unique), entity (primary key never NULL) and referential (a foreign key must match a real row).",
      answer: [
        {
          table: {
            head: ["Constraint", "Rule", "What it stops"],
            rows: [
              ["**Key**", "Every relation has a candidate key whose values never repeat", "Two students with the same roll number"],
              ["**Entity integrity**", "No part of a primary key may be NULL", "A row nobody can identify"],
              ["**Referential integrity**", "A foreign key must match an existing primary key, or be NULL", "Marks for a student who does not exist"],
            ],
          },
        },
        {
          code: `CREATE TABLE MARKS (
    roll_no     INT,
    course_code CHAR(5),
    grade       DECIMAL(3,1),
    PRIMARY KEY (roll_no, course_code),          -- key + entity integrity
    FOREIGN KEY (roll_no) REFERENCES STUDENT(roll_no)   -- referential
        ON DELETE CASCADE
);`,
          lang: "sql",
        },
        {
          note: "**A foreign key may be NULL; a primary key may not.** That asymmetry is deliberate — a NULL foreign key means the relationship is optional (an employee with no manager), whereas a NULL primary key would mean a row with no identity.",
        },
        {
          p: "`ON DELETE` decides what happens when the referenced row goes: `CASCADE` deletes the children, `SET NULL` orphans them deliberately, `RESTRICT` (the default) refuses the delete.",
        },
      ],
      tags: ["integrity constraints", "referential integrity", "foreign key"],
    },
    {
      id: "dbms-rel-03",
      subtopic: "Properties",
      type: "conceptual",
      importance: "med",
      question: "What properties does a relation have?",
      short:
        "Unique rows, unordered rows and columns, atomic values, and one domain per column.",
      answer: [
        {
          ul: [
            "**Every tuple is unique** — a relation is a *set*, so duplicates cannot exist. (SQL tables are a bag and do allow them, which is a known departure.)",
            "**Rows are unordered** — `ORDER BY` imposes an order for output; the relation has none.",
            "**Columns are unordered** — they are named, so position carries no meaning.",
            "**Values are atomic** — no lists in a cell. This is exactly 1NF.",
            "**One domain per column** — every value in a column comes from the same set.",
          ],
        },
        {
          note: "The set-versus-bag gap is a good thing to know: the *model* forbids duplicate rows, but a real SQL table permits them unless you declare a key. That is why `SELECT DISTINCT` exists at all.",
        },
      ],
      tags: ["relation properties", "atomicity", "set"],
    },
    {
      id: "dbms-rel-04",
      subtopic: "Relational algebra",
      type: "conceptual",
      importance: "med",
      question: "What are the basic relational algebra operations?",
      short:
        "Select (σ), project (π), union, set difference, Cartesian product and rename — plus join, built from them.",
      answer: [
        {
          table: {
            head: ["Operation", "Symbol", "Does", "SQL"],
            rows: [
              ["Select", "σ", "Picks **rows** matching a condition", "`WHERE`"],
              ["Project", "π", "Picks **columns**", "`SELECT` list"],
              ["Union", "∪", "All rows from both, duplicates removed", "`UNION`"],
              ["Set difference", "−", "Rows in the first and not the second", "`EXCEPT`"],
              ["Cartesian product", "×", "Every row paired with every row", "`CROSS JOIN`"],
              ["Rename", "ρ", "Renames a relation or its attributes", "`AS`"],
              ["Join", "⋈", "Product then select — derived, not primitive", "`JOIN … ON`"],
            ],
          },
        },
        {
          code: `-- "names of CSE students with CGPA above 8"
π name ( σ programme = 'CSE' ∧ cgpa > 8 (STUDENT) )

-- the same thing in SQL
SELECT name FROM STUDENT WHERE programme = 'CSE' AND cgpa > 8;`,
          lang: "sql",
        },
        {
          note: "The distinction examiners want: **σ picks rows, π picks columns.** And π removes duplicates, because its result is a relation — which is why it does not correspond exactly to a bare `SELECT`.",
        },
      ],
      tags: ["relational algebra", "select", "project", "join"],
    },
    {
      id: "dbms-rel-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "The degree of a relation is its number of:",
      options: ["Rows", "Columns", "Keys", "Constraints"],
      correct: 1,
      answer: [{ p: "Columns. The number of rows is its cardinality." }],
      tags: ["mcq", "degree"],
    },
    {
      id: "dbms-rel-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which of these may contain NULL?",
      options: ["A primary key", "A foreign key", "Neither", "Both"],
      correct: 1,
      answer: [
        {
          p: "A foreign key may be NULL, meaning the relationship is optional. A primary key may not — entity integrity forbids it.",
        },
      ],
      tags: ["mcq", "integrity"],
    },
    {
      id: "dbms-rel-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In relational algebra, σ (sigma) performs:",
      options: ["Projection of columns", "Selection of rows", "A join", "A union"],
      correct: 1,
      answer: [{ p: "Selection of rows — SQL's `WHERE`. π (pi) is the projection of columns." }],
      tags: ["mcq", "relational algebra"],
    },
  ],
};
