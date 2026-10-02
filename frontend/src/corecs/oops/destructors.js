/*
 * Destructors and Memory.
 *
 * Source: "OOPS Notes.pdf" p11, "OOPs Notes copy.pdf" pp.4, 12,
 * "OOPS_Interview_Cheatsheet_2_1.pdf" Q22, Q38, Q44,
 * "Oops in c++_ Java important questions.pdf" Q23, Q26.
 *
 * `delete` IS ON THE PRIORITY LIST AND IS BARELY COVERED BY THE NOTES.
 *
 * LIST.pdf stars "delete in C++". The 35-page notes mention destructors and
 * garbage collection but never `delete` versus `delete[]`, never virtual
 * destructors as a rule, and never what happens when you get it wrong. The
 * cheat-sheets supply the virtual-destructor rule; the rest is assembled from
 * the C++/Java comparison document, which names RAII and virtual destructors
 * as questions without answering them.
 */

export default {
  id: "destructors",
  name: "Destructors & Memory",
  importance: "high",
  icon: "cross",
  blurb:
    "What runs when an object dies, why the base class one must be virtual, and who frees the memory.",
  source: "OOPS Notes p11 · OOPs cheat-sheets pp.4, 12 · Cheatsheet Q22, 38, 44",

  questions: [
    {
      id: "oops-dtor-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is a destructor?",
      short:
        "A method called automatically when an object is destroyed, used to release whatever the object was holding.",
      answer: [
        {
          ul: [
            "Named `~ClassName` — the class name with a tilde.",
            "**No return type and no parameters**, so it can never be overloaded.",
            "Called automatically when an object goes out of scope or is `delete`d.",
            "Exactly one per class.",
          ],
        },
        {
          code: `class Student {
public:
    Student()  { cout << "Constructor\\n"; }
    ~Student() { cout << "Destructor\\n"; }
};

int main() {
    Student s1;     // "Constructor"
}                   // "Destructor" — automatic, at end of scope`,
          lang: "cpp",
        },
        {
          note: "It cannot take parameters, and that is not an arbitrary rule: the destructor is called by the compiler at a moment you did not write, so there would be nowhere to supply arguments. That also means it can never be overloaded.",
        },
      ],
      tags: ["destructor", "c++", "asked at Oracle"],
    },
    {
      id: "oops-dtor-02",
      subtopic: "Virtual destructors",
      type: "why",
      importance: "high",
      question: "Why must a base class destructor be virtual?",
      short:
        "Without it, deleting a derived object through a base pointer never runs the derived destructor — undefined behaviour, and a leak.",
      answer: [
        {
          p: "`delete` on a base pointer calls the destructor it can see. If that destructor is not virtual, the call is resolved **statically** to the base class one — and the derived part is never cleaned up.",
        },
        {
          codePair: {
            left: {
              label: "Broken",
              code: `class Base {
public:
    ~Base() { cout << "~Base"; }
};

class Derived : public Base {
    int* data;
public:
    Derived() { data = new int[1000]; }
    ~Derived() { delete[] data; }
};

Base* p = new Derived();
delete p;
// prints "~Base" only.
// ~Derived never runs -> 1000 ints leak.
// Formally: undefined behaviour.`,
            },
            right: {
              label: "Correct",
              code: `class Base {
public:
    virtual ~Base() { cout << "~Base"; }
};

class Derived : public Base {
    int* data;
public:
    Derived() { data = new int[1000]; }
    ~Derived() { delete[] data; }
};

Base* p = new Derived();
delete p;
// "~Derived" then "~Base".
// Correct order, nothing leaked.`,
            },
          },
        },
        {
          note: "**The rule:** if a class has any virtual function, or is ever deleted through a base pointer, its destructor must be virtual. The cost is one vptr per object — which a class with virtual functions is already paying.",
        },
        {
          p: "Notice the shape: this is the same mechanism as any other virtual call. The destructor is looked up in the v-table, so the most-derived one runs first and each base destructor runs after it.",
        },
      ],
      tip: "This is the standard follow-up to 'what is a virtual function'. Having the leak ready as a concrete consequence is what makes the answer land.",
      followUps: [
        {
          q: "Can a constructor be virtual?",
          a: "No. Virtual dispatch needs the vptr, and the vptr is set up *by* the constructor — so at the moment a constructor runs there is nothing to dispatch through yet. It is also unnecessary: you always name the exact type you are constructing.",
        },
      ],
      tags: ["virtual destructor", "memory leak", "polymorphism"],
    },
    {
      id: "oops-dtor-03",
      subtopic: "new and delete",
      type: "comparison",
      importance: "high",
      question: "What is the difference between `delete` and `delete[]`?",
      short:
        "`delete` frees a single object; `delete[]` frees an array and runs every element's destructor. Mixing them is undefined behaviour.",
      answer: [
        {
          table: {
            head: ["Allocated with", "Must be freed with", "What happens"],
            rows: [
              ["`new int`", "`delete`", "One object freed"],
              ["`new int[100]`", "`delete[]`", "All 100 freed, each destructor called"],
              ["`new int[100]`", "`delete` ✗", "**Undefined behaviour** — usually only the first element is destroyed"],
              ["`new int`", "`delete[]` ✗", "**Undefined behaviour**"],
            ],
          },
        },
        {
          code: `int* single = new int(5);
delete single;            // correct

int* array = new int[100];
delete[] array;           // correct — note the brackets

// delete array;          // WRONG: undefined behaviour`,
          lang: "cpp",
        },
        {
          note: "The pair must match because `new[]` records how many elements it made so `delete[]` can destroy each one. Plain `delete` does not read that count, so the other 99 destructors never run — and for a class holding resources, that is 99 leaks with no error message.",
        },
        {
          p: "Two other rules worth stating: **deleting the same pointer twice** is undefined behaviour, and **`delete` on a null pointer is safe** and does nothing, so guarding with `if (p)` is unnecessary.",
        },
      ],
      tags: ["delete", "new", "arrays", "undefined behaviour"],
    },
    {
      id: "oops-dtor-04",
      subtopic: "Java",
      type: "comparison",
      importance: "high",
      question: "Java has no destructors — so how is memory freed?",
      short:
        "By the garbage collector, which reclaims objects that are no longer reachable. You do not control when.",
      answer: [
        {
          table: {
            head: ["", "C++", "Java"],
            rows: [
              ["Frees memory", "You do, with `delete`", "The garbage collector"],
              ["When", "**Deterministically**, at the exact point you say", "**Whenever the GC decides**"],
              ["Cleanup hook", "Destructor — reliable", "`finalize()` — deprecated, unreliable"],
              ["Leak possible?", "Yes — forget to `delete`", "Yes — keep a reference you no longer need"],
              ["Dangling pointers", "Possible", "Impossible — a reference keeps the object alive"],
            ],
          },
        },
        {
          note: "**Java can still leak.** Garbage collection frees objects that are *unreachable*, not objects that are *unused*. A static list that keeps growing, or a listener never unregistered, holds references forever — the GC is doing exactly its job and the memory is still gone.",
        },
        {
          p: "For deterministic cleanup of non-memory resources — files, sockets, locks — Java uses `try-with-resources` and `AutoCloseable`, not the garbage collector. That is the honest parallel to a C++ destructor.",
        },
      ],
      followUps: [
        {
          q: "What is RAII?",
          a: "Resource Acquisition Is Initialisation: acquire a resource in a constructor and release it in the destructor, so cleanup is tied to scope and happens even if an exception unwinds. It is why C++ needs no `finally` block — and it is exactly what `try-with-resources` imitates in Java.",
        },
      ],
      tags: ["garbage collection", "java", "raii", "memory leak"],
    },
    {
      id: "oops-dtor-05",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "A C++ class allocates memory in its constructor and frees it in its destructor. What breaks when you copy an object of that class?",
      short:
        "The default copy shares the pointer, so the destructor runs twice on the same memory — a double free.",
      answer: [
        {
          p: "The compiler-generated copy constructor copies members one by one. For a pointer member that means copying the **address**, so both objects point at the same block.",
        },
        {
          code: `class Buffer {
    int* data;
public:
    Buffer()  { data = new int[100]; }
    ~Buffer() { delete[] data; }
};

{
    Buffer a;
    Buffer b = a;     // shallow: b.data == a.data
}                     // both destructors run
                      // -> delete[] on the same block twice`,
          lang: "cpp",
        },
        { p: "Three ways out, and naming the modern one is worth a lot:" },
        {
          ol: [
            "**Write a deep copy** — a copy constructor and a copy assignment operator that allocate their own block. This is the *Rule of Three*: if you need one of destructor, copy constructor or copy assignment, you almost certainly need all three.",
            "**Forbid copying** — `Buffer(const Buffer&) = delete;` so the mistake becomes a compile error.",
            "**Do not own a raw pointer at all** — hold a `std::vector` or a `std::unique_ptr` and the problem disappears, because they already know how to copy or move themselves.",
          ],
        },
        {
          note: "Option 3 is the answer a working C++ programmer gives. The Rule of Three exists because raw ownership is easy to get wrong; not owning raw pointers avoids the rule entirely.",
        },
      ],
      tip: "Say 'Rule of Three'. It is the term that signals you have met this problem rather than read about it.",
      tags: ["double free", "rule of three", "scenario", "deep copy"],
    },
    {
      id: "oops-dtor-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Can a destructor be overloaded?",
      options: ["Yes, by parameter type", "Yes, by return type", "No — it takes no parameters", "Only if it is virtual"],
      correct: 2,
      answer: [
        {
          p: "No. A destructor takes no parameters and returns nothing, so there is nothing to overload on. A class has exactly one.",
        },
      ],
      tags: ["mcq", "destructor"],
    },
    {
      id: "oops-dtor-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Deleting a derived object through a base pointer with a non-virtual base destructor:",
      options: [
        "Works correctly",
        "Is a compile error",
        "Is undefined behaviour and usually leaks the derived part",
        "Calls both destructors in reverse order",
      ],
      correct: 2,
      answer: [
        {
          p: "Undefined behaviour. In practice only the base destructor runs, so anything the derived class allocated is leaked.",
        },
      ],
      tags: ["mcq", "virtual destructor"],
    },
  ],
};
