/*
 * ER Model.
 *
 * Source: "DBMS Notes.pdf" pp.11-14, "DBMS Notes copy.pdf" p3.
 *
 * ONE PRESENTATION ERROR IN THE NOTES.
 *
 * Page 13 draws the specialization example with STUDENT and INSTRUCTOR ABOVE
 * PERSON, which is the generalization picture upside down, and then repeats
 * the generalization paragraph underneath it. Specialization goes downward:
 * PERSON at the top, subclasses beneath. The diagram below is drawn the right
 * way up.
 */

export default {
  id: "er-model",
  name: "ER Model",
  importance: "med",
  icon: "pen",
  blurb:
    "The design stage — entities, relationships and cardinality, before any of it becomes a table.",
  source: "DBMS Notes pp.11-14 · DBMS cheat-sheets p3",

  questions: [
    {
      id: "dbms-er-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is the ER model, and what are its building blocks?",
      short:
        "A conceptual design model of entities, attributes and relationships — drawn before any tables exist.",
      answer: [
        {
          p: "The Entity-Relationship model is a **conceptual blueprint**. It is deliberately implementation-free: you design it without deciding on tables, types or indexes, then map it to a relational schema afterwards.",
        },
        {
          table: {
            head: ["Term", "Meaning", "Example"],
            rows: [
              ["Entity", "A distinguishable real-world thing", "A particular Student"],
              ["Entity set", "All entities of one kind", "Every enrolled Student"],
              ["Attribute", "A property describing an entity", "rollNo, name, age"],
              ["Relationship", "An association among entities", "Student ENROLLED_IN Course"],
              ["Relationship set", "All instances of that association", "Every enrolment this year"],
            ],
          },
        },
        { diagram: "er-notation" },
      ],
      tags: ["er model", "entity", "attribute"],
    },
    {
      id: "dbms-er-02",
      subtopic: "Attributes",
      type: "conceptual",
      importance: "med",
      question: "What kinds of attribute are there?",
      short:
        "Simple, composite, single-valued, multivalued, derived and key — each with its own ER notation.",
      answer: [
        {
          table: {
            head: ["Kind", "Meaning", "Notation", "Example"],
            rows: [
              ["Simple", "Cannot be divided further", "Plain ellipse", "rollNo"],
              ["Composite", "Splits into parts", "Ellipse with sub-ellipses", "name → first, last"],
              ["Single-valued", "One value per entity", "Plain ellipse", "dateOfBirth"],
              ["Multivalued", "Several values per entity", "**Double ellipse**", "phoneNumbers"],
              ["Derived", "Computed from something else", "**Dashed ellipse**", "age, from dateOfBirth"],
              ["Key", "Uniquely identifies the entity", "**Underlined**", "rollNo"],
            ],
          },
        },
        {
          note: "A **multivalued** attribute is the one that matters when you map to tables: it cannot survive 1NF, so it becomes a table of its own. `phoneNumbers` turns into `STUDENT_PHONE(rollNo, phone)`.",
        },
      ],
      tags: ["attributes", "multivalued", "derived"],
    },
    {
      id: "dbms-er-03",
      subtopic: "Relationships",
      type: "conceptual",
      importance: "high",
      question: "What are cardinality and participation?",
      short:
        "Cardinality is how many entities may take part (1:1, 1:N, M:N). Participation is whether they must (total or partial).",
      answer: [
        { diagram: "er-cardinality" },
        {
          table: {
            head: ["Cardinality", "Meaning", "Example"],
            rows: [
              ["1 : 1", "Each side links to at most one of the other", "Student ↔ Library card"],
              ["1 : N", "One on the left, many on the right", "Department → Students"],
              ["M : N", "Many on both sides", "Students ↔ Courses"],
            ],
          },
        },
        {
          table: {
            head: ["Participation", "Meaning", "Notation"],
            rows: [
              ["**Total**", "Every entity in the set must participate", "Double line"],
              ["**Partial**", "Some entities may not participate", "Single line"],
            ],
          },
        },
        {
          p: "Example of both at once: every Library card must belong to a student (**total** on the card side), but not every student has one (**partial** on the student side).",
        },
        {
          note: "Cardinality and participation answer different questions — *how many* versus *must they at all*. A 1:1 relationship can still be partial on both sides.",
        },
      ],
      tags: ["cardinality", "participation", "relationships"],
    },
    {
      id: "dbms-er-04",
      subtopic: "Weak entities",
      type: "definition",
      importance: "med",
      question: "What is a weak entity?",
      short:
        "An entity with no key of its own. It is identified by its owner's key plus a partial key.",
      answer: [
        {
          ul: [
            "Has **no primary key of its own**.",
            "Depends on a **strong owner entity** for identification.",
            "Has a **partial key** (discriminator) that is unique only within one owner.",
            "Drawn as a **double rectangle**, joined by a **double diamond** identifying relationship, with the partial key **dashed-underlined**.",
          ],
        },
        {
          p: "Example: `Occupancy` in a hostel. `bedNumber` is only 3 within room 204 — it is not unique on its own. The key is `(roomNo, bedNumber)`, borrowed from the owner.",
        },
        {
          note: "Weak entities imply **cascading delete**: destroy the room and its occupancy records have nothing left to identify them, so they must go too. That consequence is the usual follow-up.",
        },
      ],
      tags: ["weak entity", "partial key"],
    },
    {
      id: "dbms-er-05",
      subtopic: "Hierarchies",
      type: "comparison",
      importance: "med",
      question: "Generalization, specialization and aggregation — what is the difference?",
      short:
        "Generalization merges subclasses upward, specialization splits a superclass downward, aggregation treats a whole relationship as one entity.",
      answer: [
        { diagram: "generalization" },
        {
          table: {
            head: ["", "Direction", "Meaning"],
            rows: [
              ["**Generalization**", "Bottom-up", "Spot common attributes in STUDENT and INSTRUCTOR, lift them into PERSON"],
              ["**Specialization**", "Top-down", "Start from PERSON, push distinct attributes down into subclasses"],
              ["**Aggregation**", "Sideways", "Treat a relationship and its entities as one unit so another relationship can attach to it"],
            ],
          },
        },
        {
          p: "Generalization and specialization produce the **same diagram** — an ISA hierarchy. They differ only in which end you started from.",
        },
        {
          p: "**Aggregation** solves a different problem: a relationship cannot normally connect to another relationship. If `WORKS_ON(Student, Project, Guide)` needs a `SubmissionStatus`, you wrap the whole thing in a dashed box and treat it as a single entity.",
        },
        {
          note: "Your notes draw the specialization example with the subclasses above the superclass, which is the generalization picture reversed, and repeat the generalization text below it. Specialization goes **downward** from PERSON.",
          tone: "warn",
        },
      ],
      tags: ["generalization", "specialization", "aggregation", "isa"],
    },
    {
      id: "dbms-er-06",
      subtopic: "Mapping",
      type: "how",
      importance: "high",
      question: "How do you map an ER diagram to relational tables?",
      short:
        "Entity → table. 1:N → foreign key on the many side. M:N → its own table. Multivalued attribute → its own table.",
      answer: [
        {
          table: {
            head: ["ER construct", "Becomes"],
            rows: [
              ["Strong entity", "A table; its key attribute is the primary key"],
              ["Weak entity", "A table keyed on (owner key + partial key), with a foreign key to the owner"],
              ["**1:1** relationship", "A foreign key on either side — prefer the side with **total** participation"],
              ["**1:N** relationship", "A foreign key on the **many** side"],
              ["**M:N** relationship", "**Its own table**, keyed on both foreign keys"],
              ["Multivalued attribute", "Its own table, keyed on (entity key + the value)"],
              ["Composite attribute", "One column per leaf part; the composite itself disappears"],
              ["Derived attribute", "Usually **not stored** — computed on read"],
            ],
          },
        },
        {
          code: `-- M:N: Students <-> Courses, with a relationship attribute
CREATE TABLE ENROLMENT (
    roll_no     INT,
    course_code CHAR(5),
    grade       DECIMAL(3,1),         -- the relationship's own attribute
    PRIMARY KEY (roll_no, course_code),
    FOREIGN KEY (roll_no)     REFERENCES STUDENT(roll_no),
    FOREIGN KEY (course_code) REFERENCES COURSE(course_code)
);`,
          lang: "sql",
        },
        {
          note: "The M:N row is the one that gets asked. There is no way to put a foreign key on either side — a column holds one value — so the relationship must become a table. Any attribute **of the relationship**, like `grade`, lives there too.",
        },
      ],
      tip: "If asked to design a schema from a description, do the mapping out loud: entities first, then relationships, then decide where the foreign keys go.",
      tags: ["er to relational", "mapping", "m:n"],
    },
    {
      id: "dbms-er-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In an ER diagram, a dashed ellipse denotes:",
      options: ["A multivalued attribute", "A derived attribute", "A key attribute", "A weak entity"],
      correct: 1,
      answer: [
        {
          p: "A derived attribute, such as age computed from date of birth. A double ellipse is multivalued; an underline is a key.",
        },
      ],
      tags: ["mcq", "er notation"],
    },
    {
      id: "dbms-er-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "An M:N relationship maps to:",
      options: [
        "A foreign key on the left table",
        "A foreign key on the right table",
        "A separate table with both keys",
        "Nothing — it is ignored",
      ],
      correct: 2,
      answer: [
        {
          p: "Its own table, with a composite primary key of both foreign keys. A single column cannot hold many values, so neither side can carry the relationship.",
        },
      ],
      tags: ["mcq", "mapping"],
    },
  ],
};
