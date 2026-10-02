module.exports = {
  problemId: "dsa-718",
  slug: "maximum-length-of-repeated-subarray",
  title: "Maximum Length of Repeated Subarray",
  difficulty: "Medium",
  topics: ["array", "dynamic programming", "sliding window"],
  timeLimitMs: 3000,
  statement:
    "You are given two arrays of integers.\n\n" +
    "Print the length of the longest run of neighbouring values that appears in both. Unlike a " +
    "subsequence, the run must be contiguous in each array.",
  inputFormat:
    "Line 1: the integer m.\nLine 2: m integers.\nLine 3: the integer n.\nLine 4: n integers.",
  outputFormat: "One line holding the length of the longest shared run, or 0 if they share none.",
  constraints: ["1 <= m <= 1000", "1 <= n <= 1000", "0 <= value <= 100"],
  hint: "A shared run ending at two positions extends the shared run ending just before them.",
  examples: [
    { input: "5\n1 2 3 2 1\n5\n3 2 1 4 7\n", expected: "3", note: "3 2 1 appears in both." },
    { input: "3\n1 2 3\n3\n4 5 6\n", expected: "0", note: "They share nothing." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n5\n1\n5\n" },
    { label: "Boundary condition", input: "1\n5\n1\n9\n" },
    { label: "All duplicates", input: "4\n0 0 0 0\n4\n0 0 0 0\n" },
    { label: "Special case", input: "3\n1 2 3\n3\n3 2 1\n" },
    { label: "Special case", input: "4\n1 2 3 4\n4\n1 2 3 4\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "m", type: "int", min: 1, max: 1000, scales: true },
      { name: "a", type: "intArray", length: "m", min: 0, max: 5 },
      { name: "n", type: "int", min: 1, max: 1000, scales: true },
      // A tiny value range so shared runs of real length actually occur. Over
      // 0..100 the answer would almost always be 1 or 2.
      { name: "b", type: "intArray", length: "n", min: 0, max: 5 },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int m;
    if (!(cin >> m)) return 0;
    vector<int> a(m);
    for (int i = 0; i < m; i++) cin >> a[i];
    int n; cin >> n;
    vector<int> b(n);
    for (int i = 0; i < n; i++) cin >> b[i];

    // dp[j] = length of the shared run ending at a[i-1] and b[j-1].
    // Two rows collapsed into one, filled right to left so the value being
    // read at j-1 is still the previous row's.
    vector<int> dp(n + 1, 0);
    int best = 0;
    for (int i = 1; i <= m; i++) {
        for (int j = n; j >= 1; j--) {
            if (a[i - 1] == b[j - 1]) { dp[j] = dp[j - 1] + 1; best = max(best, dp[j]); }
            else dp[j] = 0;
        }
    }
    cout << best << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The run must be contiguous in BOTH arrays, which makes this different from the longest " +
      "common subsequence. A shared subsequence may skip elements; a shared subarray may not.",
    approach:
      "Ask a more specific question than the one posed: for each pair of positions, how long is " +
      "the shared run that ENDS exactly there? That has a clean answer. If the two values " +
      "differ, no run can end there at all, so it is 0. If they match, the run is one longer " +
      "than the run ending at the two positions just before.\n\n" +
      "The answer to the real question is then the largest value anywhere in that table.",
    steps: [
      "Consider every pair of positions, one from each array.",
      "If the values differ, the run ending there has length 0.",
      "If they match, it is one more than the run ending at the previous pair of positions.",
      "Track the largest value seen while filling the table.",
    ],
    algorithm: [
      "dp[i][j] = 0 if a[i-1] != b[j-1]",
      "         = dp[i-1][j-1] + 1 otherwise",
      "answer = the maximum entry anywhere in dp",
    ],
    whyItWorks:
      "Every shared run ends at exactly one pair of positions, so taking the maximum over all " +
      "pairs considers every run exactly once. Nothing is missed and nothing is double counted.\n\n" +
      "The recurrence is forced by contiguity. A run ending at (i, j) with length greater than 1 " +
      "must have the pair (i-1, j-1) immediately before it, because neither array is allowed to " +
      "skip. That is also why a mismatch resets to 0 rather than carrying anything forward — the " +
      "reset IS the contiguity requirement.\n\n" +
      "The answer must be tracked while filling, not read from the last cell. Unlike the longest " +
      "common subsequence, the bottom-right entry here only describes runs ending at the very " +
      "ends of both arrays, which is usually not the longest.\n\n" +
      "Collapsing to one row requires filling it from right to left. Reading dp[j-1] must give " +
      "the PREVIOUS row's value, and going left to right would have already overwritten it.",
    complexity: {
      time: "O(m * n)",
      space: "O(n)",
      explanation:
        "Every pair of positions is visited once. Binary searching on the length with hashing " +
        "gets O((m+n) log(min(m,n))) at the cost of collision risk.",
    },
    edgeCases: [
      "Arrays sharing nothing, answering 0.",
      "Identical arrays, answering the full length.",
      "Reversed arrays, where the answer is 1 because runs must stay contiguous and in order.",
      "All values equal, where the answer is the shorter length.",
      "Reading the answer from the last cell instead of tracking the maximum.",
      "Filling the collapsed row left to right, which reads this row instead of the previous one.",
    ],
    implementation: `for (int i = 1; i <= m; i++)
    for (int j = n; j >= 1; j--)          // right to left for the one-row form
        if (a[i-1] == b[j-1]) { dp[j] = dp[j-1] + 1; best = max(best, dp[j]); }
        else dp[j] = 0;                    // the reset IS contiguity`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 718, sourceCategory: "Dynamic Programming" },
};
