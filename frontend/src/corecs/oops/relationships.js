/*
 * Class Relationships.
 *
 * Source: "OOPs Notes copy.pdf" p17, "OOPS_Interview_Cheatsheet_2_1.pdf" Q45,
 * "OOPS Important Interview Questions.pdf" Q12, Q24,
 * "Oops in c++_ Java important questions.pdf" Q13, Q30.
 *
 * The 35-page notes do not cover association, aggregation and composition at
 * all. The cheat-sheet page does, with the UML notation, and is the source for
 * most of this topic.
 */

export default {
  id: "relationships",
  name: "Class Relationships",
  importance: "med",
  icon: "pair",
  blurb:
    "IS-A against HAS-A — and the three strengths of HAS-A that interviewers expect you to tell apart.",
  source: "OOPs cheat-sheets p17 · Cheatsheet Q45 · Important Questions Q12, 24",

  questions: [
    {
      id: "oops-rel-01",
      subtopic: "Overview",
      type: "comparison",
      importance: "high",
      question: "Compare association, aggregation, composition and inheritance.",
      short:
        "Association: uses. Aggregation: HAS-A, part survives alone. Composition: HAS-A, part dies with the whole. Inheritance: IS-A.",
      answer: [
        { diagram: "relationships" },
        {
          table: {
            head: ["", "Association", "Aggregation", "Composition", "Inheritance"],
            rows: [
              ["Relationship", "Uses / knows", "HAS-A (weak)", "HAS-A (strong)", "IS-A"],
              ["Ownership", "None", "Weak — part can exist alone", "Strong — part cannot exist alone", "Not applicable"],
              ["Lifetime", "Independent", "Independent", "**Part dies with the whole**", "—"],
              ["UML", "Plain line", "Hollow diamond ◇", "Filled diamond ◆", "Hollow arrow △"],
              ["Example", "Student — Teacher", "College — Department", "House — Room", "Dog — Animal"],
            ],
          },
        },
        {
          note: "**Aggregation versus composition is decided by one question: if the whole is destroyed, does the part survive?** A department outlives the college closing — it can be moved. A room does not outlive the house being demolished. That test resolves almost every example.",
        },
      ],
      tip: "The UML symbols are worth memorising — hollow diamond for weak, filled for strong. They come up in design rounds more than in theory rounds.",
      tags: ["association", "aggregation", "composition", "uml"],
    },
    {
      id: "oops-rel-02",
      subtopic: "Composition",
      type: "definition",
      importance: "high",
      question: "What is composition?",
      short:
        "A strong HAS-A relationship where the contained object cannot exist without its owner.",
      answer: [
        {
          codePair: {
            left: {
              label: "Composition — strong",
              code: `class Engine {
    string type;
};

class Car {
    string model;
    Engine engine;      // owned by value
};
// The engine is created with the car
// and destroyed with it. It has no
// life of its own.`,
            },
            right: {
              label: "Aggregation — weak",
              code: `class Department {
    string deptName;
};

class College {
    string collegeName;
    Department* dept;   // points at one
};
// The department exists independently
// and can be shared or reassigned.`,
            },
          },
        },
        {
          note: "In C++ the distinction often shows up in the code itself: **composition tends to hold a member by value**, so its lifetime is the owner's by construction, while **aggregation holds a pointer or reference** to something created elsewhere. Java has only references, so there the difference is a matter of documented intent rather than syntax.",
        },
      ],
      tags: ["composition", "aggregation", "has-a"],
    },
    {
      id: "oops-rel-03",
      subtopic: "Design",
      type: "comparison",
      importance: "high",
      question: "Composition vs inheritance — which should you prefer, and why?",
      short:
        "Prefer composition. Inheritance is a compile-time, all-or-nothing commitment; composition can be changed at runtime and exposes only what you choose.",
      answer: [
        {
          table: {
            head: ["", "Inheritance (IS-A)", "Composition (HAS-A)"],
            rows: [
              ["Coupling", "Tight — you depend on the base's implementation", "Loose — you depend only on the part's interface"],
              ["Fixed when", "**Compile time**", "**Runtime** — the part can be swapped"],
              ["Inherits", "Everything, wanted or not", "Only what you choose to expose"],
              ["Relationship", "A Dog IS-A Animal", "A Car HAS-A Engine"],
              ["Breaks when", "The base class changes", "Rarely — the interface is the contract"],
            ],
          },
        },
        {
          note: "The standard cautionary example: making `Stack` extend `Vector` to reuse its storage. The stack then also exposes `insertAt()`, so anyone can insert into the middle and break the stack's own invariant. It was HAS-A all along, and inheritance turned that into a lie you cannot take back.",
        },
        {
          p: "**Use inheritance when the IS-A really holds** and you want polymorphic substitution. Use composition for everything else — which in practice is most things.",
        },
      ],
      tip: "'Prefer composition over inheritance' is a well-known principle; being able to give the Stack/Vector example is what shows you know why.",
      tags: ["composition", "inheritance", "design", "coupling"],
    },
    {
      id: "oops-rel-04",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "Model a library: a Library has Books, a Member borrows Books, a Member is a Person. Which relationship is which?",
      short:
        "Library–Book is aggregation, Member–Book is association, Member–Person is inheritance.",
      answer: [
        {
          table: {
            head: ["Pair", "Relationship", "Why"],
            rows: [
              ["Library — Book", "**Aggregation**", "The library holds books, but a book survives the library closing"],
              ["Member — Book", "**Association**", "A member borrows a book; neither owns the other"],
              ["Member — Person", "**Inheritance**", "A member IS-A person"],
              ["Book — Page", "**Composition**", "Destroy the book and its pages go with it"],
            ],
          },
        },
        {
          p: "Applying the destruction test each time is the whole method: close the library and the books still exist (aggregation); shred the book and its pages do not (composition).",
        },
        {
          note: "Design rounds ask exactly this — given a domain, name the relationships. Say which test you are applying rather than just giving the answer; the reasoning is what is being marked.",
        },
      ],
      tags: ["scenario", "design", "uml"],
    },
    {
      id: "oops-rel-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A House and its Rooms are an example of:",
      options: ["Association", "Aggregation", "Composition", "Inheritance"],
      correct: 2,
      answer: [
        { p: "Composition — the rooms do not exist once the house is demolished. Strong ownership, filled diamond in UML." },
      ],
      tags: ["mcq", "composition"],
    },
    {
      id: "oops-rel-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In UML, a hollow diamond denotes:",
      options: ["Inheritance", "Aggregation", "Composition", "Association"],
      correct: 1,
      answer: [
        { p: "Aggregation — weak HAS-A. A filled diamond is composition; a hollow arrow is inheritance." },
      ],
      tags: ["mcq", "uml"],
    },
  ],
};
