module.exports = {
  problemId: "dsa-225",
  slug: "implement-stack-using-queues",
  title: "Implement a Stack Using Queues",
  difficulty: "Easy",
  topics: ["stack", "queue", "design"],
  timeLimitMs: 2000,
  statement:
    "Build a last-in-first-out stack using only queues. The only operations you may use on the " +
    "underlying storage are add to the back, remove from the front, look at the front, and test " +
    "for empty.\n\n" +
    "You are given a list of operations, written as integers:\n\n" +
    "  a value of 1 or more  push that value\n" +
    "  0                     remove the top value and report it\n" +
    "  -1                    report the top value without removing it\n" +
    "  -2                    report whether the stack is empty\n\n" +
    "Print one line for each of the last three. A removal or a peek on an empty stack prints EMPTY.",
  inputFormat: "Line 1: the integer q, the number of operations.\nLine 2: q integers, the operations in order.",
  outputFormat:
    "One line per reporting operation: the value, EMPTY, or for the empty test either true or false.",
  constraints: ["1 <= q <= 100000", "-2 <= operation <= 1000000000"],
  hint: "After adding a value, rotate everything already there around behind it.",
  examples: [
    {
      input: "6\n1 2 -1 0 -1 -2\n",
      expected: "2\n2\n1\nfalse",
      note: "Push 1 then 2. The top is 2, removing gives 2, the top is then 1.",
    },
    { input: "3\n-1 0 -2\n", expected: "EMPTY\nEMPTY\ntrue", note: "Everything asked of an empty stack." },
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
      // Lower than the queue problem's limit: pushing is O(n) here, so the
      // whole run is quadratic in the number of pushes and 200000 would be
      // genuinely slow rather than merely large.
      { name: "q", type: "int", min: 1, max: 20000, scales: true },
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

    deque<long long> qu;   // used only as a queue: push_back, pop_front, front

    string res;
    for (int i = 0; i < q; i++) {
        long long op;
        cin >> op;
        if (op >= 1) {
            // Add at the back, then rotate everything that was already there
            // around behind it, so the newest value ends up at the front.
            qu.push_back(op);
            for (size_t k = 1; k < qu.size(); k++) {
                qu.push_back(qu.front());
                qu.pop_front();
            }
        } else if (op == 0) {
            if (qu.empty()) res += "EMPTY";
            else { res += to_string(qu.front()); qu.pop_front(); }
            res += '\\n';
        } else if (op == -1) {
            res += qu.empty() ? "EMPTY" : to_string(qu.front());
            res += '\\n';
        } else {
            res += qu.empty() ? "true" : "false";
            res += '\\n';
        }
    }
    fwrite(res.data(), 1, res.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "A queue hands back the oldest item; a stack must hand back the newest. This is the " +
      "mirror of building a queue from stacks, but the costs do not mirror — one of the two " +
      "operations is forced to be expensive.",
    approach:
      "Keep the queue in the order a stack would want, newest at the front. That way removing " +
      "and peeking are just the queue's own front operations.\n\n" +
      "The work moves into pushing. After adding the new value at the back, rotate every OTHER " +
      "value around behind it: remove from the front and add to the back, once for each of them. " +
      "The new value surfaces at the front and the rest keep their relative order.",
    steps: [
      "To push, add the value at the back.",
      "Then, once for each value that was already there, take from the front and put it at the back.",
      "The new value is now at the front, with the others behind it in stack order.",
      "Removing and peeking are the queue's front operations, unchanged.",
      "Empty is the queue's own empty test.",
    ],
    algorithm: [
      "push(v): q.add(v); repeat (size - 1) times: q.add(q.remove())",
      "pop():   return q.remove()",
      "top():   return q.front()",
      "empty(): return q.empty()",
    ],
    whyItWorks:
      "After the rotation the new value sits at the front, and the others follow in the same " +
      "order they had before — which, by induction, is newest-first. So the front is always the " +
      "most recently pushed value, which is exactly what a stack's top means.\n\n" +
      "The rotation count must be the size BEFORE the push, that is size - 1 afterwards. " +
      "Rotating one time too many brings the new value round again and puts the second-newest in " +
      "front; one too few leaves the new value buried.\n\n" +
      "The asymmetry with the queue-from-stacks problem is worth noticing. There, each value " +
      "moved once in its lifetime and the cost amortised away to O(1). Here every push rotates " +
      "the entire structure, so the O(n) cost is paid on every single push and no amortisation " +
      "argument can remove it. Pushing n values costs O(n^2) in total — which is why this " +
      "problem's input limit is set lower than the other's.",
    complexity: {
      time: "O(n) per push, O(1) for pop, top and empty",
      space: "O(n)",
      explanation:
        "n pushes cost O(n^2) altogether. The cost can be moved to pop instead, but it cannot " +
        "be removed from both.",
    },
    edgeCases: [
      "Every operation on an empty stack.",
      "Pushing a single value, where the rotation loop runs zero times.",
      "Alternating push and pop, where each push rotates only a short queue.",
      "Many pushes in a row, the quadratic case.",
      "Rotating the wrong number of times, which leaves the wrong value at the front.",
    ],
    implementation: `push(v):
    q.push_back(v);
    for (k = 1; k < q.size(); k++) {     // size - 1 rotations
        q.push_back(q.front());
        q.pop_front();
    }
pop():  return q.pop_front();            // front is the newest`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 225, sourceCategory: "Stacks and Queues" },
};
