/*
 * Function and Operator Overloading.
 *
 * Source: "OOPS Notes.pdf" pp.22-23, "OOPs Notes copy.pdf" pp.10, 15,
 * "OOPS_Interview_Cheatsheet_2_1.pdf" Q30, Q47-48.
 *
 * LIST.pdf stars "Function Overloading". The list of operators that cannot be
 * overloaded comes from the cheatsheet Q47 and is correct.
 */

export default {
  id: "overloading",
  name: "Overloading",
  importance: "high",
  icon: "repeat",
  blurb:
    "Same name, different parameters — for functions, and for operators when the language allows it.",
  source: "OOPS Notes pp.22-23 · OOPs cheat-sheets pp.10, 15 · Cheatsheet Q30, 47-48",

  questions: [
    {
      id: "oops-ovl-01",
      subtopic: "Function overloading",
      type: "definition",
      importance: "high",
      question: "What is function overloading, and what are the rules?",
      short:
        "Several functions with the same name but different parameter lists. Return type alone cannot distinguish them.",
      answer: [
        { diagram: "overload-vs-override" },
        { p: "**The rules:**" },
        {
          ul: [
            "The name must be **the same**.",
            "The parameter list must **differ** — in number, type, or order.",
            "**Return type alone is not enough.** Two functions differing only in return type will not compile.",
          ],
        },
        {
          codePair: {
            left: {
              label: "C++",
              code: `class Calculator {
public:
    int add(int a, int b) {
        return a + b;
    }
    double add(double a, double b) {
        return a + b;
    }
    int add(int a, int b, int c) {
        return a + b + c;
    }

    // ERROR: differs only by return type
    // double add(int a, int b);
};`,
            },
            right: {
              label: "Java",
              code: `class Calculator {
    int add(int a, int b) {
        return a + b;
    }
    double add(double a, double b) {
        return a + b;
    }
    int add(int a, int b, int c) {
        return a + b + c;
    }

    // ERROR: differs only by return type
    // double add(int a, int b) { }
}`,
            },
          },
        },
        {
          note: "**Why return type does not count.** The compiler resolves a call from the arguments at the call site. In `add(2, 3);` the return value is discarded, so there is nothing to choose by — the call would be ambiguous. Parameters are always present at the call; the return type may not be.",
        },
      ],
      tip: "That 'why' is the follow-up, and the reasoning is short enough to give in one sentence. Most candidates only know the rule.",
      tags: ["overloading", "asked at American Express"],
    },
    {
      id: "oops-ovl-02",
      subtopic: "Comparison",
      type: "comparison",
      importance: "high",
      question: "What is the difference between overloading and overriding?",
      short:
        "Overloading: same name, different parameters, one class, compile time. Overriding: same signature, two classes, runtime.",
      answer: [
        {
          table: {
            head: ["", "Overloading", "Overriding"],
            rows: [
              ["Polymorphism", "Compile-time (static)", "Runtime (dynamic)"],
              ["Classes involved", "**One**", "**Two** — base and derived"],
              ["Inheritance needed", "No", "Yes"],
              ["Parameters", "Must **differ**", "Must match **exactly**"],
              ["Return type", "May differ; cannot be the only difference", "Must match, or be covariant"],
              ["Resolved by", "The compiler, from the arguments", "The runtime, from the object"],
              ["C++ keyword", "None", "`virtual` on the base method"],
            ],
          },
        },
        {
          note: "The fastest way to tell them apart in code: **count the classes.** One class means overloading. Two classes in an inheritance relationship means overriding.",
        },
      ],
      tip: "This is one of the two or three most-asked OOPS questions. Have the table, and lead with 'one class versus two'.",
      tags: ["overloading", "overriding", "comparison", "asked at Adobe", "asked at Goldman Sachs"],
    },
    {
      id: "oops-ovl-03",
      subtopic: "Operator overloading",
      type: "how",
      importance: "high",
      question: "What is operator overloading?",
      short:
        "Redefining what an operator means for your own type — `+` on two `Complex` objects, for instance. C++ only.",
      answer: [
        {
          code: `class Complex {
public:
    int real, imag;
    Complex(int r, int i) : real(r), imag(i) {}

    // overload '+' for two Complex objects
    Complex operator + (const Complex& obj) {
        return Complex(real + obj.real, imag + obj.imag);
    }

    void show() { cout << real << " + " << imag << "i"; }
};

int main() {
    Complex c1(2, 3), c2(1, 4);
    Complex c3 = c1 + c2;
    c3.show();          // 3 + 7i
}`,
          lang: "cpp",
        },
        {
          p: "**Java does not support it.** The one exception is `+` on `String`, which is built into the language — you cannot define your own. The designers left it out deliberately, on the grounds that an operator whose meaning can be redefined makes code harder to read than the convenience is worth.",
        },
        {
          note: "The rule of thumb when you do use it: overload an operator only where the meaning is **unambiguous**. `+` on a complex number or a vector is obvious. `+` on two `Employee` objects is a puzzle for whoever reads it next.",
        },
      ],
      followUps: [
        {
          q: "Which operators cannot be overloaded in C++?",
          a: "Six: `.` (member access), `?:` (ternary), `::` (scope resolution), `.*` (pointer-to-member), `sizeof`, and `typeid`. They are excluded because they operate on the language's own structure rather than on values — redefining `::` would change how names are resolved, not what a computation means.",
        },
      ],
      tags: ["operator overloading", "c++", "java"],
    },
    {
      id: "oops-ovl-04",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "You add an overload `void print(long)` to a class that already has `void print(int)`. A call `print(5)` still goes to the `int` version. Why?",
      short:
        "5 is an `int` literal, so it is an exact match. Overload resolution prefers an exact match over any conversion.",
      answer: [
        {
          p: "Overload resolution works down a ranked list. An **exact match** beats a promotion, which beats a standard conversion, which beats a user-defined conversion.",
        },
        {
          code: `void print(int);
void print(long);

print(5);     // int literal   -> print(int)   exact match
print(5L);    // long literal  -> print(long)  exact match
print(5.0);   // double        -> AMBIGUOUS: double->int and
              //                  double->long rank equally`,
          lang: "cpp",
        },
        {
          note: "The third line is the interesting one. Neither candidate is an exact match and both require the same rank of conversion, so the compiler refuses to guess and reports ambiguity. Overloading on similar numeric types is a reliable way to produce errors that look mysterious.",
        },
      ],
      tags: ["overload resolution", "scenario", "c++"],
    },
    {
      id: "oops-ovl-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Two functions differing only in return type are:",
      options: ["Valid overloads", "Not valid overloads", "Overrides", "Virtual functions"],
      correct: 1,
      answer: [
        {
          p: "Not valid. The compiler resolves a call from the arguments, and the return value can be discarded — so there would be nothing to choose by.",
        },
      ],
      tags: ["mcq", "overloading"],
    },
    {
      id: "oops-ovl-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which of these operators CANNOT be overloaded in C++?",
      options: ["`+`", "`[]`", "`::`", "`<<`"],
      correct: 2,
      answer: [
        {
          p: "`::`, the scope resolution operator. It works on names rather than values, so there is nothing about it to redefine. The other five that cannot are `.`, `?:`, `.*`, `sizeof` and `typeid`.",
        },
      ],
      tags: ["mcq", "operator overloading"],
    },
    {
      id: "oops-ovl-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Overloading requires how many classes?",
      options: ["One", "Two, related by inheritance", "Two, unrelated", "Any number"],
      correct: 0,
      answer: [
        {
          p: "One — all the overloads live in the same class. Needing two classes in an inheritance relationship is overriding.",
        },
      ],
      tags: ["mcq", "overloading"],
    },
  ],
};
