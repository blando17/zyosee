module.exports = {
  problemId: "dsa-78",
  slug: "subsets",
  title: "Subsets",
  difficulty: "Medium",
  topics: ["array", "backtracking", "bit manipulation"],
  timeLimitMs: 3000,
  statement:
    "You are given an array of n distinct integers.\n\n" +
    "Print every subset, including the empty one and the array itself.\n\n" +
    "So that the answer is unique, sort the values inside each subset ascending, then sort the " +
    "subsets themselves by comparing their values in order, a shorter subset coming before a " +
    "longer one that starts the same way.",
  inputFormat: "Line 1: the integer n.\nLine 2: n distinct integers.",
  outputFormat:
    "Line 1: the number of subsets.\n" +
    "Next lines: one subset per line, written as its size followed by its values. The empty " +
    "subset is the single number 0.",
  constraints: ["1 <= n <= 14", "-1000000000 <= value <= 1000000000", "All values are distinct"],
  hint: "At every value you face one choice: include it or leave it out.",
  examples: [
    {
      input: "3\n1 2 3\n",
      expected: "8\n0\n1 1\n2 1 2\n3 1 2 3\n2 1 3\n1 2\n2 2 3\n1 3",
      note: "Eight subsets, each written as its size then its values.",
    },
    { input: "1\n7\n", expected: "2\n0\n1 7", note: "The empty subset and the whole array." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n0\n" },
    { label: "Negative values", input: "3\n-3 -1 2\n" },
    { label: "Largest allowed input", input: "14\n1 2 3 4 5 6 7 8 9 10 11 12 13 14\n" },
    { label: "Special case", input: "2\n-1000000000 1000000000\n" },
    { label: "Normal case", input: "4\n5 1 4 2\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      // 14 is the ceiling because the output doubles with every extra value:
      // 2^14 is 16384 subsets, and 2^20 would be a million.
      { name: "n", type: "int", min: 1, max: 14, scales: true },
      { name: "a", type: "intArray", length: "n", min: -1000000000, max: 1000000000, distinct: true },
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
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    // Sorting the input first means every subset comes out ascending, and the
    // subsets themselves come out in the required order without a final sort.
    sort(a.begin(), a.end());

    vector<vector<long long>> all;
    vector<long long> current;
    // Explicit stack rather than recursion is unnecessary at n = 14, but the
    // shape below is the standard backtracking one: choose, recurse, undo.
    function<void(int)> build = [&](int start) {
        all.push_back(current);
        for (int i = start; i < n; i++) {
            current.push_back(a[i]);
            build(i + 1);
            current.pop_back();
        }
    };
    build(0);

    sort(all.begin(), all.end());

    string out = to_string(all.size());
    out += '\\n';
    for (auto &s : all) {
        out += to_string(s.size());
        for (long long v : s) { out += ' '; out += to_string(v); }
        out += '\\n';
    }
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Every value is either in a subset or not, independently of the others. So there are " +
      "exactly 2^n subsets, and the task is to produce all of them in a fixed order.",
    approach:
      "Backtracking walks the array making that yes-or-no choice at each position. The standard " +
      "shape is: record the subset built so far, then for each remaining value add it, recurse, " +
      "and remove it again.\n\n" +
      "The same set can be produced by counting from 0 to 2^n - 1 and reading each number's bits " +
      "as inclusion flags, which is often shorter to write.",
    steps: [
      "Sort the input first, so every subset is produced in ascending order.",
      "Record the current subset — the empty one is recorded immediately.",
      "For each value from the current position onwards, add it and recurse from the next position.",
      "Remove it before trying the next value, so the state is restored.",
      "Sort the collected subsets to fix the output order.",
    ],
    algorithm: [
      "sort the input",
      "build(start):",
      "    record a copy of current",
      "    for i from start to n-1:",
      "        current.push(a[i]); build(i + 1); current.pop()",
    ],
    whyItWorks:
      "Recursing from i + 1 rather than from start is what makes each subset appear once. A " +
      "value can never be chosen again later in the same branch, so no subset is built in two " +
      "different orders.\n\n" +
      "Recording at the TOP of the call, before the loop, is what includes the empty subset and " +
      "every partial one. Recording only at the bottom of the recursion would produce just the " +
      "full array.\n\n" +
      "The undo step after the recursive call is the part that makes it backtracking rather than " +
      "plain recursion. Without it the shared buffer would keep values from branches already " +
      "finished, and every later subset would be wrong.\n\n" +
      "Sorting the input first is not cosmetic here: it is what makes the required output order " +
      "achievable, since a subset's values must come out ascending.",
    complexity: {
      time: "O(n * 2^n)",
      space: "O(n * 2^n) for the output",
      explanation:
        "There are 2^n subsets and each takes O(n) to copy and print. That is optimal, since " +
        "the output itself is that large.",
    },
    edgeCases: [
      "A single value, giving two subsets.",
      "The empty subset, which must be present and is printed as a lone 0.",
      "Negative values, which sort before positive ones.",
      "The largest allowed n, where the output is 16384 lines.",
      "Forgetting the undo, which corrupts every subsequent subset.",
    ],
    implementation: `void build(int start) {
    all.push_back(current);              // record BEFORE the loop
    for (int i = start; i < n; i++) {
        current.push_back(a[i]);
        build(i + 1);                    // i+1: never reuse a value
        current.pop_back();              // undo
    }
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 78, sourceCategory: "Recursion and Backtracking" },
};
