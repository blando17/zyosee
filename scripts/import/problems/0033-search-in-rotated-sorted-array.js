module.exports = {
  problemId: "dsa-33",
  slug: "search-in-rotated-sorted-array",
  title: "Search in Rotated Sorted Array",
  difficulty: "Medium",
  topics: ["array", "binary search"],
  timeLimitMs: 2000,
  statement:
    "An array of n distinct integers was sorted in increasing order, then rotated left by some " +
    "unknown amount. Rotating [1,2,3,4,5] by 2 gives [3,4,5,1,2].\n\n" +
    "You are given the rotated array and a target. Print the index of the target, counting " +
    "from 0, or -1 if it is not there.\n\n" +
    "The rotation may be by zero, so a plainly sorted array is a valid input.",
  inputFormat: "Line 1: the integer n.\nLine 2: n distinct integers, a rotated sorted array.\nLine 3: the target.",
  outputFormat: "One line holding the index of the target, or -1.",
  constraints: ["1 <= n <= 100000", "-1000000000 <= value <= 1000000000", "All values are distinct"],
  hint: "Whatever the rotation, at least one half of the window is properly sorted.",
  examples: [
    { input: "7\n4 5 6 7 0 1 2\n0\n", expected: "4", note: "0 sits at index 4 after the rotation." },
    { input: "7\n4 5 6 7 0 1 2\n3\n", expected: "-1", note: "3 is not in the array." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n5\n5\n" },
    { label: "Boundary condition", input: "1\n5\n4\n" },
    { label: "Special case", input: "5\n1 2 3 4 5\n4\n" },
    { label: "Boundary condition", input: "5\n2 3 4 5 1\n1\n" },
    { label: "Boundary condition", input: "5\n5 1 2 3 4\n5\n" },
    { label: "Special case", input: "2\n3 1\n1\n" },
    { label: "Special case", input: "3\n1 2 3\n0\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      // rotate is what makes these cases actually rotated. Without it every
      // generated array would be rotated by zero — plainly sorted — and the
      // one thing this problem is about would never be tested.
      { name: "a", type: "intArray", length: "n", min: -1000000000, max: 1000000000, distinct: true, sorted: true, rotate: true },
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
        long long mid = left + (right - left) / 2;
        if (a[mid] == target) { found = mid; break; }

        if (a[left] <= a[mid]) {
            // The left half is properly sorted.
            if (a[left] <= target && target < a[mid]) right = mid - 1;
            else left = mid + 1;
        } else {
            // Then the right half must be.
            if (a[mid] < target && target <= a[right]) left = mid + 1;
            else right = mid - 1;
        }
    }
    cout << found << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The array is sorted but starts in the wrong place, so it rises, drops once, and rises " +
      "again. Ordinary binary search fails because comparing the midpoint with the target no " +
      "longer says which side to keep.",
    approach:
      "Finding the rotation point first and then searching the right piece works, and costs two " +
      "binary searches.\n\n" +
      "One search is enough with an extra observation: cut anywhere and at least one of the two " +
      "halves is free of the drop, so that half is properly sorted. Identify which, and you can " +
      "decide by ordinary comparison whether the target lies in it.",
    steps: [
      "Take the midpoint as usual.",
      "Decide which half is sorted by comparing the leftmost value with the midpoint.",
      "If the left half is sorted, check whether the target lies between those two values. If it does, keep the left half; otherwise keep the right.",
      "If the right half is sorted instead, do the mirror check against the midpoint and the rightmost value.",
      "Repeat until found or the window empties.",
    ],
    algorithm: [
      "while left <= right:",
      "    mid = left + (right - left) / 2",
      "    if a[mid] == target: return mid",
      "    if a[left] <= a[mid]:            # left half sorted",
      "        if a[left] <= target < a[mid]: right = mid - 1 else left = mid + 1",
      "    else:                            # right half sorted",
      "        if a[mid] < target <= a[right]: left = mid + 1 else right = mid - 1",
      "return -1",
    ],
    whyItWorks:
      "There is exactly one drop in the array. A midpoint splits the window into two halves, and " +
      "the drop can only be in one of them — so the other is a plain increasing run.\n\n" +
      "The test a[left] <= a[mid] identifies which. If it holds there is no drop between left " +
      "and mid, so that half is sorted; if it fails, the drop is on the left and the right half " +
      "must be clean.\n\n" +
      "Once a half is known to be sorted, deciding whether the target is inside it is a plain " +
      "range check against its two ends. If it is, search there; if not, the target can only be " +
      "in the other half. Either way one half is discarded, so the search is still logarithmic.\n\n" +
      "The <= in a[left] <= a[mid] matters: when the window is two elements, mid equals left, " +
      "and a strict < would misclassify that half as unsorted.",
    complexity: {
      time: "O(log n)",
      space: "O(1)",
      explanation:
        "One half is discarded per step, exactly as in ordinary binary search. Finding the " +
        "rotation point first would be two passes for the same bound.",
    },
    edgeCases: [
      "A rotation of zero, which is a plainly sorted array and must still work.",
      "A rotation that puts the smallest value last.",
      "A single element, matching or not.",
      "Two elements, the case that needs the non-strict comparison.",
      "A target absent but inside the range of values.",
    ],
    implementation: `if (a[left] <= a[mid]) {                        // left half is sorted
    if (a[left] <= target && target < a[mid]) right = mid - 1;
    else left = mid + 1;
} else {                                         // right half is sorted
    if (a[mid] < target && target <= a[right]) left = mid + 1;
    else right = mid - 1;
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 33, sourceCategory: "Binary Search" },
};
