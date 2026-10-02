/*
 * Friend Functions and Classes.
 *
 * Source: "OOPS Notes.pdf" p7, "OOPs Notes copy.pdf" p14,
 * "OOPS_Interview_Cheatsheet_2_1.pdf" Q34.
 *
 * LIST.pdf stars "friend Functions in C++", and it is a small topic with a
 * large amount of confusion attached — one source lists `friend` as an access
 * modifier alongside public and private, which it is not.
 */

export default {
  id: "friend",
  name: "Friend Functions & Classes",
  importance: "high",
  icon: "friends",
  blurb:
    "Granting one named outsider access to your private members — and why that is not the hole in encapsulation it looks like.",
  source: "OOPS Notes p7 · OOPs cheat-sheets p14 · Cheatsheet Q34",

  questions: [
    {
      id: "oops-frd-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is a friend function?",
      short:
        "A non-member function that a class explicitly grants access to its private and protected members.",
      answer: [
        {
          p: "A friend function is declared inside the class with the `friend` keyword, but it is **not a member**. It is an ordinary function that has been given permission.",
        },
        {
          code: `class Box {
    double width;                       // private

public:
    void setWidth(double w) { width = w; }
    friend void printWidth(Box box);    // grant access
};

// Not a member — no Box:: prefix, no 'this'
void printWidth(Box box) {
    cout << "Width: " << box.width;     // reaches private data
}

int main() {
    Box b;
    b.setWidth(10.0);
    printWidth(b);       // called like a free function
}`,
          lang: "cpp",
        },
        {
          table: {
            head: ["Property", "Friend function"],
            rows: [
              ["Is a member?", "**No**"],
              ["Has `this`?", "**No** — it must take the object as a parameter"],
              ["Called as", "`printWidth(b)`, not `b.printWidth()`"],
              ["Affected by access specifier", "**No** — `friend` in a private section works identically"],
              ["Can it be inherited?", "No"],
              ["Is it reciprocal?", "No — A's friend does not make A a friend of them"],
            ],
          },
        },
      ],
      tip: "Say 'not a member, has no `this`'. Those two facts answer most of the follow-ups before they are asked.",
      tags: ["friend function", "c++", "asked at Adobe"],
    },
    {
      id: "oops-frd-02",
      subtopic: "Friend class",
      type: "conceptual",
      importance: "high",
      question: "What is a friend class?",
      short:
        "A class granted access to another's private and protected members — every one of its methods gets in.",
      answer: [
        { diagram: "friend-access" },
        {
          code: `class Car {
private:
    string engineNumber;

public:
    Car() { engineNumber = "XYZ1234"; }
    friend class Mechanic;      // Mechanic may see everything
};

class Mechanic {
public:
    void checkEngine(Car c) {
        cout << "Engine: " << c.engineNumber;   // allowed
    }
};`,
          lang: "cpp",
        },
        {
          p: "The picture the notes use is a good one: your `Car` has a private engine number you do not want exposed — except to the `Mechanic` who needs it to service the car.",
        },
        {
          note: "**Friendship is granted, never taken.** `Car` names `Mechanic`, not the other way round, so a class always chooses who may see inside it. That is why this is less of a breach than it first appears: the access list is written in the class itself and is as reviewable as any other part of its interface.",
        },
        {
          p: "Friend class access is **one-way and not transitive**: `Mechanic` can see `Car`'s privates, `Car` cannot see `Mechanic`'s, and a friend of `Mechanic` gets nothing from `Car`.",
        },
      ],
      tags: ["friend class", "c++", "encapsulation"],
    },
    {
      id: "oops-frd-03",
      subtopic: "Design",
      type: "why",
      importance: "high",
      question: "Does `friend` break encapsulation?",
      short:
        "It bends it deliberately and visibly. The class chooses its friends, so the access list is part of its own declaration.",
      answer: [
        { p: "**The case that it does:** an outsider reads private state, which is precisely what `private` is supposed to prevent." },
        { p: "**The case that it does not**, which is the better answer:" },
        {
          ul: [
            "The class **grants** the access itself — nothing can take it.",
            "The friends are named in the class declaration, so the full list of who can reach in is visible in one place.",
            "The alternative is usually worse: making the member **public**, which grants the same access to everybody.",
          ],
        },
        {
          note: "The classic legitimate use is operator overloading. `os << obj` needs a function whose *left* operand is the stream, so it cannot be a member of your class — but it still needs your private data. `friend ostream& operator<<(ostream&, const Obj&)` is the standard idiom, and there is no way to write it without `friend` short of exposing the data to everyone.",
        },
        {
          p: "The honest summary: `friend` is a controlled, declared exception. Overusing it is a design smell; the two or three canonical uses are not.",
        },
      ],
      tip: "Do not just say 'yes it breaks encapsulation'. The interviewer is looking for whether you can argue the trade-off.",
      followUps: [
        {
          q: "Does Java have friend functions?",
          a: "No. The nearest equivalent is package-private access, which lets classes in the same package see each other's members — but that is a *level* applied to a member, not permission granted to a named class, so it is broader and less precise.",
        },
      ],
      tags: ["friend", "encapsulation", "design", "operator overloading"],
    },
    {
      id: "oops-frd-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A friend function of a class is:",
      options: [
        "A member function with extra privileges",
        "A non-member function granted access to private members",
        "A static member function",
        "A virtual function",
      ],
      correct: 1,
      answer: [
        {
          p: "A non-member. It has no `this` and is called like a free function — the class simply grants it access.",
        },
      ],
      tags: ["mcq", "friend function"],
    },
    {
      id: "oops-frd-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "If class A declares class B as a friend, then:",
      options: [
        "B can access A's private members, and A can access B's",
        "B can access A's private members only",
        "A can access B's private members only",
        "Both become public to each other",
      ],
      correct: 1,
      answer: [
        {
          p: "Friendship is one-way. A grants it to B; nothing flows back, and it is not inherited or transitive either.",
        },
      ],
      tags: ["mcq", "friend class"],
    },
  ],
};
