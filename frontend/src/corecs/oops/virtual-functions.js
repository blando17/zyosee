/*
 * Overriding and Virtual Functions.
 *
 * Source: "OOPS Notes.pdf" pp.24-25, "OOPs Notes copy.pdf" pp.11-12,
 * "OOPS_Interview_Cheatsheet_2_1.pdf" Q41-42, Q50.
 *
 * LIST.pdf stars both "virtual Keyword" and "Virtual Functions". The v-table
 * and vptr material comes from the cheat-sheets, which cover it far better
 * than the 35-page notes do.
 *
 * One line on the cheat-sheet's own diagram reads "At runtime, JVM (actually
 * C++ Runtime) uses VPTR" — it corrects itself in the parenthesis. Nothing to
 * fix, but worth knowing if you compare the two.
 */

export default {
  id: "virtual-functions",
  name: "Overriding & Virtual Functions",
  importance: "high",
  icon: "target",
  blurb:
    "The mechanism behind runtime polymorphism — what `virtual` actually does, and the table it builds.",
  source: "OOPS Notes pp.24-25 · OOPs cheat-sheets pp.11-12 · Cheatsheet Q41-42, 50",

  questions: [
    {
      id: "oops-virt-01",
      subtopic: "Overriding",
      type: "definition",
      importance: "high",
      question: "What is method overriding, and what are the rules?",
      short:
        "A derived class redefining a base class method with the same name, parameters and return type.",
      answer: [
        {
          ul: [
            "The method **name** must be the same.",
            "The **parameter list** must match exactly.",
            "The **return type** must match, or be covariant (a derived type, in Java and C++).",
            "The override cannot be **more restrictive** in access than the base version.",
            "In C++ the base method must be `virtual` for the override to be dispatched dynamically.",
          ],
        },
        {
          codePair: {
            left: {
              label: "C++",
              code: `class Animal {
public:
    virtual void speak() {
        cout << "Animal speaks";
    }
    virtual ~Animal() {}
};

class Dog : public Animal {
public:
    void speak() override {
        cout << "Dog barks";
    }
};

Animal* a = new Dog();
a->speak();    // "Dog barks"
delete a;`,
            },
            right: {
              label: "Java",
              code: `class Animal {
    public void speak() {
        System.out.println("Animal speaks");
    }
}

class Dog extends Animal {
    @Override
    public void speak() {
        System.out.println("Dog barks");
    }
}

Animal a = new Dog();
a.speak();     // "Dog barks"`,
            },
          },
        },
        {
          note: "**Always write `override` (C++) or `@Override` (Java).** Neither is required, and both turn the commonest bug in this area — a signature that does not quite match, so you have silently written a *new* method instead of overriding one — from a runtime mystery into a compile error.",
        },
      ],
      tip: "If you write `override` in a code answer unprompted, that reads as experience. It costs one word.",
      tags: ["overriding", "virtual", "override"],
    },
    {
      id: "oops-virt-02",
      subtopic: "Virtual functions",
      type: "definition",
      importance: "high",
      question: "What is a virtual function, and why is it needed?",
      short:
        "A base-class member function marked `virtual`, so the call is resolved from the actual object at runtime rather than the pointer type at compile time.",
      answer: [
        {
          p: "Without `virtual`, C++ binds a call using the **declared type** of the pointer or reference. With it, the decision is deferred to runtime and made from the object actually there.",
        },
        {
          code: `class Animal {
public:
    virtual void speak() { cout << "Animal speaks"; }
};

class Dog : public Animal {
public:
    void speak() override { cout << "Dog barks"; }
};

int main() {
    Animal* a = new Dog();   // base pointer, derived object
    a->speak();              // "Dog barks"
    delete a;
}
// Remove 'virtual' and the same code prints "Animal speaks".`,
          lang: "cpp",
        },
        {
          p: "That last comment is the entire value of the keyword. One word changes which function runs, with no other edit to the program.",
        },
        {
          note: "In **Java this is automatic** — every method is virtual unless marked `static`, `private` or `final`. C++ makes you opt in because a non-virtual call is a direct jump and a virtual one costs an indirection, and C++ does not charge you for what you did not ask for.",
        },
      ],
      tags: ["virtual function", "asked at Microsoft", "asked at Adobe", "asked at Goldman Sachs"],
    },
    {
      id: "oops-virt-03",
      subtopic: "V-table",
      type: "how",
      importance: "high",
      question: "How do virtual functions work internally?",
      short:
        "Each class with virtual functions gets a v-table of function pointers; each object gets a hidden vptr pointing at its class's table.",
      answer: [
        { diagram: "vtable" },
        {
          ol: [
            "The compiler builds one **v-table** per class that has virtual functions — an array of pointers to the correct version of each.",
            "Every object of such a class carries a hidden **vptr**, set by the constructor to point at its own class's v-table.",
            "A call through a base pointer compiles to: follow the vptr, index into the table, call what you find.",
            "Because a `Derived` object's vptr points at `Derived`'s table, the derived override is what gets called — whatever the pointer's declared type says.",
          ],
        },
        {
          table: {
            head: ["Index", "V-table of Base", "V-table of Derived"],
            rows: [
              ["0", "`&Base::show`", "**`&Derived::show`** — overridden"],
              ["1", "`&Base::display`", "`&Base::display` — inherited unchanged"],
              ["2", "`&Base::~Base`", "**`&Derived::~Derived`**"],
            ],
          },
        },
        {
          note: "Two consequences worth naming. **Objects get bigger** — `sizeof` grows by one pointer. And **the constructor sets the vptr**, which is why calling a virtual function from inside a base constructor runs the *base* version: the derived vptr has not been installed yet.",
        },
      ],
      tip: "'Vptr and v-table' is the phrase being listened for. Add the constructor consequence and you have answered the hard follow-up too.",
      tags: ["vtable", "vptr", "dynamic dispatch"],
    },
    {
      id: "oops-virt-04",
      subtopic: "Pure virtual",
      type: "comparison",
      importance: "high",
      question: "What is a pure virtual function, and what makes a class abstract?",
      short:
        "A virtual function declared `= 0` with no body required. A class with at least one is abstract and cannot be instantiated.",
      answer: [
        {
          code: `class Shape {
public:
    virtual void area() = 0;        // pure virtual -> Shape is abstract
    void display() { cout << "A shape"; }   // ordinary member, has a body
    virtual ~Shape() {}
};

class Circle : public Shape {
public:
    void area() override { cout << "pi * r * r"; }
};

int main() {
    // Shape s;              // ERROR: cannot instantiate an abstract class
    Shape* s = new Circle(); // fine — a pointer to an abstract base
    s->area();
    delete s;
}`,
          lang: "cpp",
        },
        {
          table: {
            head: ["", "Virtual function", "Pure virtual function"],
            rows: [
              ["Syntax", "`virtual void f()`", "`virtual void f() = 0`"],
              ["Has a body in the base", "Yes", "Usually not (it may, unusually)"],
              ["Derived class must override", "No", "**Yes** — or it is abstract too"],
              ["Makes the class abstract", "No", "Yes"],
            ],
          },
        },
        {
          note: "A derived class that fails to override every pure virtual it inherits is **itself abstract** and also cannot be instantiated. That is not an error — it is how you build a partial implementation halfway down a hierarchy.",
        },
      ],
      tags: ["pure virtual", "abstract class", "asked at Adobe", "asked at Microsoft"],
    },
    {
      id: "oops-virt-05",
      subtopic: "Rules",
      type: "conceptual",
      importance: "med",
      question: "What are the rules and restrictions on virtual functions?",
      short:
        "Must be a member, accessed through a pointer or reference; constructors cannot be virtual, static functions cannot be virtual, destructors should be.",
      answer: [
        {
          table: {
            head: ["Rule", "Why"],
            rows: [
              ["Must be a **member function**", "Dispatch happens through an object's vptr"],
              ["Must be reached via a **pointer or reference**", "A value has been sliced — there is no derived part left"],
              ["A **constructor cannot** be virtual", "The vptr is set up *by* the constructor; there is nothing to dispatch through yet"],
              ["A **static function cannot** be virtual", "It has no object, so no vptr"],
              ["A **destructor should** be virtual", "Otherwise deleting through a base pointer leaks the derived part"],
              ["Private virtual functions are legal", "Legal, and confusing — the base controls the interface, the derived supplies behaviour"],
            ],
          },
        },
        {
          note: "The second row is the one that catches people. `Animal a = dog;` copies only the `Animal` part — this is **object slicing** — so a virtual call on `a` has nothing derived to find. Polymorphism needs a pointer or a reference, always.",
        },
      ],
      tags: ["virtual", "rules", "slicing"],
    },
    {
      id: "oops-virt-06",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "A base constructor calls a virtual function that the derived class overrides. Which version runs?",
      short: "The base version — the derived vptr is not installed until the derived constructor begins.",
      answer: [
        {
          code: `class Base {
public:
    Base() { init(); }                       // calls a virtual function
    virtual void init() { cout << "Base init"; }
};

class Derived : public Base {
public:
    void init() override { cout << "Derived init"; }
};

Derived d;   // prints "Base init", not "Derived init"`,
          lang: "cpp",
        },
        {
          p: "Construction runs base-first. While `Base()` is executing, the object is still only a `Base` — its vptr points at `Base`'s v-table, and the `Derived` part has not been initialised at all. Dispatching to `Derived::init()` there would let it read members that do not exist yet.",
        },
        {
          note: "**Java does the opposite and it is worse.** Java calls the overridden method, so the derived `init()` runs before the derived constructor has set any of its fields — and reads them as `null` or zero. C++ gives you a surprising answer; Java gives you a silently wrong one.",
        },
        { p: "The rule that follows: do not call virtual functions from constructors or destructors. Use a separate initialisation step if you need that behaviour." },
      ],
      tip: "This is a senior-level question. Knowing that C++ and Java differ here, and which is more dangerous, is the whole point of asking it.",
      tags: ["scenario", "constructor", "virtual", "vptr"],
    },
    {
      id: "oops-virt-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A class becomes abstract in C++ when it has:",
      options: [
        "At least one virtual function",
        "At least one pure virtual function",
        "A private constructor",
        "No constructor",
      ],
      correct: 1,
      answer: [
        { p: "At least one pure virtual function (`= 0`). Ordinary virtual functions do not make a class abstract." },
      ],
      tags: ["mcq", "abstract class"],
    },
    {
      id: "oops-virt-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which of these can be virtual?",
      options: ["A constructor", "A destructor", "A static member function", "A friend function"],
      correct: 1,
      answer: [
        {
          p: "A destructor — and in any class used polymorphically it should be. Constructors cannot be (the vptr is not set yet), and static functions and friends are not members with an object.",
        },
      ],
      tags: ["mcq", "virtual", "destructor"],
    },
    {
      id: "oops-virt-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "The vptr of an object is set by:",
      options: ["The compiler at compile time", "The constructor at runtime", "The destructor", "The linker"],
      correct: 1,
      answer: [
        {
          p: "The constructor, as the object is built — which is exactly why a virtual call made from a base constructor still runs the base version.",
        },
      ],
      tags: ["mcq", "vptr"],
    },
  ],
};
