module.exports = {
  problemId: "dsa-62",
  slug: "unique-paths",
  title: "Unique Paths",
  difficulty: "Medium",
  topics: ["dynamic programming", "math", "combinatorics"],
  timeLimitMs: 2000,
  statement:
    "A robot stands in the top-left corner of a grid with m rows and n columns. It can only " +
    "move right or down.\n\n" +
    "Print how many distinct paths reach the bottom-right corner.",
  inputFormat: "Line 1: two integers m and n.",
  outputFormat: "One line holding the number of paths.",
  constraints: ["1 <= m <= 30", "1 <= n <= 30"],
  hint: "Every square is reached only from the one above it or the one to its left.",
  examples: [
    { input: "3 7\n", expected: "28", note: "A 3 by 7 grid has 28 paths." },
    { input: "3 2\n", expected: "3", note: "Right-down-down, down-right-down, down-down-right." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1 1\n" },
    { label: "Boundary condition", input: "1 30\n" },
    { label: "Boundary condition", input: "30 1\n" },
    { label: "Largest allowed input", input: "30 30\n" },
    { label: "Normal case", input: "10 10\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "m", type: "int", min: 1, max: 30, scales: true },
      { name: "n", type: "int", min: 1, max: 30, scales: true },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long m, n;
    if (!(cin >> m >> n)) return 0;

    // One row of the table, updated in place. dp[j] holds the paths to the
    // current row's column j; reading dp[j] before writing it gives the value
    // from the row above, and dp[j-1] is already this row's.
    vector<long long> dp(n, 1);
    for (long long i = 1; i < m; i++)
        for (long long j = 1; j < n; j++)
            dp[j] += dp[j - 1];

    cout << dp[n - 1] << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The robot only moves right or down, so every path is a fixed-length sequence of moves. " +
      "Reaching the far corner of an m by n grid always takes m - 1 downs and n - 1 rights, in " +
      "some order.",
    approach:
      "The dynamic programming view: the paths to any square are the paths to the square above " +
      "plus the paths to the square on its left, because those are the only two squares it can " +
      "be entered from. The top row and the left column have exactly one path each.\n\n" +
      "There is also a closed form. A path is just a choice of which of the m + n - 2 moves are " +
      "the downs, so the answer is the binomial coefficient C(m + n - 2, m - 1). The table is " +
      "kept here because it generalises to grids with obstacles, where the formula does not.",
    steps: [
      "Every square in the top row has one path: keep going right.",
      "Every square in the left column has one path: keep going down.",
      "For every other square, add the value above it to the value on its left.",
      "The bottom-right square holds the answer.",
    ],
    algorithm: [
      "dp = one row of n ones",
      "for i from 1 to m-1:",
      "    for j from 1 to n-1:",
      "        dp[j] = dp[j] + dp[j-1]",
      "print dp[n-1]",
    ],
    whyItWorks:
      "Every path into a square arrives through exactly one of its two neighbours, and the two " +
      "groups share no paths, so adding their counts counts each path once.\n\n" +
      "The single-row trick is worth understanding rather than memorising. When dp[j] is about " +
      "to be updated it still holds the value from the row ABOVE, because this row has not " +
      "written it yet. Meanwhile dp[j-1] was updated a moment ago and holds THIS row's value. " +
      "So `dp[j] += dp[j-1]` is exactly \"above plus left\" without ever storing the full grid.\n\n" +
      "The counts grow quickly: a 30 by 30 grid has about 3 * 10^16 paths, which needs 64 bits. " +
      "This is why the grid size is limited rather than the answer being taken modulo something.",
    complexity: {
      time: "O(m * n)",
      space: "O(n)",
      explanation:
        "One row of the table rather than all of it. The binomial formula answers in O(min(m, n)) " +
        "with no table at all.",
    },
    edgeCases: [
      "A 1 by 1 grid, where the robot is already at the corner: one path.",
      "A single row or single column, where there is exactly one path.",
      "The largest grid, whose answer needs more than 32 bits.",
      "A non-square grid, which must not confuse the two dimensions.",
    ],
    implementation: `vector<long long> dp(n, 1);
for (int i = 1; i < m; i++)
    for (int j = 1; j < n; j++)
        dp[j] += dp[j - 1];      // dp[j] is still "above", dp[j-1] is "left"
return dp[n - 1];`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 62, sourceCategory: "Dynamic Programming" },
};
