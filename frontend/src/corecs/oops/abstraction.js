/*
 * Abstraction, Abstract Classes and Interfaces.
 *
 * Source: "OOPS Notes.pdf" pp.26-28, "OOPs Notes copy.pdf" pp.6, 16,
 * "OOPS_Interview_Cheatsheet_2_1.pdf" Q15-16, Q32-33.
 *
 * Cheatsheet Q16 answers "what are the levels of data abstraction" with the
 * DATABASE levels — internal, conceptual, external. That is a DBMS answer
 * that has wandered into an OOPS document; it is left for the DBMS subject
 * rather than reproduced here.
 */

export default {
  id: "abstraction",
  name: "Abstraction & Interfaces",
  importance: "high",
  icon: "page",
  blurb:
    "Showing what something does without showing how — abstract classes, interfaces, and when each one fits.",
  source: "OOPS Notes pp.26-28 · OOPs cheat-sheets pp.6, 16 · Cheatsheet Q15, 32-33",

  questions: [
    {
      id: "oops-abs-01",
      subtopic: "Abstraction",
      type: "definition",
      importance: "high",
      question: "What is abstraction?",
      short:
        "Hiding implementation detail and exposing only the essential interface.",
      answer: [
        {
          p: "Abstraction is deciding **what the outside world needs to see** and showing only that. You use a smartphone by tapping icons; you drive a car without knowing how fuel injection works.",
        },
        {
          table: {
            head: ["Language", "How abstraction is achieved"],
            rows: [
              ["C++", "Abstract classes with pure virtual functions; partially, via access specifiers"],
              ["Java", "Abstract classes and interfaces"],
            ],
          },
        },
        {
          note: "Access specifiers give **partial** abstraction — they hide data. Full abstraction means hiding the implementation of *behaviour* too, which is what an abstract class or interface does: it names the operation and says nothing about how it is carried out.",
        },
      ],
      tip: "Keep the encapsulation contrast ready: abstraction is *what* you expose, encapsulation is *how* you restrict the rest.",
      tags: ["abstraction", "asked at Microsoft"],
    },
    {
      id: "oops-abs-02",
      subtopic: "Abstract classes",
      type: "definition",
      importance: "high",
      question: "What is an abstract class?",
      short:
        "A class that cannot be instantiated, containing at least one method with no implementation, meant to be a base.",
      answer: [
        { diagram: "abstract-interface" },
        {
          codePair: {
            left: {
              label: "C++",
              code: `class Shape {
public:
    virtual void area() = 0;   // pure virtual
    void display() {           // concrete
        cout << "This is a shape";
    }
    virtual ~Shape() {}
};

class Circle : public Shape {
public:
    void area() override {
        cout << "pi * r * r";
    }
};

// Shape s;               // ERROR
Shape* s = new Circle();  // fine`,
            },
            right: {
              label: "Java",
              code: `abstract class Animal {
    String name;

    Animal(String name) {      // ctor allowed
        this.name = name;
    }

    abstract void makeSound(); // no body

    void sleep() {             // concrete
        System.out.println(name + " sleeps");
    }
}

// new Animal("x");        // ERROR
Animal a = new Dog("Rex"); // fine`,
            },
          },
        },
        {
          ul: [
            "Cannot be instantiated on its own.",
            "**Can** hold concrete methods, fields and constructors.",
            "Its constructor still runs — when a derived object is created.",
            "A derived class that does not implement every abstract method is itself abstract.",
          ],
        },
        {
          note: "The constructor point surprises people: an abstract class can have one and it does run, as part of building the derived object. It just cannot be called to produce a standalone instance.",
        },
      ],
      tags: ["abstract class", "pure virtual"],
    },
    {
      id: "oops-abs-03",
      subtopic: "Interfaces",
      type: "comparison",
      importance: "high",
      question: "Abstract class vs interface in Java?",
      short:
        "An abstract class can carry state and shared code and you extend one. An interface is a contract and you implement many.",
      answer: [
        {
          table: {
            head: ["", "Abstract class", "Interface"],
            rows: [
              ["Keyword", "`extends` — **one only**", "`implements` — **many allowed**"],
              ["Constructors", "Yes", "No"],
              ["Fields", "Instance and static fields", "Only `public static final` constants"],
              ["Abstract methods", "Yes", "Yes"],
              ["Concrete methods", "Yes", "Yes, via `default` and `static` (Java 8+)"],
              ["Access modifiers", "Any", "Methods are public by default"],
              ["Instantiable", "No", "No"],
              ["Use it for", "Shared base logic and shared state", "A capability several unrelated classes can have"],
            ],
          },
        },
        {
          p: "**How to choose.** If subclasses share *state* or *implementation*, use an abstract class — that is what it is for. If you are declaring a *capability* that classes from different hierarchies can have, use an interface: `Flyable` fits a bird and an aeroplane, which have no useful common ancestor.",
        },
        {
          note: "The decisive practical difference is **one versus many**. A class can extend one abstract class and implement any number of interfaces, so an interface is the only way to say a class belongs to several categories at once.",
        },
        {
          p: "**C++ has no `interface` keyword.** The equivalent is an abstract class where every function is pure virtual and there is no state.",
        },
      ],
      tip: "Answer the choosing question, not just the difference. 'Shared implementation versus shared capability' is what the interviewer is after.",
      tags: ["abstract class", "interface", "java"],
    },
    {
      id: "oops-abs-04",
      subtopic: "Interfaces",
      type: "conceptual",
      importance: "med",
      question: "What is an interface, and what changed in Java 8?",
      short:
        "A contract of method signatures. Java 8 added `default` and `static` methods, so interfaces can now carry implementation.",
      answer: [
        {
          code: `interface Flyable {
    void fly();                       // abstract — implementer must define

    default void land() {             // Java 8: has a body
        System.out.println("Landing...");
    }

    static void info() {              // Java 8: called on the interface
        System.out.println("Flyable interface");
    }
}

class Bird implements Flyable {
    public void fly() { System.out.println("Flap"); }
    // land() is inherited as-is
}`,
          lang: "java",
        },
        {
          p: "**Why `default` methods were added:** to let an interface gain a new method without breaking every class that already implements it. Before Java 8, adding `land()` to a widely-used interface broke every implementer at once.",
        },
        {
          note: "The cost is that the diamond problem came partly back. If a class implements two interfaces with conflicting `default` methods, it **must** override the method, and can choose explicitly with `InterfaceName.super.method()`. Java traded a little safety for the ability to evolve an interface.",
        },
      ],
      tags: ["interface", "java 8", "default methods"],
    },
    {
      id: "oops-abs-05",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "You are designing a payment system supporting cards, UPI and wallets. Abstract class or interface?",
      short:
        "Both — an interface for the capability, an abstract class for the shared logic underneath it.",
      answer: [
        {
          p: "The two are not alternatives here. Use each for what it is good at:",
        },
        {
          code: `interface PaymentMethod {          // the contract
    boolean pay(double amount);
    void refund(double amount);
}

abstract class OnlinePayment implements PaymentMethod {
    protected String transactionId;

    protected void logTransaction() {  // shared by all online methods
        System.out.println("Logged: " + transactionId);
    }

    public abstract boolean pay(double amount);   // still each one's own
}

class CardPayment   extends OnlinePayment { /* ... */ }
class UpiPayment    extends OnlinePayment { /* ... */ }
class CashPayment implements PaymentMethod { /* no online logic */ }`,
          lang: "java",
        },
        {
          note: "`CashPayment` is why the interface earns its place. It is a payment method but shares none of the online logic, so it implements the contract without inheriting the base class. Had the contract been an abstract class, cash would have been forced to inherit machinery it has no use for.",
        },
      ],
      tags: ["scenario", "design", "interface", "abstract class"],
    },
    {
      id: "oops-abs-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which of these can an interface NOT have?",
      options: ["Abstract methods", "Constants", "A constructor", "Static methods"],
      correct: 2,
      answer: [
        {
          p: "A constructor. An interface has no instance state to initialise and is never instantiated directly.",
        },
      ],
      tags: ["mcq", "interface"],
    },
    {
      id: "oops-abs-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In Java, a class can:",
      options: [
        "Extend many classes and implement one interface",
        "Extend one class and implement many interfaces",
        "Extend many classes and implement many interfaces",
        "Only extend one class",
      ],
      correct: 1,
      answer: [
        {
          p: "Extend one class, implement any number of interfaces — which is how Java gets the benefit of multiple inheritance without the ambiguity.",
        },
      ],
      tags: ["mcq", "interface", "inheritance"],
    },
  ],
};
