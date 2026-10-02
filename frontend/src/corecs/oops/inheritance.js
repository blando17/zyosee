/*
 * Inheritance.
 *
 * Source: "OOPS Notes.pdf" pp.16-21, "OOPs Notes copy.pdf" pp.7-8,
 * "OOPS_Interview_Cheatsheet_2_1.pdf" Q14, Q24-26.
 */

export default {
  id: "inheritance",
  name: "Inheritance",
  importance: "high",
  icon: "graduation",
  blurb:
    "One class taking on another's members — the five shapes it comes in, and the ambiguity that made Java refuse one of them.",
  source: "OOPS Notes pp.16-21 · OOPs cheat-sheets pp.7-8 · Cheatsheet Q14, 24-26",

  questions: [
    {
      id: "oops-inh-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is inheritance?",
      short:
        "A derived class acquires the properties and behaviour of a base class, and may add or redefine its own.",
      answer: [
        {
          p: "Inheritance expresses an **IS-A** relationship: a `Car` **is a** `Vehicle`, so it gets everything a vehicle has without repeating it.",
        },
        {
          codePair: {
            left: {
              label: "C++",
              code: `class Vehicle {
public:
    void start() {
        cout << "Vehicle started";
    }
};

class Car : public Vehicle {
public:
    void drive() {
        cout << "Car is driving";
    }
};

Car c;
c.start();   // inherited
c.drive();   // its own`,
            },
            right: {
              label: "Java",
              code: `class Vehicle {
    void start() {
        System.out.println("Vehicle started");
    }
}

class Car extends Vehicle {
    void drive() {
        System.out.println("Car is driving");
    }
}

Car c = new Car();
c.start();   // inherited
c.drive();   // its own`,
            },
          },
        },
        {
          note: "Inheritance is also the tightest coupling OOP offers. The derived class depends on the base class's internals, so a change in the base can break every subclass — which is why the usual advice is **prefer composition over inheritance** unless the relationship really is IS-A.",
        },
      ],
      tip: "Say IS-A. The next question is almost always 'when would you use composition instead', and IS-A versus HAS-A is the answer to both.",
      tags: ["inheritance", "is-a", "asked at Goldman Sachs"],
    },
    {
      id: "oops-inh-02",
      subtopic: "Types",
      type: "conceptual",
      importance: "high",
      question: "What are the types of inheritance?",
      short:
        "Single, multilevel, hierarchical, multiple and hybrid. Java supports the first three with classes.",
      answer: [
        { diagram: "inheritance-types" },
        {
          table: {
            head: ["Type", "Shape", "In Java?"],
            rows: [
              ["Single", "A → B", "Yes"],
              ["Multilevel", "A → B → C", "Yes"],
              ["Hierarchical", "A → B and A → C", "Yes"],
              ["Multiple", "A and B → C", "**Only via interfaces**"],
              ["Hybrid", "A combination, e.g. hierarchical + multiple", "Only via interfaces"],
            ],
          },
        },
        {
          p: "C++ supports all five directly with classes. Java refuses multiple inheritance of classes, which removes hybrid as well.",
        },
      ],
      tags: ["types of inheritance", "multiple inheritance"],
    },
    {
      id: "oops-inh-03",
      subtopic: "Modes",
      type: "comparison",
      importance: "med",
      question: "What are the modes of inheritance in C++?",
      short:
        "public, protected and private — they decide what the base's members become in the derived class.",
      answer: [
        {
          table: {
            head: ["Base member", "public inheritance", "protected inheritance", "private inheritance"],
            rows: [
              ["`public`", "public", "protected", "private"],
              ["`protected`", "protected", "protected", "private"],
              ["`private`", "**Not inherited**", "**Not inherited**", "**Not inherited**"],
            ],
          },
        },
        {
          code: `class Derived : public Base     { };   // the usual one — IS-A
class Derived : protected Base  { };
class Derived : private Base    { };   // the DEFAULT if you omit it`,
          lang: "cpp",
        },
        {
          note: "**Omitting the mode gives you `private` inheritance**, which is almost never what you meant. Written `class Car : Vehicle`, a `Car` is no longer usable as a `Vehicle` from outside, and every polymorphic use silently fails to compile. Always write `public` explicitly. (A `struct` defaults to public inheritance, which is another reason the two keywords are not interchangeable.)",
        },
        {
          p: "Private members are never inherited *accessibly*, but they still **exist** in the derived object — the base part is there, and its public and protected methods can still reach them. They are hidden, not absent.",
        },
        {
          p: "Java has no modes at all: `extends` is always equivalent to public inheritance.",
        },
      ],
      tip: "The 'private by default' trap is a favourite. If a question shows `class B : A`, that colon has no keyword and the answer usually hinges on it.",
      tags: ["inheritance modes", "c++", "public", "private"],
    },
    {
      id: "oops-inh-04",
      subtopic: "Diamond problem",
      type: "conceptual",
      importance: "high",
      question: "What is the diamond problem, and how is it solved?",
      short:
        "D inherits from B and C, which both inherit from A — so D gets two copies of A. C++ solves it with virtual inheritance; Java avoids it by banning multiple class inheritance.",
      answer: [
        { diagram: "diamond-problem" },
        {
          p: "`B` and `C` each inherit from `A`. `D` inherits from both, so `D` contains **two** copies of `A`'s members — and `d.show()` is ambiguous, because the compiler cannot tell which copy you mean.",
        },
        {
          codePair: {
            left: {
              label: "The problem",
              code: `class A {
public: void show() { cout << "A"; }
};
class B : public A { };
class C : public A { };
class D : public B, public C { };

int main() {
    D obj;
    // obj.show();    // ERROR: ambiguous
    obj.B::show();    // works — say which
    obj.C::show();
}`,
            },
            right: {
              label: "Virtual inheritance",
              code: `class A {
public: void show() { cout << "A"; }
};
class B : virtual public A { };
class C : virtual public A { };
class D : public B, public C { };

int main() {
    D obj;
    obj.show();   // fine — one copy of A
}`,
            },
          },
        },
        {
          p: "**Java's answer** is to disallow multiple inheritance of classes entirely. Interfaces can be multiply implemented safely, because before Java 8 they carried no implementation — there was nothing to be ambiguous about. If two interfaces declare the same method, the implementing class must define it once, which resolves it by construction.",
        },
        {
          note: "Java 8 default methods brought a small version of the problem back: if two interfaces provide conflicting `default` implementations, the class is forced to override the method and can pick with `InterfaceName.super.method()`.",
        },
      ],
      tip: "Name both fixes and say why they are different: C++ removes the duplicate copy, Java removes the possibility.",
      tags: ["diamond problem", "virtual inheritance", "multiple inheritance"],
    },
    {
      id: "oops-inh-05",
      subtopic: "Java",
      type: "why",
      importance: "high",
      question: "Why does Java not support multiple inheritance with classes?",
      short: "To avoid the ambiguity of the diamond problem. Interfaces give the benefit without the risk.",
      answer: [
        {
          p: "If a class could inherit from two classes that both define `show()`, a call to `show()` would have no single correct answer — and the same goes for duplicated state.",
        },
        {
          p: "Java's designers chose to remove the ambiguity rather than provide machinery for resolving it. Interfaces then supply what multiple inheritance was *for* — a class conforming to several contracts — without inheriting conflicting implementations.",
        },
        {
          codePair: {
            left: {
              label: "C++ — classes",
              code: `class A {
public: void showA() { }
};
class B {
public: void showB() { }
};

class C : public A, public B {
public: void showC() { }
};`,
            },
            right: {
              label: "Java — interfaces",
              code: `interface A { void showA(); }
interface B { void showB(); }

class C implements A, B {
    public void showA() { }
    public void showB() { }
    public void showC() { }
}`,
            },
          },
        },
        {
          note: "The distinction worth stating: C++ inherits **implementation** from several places, Java implements several **contracts**. The first can conflict; the second cannot, because the class writes the only implementation there is.",
        },
      ],
      tags: ["multiple inheritance", "java", "interface", "asked at American Express"],
    },
    {
      id: "oops-inh-06",
      subtopic: "Limitations",
      type: "why",
      importance: "med",
      question: "What are the limitations of inheritance?",
      short:
        "Tight coupling, fragile base classes, deep hierarchies that are hard to follow, and a small runtime cost.",
      answer: [
        {
          ul: [
            "**Tight coupling** — the derived class depends on the base class's implementation, not just its interface.",
            "**Fragile base class** — changing the base can break subclasses you have never seen.",
            "**Depth** — following behaviour through five levels of hierarchy is genuinely hard.",
            "**Runtime cost** — virtual dispatch adds an indirection per call.",
            "**It is permanent** — a class's base is fixed at compile time, while a composed object can be swapped at runtime.",
          ],
        },
        {
          note: "The standard counter-example: making `Stack` inherit from `Vector` to reuse its storage. A stack then also exposes `insertAt()` — which lets anyone break the stack's own invariant. The relationship was HAS-A all along, and inheritance made it a lie.",
        },
      ],
      tags: ["inheritance", "coupling", "composition"],
    },
    {
      id: "oops-inh-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In C++, if the inheritance mode is omitted (`class B : A`), it is:",
      options: ["public", "protected", "private", "a compile error"],
      correct: 2,
      answer: [
        {
          p: "private — which is almost never intended, and quietly stops `B` being usable as an `A`. A `struct` defaults to public instead.",
        },
      ],
      tags: ["mcq", "inheritance modes"],
    },
    {
      id: "oops-inh-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Virtual inheritance in C++ is used to:",
      options: [
        "Make functions resolve at runtime",
        "Ensure only one copy of a shared base class exists",
        "Prevent a class from being inherited",
        "Allow multiple inheritance in Java",
      ],
      correct: 1,
      answer: [
        {
          p: "To give the diamond a single shared copy of the common base, removing the ambiguity. Runtime resolution is what `virtual` does on *functions* — same keyword, different job.",
        },
      ],
      tags: ["mcq", "virtual inheritance"],
    },
    {
      id: "oops-inh-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Private members of a base class are:",
      options: [
        "Inherited and accessible in the derived class",
        "Present in the derived object but not directly accessible",
        "Not present in the derived object at all",
        "Converted to protected",
      ],
      correct: 1,
      answer: [
        {
          p: "They exist inside the base part of the derived object — the object's size reflects them — but the derived class cannot name them. Base class public and protected methods can still reach them.",
        },
      ],
      tags: ["mcq", "inheritance", "private"],
    },
  ],
};
