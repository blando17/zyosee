/*
 * Encapsulation and Access Specifiers.
 *
 * Source: "OOPS Notes.pdf" pp.6, 9, "OOPs Notes copy.pdf" p5,
 * "OOPS_Interview_Cheatsheet_2_1.pdf" Q10, Q35,
 * "OOPs Interview Preparation Notes.pdf" Q28.
 *
 * THE FOUR-COLUMN ACCESS TABLE IS JAVA'S, NOT C++'S.
 *
 * Both sources print a table with Class / Package / Subclass / World columns.
 * That is Java — C++ has no package level and only three specifiers. The two
 * are separated below rather than merged, because the merged version quietly
 * teaches C++ a `default` access level it does not have.
 */

export default {
  id: "encapsulation",
  name: "Encapsulation & Access",
  importance: "high",
  icon: "lock",
  blurb:
    "Bundling data with the code that owns it, and deciding who is allowed to reach in.",
  source: "OOPS Notes pp.6, 9 · OOPs cheat-sheets p5 · Cheatsheet Q10, Q35",

  questions: [
    {
      id: "oops-enc-01",
      subtopic: "Encapsulation",
      type: "definition",
      importance: "high",
      question: "What is encapsulation?",
      short:
        "Wrapping data and the methods that operate on it into one unit, and restricting direct access to that data.",
      answer: [
        { p: "Two halves, and a good answer gives both:" },
        {
          ul: [
            "**Data binding** — putting the data members and the methods that act on them together in one class.",
            "**Data hiding** — marking that data `private` so nothing outside can touch it directly.",
          ],
        },
        { diagram: "encapsulation" },
        {
          codePair: {
            left: {
              label: "C++",
              code: `class Student {
private:
    int age;          // hidden

public:
    void setAge(int a) {
        if (a > 0) age = a;   // validated
    }
    int getAge() { return age; }
};

int main() {
    Student s;
    s.setAge(20);
    cout << s.getAge();
    // s.age = -5;   // won't compile
}`,
            },
            right: {
              label: "Java",
              code: `class Student {
    private int age;        // hidden

    public void setAge(int a) {
        if (a > 0) age = a; // validated
    }
    public int getAge() {
        return age;
    }
}

Student s = new Student();
s.setAge(20);
System.out.println(s.getAge());
// s.age = -5;   // won't compile`,
            },
          },
        },
        {
          note: "The `if (a > 0)` is the point, not decoration. A public field can be set to −5 by anyone and nothing can stop it. A setter gives the class **one place** to enforce what a valid age is — which is what encapsulation actually buys you.",
        },
      ],
      tip: "The capsule analogy is fine for the definition, but the validation argument is what makes it sound like you have used it rather than read about it.",
      tags: ["encapsulation", "data hiding", "getters", "setters"],
    },
    {
      id: "oops-enc-02",
      subtopic: "Encapsulation",
      type: "comparison",
      importance: "high",
      question: "Encapsulation vs abstraction — what is the difference?",
      short:
        "Abstraction is about *what* you expose (design). Encapsulation is about *how* you restrict access to the rest (implementation).",
      answer: [
        {
          table: {
            head: ["", "Abstraction", "Encapsulation"],
            rows: [
              ["Question it answers", "**What** should the outside see?", "**How** do I stop it seeing the rest?"],
              ["Level", "Design", "Implementation"],
              ["Achieved with", "Abstract classes, interfaces, pure virtual functions", "Access modifiers, getters and setters"],
              ["Hides", "Complexity", "Data"],
              ["Example", "You know a car has `drive()`", "You cannot reach the fuel-injection variables"],
            ],
          },
        },
        {
          note: "They are related, not rival: **encapsulation is one of the mechanisms by which abstraction is achieved**. You decide what to expose (abstraction), then use `private` to make that decision stick (encapsulation).",
        },
      ],
      tip: "This is the single most confused pair in OOPS interviews. 'What versus how' is the compressed answer.",
      tags: ["encapsulation", "abstraction", "comparison"],
    },
    {
      id: "oops-enc-03",
      subtopic: "Access specifiers",
      type: "conceptual",
      importance: "high",
      question: "What are the access specifiers in C++ and in Java?",
      short:
        "C++ has three: private, protected, public. Java has four, adding package-private (no keyword).",
      answer: [
        { diagram: "access-modifiers" },
        { p: "**C++ — three specifiers:**" },
        {
          table: {
            head: ["Specifier", "Same class", "Derived class", "Outside"],
            rows: [
              ["`private`", "Yes", "No", "No"],
              ["`protected`", "Yes", "Yes", "No"],
              ["`public`", "Yes", "Yes", "Yes"],
            ],
          },
        },
        { p: "**Java — four levels**, because Java also has packages:" },
        {
          table: {
            head: ["Modifier", "Same class", "Same package", "Subclass elsewhere", "Anywhere"],
            rows: [
              ["`private`", "Yes", "No", "No", "No"],
              ["*(no modifier)* — default", "Yes", "Yes", "No", "No"],
              ["`protected`", "Yes", "Yes", "Yes", "No"],
              ["`public`", "Yes", "Yes", "Yes", "Yes"],
            ],
          },
        },
        {
          note: "Both of your sources print the four-column Java table and label it as applying to both languages. **C++ has no package level and no default modifier** — a C++ class member with no specifier is private, a struct member is public. Keep the two tables apart.",
          tone: "warn",
        },
      ],
      followUps: [
        {
          q: "Is `friend` an access specifier?",
          a: "No. One of your sources lists Private / Protected / Public / Friend as 'five types of access modifier' — `friend` is a declaration that grants one named class or function access, not a visibility level applied to a member. Java has no equivalent at all.",
        },
      ],
      tags: ["access specifiers", "private", "protected", "public"],
    },
    {
      id: "oops-enc-04",
      subtopic: "Access specifiers",
      type: "scenario",
      importance: "med",
      question:
        "You want a field readable by subclasses but not by anyone else. Which specifier, and what is the catch?",
      short: "`protected` — but it exposes the field to every future subclass, which is a wider promise than it looks.",
      answer: [
        { p: "`protected` is the specifier: visible in the class and in derived classes, not outside." },
        {
          p: "**The catch.** A protected field becomes part of your contract with every subclass, forever. Anyone can subclass you and write to it directly, so you cannot later add validation, rename it, or change its type without breaking them — the same problem a public field has, just with a smaller audience.",
        },
        {
          p: "The usual advice is to keep the field `private` and expose a `protected` getter and setter instead. You keep the single point of control, and subclasses still get their access.",
        },
        {
          note: "In Java there is an extra surprise: `protected` **also** grants access to every class in the same package, subclass or not. It is wider than 'subclasses only'.",
        },
      ],
      tags: ["protected", "scenario", "encapsulation"],
    },
    {
      id: "oops-enc-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In C++, a class member with no access specifier is:",
      options: ["public", "private", "protected", "a compile error"],
      correct: 1,
      answer: [
        { p: "private. In a `struct` the same member would be public — that is the whole difference between the keywords." },
      ],
      tags: ["mcq", "access specifiers"],
    },
    {
      id: "oops-enc-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In Java, which modifier allows access within the same package but not from subclasses in other packages?",
      options: ["private", "default (no modifier)", "protected", "public"],
      correct: 1,
      answer: [
        {
          p: "Package-private — no keyword at all. `protected` would additionally reach subclasses in other packages.",
        },
      ],
      tags: ["mcq", "java", "access specifiers"],
    },
    {
      id: "oops-enc-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Encapsulation primarily achieves:",
      options: [
        "Faster execution",
        "Data hiding and controlled access",
        "Multiple inheritance",
        "Runtime polymorphism",
      ],
      correct: 1,
      answer: [
        { p: "Data hiding with controlled access through the class's own methods. It has no effect on execution speed." },
      ],
      tags: ["mcq", "encapsulation"],
    },
  ],
};
