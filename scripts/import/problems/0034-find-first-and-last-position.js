module.exports = {
  problemId: "dsa-34",
  slug: "find-first-and-last-position",
  title: "Find First and Last Position of an Element",
  difficulty: "Medium",
  topics: ["array", "binary search"],
  timeLimitMs: 2000,
  statement:
    "You are given an array of n integers sorted in non-decreasing order, and a target.\n\n" +
    "Print the first and the last index at which the target appears. If it does not appear at " +
    "all, print -1 -1.",
  inputFormat: "Line 1: the integer n.\nLine 2: n integers in non-decreasing order.\nLine 3: the target.",
  outputFormat: "One line holding two integers: the first and last index, or -1 -1.",
  constraints: ["1 <= n <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "Two searches: one that leans left on a match, one that leans right.",
  examples: [
    { input: "6\n5 7 7 8 8 10\n8\n", expected: "3 4", note: "8 runs from index 3 to index 4." },
    { input: "6\n5 7 7 8 8 10\n6\n", expected: "-1 -1", note: "6 never appears." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n5\n5\n" },
    { label: "Boundary condition", input: "1\n5\n4\n" },
    { label: "All duplicates", input: "6\n7 7 7 7 7 7\n7\n" },
    { label: "Boundary condition", input: "5\n1 2 3 4 5\n1\n" },
    { label: "Boundary condition", input: "5\n1 2 3 4 5\n5\n" },
    { label: "Special case", input: "5\n1 1 2 3 3\n2\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      // A narrow value range on purpose: it guarantees long runs of equal
      // values, which is what this problem is about. A wide range would make
      // nearly every answer a run of length one.
      { name: "a", type: "intArray", length: "n", min: 0, max: 50, sorted: true },
      { name: "target", type: "sumOfK", from: "a", k: 1 },
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
    long long target;
    cin >> target;

    // lower_bound: first index whose value is >= target.
    // upper_bound: first index whose value is  > target.
    long long lo = lower_bound(a.begin(), a.end(), target) - a.begin();
    long long hi = upper_bound(a.begin(), a.end(), target) - a.begin() - 1;

    if (lo >= n || a[lo] != target) cout << "-1 -1\\n";
    else cout << lo << " " << hi << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Equal values in a sorted array sit together in one run. The answer is where that run " +
      "starts and where it ends, or -1 -1 when the run is empty.",
    approach:
      "Finding any one occurrence is ordinary binary search, but walking outwards from it to " +
      "find the ends is O(n) when the run is long — an array of one repeated value degrades to " +
      "a linear scan.\n\n" +
      "Run two binary searches instead, each with a modified rule. One does not stop on a match " +
      "but keeps moving left, so it settles on the first occurrence. The other keeps moving " +
      "right and settles just past the last.",
    steps: [
      "Search for the first index whose value is at least the target. That is the start of the run.",
      "Search for the first index whose value is strictly greater than the target. That is one past the end.",
      "Subtract one to get the last index of the run.",
      "If the start ran off the array, or the value there is not the target, the target is absent.",
      "Otherwise print the two indices.",
    ],
    algorithm: [
      "lo = first index with a[i] >= target      (lower bound)",
      "hi = first index with a[i] >  target, minus 1   (upper bound - 1)",
      "if lo == n or a[lo] != target: print -1 -1",
      "else print lo and hi",
    ],
    whyItWorks:
      "Both searches are looking for a boundary rather than a value, which is why neither stops " +
      "early on a match. In a sorted array the predicate \"is this value at least the target\" is " +
      "false then true, never alternating, so there is exactly one crossing point and binary " +
      "search finds it.\n\n" +
      "The lower bound lands on that crossing, which is the first occurrence when the target is " +
      "present. The upper bound uses the strictly-greater predicate, so its crossing is the " +
      "first index past the run; subtracting one gives the last occurrence.\n\n" +
      "The absence check has to look at the value, not just the index. A lower bound always " +
      "returns a position — the place the target WOULD go — so a missing target still yields a " +
      "valid index pointing at something larger.",
    complexity: {
      time: "O(log n)",
      space: "O(1)",
      explanation:
        "Two binary searches. The walk-outwards approach is O(log n + k) where k is the run " +
        "length, which is O(n) when the array is one repeated value.",
    },
    edgeCases: [
      "A target that appears once, where the two answers are equal.",
      "An array of one repeated value equal to the target, where the run is the whole array.",
      "A target absent but within the range of values, which the value check catches.",
      "A target smaller or larger than everything, where the lower bound lands at 0 or at n.",
      "Walking outwards instead of searching, which is correct but slow on long runs.",
    ],
    implementation: `long long lo = lower_bound(a.begin(), a.end(), target) - a.begin();
long long hi = upper_bound(a.begin(), a.end(), target) - a.begin() - 1;
if (lo >= n || a[lo] != target) return {-1, -1};   // a position is always returned
return {lo, hi};`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 34, sourceCategory: "Binary Search" },
};
