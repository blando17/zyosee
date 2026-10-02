module.exports = {
  problemId: "dsa-300",
  slug: "longest-increasing-subsequence",
  title: "Longest Increasing Subsequence",
  difficulty: "Medium",
  topics: ["array", "dynamic programming", "binary search"],
  timeLimitMs: 3000,
  statement:
    "You are given an array of n integers.\n\n" +
    "A subsequence is what is left after deleting some elements without reordering the rest. " +
    "Print the length of the longest subsequence whose values strictly increase.",
  inputFormat: "Line 1: the integer n.\nLine 2: n integers.",
  outputFormat: "One line holding the length of the longest strictly increasing subsequence.",
  constraints: ["1 <= n <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "Keep the smallest possible tail for an increasing run of each length.",
  examples: [
    { input: "8\n10 9 2 5 3 7 101 18\n", expected: "4", note: "2, 3, 7, 101 is one of the longest." },
    { input: "4\n7 7 7 7\n", expected: "1", note: "Equal values do not strictly increase." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n5\n" },
    { label: "All duplicates", input: "5\n3 3 3 3 3\n" },
    { label: "Special case", input: "5\n5 4 3 2 1\n" },
    { label: "Special case", input: "5\n1 2 3 4 5\n" },
    { label: "Negative values", input: "5\n-5 -3 -4 -1 -2\n" },
    { label: "Overflow risk", input: "3\n-1000000000 0 1000000000\n" },
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

    // tails[k] = the smallest value that can end an increasing run of length
    // k+1. It is always sorted, which is what makes the binary search valid.
    vector<long long> tails;
    long long v;
    for (int i = 0; i < n; i++) {
        cin >> v;
        // lower_bound, not upper_bound: replacing an equal value keeps the
        // sequence STRICTLY increasing.
        auto it = lower_bound(tails.begin(), tails.end(), v);
        if (it == tails.end()) tails.push_back(v);
        else *it = v;
    }
    cout << tails.size() << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "A subsequence keeps the original order but may skip elements. Only the LENGTH of the " +
      "longest increasing one is wanted, not the subsequence itself, and increases must be " +
      "strict so equal values cannot both be used.",
    approach:
      "The straightforward dynamic programme asks, for each position, the length of the longest " +
      "increasing subsequence ending there. It compares every earlier element, giving O(n^2) — " +
      "which at n = 100000 is ten billion comparisons and far too slow.\n\n" +
      "The faster method keeps a list of tails: for every possible length, the SMALLEST value " +
      "that can end an increasing run of that length. That list is always sorted, so each new " +
      "value can be placed with a binary search.",
    steps: [
      "Start with an empty list of tails.",
      "For each value, find the first tail that is greater than or equal to it.",
      "If there is none, this value extends the longest run: append it.",
      "Otherwise overwrite that tail with this value, which is smaller or equal and therefore a better ending.",
      "The answer is the length of the list.",
    ],
    algorithm: [
      "tails = empty",
      "for each value v:",
      "    i = first position in tails with tails[i] >= v",
      "    if i is past the end: append v",
      "    else: tails[i] = v",
      "print length of tails",
    ],
    whyItWorks:
      "The list stays sorted because a run of length k + 1 must end on a value larger than some " +
      "value ending a run of length k. That is what justifies the binary search.\n\n" +
      "Replacing a tail never shortens anything. The run of that length still exists — it just " +
      "now ends on a smaller value, which can only make future extensions easier. Appending is " +
      "the only operation that grows the answer, and it happens exactly when a value exceeds " +
      "every tail, meaning it genuinely extends the longest run found so far.\n\n" +
      "The list itself is NOT the subsequence. Its entries can come from positions all over the " +
      "array and need not appear in that order; only its length is meaningful.\n\n" +
      "Strictness is decided by the search. A lower bound finds the first tail >= v and " +
      "overwrites it, so an equal value replaces rather than extends. An upper bound would " +
      "extend on equality and solve the non-decreasing version instead.",
    complexity: {
      time: "O(n log n)",
      space: "O(n)",
      explanation:
        "One binary search per element. The quadratic version is simpler to derive and fine for " +
        "small n, but not at 100000.",
    },
    edgeCases: [
      "A single element, giving 1.",
      "All values equal, giving 1 because increases must be strict.",
      "A strictly decreasing array, also 1.",
      "A strictly increasing array, giving n.",
      "Using an upper bound instead of a lower bound, which silently answers the non-decreasing question.",
    ],
    implementation: `vector<long long> tails;
for (each value v) {
    auto it = lower_bound(tails.begin(), tails.end(), v);  // >= : strict
    if (it == tails.end()) tails.push_back(v);
    else *it = v;
}
return tails.size();`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 300, sourceCategory: "Dynamic Programming" },
};
