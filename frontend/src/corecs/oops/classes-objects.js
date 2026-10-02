/*
 * Classes and Objects.
 *
 * Source: "OOPS Notes.pdf" pp.4-5, 29, "OOPs Notes copy.pdf" pp.2, 13,
 * "OOPS_Interview_Cheatsheet_2_1.pdf" Q8-9, Q17-18, Q23.
 *
 * ONE CLAIM IN THE CHEATSHEET IS WRONG AND IS CORRECTED HERE.
 *
 * Cheatsheet Q23 says "the structure is saved in the stack memory, whereas the
 * class is saved in the heap memory". That is not true in C++ — both can live
 * in either, and where an instance lives is decided by how it is created, not
 * by which keyword declared it. The real difference is default access.
 */

export default {
  id: "classes-objects",
  name: "Classes & Objects",
  importance: "high",
  icon: "package",
  blurb:
    "The blueprint and the thing built from it — plus what actually occupies memory, and when.",
  source: "OOPS Notes pp.4-5, 29 · OOPs cheat-sheets pp.2, 13 · Cheatsheet Q8-23",

  questions: [
    {
      id: "oops-co-01",
      subtopic: "Basics",
      type: "comparison",
      importance: "high",
      question: "What is the difference between a class and an object?",
      short:
        "A class is a template that defines structure and behaviour. An object is an instance of it, with its own memory.",
      answer: [
        { diagram: "class-object" },
        {
          table: {
            head: ["", "Class", "Object"],
            rows: [
              ["Is", "A blueprint or template", "A real instance of that blueprint"],
              ["Memory", "**Occupies none** — it only describes a shape", "Occupies memory for its own data members"],
              ["How many", "Declared once", "Any number can be created"],
              ["Created with", "The `class` keyword", "`new` (Java), or by declaring a variable (C++)"],
              ["Holds", "The definition of attributes and methods", "Actual values for those attributes"],
            ],
          },
        },
        {
          p: "One `Car` class, three objects — `car1` a Honda, `car2` a Swift, `car3` a BMW. Same shape, three independent sets of values.",
        },
      ],
      tip: "'A class occupies no memory, objects do' is the sentence that answers this and its usual follow-up at once.",
      followUps: [
        {
          q: "Do you always have to create an object to use a class?",
          a: "No. A class with static members can be used through the class name without any instance — `Math.max()` in Java, `ClassName::method()` in C++. You need an object only for non-static members, because those are per-instance.",
        },
      ],
      tags: ["class", "object", "memory"],
    },
    {
      id: "oops-co-02",
      subtopic: "Basics",
      type: "how",
      importance: "high",
      question: "How do you declare a class and create an object from it?",
      short:
        "Declare with `class`. In C++ an object can be a plain variable or `new`; in Java it is always `new`.",
      answer: [
        {
          codePair: {
            left: {
              label: "C++",
              code: `class Car {
public:
    string brand;
    int speed;

    void display() {
        cout << brand << " " << speed << endl;
    }
};

int main() {
    Car c1;              // on the stack
    c1.brand = "Honda";
    c1.display();

    Car* c2 = new Car(); // on the heap
    c2->brand = "BMW";
    c2->display();
    delete c2;           // you must free it
}`,
            },
            right: {
              label: "Java",
              code: `class Car {
    String brand;
    int speed;

    void display() {
        System.out.println(brand + " " + speed);
    }
}

public class Main {
    public static void main(String[] a) {
        Car c1 = new Car();
        c1.brand = "Honda";
        c1.display();
        // always on the heap;
        // the garbage collector
        // frees it
    }
}`,
            },
          },
        },
        {
          note: "The difference worth naming: **in C++ an object can live on the stack**, and it is destroyed automatically when its scope ends. In Java every object is on the heap and reached through a reference. That single fact is behind most of the C++/Java differences in destructors, copying and memory management.",
        },
      ],
      tags: ["class", "object", "syntax", "c++", "java"],
    },
    {
      id: "oops-co-03",
      subtopic: "struct vs class",
      type: "comparison",
      importance: "med",
      question: "What is the difference between a struct and a class in C++?",
      short:
        "Default access only: struct members are public by default, class members are private. Everything else is identical.",
      answer: [
        {
          table: {
            head: ["", "struct", "class"],
            rows: [
              ["Default member access", "**public**", "**private**"],
              ["Default inheritance mode", "public", "private"],
              ["Can have methods", "Yes", "Yes"],
              ["Can have constructors", "Yes", "Yes"],
              ["Supports inheritance", "Yes", "Yes"],
              ["Supports access specifiers", "Yes", "Yes"],
            ],
          },
        },
        {
          p: "That really is the whole list. A C++ `struct` is a class whose members default to public; anything one can do, the other can.",
        },
        {
          note: "Your cheatsheet says \"the structure is saved in the stack memory, whereas the class is saved in the heap memory\". That is not right. **Where an instance lives is decided by how you create it**, not by the keyword: `MyClass a;` is on the stack, `new MyStruct()` is on the heap. Both keywords behave identically in that respect.",
          tone: "warn",
        },
        {
          p: "The convention that survives: use `struct` for a plain bundle of public data, `class` when there is an invariant to protect.",
        },
      ],
      tip: "If you only say 'public vs private by default' you have answered it correctly and completely. Resist adding more.",
      tags: ["struct", "class", "c++"],
    },
    {
      id: "oops-co-04",
      subtopic: "Static members",
      type: "definition",
      importance: "high",
      question: "What are static data members and static member functions?",
      short:
        "Static members belong to the class, not to any object — one copy shared by every instance.",
      answer: [
        {
          table: {
            head: ["", "Static data member", "Static member function"],
            rows: [
              ["Belongs to", "The class", "The class"],
              ["Copies", "**Exactly one**, shared by all objects", "—"],
              ["Exists", "Before any object is created", "Callable with no object"],
              ["Called as", "—", "`ClassName::fn()` (C++), `ClassName.fn()` (Java)"],
              ["Can access", "—", "**Only static members**"],
            ],
          },
        },
        {
          codePair: {
            left: {
              label: "C++",
              code: `class Counter {
public:
    static int count;   // declared
    Counter() { count++; }
    static void show() {
        cout << count;
        // cout << name;  // ERROR:
        // non-static member
    }
};

int Counter::count = 0;  // defined`,
            },
            right: {
              label: "Java",
              code: `class Counter {
    static int count = 0;
    Counter() { count++; }

    static void show() {
        System.out.println(count);
        // this.name;  // ERROR:
        // no object context
    }
}`,
            },
          },
        },
        {
          note: "**Why a static function cannot touch non-static members** is the real question underneath. A static function is called without an object, so there is no `this` — and a non-static member only exists *inside* some object. There is nothing for it to refer to.",
        },
        {
          p: "In C++ a static data member must also be **defined** outside the class (`int Counter::count = 0;`). The in-class line is only a declaration, and forgetting the definition produces a linker error rather than a compiler one — which is why it is confusing the first time.",
        },
      ],
      tip: "Counting instances is the standard example. If asked for a use, say that — it is the case where per-class rather than per-object state is obviously right.",
      followUps: [
        {
          q: "Can a static method be overridden?",
          a: "No. Overriding is resolved by the object at runtime, and a static method has no object — it is bound at compile time by the class name. Declaring one with the same signature in a subclass is **method hiding**, not overriding, and which one runs depends on the reference type rather than the object.",
        },
      ],
      tags: ["static", "class members"],
    },
    {
      id: "oops-co-05",
      subtopic: "Memory",
      type: "why",
      importance: "med",
      question: "How much memory does a class occupy?",
      short:
        "A class occupies none — it is only a description. Memory is allocated when an object is instantiated.",
      answer: [
        {
          p: "A class definition is information for the compiler: what members exist and how big they are. Nothing is allocated for the class itself.",
        },
        {
          p: "When an object is created, memory is allocated for **its** data members. Methods are not duplicated per object — there is one copy of the code, shared, which is why adding methods to a class does not make its objects bigger.",
        },
        {
          note: "A class with a virtual function is the one exception worth knowing: each of its objects also carries a hidden **vptr**, so `sizeof` grows by a pointer. That is the memory cost of runtime polymorphism.",
        },
      ],
      tags: ["memory", "class", "vptr"],
    },
    {
      id: "oops-co-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In C++, members of a `struct` are by default:",
      options: ["private", "protected", "public", "static"],
      correct: 2,
      answer: [
        { p: "public. In a `class` they default to private — and that is the only difference between the two keywords." },
      ],
      tags: ["mcq", "struct"],
    },
    {
      id: "oops-co-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A static member function can directly access:",
      options: [
        "Both static and non-static members",
        "Only static members",
        "Only non-static members",
        "Only private members",
      ],
      correct: 1,
      answer: [
        {
          p: "Only static members. It is called without an object, so there is no `this` and no instance whose non-static members it could mean.",
        },
      ],
      tags: ["mcq", "static"],
    },
  ],
};
