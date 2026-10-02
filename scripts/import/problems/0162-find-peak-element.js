module.exports = {
  problemId: "dsa-162",
  slug: "find-peak-element",
  title: "Find Peak Element",
  difficulty: "Medium",
  topics: ["array", "binary search"],
  timeLimitMs: 2000,
  statement:
    "You are given an array of n distinct integers that rises and then falls: the values " +
    "strictly increase up to one position and strictly decrease after it.\n\n" +
    "Print the index of that peak, counting from 0.",
  inputFormat: "Line 1: the integer n.\nLine 2: n distinct integers, strictly increasing then strictly decreasing.",
  outputFormat: "One line holding the index of the peak.",
  constraints: [
    "3 <= n <= 100000",
    "-1000000000 <= value <= 1000000000",
    "All values are distinct",
    "There is exactly one peak, and it is not at either end",
  ],
  hint: "The slope under the midpoint tells you which side the peak is on.",
  examples: [
    { input: "5\n1 3 7 4 2\n", expected: "2", note: "7 is larger than both its neighbours." },
    { input: "3\n1 5 2\n", expected: "1", note: "The smallest possible mountain." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "3\n1 2 0\n" },
    { label: "Boundary condition", input: "4\n1 9 5 2\n" },
    { label: "Boundary condition", input: "4\n1 2 9 5\n" },
    { label: "Normal case", input: "7\n1 2 3 100 30 20 10\n" },
    { label: "Negative values", input: "5\n-9 -5 -1 -4 -8\n" },
    { label: "Overflow risk", input: "3\n-1000000000 1000000000 0\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 3, max: 100000, scales: true },
      // `mountain` arranges distinct values into one rise and one fall, which
      // is what makes the peak unique. Without it a random array has many
      // peaks and the answer would not be a single number a judge can compare.
      { name: "a", type: "intArray", length: "n", min: -1000000000, max: 1000000000, distinct: true, mountain: true },
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

    // The window always contains the peak. Note left < right, not <=: the
    // loop ends when the window is one element, which is the answer.
    long long left = 0, right = n - 1;
    while (left < right) {
        long long mid = left + (right - left) / 2;
        if (a[mid] > a[mid + 1]) right = mid;   // falling: peak is here or left
        else left = mid + 1;                    // rising: peak is strictly right
    }
    cout << left << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The array rises to a single high point and then falls. Because it is strictly monotonic " +
      "on each side, there is exactly one position larger than both its neighbours, and that is " +
      "the answer.",
    approach:
      "Scanning until the values start falling is O(n) and obviously correct. Binary search does " +
      "it in O(log n), which is surprising — the array is not sorted, so there is nothing " +
      "obvious to search for.\n\n" +
      "What makes it work is that comparing a midpoint with its NEIGHBOUR reveals which side of " +
      "the peak you are standing on. That single comparison eliminates half the array.",
    steps: [
      "Set the window to the whole array.",
      "Take the middle index and compare its value with the one just after it.",
      "If the value is falling, the peak is at the midpoint or to its left — keep the midpoint in the window.",
      "If it is rising, the peak must be strictly to the right — discard the midpoint.",
      "Repeat until the window holds one element; that is the peak.",
    ],
    algorithm: [
      "left = 0, right = n-1",
      "while left < right:",
      "    mid = left + (right - left) / 2",
      "    if a[mid] > a[mid+1]: right = mid",
      "    else: left = mid + 1",
      "return left",
    ],
    whyItWorks:
      "The invariant is that the peak is inside the window. It holds at the start.\n\n" +
      "If a[mid] > a[mid+1] the array is already descending at mid, so the whole rise happened " +
      "at or before mid and everything after it keeps falling. The peak cannot be to the right, " +
      "and mid itself might be it — which is why right becomes mid rather than mid - 1.\n\n" +
      "If a[mid] < a[mid+1] the array is still climbing, so mid is on the way up and cannot be " +
      "the peak. Discarding it with left = mid + 1 is safe.\n\n" +
      "The asymmetry between the two branches is the part people get wrong. It is also why the " +
      "loop uses left < right rather than left <= right: the window shrinks to exactly one " +
      "element, and that element is the answer, so there is no separate found-it case.",
    complexity: {
      time: "O(log n)",
      space: "O(1)",
      explanation:
        "The window halves every step. A linear scan is O(n), which for this shape is fine but " +
        "misses the point of the problem.",
    },
    edgeCases: [
      "The smallest array of three, where the peak is in the middle.",
      "A peak near the left end or the right end.",
      "Negative values throughout, where the peak is the least negative.",
      "Writing right = mid - 1 in the falling branch, which can step over the peak.",
      "Using left <= right, which loops forever once the window holds one element.",
    ],
    implementation: `while (left < right) {                 // < not <=
    long long mid = left + (right - left) / 2;
    if (a[mid] > a[mid + 1]) right = mid;   // mid itself may be the peak
    else left = mid + 1;                    // mid is on the way up
}
return left;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 162, sourceCategory: "Binary Search" },
};
