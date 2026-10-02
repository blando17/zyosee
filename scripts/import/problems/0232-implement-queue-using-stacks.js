module.exports = {
  problemId: "dsa-232",
  slug: "implement-queue-using-stacks",
  title: "Implement a Queue Using Stacks",
  difficulty: "Easy",
  topics: ["stack", "queue", "design"],
  timeLimitMs: 2000,
  statement:
    "Build a first-in-first-out queue using only stacks. The only operations you may use on " +
    "the underlying storage are push to the top, pop from the top, look at the top, and test " +
    "for empty.\n\n" +
    "You are given a list of operations, written as integers:\n\n" +
    "  a value of 1 or more  add that value to the back\n" +
    "  0                     remove the front value and report it\n" +
    "  -1                    report the front value without removing it\n" +
    "  -2                    report whether the queue is empty\n\n" +
    "Print one line for each of the last three. A removal or a peek on an empty queue prints " +
    "EMPTY.",
  inputFormat: "Line 1: the integer q, the number of operations.\nLine 2: q integers, the operations in order.",
  outputFormat:
    "One line per reporting operation: the value, EMPTY, or for the empty test either true or false.",
  constraints: ["1 <= q <= 200000", "-2 <= operation <= 1000000000"],
  hint: "One stack takes new arrivals; the other hands them out in the opposite order.",
  examples: [
    {
      input: "6\n1 2 -1 0 -1 -2\n",
      expected: "1\n1\n2\nfalse",
      note: "Add 1 and 2. The front is 1, removing gives 1, the front is now 2, and the queue is not empty.",
    },
    { input: "3\n-1 0 -2\n", expected: "EMPTY\nEMPTY\ntrue", note: "Everything asked of an empty queue." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n-2\n" },
    { label: "Special case", input: "5\n1 0 2 0 -2\n" },
    { label: "All duplicates", input: "6\n7 7 7 0 -1 -2\n" },
    { label: "Boundary condition", input: "4\n1000000000 -1 0 -2\n" },
    { label: "Special case", input: "8\n1 2 3 0 4 0 -1 -2\n" },
    { label: "Special case", input: "5\n0 0 0 -1 -2\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "q", type: "int", min: 1, max: 200000, scales: true },
      { name: "ops", type: "intArray", length: "q", min: -2, max: 9 },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int q;
    if (!(cin >> q)) return 0;

    vector<long long> in;   // arrivals pile up here
    vector<long long> out;  // reversed, so its top is the queue's front

    // Only move when the departures stack runs dry. Moving on every
    // operation would cost O(n) per call instead of O(1) amortised.
    auto shift = [&]() {
        if (out.empty()) {
            while (!in.empty()) { out.push_back(in.back()); in.pop_back(); }
        }
    };

    string res;
    for (int i = 0; i < q; i++) {
        long long op;
        cin >> op;
        if (op >= 1) {
            in.push_back(op);
        } else if (op == 0) {
            shift();
            if (out.empty()) res += "EMPTY";
            else { res += to_string(out.back()); out.pop_back(); }
            res += '\\n';
        } else if (op == -1) {
            shift();
            res += out.empty() ? "EMPTY" : to_string(out.back());
            res += '\\n';
        } else {
            res += (in.empty() && out.empty()) ? "true" : "false";
            res += '\\n';
        }
    }
    fwrite(res.data(), 1, res.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "A stack hands back the most recent item; a queue must hand back the oldest. The two are " +
      "opposites, and the task is to build one out of the other.",
    approach:
      "Reversing a stack into a second stack puts the oldest item on top. That is the whole " +
      "idea: keep two stacks, one for arrivals and one for departures.\n\n" +
      "The naive version reverses on every operation, which costs O(n) each time. The good " +
      "version only reverses when the departure stack is EMPTY, which makes the average cost " +
      "constant.",
    steps: [
      "Adding a value pushes it onto the arrivals stack. Nothing else happens.",
      "For a removal or a peek, first check the departures stack.",
      "If it is empty, pour the whole arrivals stack into it, which reverses the order.",
      "The top of the departures stack is now the oldest value: peek or pop it.",
      "The queue is empty only when both stacks are.",
    ],
    algorithm: [
      "push(v): in.push(v)",
      "shift(): if out is empty: while in is not empty: out.push(in.pop())",
      "pop():   shift(); return out.pop()",
      "peek():  shift(); return out.top()",
      "empty(): return in.empty() and out.empty()",
    ],
    whyItWorks:
      "Pouring one stack into another reverses it, so the arrivals stack — newest on top — " +
      "becomes a departures stack with the oldest on top. Taking from there is exactly " +
      "first-in-first-out.\n\n" +
      "The condition for pouring is what makes it efficient, and it has to be \"only when the " +
      "departures stack is empty\". Pouring while it still holds items would put newer arrivals " +
      "underneath older ones and break the order outright.\n\n" +
      "The cost argument is amortisation. Each value is moved from one stack to the other " +
      "exactly once in its lifetime, so n operations do at most n moves in total. A single " +
      "removal may cost O(n) when it triggers a pour, but the average across all operations is " +
      "constant — which is the standard meaning of the claim that this is an O(1) queue.",
    complexity: {
      time: "O(1) amortised per operation, O(n) for a single unlucky one",
      space: "O(n)",
      explanation:
        "Each value moves between the stacks once. Reversing on every call instead would be " +
        "O(n) per operation with no amortisation to rescue it.",
    },
    edgeCases: [
      "Every operation on an empty queue.",
      "Alternating add and remove, which triggers a pour on each removal but only ever moves one value.",
      "Many adds followed by many removals, the case the amortisation is about.",
      "Testing for empty, which must consult BOTH stacks.",
      "Pouring while the departures stack is non-empty, which silently reorders the queue.",
    ],
    implementation: `void shift() {
    if (out.empty())                   // only when empty, never otherwise
        while (!in.empty()) { out.push_back(in.back()); in.pop_back(); }
}
pop():   shift(); return out.pop_back();
empty(): return in.empty() && out.empty();   // both`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 232, sourceCategory: "Stacks and Queues" },
};
