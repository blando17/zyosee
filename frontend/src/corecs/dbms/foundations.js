/*
 * DBMS Foundations.
 *
 * Source: "DBMS Notes.pdf" pp.3-10, "DBMS Notes copy.pdf" pp.1-2,
 * "DBMS & SQL NOTES.pdf" (the file-system problems list).
 */

export default {
  id: "foundations",
  name: "DBMS Foundations",
  importance: "med",
  icon: "books",
  blurb:
    "What a database system is for, what it replaced, and the three-level architecture that lets you change one layer without breaking the others.",
  source: "DBMS Notes pp.3-10 · DBMS cheat-sheets pp.1-2",

  questions: [
    {
      id: "dbms-found-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is a DBMS, and why use one instead of files?",
      short:
        "Software that manages databases — giving you consistency, concurrent access, security and recovery that flat files cannot.",
      answer: [
        {
          p: "A **Database Management System** is software that lets you create, query and administer databases. The database is the data; the DBMS is the program that looks after it.",
        },
        { p: "**What file-based storage got wrong**, which is really the answer to this question:" },
        {
          table: {
            head: ["Problem with files", "What the DBMS does"],
            rows: [
              ["**Redundancy and inconsistency** — the same student's address in four spreadsheets", "One copy, one source of truth"],
              ["**Difficulty accessing data** — a new question means a new program", "A query language answers questions nobody anticipated"],
              ["**Data isolation** — scattered across formats", "One schema over one store"],
              ["**Integrity problems** — rules live in application code, if anywhere", "Constraints enforced by the database itself"],
              ["**Atomicity failures** — a crash mid-update leaves half a change", "Transactions are all-or-nothing"],
              ["**Concurrent access** — two writers clobber each other", "Locking and isolation levels"],
              ["**Security** — all or nothing per file", "Per-table, per-column, per-role access"],
            ],
          },
        },
        {
          note: "The example that makes it concrete: if every department keeps its own spreadsheet, Admissions updates a student's address and Fees does not. Neither is wrong, and the data no longer agrees with itself. That single failure is what a DBMS exists to prevent.",
        },
      ],
      tip: "Answer with the file-system problems, not a definition. 'It stores data' is true of a text file.",
      tags: ["dbms", "file system", "redundancy"],
    },
    {
      id: "dbms-found-02",
      subtopic: "Architecture",
      type: "conceptual",
      importance: "high",
      question: "What is the three-schema architecture, and what is data independence?",
      short:
        "External, conceptual and internal levels. Separating them means you can change storage or a view without rewriting the others.",
      answer: [
        { diagram: "three-schema" },
        {
          table: {
            head: ["Level", "Describes", "Who cares"],
            rows: [
              ["**External / view**", "What one group of users sees — a subset, possibly reshaped", "End users, applications"],
              ["**Conceptual / logical**", "The whole database as tables, columns and constraints", "Database designers"],
              ["**Internal / physical**", "Files, pages, indexes, compression on disk", "The DBMS and the DBA"],
            ],
          },
        },
        { p: "The point of the separation is **data independence**:" },
        {
          ul: [
            "**Physical data independence** — change how data is stored (add an index, switch file organisation) without touching the logical schema. Easy, and routinely done.",
            "**Logical data independence** — change the logical schema (add a column, split a table) without changing the external views. Harder, because views are defined in terms of the tables.",
          ],
        },
        {
          note: "The asymmetry is worth stating: **physical independence is largely achieved, logical independence is not**. Adding an index breaks nothing. Splitting a table usually means rewriting the views built on it.",
        },
      ],
      tip: "Name both kinds and say which one is actually hard. That distinction is the follow-up.",
      tags: ["three-schema", "data independence", "architecture"],
    },
    {
      id: "dbms-found-03",
      subtopic: "Architecture",
      type: "comparison",
      importance: "med",
      question: "What is the difference between a schema and an instance?",
      short:
        "The schema is the structure and rarely changes. The instance is the data in it right now.",
      answer: [
        {
          table: {
            head: ["", "Schema (intension)", "Instance (extension)"],
            rows: [
              ["Is", "The definition — tables, columns, domains, constraints", "The rows currently present"],
              ["Changes", "Rarely, by a deliberate migration", "Constantly, with every insert and delete"],
              ["Analogy", "The blank worksheet template", "The filled-in worksheet"],
            ],
          },
        },
        {
          code: `-- Schema
STUDENT(roll_no INT PRIMARY KEY, name VARCHAR(30), programme CHAR(10))

-- Instance, right now
22104567 | Parikshit Sharma | BTech CSE
22104612 | Rajat Mehta      | BTech ECE`,
          lang: "sql",
        },
      ],
      tags: ["schema", "instance"],
    },
    {
      id: "dbms-found-04",
      subtopic: "Data models",
      type: "comparison",
      importance: "med",
      question: "What types of data model are there?",
      short:
        "Hierarchical, network, relational, object-oriented and entity-relationship. Relational won.",
      answer: [
        {
          table: {
            head: ["Model", "Structure", "Where it stands"],
            rows: [
              ["Hierarchical", "A tree — each child has one parent", "Obsolete; a many-to-many relationship cannot be expressed"],
              ["Network", "A graph — a child may have several parents", "Fixed the M:N problem, needed pointer navigation"],
              ["**Relational**", "Tables of rows and columns, joined by values", "**Dominant.** You declare what you want, not how to walk to it"],
              ["Object-oriented", "Objects with attributes and methods", "Niche; survives as the object-relational features in SQL"],
              ["Entity-Relationship", "Entities, attributes, relationships", "A **design** model — you draw an ER diagram, then map it to tables"],
            ],
          },
        },
        {
          note: "Why relational won is worth one sentence: in the earlier models a query had to **navigate** pointers, so the code depended on the physical layout. Relational queries name values, so the DBMS is free to change how it stores and searches — which is exactly physical data independence.",
        },
      ],
      tags: ["data models", "relational"],
    },
    {
      id: "dbms-found-05",
      subtopic: "Comparison",
      type: "comparison",
      importance: "high",
      question: "SQL vs NoSQL — when would you choose each?",
      short:
        "SQL for a fixed schema and strong transactional guarantees; NoSQL for scale, flexible shape and tolerance of eventual consistency.",
      answer: [
        {
          table: {
            head: ["", "SQL (relational)", "NoSQL"],
            rows: [
              ["Schema", "Fixed, declared up front", "Flexible — documents can differ"],
              ["Scaling", "Vertical, mostly", "Horizontal by design"],
              ["Guarantees", "**ACID**", "Often **BASE** — eventually consistent"],
              ["Joins", "First-class", "Usually absent; you denormalise instead"],
              ["Query language", "SQL, standardised", "Per-product APIs"],
              ["Suits", "Money, bookings, anything where a wrong number matters", "Logs, catalogues, feeds, very high write volume"],
            ],
          },
        },
        {
          note: "The honest framing is not \"which is better\" but **what you are willing to give up**. A relational database will not scale writes across fifty machines easily; a document store will not stop you charging a card twice. Pick the failure you can live with.",
        },
        {
          p: "NoSQL is itself four different things: key-value (Redis), document (MongoDB), column-family (Cassandra) and graph (Neo4j). Naming the family you mean is better than saying \"NoSQL\".",
        },
      ],
      tip: "Interviewers are testing whether you reach for a trade-off or a favourite. Answer with the workload, not the product.",
      tags: ["sql", "nosql", "acid", "scaling"],
    },
    {
      id: "dbms-found-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Changing the physical storage of a table without altering the logical schema is:",
      options: [
        "Logical data independence",
        "Physical data independence",
        "Normalisation",
        "Denormalisation",
      ],
      correct: 1,
      answer: [
        {
          p: "Physical data independence — the easier of the two, and the reason adding an index breaks nothing above it.",
        },
      ],
      tags: ["mcq", "data independence"],
    },
    {
      id: "dbms-found-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which data model could not represent a many-to-many relationship?",
      options: ["Relational", "Network", "Hierarchical", "Entity-Relationship"],
      correct: 2,
      answer: [
        {
          p: "Hierarchical — it is a tree, so every child has exactly one parent. The network model was invented largely to lift that restriction.",
        },
      ],
      tags: ["mcq", "data models"],
    },
  ],
};
