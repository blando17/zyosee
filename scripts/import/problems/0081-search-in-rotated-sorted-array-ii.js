module.exports = {
  problemId: "dsa-81",
  slug: "search-in-rotated-sorted-array-ii",
  title: "Search in Rotated Sorted Array II",
  difficulty: "Medium",
  topics: ["array", "binary search"],
  timeLimitMs: 2000,
  statement:
    "An array of n integers was sorted in non-decreasing order, then rotated left by some " +
    "unknown amount. Unlike the earlier version, values may repeat.\n\n" +
    "You are given the rotated array and a target. Print true if the target is present, and " +
    "false otherwise.",
  inputFormat: "Line 1: the integer n.\nLine 2: n integers, a rotated sorted array that may contain duplicates.\nLine 3: the target.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["1 <= n <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "When the two ends and the middle all match, neither half can be ruled out.",
  examples: [
    { input: "7\n2 5 6 0 0 1 2\n0\n", expected: "true", note: "0 appears twice in the array." },
    { input: "7\n2 5 6 0 0 1 2\n3\n", expected: "false", note: "3 never appears." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n5\n5\n" },
    { label: "Boundary condition", input: "1\n5\n4\n" },
    // The case that forces the linear fallback: everything equal except one.
    { label: "All duplicates", input: "9\n1 1 1 1 1 1 1 1 1\n1\n" },
    { label: "Special case", input: "9\n1 1 1 1 2 1 1 1 1\n2\n" },
    /*
     * The cases that actually force the all-equal branch.
     *
     * [1,0,1,1,1] is a rotation of [0,1,1,1,1]. Searching for 0: the midpoint
     * holds 1, and the left end, middle and right end are all 1 — so neither
     * half can be ruled out. A solution missing that branch decides the left
     * half is sorted, discards the half containing the 0, and answers false.
     *
     * The earlier "1 1 1 1 2 1 1 1 1" case does NOT force it: the midpoint
     * lands straight on the target, so the branch is never reached.
     */
    { label: "Special case", input: "5\n1 0 1 1 1\n0\n" },
    { label: "Special case", input: "5\n1 1 1 0 1\n0\n" },
    { label: "Special case", input: "9\n1 1 1 1 1 1 1 1 1\n2\n" },
    { label: "Boundary condition", input: "5\n1 2 3 4 5\n5\n" },
    { label: "Special case", input: "2\n3 1\n1\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      // A narrow value range so duplicates are everywhere, which is the whole
      // difference from the previous problem, and rotate so the arrays really
      // are rotated rather than merely sorted.
      { name: "a", type: "intArray", length: "n", min: 0, max: 20, sorted: true, rotate: true },
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

    long long left = 0, right = n - 1;
    bool found = false;
    while (left <= right) {
        long long mid = left + (right - left) / 2;
        if (a[mid] == target) { found = true; break; }

        if (a[left] == a[mid] && a[mid] == a[right]) {
            // Both ends match the middle, so neither half can be ruled out.
            // Give up one element from each side and try again.
            left++; right--;
        } else if (a[left] <= a[mid]) {
            if (a[left] <= target && target < a[mid]) right = mid - 1;
            else left = mid + 1;
        } else {
            if (a[mid] < target && target <= a[right]) left = mid + 1;
            else right = mid - 1;
        }
    }
    cout << (found ? "true" : "false") << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "This is the rotated search again, with duplicates allowed. Only presence is asked for, " +
      "not an index — which is a hint, because with repeats there may be several and no " +
      "principled way to pick one.",
    approach:
      "The method is the same: work out which half is sorted, then decide whether the target " +
      "could be in it. Duplicates break the test that identifies the sorted half.\n\n" +
      "In the distinct version, a[left] <= a[mid] settles it. With repeats, a[left] == a[mid] " +
      "tells you nothing — the values between them could be all equal, or could hide the drop. " +
      "When the two ends and the middle are all equal, the only safe move is to shrink the " +
      "window by one from each side and try again.",
    steps: [
      "Take the midpoint and check for a match.",
      "If the leftmost, middle and rightmost values are all equal, step both ends inwards by one and start over.",
      "Otherwise decide which half is sorted exactly as in the distinct version.",
      "Check whether the target lies within that sorted half's range, and keep the appropriate half.",
      "Repeat until found or the window empties.",
    ],
    algorithm: [
      "while left <= right:",
      "    mid = left + (right - left) / 2",
      "    if a[mid] == target: return true",
      "    if a[left] == a[mid] == a[right]: left++, right--",
      "    else if a[left] <= a[mid]: usual left-sorted logic",
      "    else: usual right-sorted logic",
      "return false",
    ],
    whyItWorks:
      "The ambiguous case is exactly when the two ends and the middle all carry the same value. " +
      "Consider [1,1,1,2,1] and [1,2,1,1,1]: both have 1 at the left, middle and right, yet the " +
      "drop sits in different halves. No comparison of those three values can distinguish them, " +
      "so no rule based on them can be correct.\n\n" +
      "Shrinking by one from each side is safe because the discarded values equal a[mid], which " +
      "has already been compared with the target and did not match. Nothing that could be the " +
      "answer is thrown away.\n\n" +
      "The cost is the worst case. An array of one repeated value hits that branch every " +
      "iteration and shrinks by two instead of halving, giving O(n). That is unavoidable: if " +
      "every visible value is identical, no algorithm can rule out any region without looking " +
      "at it. Duplicates genuinely destroy the logarithmic guarantee rather than merely " +
      "complicating the code.",
    complexity: {
      time: "O(log n) typically, O(n) in the worst case",
      space: "O(1)",
      explanation:
        "The halving still happens whenever the three values are not all equal. An array of a " +
        "single repeated value degrades to a scan, which is provably necessary.",
    },
    edgeCases: [
      "An array of one repeated value, the worst case for time.",
      "One distinct value hidden among identical ones, which the shrink must not skip over.",
      "A target absent from an array of all-equal values.",
      "A rotation of zero.",
      "A single element.",
      "Omitting the all-equal branch, which makes the search pick the wrong half and miss the target.",
    ],
    implementation: `if (a[left] == a[mid] && a[mid] == a[right]) {
    left++; right--;          // ambiguous: cannot rule out either half
} else if (a[left] <= a[mid]) {
    ...                       // as in the distinct version
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 81, sourceCategory: "Binary Search" },
};
