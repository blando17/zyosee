/*
 * OOP Foundations.
 *
 * Source: "OOPS Notes.pdf" p3, "OOPs Notes copy.pdf" p1,
 * "OOPS_Interview_Cheatsheet_2_1.pdf" Q1-Q7.
 *
 * The cheatsheet carries company tags on several questions ([Microsoft],
 * [Oracle], [American Express]). Those are kept as tags, because knowing a
 * question is actually asked is worth more than a topic label.
 */

export default {
  id: "foundations",
  name: "OOP Foundations",
  importance: "med",
  icon: "bulb",
  blurb:
    "What object-oriented programming is for, and why it replaced writing everything as a sequence of functions.",
  source: "OOPS Notes p3 · OOPs cheat-sheets p1 · Cheatsheet Q1-7",

  questions: [
    {
      id: "oops-found-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is object-oriented programming?",
      short:
        "A paradigm that models a program as objects — bundles of data and the methods that act on it.",
      answer: [
        {
          p: "OOP organises code around **objects**: real-world entities that carry both data (attributes) and behaviour (methods), created from templates called **classes**.",
        },
        {
          p: "The aim is to bind data and the functions that operate on it together, so that no other part of the program can reach that data except through those functions.",
        },
        { diagram: "four-pillars" },
      ],
      tip: "Lead with 'data and behaviour together'. 'It uses objects' is a definition that explains nothing.",
      tags: ["oop", "definition", "asked at Microsoft", "asked at Oracle"],
    },
    {
      id: "oops-found-02",
      subtopic: "Basics",
      type: "comparison",
      importance: "high",
      question: "Procedural programming vs object-oriented programming?",
      short:
        "Procedural is function-centric and top-down; OOP is object-centric and bottom-up, with data hiding built in.",
      answer: [
        {
          table: {
            head: ["", "Procedural", "Object-oriented"],
            rows: [
              ["Basic unit", "Function", "Object"],
              ["Approach", "Top-down", "Bottom-up"],
              ["Focus", "Procedures acting on data", "Objects holding data *and* the code for it"],
              ["Data security", "Low — global data is reachable by anything", "High — data hiding through access modifiers"],
              ["Reusability", "Low", "High, via inheritance"],
              ["Large codebases", "Hard to maintain", "Easier — the structure scales"],
              ["Real-world modelling", "Poor fit", "Close fit"],
              ["Languages", "C, Pascal, FORTRAN", "Java, C++, Python, C#"],
            ],
          },
        },
        {
          note: "The security row is the substantive one. In procedural code any function can reach global data, so a bug anywhere can corrupt state everywhere. OOP does not make that impossible, but it makes it **visible**: data reachable only through a class's own methods has a small, listable set of places that can break it.",
        },
      ],
      tags: ["procedural", "comparison"],
    },
    {
      id: "oops-found-03",
      subtopic: "Basics",
      type: "conceptual",
      importance: "high",
      question: "What are the four pillars of OOP?",
      short: "Encapsulation, Abstraction, Inheritance, Polymorphism.",
      answer: [
        {
          table: {
            head: ["Pillar", "What it does", "Real-life picture"],
            rows: [
              ["**Encapsulation**", "Bundles data with its methods and restricts direct access", "A capsule hides the bitter medicine inside a shell"],
              ["**Abstraction**", "Hides implementation, shows only the essential interface", "You drive a car without knowing how the engine works"],
              ["**Inheritance**", "A class acquires the properties and behaviour of another", "A child inherits traits from a parent"],
              ["**Polymorphism**", "One name behaving differently depending on context", "The same person is a student, a player and a child"],
            ],
          },
        },
        {
          note: "**Encapsulation and abstraction are not the same thing**, and confusing them is the commonest slip on this question. Encapsulation is about *bundling and restricting access* — an implementation technique. Abstraction is about *what you expose* — a design decision. Encapsulation is one of the ways you achieve abstraction.",
        },
      ],
      tip: "Expect 'difference between encapsulation and abstraction' immediately after. Have the how-versus-what distinction ready.",
      followUps: [
        {
          q: "Some lists say there are seven features, not four. Why?",
          a: "The four pillars are the classical set. Longer lists add class-and-object, dynamic binding and message passing — which are mechanisms OOP uses rather than principles it is built on. Name the four, then mention the others exist.",
        },
      ],
      tags: ["four pillars", "asked at American Express", "asked at Microsoft"],
    },
    {
      id: "oops-found-04",
      subtopic: "Basics",
      type: "why",
      importance: "med",
      question: "What are the advantages of OOP?",
      short:
        "Modularity, reuse through inheritance, data hiding, maintainability, real-world modelling and scalability.",
      answer: [
        {
          ul: [
            "**Modularity** — code is divided into classes, so a change has a boundary.",
            "**Reusability** — inheritance and composition reduce duplication.",
            "**Data hiding** — encapsulation exposes only what is necessary.",
            "**Maintainability** — you can extend a class without touching unrelated code.",
            "**Real-world modelling** — a `Student` class maps onto an actual student.",
            "**Scalability** — large systems stay manageable.",
          ],
        },
        {
          note: "There are costs too, and saying so is stronger than a list of virtues: inheritance couples classes tightly, deep hierarchies are hard to follow, and a virtual call costs an indirection. OOP is a trade, not a free win.",
        },
      ],
      tags: ["advantages", "asked at Oracle"],
    },
    {
      id: "oops-found-05",
      subtopic: "Basics",
      type: "scenario",
      importance: "low",
      question: "Can you write a C++ program without using OOP? What about Java?",
      short: "C++ yes — it supports C-style procedural code. Java no — everything lives inside a class.",
      answer: [
        {
          p: "**C++ — yes.** It was built as 'C with classes' and never removed the C part, so a C++ program can be entirely procedural.",
        },
        {
          p: "**Java — no, not really.** Every method must live inside a class, so even a one-line program has a class around it. You can write procedural code *style* inside a single class with static methods, but you cannot escape the class.",
        },
      ],
      tags: ["c++", "java", "scenario"],
    },
    {
      id: "oops-found-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which of these is NOT one of the four pillars of OOP?",
      options: ["Encapsulation", "Inheritance", "Compilation", "Polymorphism"],
      correct: 2,
      answer: [
        { p: "Compilation is a build step, not a design principle. The fourth pillar is abstraction." },
      ],
      tags: ["mcq", "four pillars"],
    },
    {
      id: "oops-found-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "OOP is described as which kind of approach?",
      options: ["Top-down", "Bottom-up", "Linear", "Recursive"],
      correct: 1,
      answer: [
        {
          p: "Bottom-up — you build objects and compose them into a system. Procedural programming is the top-down one, decomposing a task into smaller procedures.",
        },
      ],
      tags: ["mcq", "procedural"],
    },
  ],
};
