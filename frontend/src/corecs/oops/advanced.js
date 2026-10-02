import { UNANSWERED } from "../schema.js";

/*
 * Advanced Concepts, and C++ against Java.
 *
 * Source: "OOPs Notes copy.pdf" pp.18-20, "OOPS Notes.pdf" pp.12-13,
 * "OOPS_Interview_Cheatsheet_2_1.pdf" Q36-37, Q43, Q49-55,
 * "Oops in c++_ Java important questions.pdf" — the whole comparison section.
 *
 * SEVERAL QUESTIONS HERE HAVE NO ANSWER IN THE NOTES.
 *
 * The misfiled C++/Java document lists 36 C++ questions and 3 Java questions
 * as a bare list, with answers only for the ten-point comparison section. The
 * ones nothing in any document answers ship marked UNANSWERED, as in the OS
 * subject, rather than being dropped or invented.
 */

export default {
  id: "advanced",
  name: "Advanced Concepts",
  importance: "med",
  icon: "sparkle",
  blurb:
    "this and super, slicing, casting, the keywords that keep coming up, and how C++ and Java differ.",
  source: "OOPs cheat-sheets pp.18-20 · OOPS Notes pp.12-13 · Cheatsheet Q49-55",

  questions: [
    {
      id: "oops-adv-01",
      subtopic: "Keywords",
      type: "definition",
      importance: "high",
      question: "What is the `this` pointer used for?",
      short:
        "It refers to the current object — mainly to disambiguate a member from a parameter of the same name.",
      answer: [
        {
          codePair: {
            left: {
              label: "C++ — a pointer",
              code: `class Student {
    int id;
public:
    void setId(int id) {
        this->id = id;   // member = parameter
    }
    Student& self() {
        return *this;    // dereference it
    }
};`,
            },
            right: {
              label: "Java — a reference",
              code: `class Student {
    int id;

    void setId(int id) {
        this.id = id;    // member = parameter
    }

    Student self() {
        return this;     // already a reference
    }
}`,
            },
          },
        },
        {
          ul: [
            "Available only in **non-static** member functions — a static one has no object.",
            "C++ uses `this->`; Java uses `this.` because it is a reference, not a pointer.",
            "Also used to return `*this` for method chaining, and to pass the current object to another function.",
          ],
        },
        {
          note: "`this` is only strictly **necessary** when a parameter shadows a member. Had the parameter been named `n`, plain `id = n;` would do. Using it everywhere is a style choice, not a requirement.",
        },
      ],
      tags: ["this", "c++", "java"],
    },
    {
      id: "oops-adv-02",
      subtopic: "Keywords",
      type: "conceptual",
      importance: "med",
      question: "What do `super` (Java) and the scope resolution operator (C++) do?",
      short:
        "Both reach the parent class explicitly — `super.method()` in Java, `Base::method()` in C++.",
      answer: [
        {
          codePair: {
            left: {
              label: "C++ — `::`",
              code: `class Animal {
public:
    void eat() { cout << "Eating"; }
};

class Dog : public Animal {
public:
    void show() {
        Animal::eat();   // the base version
    }
};

int x = 10;              // global
int main() {
    int x = 20;
    cout << ::x;         // 10 — the global
}`,
            },
            right: {
              label: "Java — `super`",
              code: `class Animal {
    void eat() { System.out.println("Eating"); }
}

class Dog extends Animal {
    void show() {
        super.eat();     // the base version
    }

    Dog() {
        super();         // base constructor,
                         // must be first
    }
}`,
            },
          },
        },
        {
          p: "C++'s `::` does more than reach a parent: it also gets at a global shadowed by a local (`::x`), defines a member function outside its class (`void Student::show()`), and names something in a namespace (`A::value`).",
        },
      ],
      tags: ["super", "scope resolution", "c++", "java"],
    },
    {
      id: "oops-adv-03",
      subtopic: "Slicing",
      type: "conceptual",
      importance: "high",
      question: "What is object slicing?",
      short:
        "Assigning a derived object to a base object by value copies only the base part — the derived part is lost.",
      answer: [
        { diagram: "object-slicing" },
        {
          code: `class Base {
public:
    int x;
    virtual void show() { cout << "Base"; }
};

class Derived : public Base {
public:
    int y;
    void show() override { cout << "Derived"; }
};

Derived d;
d.x = 10;
d.y = 20;

Base b = d;    // SLICED: only x is copied, y is gone
b.show();      // "Base" — there is no derived part left to dispatch to

Base* p = &d;  // no slicing — the object is untouched
p->show();     // "Derived"`,
          lang: "cpp",
        },
        {
          note: "Slicing is **silent**. It compiles cleanly, runs, and quietly gives you the wrong behaviour — which is why it is a favourite output-prediction question. The fix is always the same: use a pointer or a reference when you want polymorphism.",
        },
        {
          p: "It cannot happen in Java, because a variable of class type is always a reference. Assigning a `Dog` to an `Animal` variable copies the reference, never the object.",
        },
      ],
      tip: "Watch for `Base b = d;` in any output question. If you see an assignment by value across an inheritance boundary, slicing is the answer.",
      tags: ["object slicing", "c++", "polymorphism"],
    },
    {
      id: "oops-adv-04",
      subtopic: "Casting",
      type: "comparison",
      importance: "med",
      question: "Upcasting vs downcasting, and which cast should you use?",
      short:
        "Upcasting (derived → base) is implicit and always safe. Downcasting is explicit and risky — use `dynamic_cast` and check the result.",
      answer: [
        { diagram: "upcast-downcast" },
        {
          table: {
            head: ["", "Upcasting", "Downcasting"],
            rows: [
              ["Direction", "Derived → Base", "Base → Derived"],
              ["Conversion", "Implicit — automatic", "Explicit — you must ask"],
              ["Safe?", "**Always**", "**Only if the object really is a Derived**"],
              ["Used for", "Polymorphism", "Reaching members only the derived class has"],
            ],
          },
        },
        {
          code: `Base* bPtr = &d;                  // upcast — implicit, safe

// Downcast, checked:
Derived* dPtr = dynamic_cast<Derived*>(bPtr);
if (dPtr != nullptr) {
    dPtr->show();                 // definitely a Derived
} else {
    cout << "Not a Derived";
}

// Downcast, unchecked — fast and dangerous:
Derived* d2 = static_cast<Derived*>(bPtr);   // no runtime check at all`,
          lang: "cpp",
        },
        {
          note: "`dynamic_cast` checks the actual type at runtime and returns `nullptr` when the cast is wrong; `static_cast` does no check and gives you undefined behaviour if you were wrong. `dynamic_cast` **requires the class to have at least one virtual function**, because it reads the type information through the vptr.",
        },
        {
          p: "Java's equivalent of the checked downcast is `instanceof` before the cast; a bad cast throws `ClassCastException` rather than returning null.",
        },
      ],
      tags: ["upcasting", "downcasting", "dynamic_cast", "static_cast"],
    },
    {
      id: "oops-adv-05",
      subtopic: "Keywords",
      type: "comparison",
      importance: "med",
      question: "What do `const`, `static` and `final` do?",
      short:
        "`const` freezes a value or promises a method will not mutate. `static` means per-class, not per-object. `final` prevents overriding, extending or reassignment.",
      answer: [
        {
          table: {
            head: ["Keyword", "Applied to", "Means"],
            rows: [
              ["`const` *(C++)*", "Variable", "The value cannot change"],
              ["", "Member function", "**The function will not modify the object** — `void show() const`"],
              ["", "Parameter", "The function will not modify the argument"],
              ["`static`", "Data member", "One copy shared by every object"],
              ["", "Member function", "Callable without an object; only sees static members"],
              ["`final` *(Java)*", "Variable", "Cannot be reassigned after initialisation"],
              ["", "Method", "Cannot be overridden"],
              ["", "Class", "Cannot be extended"],
            ],
          },
        },
        {
          note: "The `const` **member function** is the one that matters in interviews. `void show() const;` is a compiler-enforced promise not to mutate the object — and it is what lets you call `show()` on a `const` object at all. Forgetting it is why a perfectly innocent getter fails to compile on a const reference.",
        },
        {
          p: "C++'s nearest equivalents to `final`: `const` for variables, and the `final` specifier (C++11) on a class or virtual function.",
        },
      ],
      tags: ["const", "static", "final", "keywords"],
    },
    {
      id: "oops-adv-06",
      subtopic: "C++ vs Java",
      type: "comparison",
      importance: "high",
      question: "What are the main OOP differences between C++ and Java?",
      short:
        "Memory management, multiple inheritance, operator overloading, default virtual dispatch and pointers.",
      answer: [
        {
          table: {
            head: ["", "C++", "Java"],
            rows: [
              ["Memory", "Manual — `new` / `delete`", "Automatic — garbage collector"],
              ["Pointers", "Yes, with arithmetic", "References only, no arithmetic"],
              ["Multiple inheritance", "Yes, with classes", "Interfaces only"],
              ["Operator overloading", "Yes", "**No** — except built-in `+` on String"],
              ["Virtual by default", "**No** — opt in with `virtual`", "**Yes** — opt out with `final`"],
              ["Destructors", "Yes, deterministic", "No — GC, plus `try-with-resources`"],
              ["Default member access", "`private` in a class", "Package-private"],
              ["`friend`", "Yes", "No"],
              ["Strings", "Mutable `std::string`", "**Immutable** `String`; `StringBuilder` for mutation"],
              ["Exceptions", "All unchecked", "Checked and unchecked"],
              ["Runs without OOP?", "Yes — C-style code compiles", "No — everything is in a class"],
            ],
          },
        },
        {
          note: "The row that explains most of the others is **manual versus automatic memory**. Deterministic destruction is what gives C++ destructors and RAII; the garbage collector is what removes the need for them in Java and why Java has `try-with-resources` instead.",
        },
      ],
      tip: "If asked to pick one difference, say memory management and derive the rest from it. It reads as understanding rather than a memorised list.",
      tags: ["c++", "java", "comparison"],
    },
    {
      id: "oops-adv-07",
      subtopic: "Exceptions",
      type: "conceptual",
      importance: "med",
      question: "What is exception handling, and how do C++ and Java differ?",
      short:
        "try/catch to handle runtime errors without halting. Java has checked exceptions the compiler enforces; C++ has none.",
      answer: [
        {
          p: "An **exception** is an event during execution that interrupts normal flow — invalid input, a missing file, division by zero. Handling it means catching the condition and continuing deliberately instead of stopping.",
        },
        {
          table: {
            head: ["", "C++", "Java"],
            rows: [
              ["Blocks", "`try` / `catch`", "`try` / `catch` / `finally`"],
              ["Checked exceptions", "**None**", "**Yes** — must be caught or declared with `throws`"],
              ["Must declare what you throw", "No", "Yes, for checked exceptions"],
              ["What can be thrown", "Any type", "Anything deriving from `Throwable`"],
              ["Cleanup", "Destructors, via RAII", "`finally`, or `try-with-resources`"],
            ],
          },
        },
        {
          note: "C++ has no `finally` block and does not need one: **RAII** means a destructor runs as the stack unwinds, so resources are released without anywhere to write cleanup code. That is the same mechanism as ordinary scope exit — exceptions are not a special case.",
        },
      ],
      tags: ["exception handling", "try catch", "raii"],
    },
    {
      id: "oops-adv-08",
      subtopic: "Design principles",
      type: "conceptual",
      importance: "med",
      question: "What are the SOLID principles?",
      short:
        "Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion.",
      answer: [
        {
          table: {
            head: ["", "Principle", "In one line"],
            rows: [
              ["**S**", "Single Responsibility", "A class should have one reason to change"],
              ["**O**", "Open–Closed", "Open for extension, closed for modification"],
              ["**L**", "Liskov Substitution", "A subclass must be usable anywhere its base is"],
              ["**I**", "Interface Segregation", "Many small interfaces beat one large one"],
              ["**D**", "Dependency Inversion", "Depend on abstractions, not concrete classes"],
            ],
          },
        },
        {
          note: "**Liskov is the one worth being able to explain**, because it is the principle that says when inheritance is wrong. The standard violation: `Square extends Rectangle`. Setting the width of a rectangle should not change its height — but for a square it must, so a `Square` cannot be substituted for a `Rectangle` without breaking code that relied on that. The IS-A reads fine in English and fails as a type.",
        },
        {
          p: "Your source lists the acronym without expanding it. The expansions above are the standard ones.",
        },
      ],
      tags: ["solid", "design principles", "liskov"],
    },

    /* ------------------- questions the notes never answer ------------------- */
    {
      id: "oops-adv-u1",
      subtopic: "Unanswered",
      type: "conceptual",
      importance: "med",
      question: "What is a Singleton class, and how would you implement one?",
      answer: UNANSWERED,
      short: "Listed in your C++ question sheet with no answer given.",
      tags: ["singleton", "design pattern", "unanswered"],
    },
    {
      id: "oops-adv-u2",
      subtopic: "Unanswered",
      type: "conceptual",
      importance: "med",
      question: "What are the advantages of using templates in C++?",
      answer: UNANSWERED,
      short: "Listed in your C++ question sheet with no answer given.",
      tags: ["templates", "c++", "unanswered"],
    },
    {
      id: "oops-adv-u3",
      subtopic: "Unanswered",
      type: "conceptual",
      importance: "low",
      question: "What is the purpose of a namespace in C++?",
      answer: UNANSWERED,
      short: "Listed in your C++ question sheet with no answer given.",
      tags: ["namespace", "c++", "unanswered"],
    },
    {
      id: "oops-adv-u4",
      subtopic: "Unanswered",
      type: "comparison",
      importance: "med",
      question: "What are the differences between JDK, JRE and JVM?",
      answer: UNANSWERED,
      short: "Listed in your Java question sheet with no answer given.",
      tags: ["java", "jvm", "unanswered"],
    },
    {
      id: "oops-adv-u5",
      subtopic: "Unanswered",
      type: "comparison",
      importance: "med",
      question: "What is the difference between String, StringBuilder and StringBuffer in Java?",
      answer: UNANSWERED,
      short: "Listed in your Java question sheet with no answer given.",
      tags: ["java", "string", "unanswered"],
    },
    {
      id: "oops-adv-u6",
      subtopic: "Unanswered",
      type: "comparison",
      importance: "med",
      question: "What is the difference between `final`, `finally` and `finalize()` in Java?",
      answer: UNANSWERED,
      short: "Listed in your Java question sheet with no answer given.",
      tags: ["java", "final", "unanswered"],
    },

    {
      id: "oops-adv-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "`Base b = derivedObject;` in C++ causes:",
      options: ["A compile error", "Object slicing", "Correct polymorphic behaviour", "A memory leak"],
      correct: 1,
      answer: [
        {
          p: "Object slicing — only the base part is copied, and it happens silently. Use a pointer or reference to keep the derived part.",
        },
      ],
      tags: ["mcq", "slicing"],
    },
    {
      id: "oops-adv-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "`dynamic_cast` on a failed pointer cast returns:",
      options: ["A garbage pointer", "`nullptr`", "The base pointer unchanged", "It throws an exception"],
      correct: 1,
      answer: [
        {
          p: "`nullptr` for a pointer cast, which is why you check the result. For a *reference* cast it throws `std::bad_cast` instead.",
        },
      ],
      tags: ["mcq", "dynamic_cast"],
    },
    {
      id: "oops-adv-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "`void show() const;` in C++ promises that the function:",
      options: [
        "Returns a constant",
        "Cannot be overridden",
        "Will not modify the object it is called on",
        "Is static",
      ],
      correct: 2,
      answer: [
        {
          p: "It will not modify the object — enforced by the compiler, and required if you want to call it on a `const` object.",
        },
      ],
      tags: ["mcq", "const"],
    },
  ],
};
