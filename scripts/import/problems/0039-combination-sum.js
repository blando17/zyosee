module.exports = {
  problemId: "dsa-39",
  slug: "combination-sum",
  title: "Combination Sum",
  difficulty: "Medium",
  topics: ["array", "backtracking"],
  timeLimitMs: 3000,
  statement:
    "You are given c distinct positive integers and a target.\n\n" +
    "Print every combination of them that adds up to exactly the target. Each number may be " +
    "used as many times as you like. Two combinations are the same if they use the same numbers " +
    "the same number of times.\n\n" +
    "So that the answer is unique, sort the values inside each combination ascending, then sort " +
    "the combinations by comparing their values in order.",
  inputFormat: "Line 1: the integer c.\nLine 2: c distinct positive integers.\nLine 3: the target.",
  outputFormat:
    "Line 1: the number of combinations.\n" +
    "Next lines: one combination per line, its values separated by single spaces.",
  constraints: ["1 <= c <= 8", "1 <= value <= 40", "1 <= target <= 40"],
  hint: "Allow a number to be chosen again, but never go back to an earlier one.",
  examples: [
    { input: "3\n2 3 6\n7\n", expected: "1\n2 2 3", note: "Only 2 + 2 + 3 reaches 7; 7 itself is not one of the numbers." },
    { input: "3\n2 3 5\n8\n", expected: "3\n2 2 2 2\n2 3 3\n3 5", note: "Three ways to reach 8, in sorted order." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n1\n1\n" },
    { label: "Boundary condition", input: "1\n5\n3\n" },
    { label: "Special case", input: "2\n2 4\n7\n" },
    { label: "Largest practical input", input: "3\n1 2 3\n20\n" },
    { label: "Normal case", input: "4\n2 3 6 7\n7\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "c", type: "int", min: 1, max: 8, scales: true },
      // Small values against a small target: the number of combinations grows
      // very quickly when the smallest value is 1 and the target is large.
      { name: "vals", type: "intArray", length: "c", min: 2, max: 40, distinct: true },
      { name: "target", type: "int", min: 1, max: 40, scales: true },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int c;
    if (!(cin >> c)) return 0;
    vector<long long> v(c);
    for (int i = 0; i < c; i++) cin >> v[i];
    long long target; cin >> target;

    sort(v.begin(), v.end());

    vector<vector<long long>> all;
    vector<long long> current;
    function<void(int, long long)> build = [&](int start, long long left) {
        if (left == 0) { all.push_back(current); return; }
        for (int i = start; i < c; i++) {
            if (v[i] > left) break;   // sorted, so everything after is too big
            current.push_back(v[i]);
            // i, not i + 1: the same value may be chosen again.
            build(i, left - v[i]);
            current.pop_back();
        }
    };
    build(0, target);

    sort(all.begin(), all.end());

    string out = to_string(all.size());
    out += '\\n';
    for (auto &comb : all) {
        for (size_t i = 0; i < comb.size(); i++) {
            if (i) out += ' ';
            out += to_string(comb[i]);
        }
        out += '\\n';
    }
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Numbers may be reused, so combinations can be longer than the input. What makes two " +
      "combinations the same is the multiset of numbers, not the order they were picked in — " +
      "2 + 3 + 3 and 3 + 2 + 3 are one combination, not two.",
    approach:
      "Backtracking with a running remainder. At each step, choose a number, subtract it, and " +
      "recurse. When the remainder hits zero the current combination is an answer; if it goes " +
      "negative the branch is dead.\n\n" +
      "The two details that matter are how reuse is allowed and how duplicates are avoided, and " +
      "they are the same line of code.",
    steps: [
      "Sort the numbers ascending.",
      "Track a remainder, starting at the target.",
      "If the remainder is zero, record the current combination.",
      "Otherwise try each number from the current index onwards.",
      "If a number exceeds the remainder, stop the loop — everything after it is larger still.",
      "Otherwise subtract it and recurse from the SAME index, then undo.",
    ],
    algorithm: [
      "sort the values",
      "build(start, left):",
      "    if left == 0: record current; return",
      "    for i from start to c-1:",
      "        if v[i] > left: break",
      "        current.push(v[i]); build(i, left - v[i]); current.pop()",
    ],
    whyItWorks:
      "Recursing from `i` rather than `i + 1` is what permits reuse: the same number is still " +
      "available at the next level. Recursing from `i + 1` would solve a different problem, " +
      "where each number may be used once.\n\n" +
      "Never going BACK below `start` is what stops duplicates. Every combination is therefore " +
      "built in non-decreasing order of value, so there is exactly one path to it and no " +
      "reordering of the same multiset can be produced twice.\n\n" +
      "The early break relies on the sort. Once a value exceeds the remainder, every later value " +
      "does too, so the rest of the loop cannot produce anything — turning a wasted subtree into " +
      "an immediate return. With a `continue` instead the answer stays correct but the search " +
      "keeps exploring branches it already knows are hopeless.",
    complexity: {
      time: "exponential in the target divided by the smallest value",
      space: "O(target / smallest value) for the recursion, plus the output",
      explanation:
        "There is no polynomial bound: the number of combinations itself can be exponential. " +
        "The pruning cuts the search hard in practice.",
    },
    edgeCases: [
      "No combination reaching the target, giving a count of 0.",
      "A single number that divides the target exactly.",
      "A number equal to the target, giving a combination of length one.",
      "A small smallest value with a large target, which is where the count explodes.",
      "Recursing from i + 1, which silently forbids reuse.",
    ],
    implementation: `for (int i = start; i < c; i++) {
    if (v[i] > left) break;          // sorted: the rest are larger too
    current.push_back(v[i]);
    build(i, left - v[i]);           // i, not i+1: reuse allowed
    current.pop_back();
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 39, sourceCategory: "Recursion and Backtracking" },
};
