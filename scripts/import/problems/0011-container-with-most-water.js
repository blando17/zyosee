module.exports = {
  problemId: "dsa-11",
  slug: "container-with-most-water",
  title: "Container With Most Water",
  difficulty: "Medium",
  topics: ["array", "two pointers", "greedy"],
  timeLimitMs: 2000,

  statement:
    "You are given n vertical lines standing on a horizontal axis. The i-th line runs from " +
    "(i, 0) up to (i, height[i]).\n\n" +
    "Choose two lines so that they and the axis hold as much water as possible, and print that " +
    "amount. The container cannot be tilted, so the water level is set by the shorter of the two " +
    "lines, and the width is the distance between them.",

  inputFormat: "Line 1: the integer n, the number of lines.\nLine 2: n integers, the height of each line.",
  outputFormat: "One line holding the largest amount of water.",
  constraints: ["2 <= n <= 100000", "0 <= height[i] <= 10000"],
  hint: "Start with the widest pair. Moving the taller line inwards can never help.",

  examples: [
    { input: "9\n1 8 6 2 5 4 8 3 7\n", expected: "49", note: "The lines of height 8 and 7 are 7 apart, holding 7 x 7 = 49." },
    { input: "2\n1 1\n", expected: "1", note: "Only one pair exists: height 1, width 1." },
  ],

  curated: [
    { label: "Smallest allowed input", input: "2\n0 0\n" },
    { label: "All duplicates", input: "5\n6 6 6 6 6\n" },
    { label: "Zero values", input: "5\n0 5 0 5 0\n" },
    { label: "Largest allowed input", input: "2\n10000 10000\n" },
    { label: "Special case", input: "6\n1 2 3 4 5 6\n" },
  ],

  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 2, max: 100000, scales: true },
      { name: "height", type: "intArray", length: "n", min: 0, max: 10000 },
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
    vector<long long> h(n);
    for (int i = 0; i < n; i++) cin >> h[i];

    long long left = 0, right = n - 1, best = 0;
    while (left < right) {
        best = max(best, min(h[left], h[right]) * (right - left));
        if (h[left] < h[right]) ++left; else --right;
    }
    cout << best << "\\n";
    return 0;
}`,
  },

  editorial: {
    understanding:
      "Any two lines form a container. Its area is the distance between them multiplied by the " +
      "height of the shorter one, because water above the shorter line would spill out. " +
      "The task is the largest such area.",
    approach:
      "There are about n squared pairs, which is far too many at n = 100000. Instead start with " +
      "the two outermost lines, the widest container possible, and close in. At each step move " +
      "the pointer at the SHORTER line inwards. That choice is what makes a single pass enough.",
    steps: [
      "Put one pointer at each end of the array.",
      "Work out the area between them and keep it if it is the best so far.",
      "Move whichever pointer sits at the shorter line one step inwards.",
      "If both are equal, moving either is fine.",
      "Stop when the pointers meet, then print the best area.",
    ],
    algorithm: [
      "left = 0, right = n-1, best = 0",
      "while left < right:",
      "    best = max(best, min(h[left], h[right]) * (right - left))",
      "    if h[left] < h[right]: left = left + 1",
      "    else: right = right - 1",
      "print best",
    ],
    whyItWorks:
      "The part to convince yourself of is that discarding the shorter line loses nothing.\n\n" +
      "Suppose the left line is the shorter one. Any container that still uses this left line and " +
      "some line strictly inside the current right pointer is narrower than the one just measured, " +
      "and its height is still capped by this same short left line. So its area cannot exceed the " +
      "area already recorded. Every pair involving that line has therefore been accounted for, and " +
      "it can be dropped.\n\n" +
      "Each step removes one line from consideration, so the scan ends after n steps having " +
      "considered, directly or by that argument, every pair.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation: "Two pointers travel towards each other and together cover the array once.",
    },
    edgeCases: [
      "Exactly two lines: the loop runs once and measures the only pair.",
      "Lines of height zero, which hold nothing but are still valid choices.",
      "All heights equal, where the widest pair is the best and the pointers may move either way.",
      "Heights increasing steadily, where the best pair is not the outermost one.",
      "Large values: 10000 height by 100000 width is 10^9, so the area is kept in a 64-bit type.",
    ],
    implementation: `long long left = 0, right = n - 1, best = 0;
while (left < right) {
    best = max(best, min(h[left], h[right]) * (right - left));
    if (h[left] < h[right]) ++left; else --right;
}
cout << best << "\\n";`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 11, sourceCategory: "Arrays" },
};
