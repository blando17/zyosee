module.exports = {
  problemId: "dsa-90",
  slug: "subsets-ii",
  title: "Subsets II",
  difficulty: "Medium",
  topics: ["array", "backtracking"],
  timeLimitMs: 3000,
  statement:
    "You are given an array of n integers which may contain repeats.\n\n" +
    "Print every DISTINCT subset. Two subsets are the same if they contain the same values the " +
    "same number of times, whichever positions those values came from.\n\n" +
    "So that the answer is unique, sort the values inside each subset ascending, then sort the " +
    "subsets by comparing their values in order.",
  inputFormat: "Line 1: the integer n.\nLine 2: n integers, which may repeat.",
  outputFormat:
    "Line 1: the number of distinct subsets.\n" +
    "Next lines: one subset per line, written as its size followed by its values. The empty " +
    "subset is the single number 0.",
  constraints: ["1 <= n <= 14", "-1000 <= value <= 1000"],
  hint: "After sorting, skip a value that equals the one just tried at the same position.",
  examples: [
    {
      input: "3\n1 2 2\n",
      expected: "6\n0\n1 1\n2 1 2\n3 1 2 2\n1 2\n2 2 2",
      note: "Six distinct subsets; the two 2s cannot be told apart.",
    },
    { input: "2\n1 1\n", expected: "3\n0\n1 1\n2 1 1", note: "Empty, one 1, and both 1s." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n0\n" },
    { label: "All duplicates", input: "4\n7 7 7 7\n" },
    { label: "Special case", input: "4\n1 2 3 4\n" },
    { label: "Negative values", input: "4\n-1 -1 2 2\n" },
    { label: "Largest allowed input", input: "14\n1 1 2 2 3 3 4 4 5 5 6 6 7 7\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 14, scales: true },
      // A narrow range so repeats are common — repeats are the whole point of
      // this problem, and a wide range would make it identical to Subsets.
      { name: "a", type: "intArray", length: "n", min: -3, max: 3 },
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

    sort(a.begin(), a.end());

    vector<vector<long long>> all;
    vector<long long> current;
    function<void(int)> build = [&](int start) {
        all.push_back(current);
        for (int i = start; i < n; i++) {
            // Skip a repeat at the SAME position. i > start is what allows a
            // repeated value to be used deeper in the branch while stopping it
            // from being chosen twice as the same slot.
            if (i > start && a[i] == a[i - 1]) continue;
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
      "With repeats in the input, different positions can produce the same subset. Only one copy " +
      "of each should appear, so the count is no longer simply 2^n.",
    approach:
      "Collecting every subset and removing duplicates afterwards works, and wastes time " +
      "generating them. Better to avoid producing a duplicate at all.\n\n" +
      "Sort the input so equal values sit together. Then, at each level of the recursion, use a " +
      "given value at most once as the choice for that slot — skipping later copies of a value " +
      "already tried at this level.",
    steps: [
      "Sort the input so equal values are adjacent.",
      "Record the current subset.",
      "For each value from the current position onwards, skip it if it equals the previous value AND is not the first candidate at this level.",
      "Otherwise add it, recurse from the next position, and remove it.",
    ],
    algorithm: [
      "sort the input",
      "build(start):",
      "    record current",
      "    for i from start to n-1:",
      "        if i > start and a[i] == a[i-1]: continue",
      "        current.push(a[i]); build(i + 1); current.pop()",
    ],
    whyItWorks:
      "The condition is `i > start`, not `i > 0`, and the difference is everything.\n\n" +
      "Two equal values must still be usable TOGETHER — the subset [2,2] is legitimate. That " +
      "happens when the second 2 is chosen in a deeper call, where it is the first candidate and " +
      "`i == start`, so the skip does not apply.\n\n" +
      "What must not happen is choosing either 2 as the same slot, since that produces the same " +
      "subset twice. Those both occur at the same recursion level with `i > start`, which is " +
      "exactly what the skip catches.\n\n" +
      "Writing `i > 0` instead would block [2,2] from ever forming, losing valid subsets. That " +
      "makes the answer too small rather than too large, which is why it is easy to miss.",
    complexity: {
      time: "O(n * 2^n) in the worst case",
      space: "O(n * 2^n) for the output",
      explanation:
        "With no repeats it matches Subsets exactly. With many repeats the output shrinks " +
        "sharply — n identical values give only n + 1 distinct subsets.",
    },
    edgeCases: [
      "All values identical, giving n + 1 subsets rather than 2^n.",
      "No repeats at all, where the answer matches Subsets.",
      "A repeated value that must appear twice in one subset.",
      "Negative repeats.",
      "Using i > 0 instead of i > start, which silently drops valid subsets.",
    ],
    implementation: `sort(a.begin(), a.end());
for (int i = start; i < n; i++) {
    if (i > start && a[i] == a[i-1]) continue;   // same SLOT, not same value
    current.push_back(a[i]); build(i + 1); current.pop_back();
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 90, sourceCategory: "Recursion and Backtracking" },
};
