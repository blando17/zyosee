module.exports = {
  problemId: "dsa-53",
  slug: "maximum-subarray",
  title: "Maximum Subarray",
  difficulty: "Medium",
  topics: ["array", "dynamic programming", "divide and conquer"],
  timeLimitMs: 2000,

  statement:
    "You are given an array of n integers.\n\n" +
    "A subarray is a run of one or more neighbouring elements. Print the largest sum any " +
    "subarray of this array has.\n\n" +
    "At least one element must be chosen, so an array of only negative numbers has a negative answer.",

  inputFormat: "Line 1: the integer n, the length of the array.\nLine 2: n integers, the array.",
  outputFormat: "One line holding the largest subarray sum.",
  constraints: ["1 <= n <= 100000", "-10000 <= a[i] <= 10000"],
  hint: "At each position, decide whether to extend the run you are on or start a new one.",

  examples: [
    { input: "9\n-2 1 -3 4 -1 2 1 -5 4\n", expected: "6", note: "The run 4 -1 2 1 sums to 6." },
    { input: "1\n-7\n", expected: "-7", note: "One element must be chosen, so the answer is negative." },
  ],

  curated: [
    { label: "Smallest allowed input", input: "1\n0\n" },
    { label: "Negative values", input: "5\n-5 -2 -9 -1 -6\n" },
    { label: "All duplicates", input: "6\n3 3 3 3 3 3\n" },
    { label: "Special case", input: "7\n-1 -2 -3 100 -3 -2 -1\n" },
    { label: "Overflow risk", input: "8\n10000 10000 10000 10000 10000 10000 10000 10000\n" },
  ],

  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "a", type: "intArray", length: "n", min: -10000, max: 10000 },
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

    long long best = a[0], current = a[0];
    for (int i = 1; i < n; i++) {
        current = max(a[i], current + a[i]);
        best = max(best, current);
    }
    cout << best << "\\n";
    return 0;
}`,
  },

  editorial: {
    understanding:
      "Among all the runs of neighbouring elements, one has the largest sum, and that sum is the " +
      "answer. The run may not be empty, which is the detail that decides what an all-negative " +
      "array returns: the least negative single element, not 0.",
    approach:
      "Checking every run is quadratic, and at n = 100000 that is far too slow. The insight is " +
      "that you only need one number per position: the largest sum of a run that ENDS at that " +
      "position. Knowing it for position i - 1 is enough to work it out for i, because a run " +
      "ending at i either extends the run ending at i - 1 or starts fresh at i.",
    steps: [
      "Set both the running sum and the best answer to the first element.",
      "Move to the next element.",
      "The best run ending here is either this element alone, or this element added to the best run ending at the previous position. Take the larger.",
      "If that beats the best answer seen anywhere, remember it.",
      "Repeat to the end, then print the best answer.",
    ],
    algorithm: [
      "best = current = a[0]",
      "for i from 1 to n-1:",
      "    current = max(a[i], current + a[i])",
      "    best = max(best, current)",
      "print best",
    ],
    whyItWorks:
      "Every non-empty run ends at exactly one position, so if the largest sum ending at each " +
      "position is correct, the maximum over all positions is the answer.\n\n" +
      "The step is correct because a run ending at i that has more than one element must contain " +
      "the run ending at i - 1 immediately before it. So its sum is (best ending at i - 1) + a[i]. " +
      "The only other possibility is the single element a[i]. Taking the larger of those two " +
      "covers every case, and dropping a negative running sum is exactly what choosing a[i] does.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation: "One pass, holding two numbers, regardless of the size of the array.",
    },
    edgeCases: [
      "A single element: the answer is that element, positive or negative.",
      "Every element negative: the answer is the largest single element, because a run cannot be empty.",
      "A single large positive surrounded by negatives: the running sum must reset rather than drag the negatives along.",
      "Large values with large n: 100000 elements at 10000 each sums to 10^9, which overflows a 32-bit int only if you also add, so the running sum is kept in a 64-bit type.",
    ],
    implementation: `long long best = a[0], current = a[0];
for (int i = 1; i < n; i++) {
    current = max(a[i], current + a[i]);
    best = max(best, current);
}
cout << best << "\\n";`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 53, sourceCategory: "Arrays" },
};
