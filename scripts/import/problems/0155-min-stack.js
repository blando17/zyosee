module.exports = {
  problemId: "dsa-155",
  slug: "min-stack",
  title: "Min Stack",
  difficulty: "Medium",
  topics: ["stack", "design"],
  timeLimitMs: 2000,
  statement:
    "Build a stack that can also report its smallest value, with every operation taking " +
    "constant time.\n\n" +
    "You are given a list of operations to perform, written as integers:\n\n" +
    "  a value of 1 or more  push that value\n" +
    "  0                     remove the top value\n" +
    "  -1                    report the top value\n" +
    "  -2                    report the smallest value in the stack\n\n" +
    "Print one line for each report. If the stack is empty when a report or a removal is asked " +
    "for, print EMPTY for a report and ignore the removal.",
  inputFormat: "Line 1: the integer q, the number of operations.\nLine 2: q integers, the operations in order.",
  outputFormat: "One line per report operation: the value, or EMPTY if the stack was empty.",
  constraints: ["1 <= q <= 200000", "-2 <= operation <= 1000000000"],
  hint: "Alongside the values, keep a second stack of the smallest value seen so far.",
  examples: [
    {
      input: "7\n5 3 -2 -1 0 -2 -1\n",
      expected: "3\n3\n5\n5",
      note: "Push 5 and 3; the minimum is 3 and the top is 3. Remove 3, and both become 5.",
    },
    { input: "3\n-1 -2 0\n", expected: "EMPTY\nEMPTY", note: "Reports on an empty stack." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n-1\n" },
    { label: "All duplicates", input: "7\n4 4 4 -2 0 -2 -1\n" },
    { label: "Special case", input: "9\n3 2 1 -2 0 -2 0 -2 -1\n" },
    { label: "Boundary condition", input: "5\n1000000000 -2 -1 0 -1\n" },
    { label: "Special case", input: "6\n0 0 0 -1 -2 0\n" },
    { label: "Normal case", input: "10\n2 7 1 -2 0 -2 5 -2 -1 0\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "q", type: "int", min: 1, max: 200000, scales: true },
      // The whole point of encoding operations as integers: a random sequence
      // is always a VALID one. Generating "push/pop/top" words would need the
      // generator to track whether the stack is empty, which it cannot do.
      // Defining reports on an empty stack as EMPTY is what removes that
      // requirement, and it exercises the empty path for free.
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

    vector<long long> values;   // the stack itself
    vector<long long> mins;     // the smallest value at or below each level

    string out;
    for (int i = 0; i < q; i++) {
        long long op;
        cin >> op;
        if (op >= 1) {
            values.push_back(op);
            mins.push_back(mins.empty() ? op : min(mins.back(), op));
        } else if (op == 0) {
            if (!values.empty()) { values.pop_back(); mins.pop_back(); }
        } else if (op == -1) {
            out += values.empty() ? "EMPTY" : to_string(values.back());
            out += '\\n';
        } else {
            out += mins.empty() ? "EMPTY" : to_string(mins.back());
            out += '\\n';
        }
    }
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "A stack already gives push, pop and top in constant time. The new requirement is the " +
      "minimum, also in constant time — so scanning the stack to find it is not allowed.",
    approach:
      "Keeping a single variable for the minimum fails, because popping that value leaves no way " +
      "to know what the new minimum is; the information has been thrown away.\n\n" +
      "The fix is to keep a minimum for every level of the stack. Alongside each value, store " +
      "the smallest value at or below it. Pushing computes one new entry from the previous one, " +
      "and popping simply discards a level, restoring the earlier minimum automatically.",
    steps: [
      "Keep two stacks that always have the same height: the values, and the running minimum.",
      "On push, add the value, and add the smaller of it and the current minimum.",
      "On pop, remove from both.",
      "The top value is the top of the first stack; the minimum is the top of the second.",
    ],
    algorithm: [
      "push(v): values.push(v); mins.push(mins.empty ? v : min(mins.top, v))",
      "pop():    values.pop(); mins.pop()",
      "top():    return values.top()",
      "getMin(): return mins.top()",
    ],
    whyItWorks:
      "The invariant is that mins[i] is the smallest of values[0..i]. Pushing preserves it " +
      "because the smallest of the first i+1 values is either the new value or the smallest of " +
      "the first i, and the push computes exactly that.\n\n" +
      "Popping preserves it for free. The entry being removed described a state that no longer " +
      "exists, and the entry beneath it already describes the state being returned to. That is " +
      "the insight a single minimum variable cannot reproduce: it would have to recompute.\n\n" +
      "Every operation touches only the ends of two arrays, so all four are constant time. The " +
      "cost is O(n) extra memory, which can be reduced by only pushing onto the minimum stack " +
      "when a new value ties or beats the current minimum — at the price of a subtler pop.",
    complexity: {
      time: "O(1) for every operation",
      space: "O(n)",
      explanation:
        "Two stacks of equal height. Storing a minimum per level is what buys constant-time " +
        "getMin; scanning would be O(n) per query.",
    },
    edgeCases: [
      "Reporting on an empty stack, answered EMPTY here.",
      "Removing from an empty stack, which is ignored.",
      "Repeated equal minimums, where using a strict comparison to decide what to push can pop one copy too early.",
      "The minimum being removed, so the previous minimum must return.",
      "A single element, where the top and the minimum are the same value.",
    ],
    implementation: `push(v): values.push(v);
         mins.push(mins.empty() ? v : min(mins.back(), v));
pop():   values.pop_back(); mins.pop_back();   // previous minimum returns free
getMin(): return mins.back();`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 155, sourceCategory: "Stacks and Queues" },
};
