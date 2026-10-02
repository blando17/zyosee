/*
 * Polymorphism.
 *
 * Source: "OOPS Notes.pdf" pp.22, 25, "OOPs Notes copy.pdf" p9,
 * "OOPS_Interview_Cheatsheet_2_1.pdf" Q11-13, Q31.
 *
 * ONE CLAIM IN THE C++/JAVA COMPARISON DOCUMENT IS SELF-CONTRADICTORY.
 *
 * It lists Java's compile-time polymorphism as "method overloading and
 * operator overloading", then correctly states two sections later that Java
 * has no operator overloading. Java's compile-time polymorphism is method
 * overloading only.
 */

export default {
  id: "polymorphism",
  name: "Polymorphism",
  importance: "high",
  icon: "palette",
  blurb:
    "One name, many behaviours — and the difference between the compiler deciding and the object deciding.",
  source: "OOPS Notes pp.22, 25 · OOPs cheat-sheets p9 · Cheatsheet Q11-13, 31",

  questions: [
    {
      id: "oops-poly-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is polymorphism?",
      short:
        "'Many forms' — the same name behaving differently depending on the context or the actual object.",
      answer: [
        {
          p: "From *poly* (many) and *morph* (form). In OOP it means a single interface — a method name, an operator, a base-class pointer — producing different behaviour depending on what it is applied to.",
        },
        {
          p: "The everyday picture: the same person is a student at college, a player on the field and a child at home. One individual, different behaviour per context.",
        },
        {
          table: {
            head: ["Type", "Also called", "Achieved by", "Resolved"],
            rows: [
              ["Compile-time", "Static binding, early binding", "Function overloading, operator overloading *(C++)*", "By the compiler"],
              ["Runtime", "Dynamic binding, late binding", "Method overriding with virtual functions", "By the object, at runtime"],
            ],
          },
        },
      ],
      tip: "Give both types in the first answer. 'What are the two types' is otherwise the immediate next question.",
      tags: ["polymorphism", "asked at Microsoft", "asked at Intuit"],
    },
    {
      id: "oops-poly-02",
      subtopic: "Binding",
      type: "comparison",
      importance: "high",
      question: "Static binding vs dynamic binding?",
      short:
        "Static: the compiler picks the function from the reference type. Dynamic: the runtime picks it from the object's actual type.",
      answer: [
        {
          table: {
            head: ["", "Static (early) binding", "Dynamic (late) binding"],
            rows: [
              ["Decided", "At compile time", "At runtime"],
              ["Based on", "The **reference or pointer type**", "The **actual object type**"],
              ["Mechanism", "Direct call", "V-table lookup through the vptr"],
              ["Applies to", "Overloading, non-virtual functions, static and private methods", "Virtual functions / overridden methods"],
              ["Speed", "Faster — a direct jump", "Slightly slower — one indirection"],
            ],
          },
        },
        {
          code: `class Animal {
public:
    void eat()          { cout << "Animal eats"; }   // NOT virtual
    virtual void speak(){ cout << "Animal speaks"; } // virtual
};

class Dog : public Animal {
public:
    void eat()   { cout << "Dog eats"; }
    void speak() override { cout << "Dog barks"; }
};

Animal* a = new Dog();
a->eat();     // "Animal eats"  <- static: chosen by the POINTER type
a->speak();   // "Dog barks"    <- dynamic: chosen by the OBJECT`,
          lang: "cpp",
        },
        {
          note: "Those two lines are the whole topic. Same pointer, same object, two different rules — and the only difference is the `virtual` keyword on one of them.",
        },
        {
          p: "In **Java every method is virtual by default** (except `static`, `private` and `final`), so this asymmetry does not arise. `final` is how you opt out.",
        },
      ],
      tip: "If you are asked to predict output from a base pointer, check for `virtual` first. Everything follows from it.",
      tags: ["static binding", "dynamic binding", "virtual", "output"],
    },
    {
      id: "oops-poly-03",
      subtopic: "Types",
      type: "comparison",
      importance: "high",
      question: "How is polymorphism achieved in C++ and in Java?",
      short:
        "C++: overloading, operator overloading and templates at compile time; virtual functions at runtime. Java: overloading at compile time, overriding at runtime.",
      answer: [
        {
          table: {
            head: ["", "C++", "Java"],
            rows: [
              ["Compile-time", "Function overloading, **operator overloading**, templates, default arguments", "Method overloading only"],
              ["Runtime", "Virtual functions with method overriding", "Method overriding — **every method is virtual by default**"],
              ["Opt in to dynamic dispatch", "`virtual` keyword required", "Automatic"],
              ["Opt out", "Omit `virtual`", "`final`, `static` or `private`"],
            ],
          },
        },
        {
          note: "Your C++/Java comparison document lists operator overloading under Java's compile-time polymorphism and then says, correctly, that Java has no operator overloading. **Java has none** — the single exception is `+` on `String`, which is built into the language rather than something you can define.",
          tone: "warn",
        },
      ],
      tags: ["polymorphism", "c++", "java", "comparison"],
    },
    {
      id: "oops-poly-04",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "A base-class pointer holds a derived object, but calling a method still runs the base version. Why?",
      short: "The method is not virtual, so the call was bound statically to the pointer's type.",
      answer: [
        {
          p: "Without `virtual`, C++ resolves the call at **compile time** using the declared type of the pointer. The compiler sees `Animal*`, so it emits a direct call to `Animal::speak` — the actual object is never consulted.",
        },
        { p: "Three things to check, in order:" },
        {
          ol: [
            "Is the base method declared `virtual`? This is the cause nine times out of ten.",
            "Do the signatures match **exactly**? A different parameter list or a missing `const` makes it an overload that hides the base method rather than an override. Adding `override` turns that into a compile error instead of a silent bug.",
            "Are you using a pointer or reference, or a **value**? Assigning a derived object to a base *value* slices it — the derived part is gone, so there is nothing left to dispatch to.",
          ],
        },
        {
          note: "In Java the same symptom has a different cause, because methods are virtual by default. There it is almost always **method hiding**: a `static` method redeclared in the subclass, which is bound by reference type just like a non-virtual C++ function.",
        },
      ],
      tip: "Always mention `override`. It converts this exact bug from something you debug into something that does not compile.",
      tags: ["scenario", "virtual", "slicing", "override"],
    },
    {
      id: "oops-poly-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Function overloading is an example of:",
      options: ["Runtime polymorphism", "Compile-time polymorphism", "Inheritance", "Encapsulation"],
      correct: 1,
      answer: [
        { p: "Compile-time — the compiler picks the overload from the argument types before the program runs." },
      ],
      tags: ["mcq", "overloading"],
    },
    {
      id: "oops-poly-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In Java, methods are by default:",
      options: ["Non-virtual", "Virtual", "Static", "Final"],
      correct: 1,
      answer: [
        {
          p: "Virtual — dynamic dispatch is the default and you opt out with `final`. C++ is the other way round: you opt in with `virtual`.",
        },
      ],
      tags: ["mcq", "java", "virtual"],
    },
  ],
};
