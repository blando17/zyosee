/*
 * Constructors.
 *
 * Source: "OOPS Notes.pdf" pp.10, 14-15, "OOPs Notes copy.pdf" p3,
 * "OOPS_Interview_Cheatsheet_2_1.pdf" Q19-21, Q46, Q51.
 *
 * TWO ERRORS IN THE CHEATSHEET ARE CORRECTED HERE.
 *
 *   Q20 prints a copy constructor as `ABC(ABC abc)` — taking the parameter BY
 *   VALUE. That does not compile in C++: copying the argument would itself
 *   need the copy constructor, forever. It must take a reference.
 *
 *   Q46 defines the copy assignment operator as one that "lets you create a
 *   new object from an existing one by initialisation". That is the copy
 *   CONSTRUCTOR. Assignment happens to an object that already exists, and
 *   telling them apart is the whole point of the question.
 */

export default {
  id: "constructors",
  name: "Constructors",
  importance: "high",
  icon: "seedling",
  blurb:
    "The method that runs when an object is born — and the copy rules that trip people up.",
  source: "OOPS Notes pp.10, 14-15 · OOPs cheat-sheets p3 · Cheatsheet Q19-21, 46",

  questions: [
    {
      id: "oops-ctor-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is a constructor?",
      short:
        "A special method with the class's name and no return type, called automatically when an object is created.",
      answer: [
        {
          ul: [
            "Has **the same name as the class**.",
            "Has **no return type** — not even `void`.",
            "Is invoked **automatically**, exactly once, at object creation.",
            "Exists to initialise the object into a usable state.",
          ],
        },
        {
          note: "A constructor does **not** allocate the memory. Memory is allocated first, then the constructor runs to initialise it. That ordering matters: `new` does the allocation, the constructor does the setup.",
        },
      ],
      tip: "'Same name, no return type, runs automatically' is the three-part answer. Add the allocation point and you have the follow-up covered too.",
      tags: ["constructor", "asked at Adobe"],
    },
    {
      id: "oops-ctor-02",
      subtopic: "Types",
      type: "comparison",
      importance: "high",
      question: "What are the types of constructor?",
      short: "Default (no parameters), parameterised, and copy.",
      answer: [
        {
          codePair: {
            left: {
              label: "C++",
              code: `class Student {
public:
    string name;

    // 1. default
    Student() {
        name = "unknown";
    }

    // 2. parameterised
    Student(string n) {
        name = n;
    }

    // 3. copy — note the &
    Student(const Student &s) {
        name = s.name;
    }
};`,
            },
            right: {
              label: "Java",
              code: `class Student {
    String name;

    // 1. default
    Student() {
        name = "unknown";
    }

    // 2. parameterised
    Student(String n) {
        name = n;
    }

    // 3. copy (just a convention —
    //    Java has no special rule)
    Student(Student s) {
        this.name = s.name;
    }
}`,
            },
          },
        },
        {
          note: "**The `&` in the C++ copy constructor is compulsory.** Written `Student(Student s)` the parameter would have to be copied to be passed — which would call the copy constructor — which would copy the parameter, forever. The compiler rejects it outright. Your cheatsheet prints exactly this mistake as `ABC(ABC abc)`.",
          tone: "warn",
        },
        {
          p: "Java has no special copy-constructor rule because Java passes object **references**, so nothing is copied on the way in. A Java 'copy constructor' is an ordinary constructor by convention.",
        },
      ],
      followUps: [
        {
          q: "What happens if you write no constructor at all?",
          a: "The compiler supplies one. C++ also supplies a copy constructor, a copy assignment operator and a destructor; Java supplies just a no-argument constructor. But in C++ the moment you declare **any** constructor, the implicit default one disappears — so adding a parameterised constructor silently breaks `Student s;`.",
        },
      ],
      tags: ["constructor", "copy constructor", "default constructor"],
    },
    {
      id: "oops-ctor-03",
      subtopic: "Copying",
      type: "comparison",
      importance: "high",
      question: "Shallow copy vs deep copy?",
      short:
        "Shallow copies the pointer, so both objects share the same memory. Deep allocates new memory and copies the value.",
      answer: [
        { diagram: "shallow-vs-deep" },
        {
          codePair: {
            left: {
              label: "Shallow — broken",
              code: `class Student {
public:
    int* marks;
    Student(int m) { marks = new int(m); }

    Student(const Student& s) {
        marks = s.marks;   // address only
    }
};

Student s1(90);
Student s2 = s1;
*s2.marks = 50;
s1.show();   // 50  — s1 changed too`,
            },
            right: {
              label: "Deep — correct",
              code: `class Student {
public:
    int* marks;
    Student(int m) { marks = new int(m); }

    Student(const Student& s) {
        marks = new int(*(s.marks));
    }
};

Student s1(90);
Student s2 = s1;
*s2.marks = 50;
s1.show();   // 90  — independent`,
            },
          },
        },
        {
          note: "**Shallow copy has a second failure your notes do not mention, and it is worse than the first.** Both objects hold the same pointer, so when both destructors run, the same memory is freed **twice** — a double free, which is undefined behaviour and usually a crash. Any object owning a raw pointer needs a deep copy, or it needs to forbid copying.",
        },
        {
          p: "The default compiler-generated copy constructor is a **member-wise** copy, which for a pointer member means copying the address — so the broken version above is what you get by writing nothing at all.",
        },
      ],
      tip: "Name the double-free. Everyone says 'they share memory'; far fewer say what actually goes wrong at the end of scope.",
      tags: ["shallow copy", "deep copy", "copy constructor"],
    },
    {
      id: "oops-ctor-04",
      subtopic: "Copying",
      type: "comparison",
      importance: "high",
      question: "Copy constructor vs copy assignment operator?",
      short:
        "The copy constructor creates a new object from an existing one. Assignment overwrites an object that already exists.",
      answer: [
        {
          table: {
            head: ["", "Copy constructor", "Copy assignment operator"],
            rows: [
              ["Target object", "**Does not exist yet** — is being created", "**Already exists** — is being overwritten"],
              ["Signature", "`A(const A& other)`", "`A& operator=(const A& other)`"],
              ["Returns", "Nothing", "A reference to `*this`, so `a = b = c` works"],
              ["Must handle", "Allocating its own copy", "Freeing the old resource first, and self-assignment"],
            ],
          },
        },
        {
          code: `Student s1(90);
Student s2 = s1;   // copy CONSTRUCTOR — s2 is being created
Student s3(80);
s3 = s1;           // copy ASSIGNMENT — s3 already existed`,
          lang: "cpp",
        },
        {
          note: "Your cheatsheet defines the copy assignment operator as one that \"lets you create a new object from an existing one by initialisation\". That describes the **copy constructor**. Assignment never creates anything — it replaces the contents of an object that is already there, which is why it also has to release whatever that object was holding.",
          tone: "warn",
        },
        {
          p: "Self-assignment is the classic bug: `s = s;` naively written frees the resource and then copies from the thing it just freed. A correct `operator=` checks `if (this == &other) return *this;` first.",
        },
      ],
      tip: "`Student s2 = s1;` looks like assignment and is construction. Being able to spot that from the syntax is the real test here.",
      tags: ["copy constructor", "assignment operator", "rule of three"],
    },
    {
      id: "oops-ctor-05",
      subtopic: "Overloading",
      type: "conceptual",
      importance: "high",
      question: "What is constructor overloading, and what is constructor chaining?",
      short:
        "Overloading: several constructors with different parameter lists. Chaining: one constructor calling another to avoid duplication.",
      answer: [
        {
          p: "**Constructor overloading** is ordinary function overloading applied to constructors — same name, different parameter lists, resolved at compile time.",
        },
        {
          p: "**Constructor chaining** lets one constructor delegate to another rather than repeating the initialisation.",
        },
        {
          codePair: {
            left: {
              label: "C++ (delegating)",
              code: `class Student {
    string name;
    int age;
public:
    Student(string n, int a)
        : name(n), age(a) {}

    // delegates to the one above
    Student(string n)
        : Student(n, 18) {}

    Student() : Student("unknown") {}
};`,
            },
            right: {
              label: "Java",
              code: `class Student {
    String name;
    int age;

    Student(String n, int a) {
        name = n; age = a;
    }

    Student(String n) {
        this(n, 18);   // same class
    }

    Student() {
        this("unknown");
    }
}`,
            },
          },
        },
        {
          note: "`this(...)` in Java calls another constructor of the **same** class; `super(...)` calls the parent's. Either must be the **first statement** in the constructor, because the object has to be fully set up from the bottom of the hierarchy upwards before anything else runs.",
        },
      ],
      tags: ["constructor overloading", "constructor chaining", "this", "super"],
    },
    {
      id: "oops-ctor-06",
      subtopic: "Order",
      type: "scenario",
      importance: "med",
      question: "In what order do constructors run in an inheritance chain?",
      short: "Base first, then derived — and destructors run in exactly the reverse order.",
      answer: [
        { diagram: "ctor-dtor-order" },
        {
          code: `class Base {
public:
    Base()  { cout << "Base "; }
    ~Base() { cout << "~Base "; }
};

class Derived : public Base {
public:
    Derived()  { cout << "Derived "; }
    ~Derived() { cout << "~Derived "; }
};

int main() {
    Derived d;
}
// Output:  Base Derived ~Derived ~Base`,
          lang: "cpp",
        },
        {
          p: "**Why base first.** A derived constructor may use members it inherited, so the base part has to be fully built before the derived body runs. Destruction reverses it for the same reason: the derived destructor may still need the base part while it cleans up.",
        },
        {
          note: "This is a favourite output-prediction question. If you are asked to trace one, write the construction order top-down and then read it backwards for the destruction — you do not need to reason about it twice.",
        },
      ],
      tags: ["constructor order", "destructor order", "inheritance", "output"],
    },
    {
      id: "oops-ctor-07",
      subtopic: "explicit",
      type: "why",
      importance: "med",
      question: "What is the `explicit` keyword for?",
      short:
        "It stops a single-argument constructor from being used for silent implicit conversions.",
      answer: [
        {
          p: "A constructor callable with one argument doubles as a **conversion constructor** — the compiler will use it silently to turn that argument type into your class.",
        },
        {
          code: `class Distance {
public:
    Distance(int metres) { /* ... */ }
};

void travel(Distance d);

travel(42);     // compiles! 42 is silently converted to a Distance

// With explicit:
class Distance {
public:
    explicit Distance(int metres) { /* ... */ }
};

travel(42);              // now a compile error
travel(Distance(42));    // must say what you mean`,
          lang: "cpp",
        },
        {
          note: "The reason to care: `travel(42)` reads like a bug and compiles like a feature. `explicit` costs nothing and turns a class of silent surprises into compile errors, which is why the usual advice is to mark every single-argument constructor `explicit` unless you specifically want the conversion.",
        },
      ],
      tags: ["explicit", "c++", "conversion"],
    },
    {
      id: "oops-ctor-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A constructor's return type is:",
      options: ["`void`", "The class type", "There is none", "`int`"],
      correct: 2,
      answer: [
        { p: "There is none — not even `void`. Writing a return type turns it into an ordinary method that happens to share the class's name." },
      ],
      tags: ["mcq", "constructor"],
    },
    {
      id: "oops-ctor-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In C++, a copy constructor must take its parameter:",
      options: ["By value", "By reference", "By pointer", "As a static member"],
      correct: 1,
      answer: [
        {
          p: "By reference — usually `const A&`. Taking it by value would require a copy to make the call, which would call the copy constructor again, without end.",
        },
      ],
      tags: ["mcq", "copy constructor"],
    },
    {
      id: "oops-ctor-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "`Student s2 = s1;` calls which of these?",
      options: ["The copy assignment operator", "The copy constructor", "The default constructor", "Nothing"],
      correct: 1,
      answer: [
        {
          p: "The copy constructor — `s2` is being created here. The assignment operator would only run if `s2` already existed, as in `s2 = s1;` on a later line.",
        },
      ],
      tags: ["mcq", "copy constructor"],
    },
  ],
};
