module.exports = {
  problemId: "dsa-704",
  slug: "binary-search",
  title: "Binary Search",
  difficulty: "Easy",
  topics: ["array", "binary search"],
  timeLimitMs: 2000,
  statement:
    "You are given an array of n distinct integers sorted in increasing order, and a target.\n\n" +
    "Print the index of the target in the array, counting from 0, or -1 if it is not there.",
  inputFormat: "Line 1: the integer n.\nLine 2: n distinct integers in increasing order.\nLine 3: the target.",
  outputFormat: "One line holding the index of the target, or -1.",
  constraints: ["1 <= n <= 100000", "-1000000000 <= value <= 1000000000", "All values are distinct"],
  hint: "Halve the range you are still searching at every step.",
  examples: [
    { input: "6\n-1 0 3 5 9 12\n9\n", expected: "4", note: "9 sits at index 4." },
    { input: "6\n-1 0 3 5 9 12\n2\n", expected: "-1", note: "2 is not in the array." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n5\n5\n" },
    { label: "Boundary condition", input: "1\n5\n4\n" },
    { label: "Boundary condition", input: "5\n1 2 3 4 5\n1\n" },
    { label: "Boundary condition", input: "5\n1 2 3 4 5\n5\n" },
    { label: "Special case", input: "5\n1 2 3 4 5\n0\n" },
    { label: "Special case", input: "5\n1 2 3 4 5\n6\n" },
    { label: "Overflow risk", input: "2\n-1000000000 1000000000\n1000000000\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "a", type: "intArray", length: "n", min: -1000000000, max: 1000000000, distinct: true, sorted: true },
      // sumOfK with k = 1 picks one element of the array, so the target is
      // always present. A target drawn at random from the value range would
      // essentially never hit, and every generated case would answer -1.
      // The absent cases are curated above.
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

    long long left = 0, right = n - 1, found = -1;
    while (left <= right) {
        // left + (right-left)/2 rather than (left+right)/2, which can overflow.
        long long mid = left + (right - left) / 2;
        if (a[mid] == target) { found = mid; break; }
        if (a[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    cout << found << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The array is sorted, which means a single comparison rules out half of it. That is the " +
      "entire leverage: scanning would be O(n), but exploiting the order gives O(log n).",
    approach:
      "Keep a window of the array that could still hold the target, described by two indices. " +
      "Look at the middle. If it is the target you are done. If it is too small, nothing to its " +
      "left can be the target either, so move the left edge past it. If it is too large, do the " +
      "mirror. Each step throws away half the window.",
    steps: [
      "Set left to 0 and right to n - 1.",
      "While the window is non-empty, take its middle index.",
      "If the value there equals the target, print that index.",
      "If it is smaller than the target, move left to mid + 1.",
      "If it is larger, move right to mid - 1.",
      "If the window empties, the target is absent: print -1.",
    ],
    algorithm: [
      "left = 0, right = n-1",
      "while left <= right:",
      "    mid = left + (right - left) / 2",
      "    if a[mid] == target: return mid",
      "    if a[mid] < target: left = mid + 1",
      "    else: right = mid - 1",
      "return -1",
    ],
    whyItWorks:
      "The invariant is that if the target is anywhere, it is inside the window. It holds at the " +
      "start, when the window is the whole array.\n\n" +
      "Each step preserves it. When a[mid] < target, the array being sorted means every index up " +
      "to and including mid also holds something smaller, so none of them can be the target and " +
      "discarding them loses nothing. The mirror argument covers the other branch.\n\n" +
      "It terminates because the window strictly shrinks every iteration — mid + 1 and mid - 1 " +
      "both exclude mid itself. Writing left = mid or right = mid instead is the classic infinite " +
      "loop, because a window of one element would never change.\n\n" +
      "The midpoint is computed as left + (right - left) / 2 rather than (left + right) / 2. " +
      "The latter can overflow once the indices are large, and it is a real bug that sat in the " +
      "Java standard library for years.",
    complexity: {
      time: "O(log n)",
      space: "O(1)",
      explanation:
        "The window halves each step, so it takes about log2(n) steps to empty. At n = 100000 " +
        "that is 17 comparisons against 100000 for a linear scan.",
    },
    edgeCases: [
      "A single element, matching or not.",
      "The target at the very first or very last index.",
      "A target smaller than everything or larger than everything.",
      "A target absent from the middle of the range, where the window empties without a match.",
      "Large indices, which is why the midpoint avoids the overflowing form.",
    ],
    implementation: `while (left <= right) {
    long long mid = left + (right - left) / 2;   // overflow-safe midpoint
    if (a[mid] == target) return mid;
    if (a[mid] < target) left = mid + 1;         // mid+1, never mid
    else right = mid - 1;
}
return -1;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 704, sourceCategory: "Binary Search" },
};
