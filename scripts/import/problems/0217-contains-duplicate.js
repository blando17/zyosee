module.exports = {
  problemId: "dsa-217",
  slug: "contains-duplicate",
  title: "Contains Duplicate",
  difficulty: "Easy",
  topics: ["array", "hash set", "sorting"],
  timeLimitMs: 2000,

  statement:
    "You are given an array of n integers.\n\n" +
    "Print true if any value appears more than once, and false if every value is different.",

  inputFormat: "Line 1: the integer n, the length of the array.\nLine 2: n integers, the array.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["1 <= n <= 100000", "-1000000000 <= a[i] <= 1000000000"],
  hint: "Remember what you have already seen, and stop the moment something repeats.",

  examples: [
    { input: "4\n1 2 3 1\n", expected: "true", note: "The value 1 appears at both ends." },
    { input: "4\n1 2 3 4\n", expected: "false", note: "Every value is different." },
  ],

  curated: [
    { label: "Smallest allowed input", input: "1\n42\n" },
    { label: "All duplicates", input: "5\n7 7 7 7 7\n" },
    { label: "Negative values", input: "4\n-1 -2 -3 -1\n" },
    { label: "Special case", input: "3\n-1000000000 0 1000000000\n" },
    { label: "Normal case", input: "6\n5 1 4 1 9 2\n" },
  ],

  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "a", type: "intArray", length: "n", min: -1000000000, max: 1000000000 },
    ],
  },

  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;

    unordered_set<long long> seen;
    seen.reserve(n * 2);
    long long x;
    for (int i = 0; i < n; i++) {
        cin >> x;
        if (seen.count(x)) { cout << "true\\n"; return 0; }
        seen.insert(x);
    }
    cout << "false\\n";
    return 0;
}`,
  },

  editorial: {
    understanding:
      "The question is only whether some value repeats, not which one or how often. " +
      "That means the answer can be decided the instant a repeat is found.",
    approach:
      "Comparing every pair is quadratic and far too slow at n = 100000. Two things are fast " +
      "enough. Sorting puts equal values next to each other, so one pass afterwards finds a " +
      "repeat in O(n log n). A hash set is better still: remember every value seen so far and " +
      "check membership before inserting, which is O(n) on average.",
    steps: [
      "Start with an empty set of values seen so far.",
      "Read the array one value at a time.",
      "Before storing a value, ask whether the set already contains it.",
      "If it does, print true and stop immediately — nothing later can change the answer.",
      "If the array runs out without a repeat, print false.",
    ],
    algorithm: [
      "seen = empty hash set",
      "for each value x:",
      "    if x is in seen: print true and stop",
      "    add x to seen",
      "print false",
    ],
    whyItWorks:
      "A value repeats exactly when some occurrence of it is not the first. Reading left to " +
      "right, the set holds precisely the values that have already occurred, so the membership " +
      "test is asking exactly that question about the current element.\n\n" +
      "Stopping early is safe because the answer is a single yes or no: one repeat is enough, " +
      "and no later element can turn a true back into a false.",
    complexity: {
      time: "O(n) on average, O(n log n) if you sort instead",
      space: "O(n) for the set, or O(1) extra if you sort in place",
      explanation:
        "Each value is inserted and looked up once. Hashing is constant time on average; the " +
        "sorting alternative trades a log factor for using no extra memory.",
    },
    edgeCases: [
      "A single element: nothing can repeat, so the answer is false.",
      "Every element identical: the second element already decides it.",
      "Values at the extremes of the range, including negatives, which a hash set handles like any other.",
      "A repeat at the very end, which is the case that stops the early exit from helping.",
    ],
    implementation: `unordered_set<long long> seen;
for (int i = 0; i < n; i++) {
    cin >> x;
    if (seen.count(x)) { cout << "true\\n"; return 0; }
    seen.insert(x);
}
cout << "false\\n";`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 217, sourceCategory: "Arrays" },
};
