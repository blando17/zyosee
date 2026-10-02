module.exports = {
  problemId: "dsa-48",
  slug: "rotate-image",
  title: "Rotate Image",
  difficulty: "Medium",
  topics: ["array", "matrix", "simulation"],
  timeLimitMs: 2000,

  statement:
    "You are given an n by n grid of integers representing an image.\n\n" +
    "Rotate the image 90 degrees clockwise and print the result.",

  inputFormat: "Line 1: the integer n, the size of the grid.\nNext n lines: n integers each, one row of the grid.",
  outputFormat: "n lines, each holding n integers separated by single spaces: the rotated grid.",
  constraints: ["1 <= n <= 700", "-1000000000 <= value <= 1000000000"],
  hint: "Reflect the grid across its main diagonal, then reverse each row.",

  examples: [
    {
      input: "3\n1 2 3\n4 5 6\n7 8 9\n",
      expected: "7 4 1\n8 5 2\n9 6 3",
      note: "The first column, read upwards, becomes the first row.",
    },
    {
      input: "2\n1 2\n3 4\n",
      expected: "3 1\n4 2",
      note: "A 2 by 2 grid turns a quarter turn clockwise.",
    },
  ],

  curated: [
    { label: "Smallest allowed input", input: "1\n42\n" },
    { label: "All duplicates", input: "3\n5 5 5\n5 5 5\n5 5 5\n" },
    { label: "Negative values", input: "2\n-1 -2\n-3 -4\n" },
    { label: "Zero values", input: "3\n0 0 1\n0 0 0\n0 0 0\n" },
    { label: "Overflow risk", input: "2\n-1000000000 1000000000\n1000000000 -1000000000\n" },
    { label: "Normal case", input: "4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16\n" },
  ],

  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 700, scales: true },
      { name: "grid", type: "intMatrix", rows: "n", cols: "n", min: -1000000000, max: 1000000000 },
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
    vector<vector<long long>> m(n, vector<long long>(n));
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++) cin >> m[i][j];

    // Reflect across the main diagonal, then reverse every row.
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) swap(m[i][j], m[j][i]);
    for (auto &row : m) reverse(row.begin(), row.end());

    string out;
    out.reserve((size_t)n * n * 12 + n);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (j) out += ' ';
            out += to_string(m[i][j]);
        }
        out += '\\n';
    }
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },

  editorial: {
    understanding:
      "A clockwise quarter turn sends the value at row i, column j to row j, column n-1-i. " +
      "Read another way: the first column bottom-to-top becomes the first row left-to-right.",
    approach:
      "Building a fresh grid and copying each value to its new place is easy and correct. The " +
      "neater route, and the one that needs no second grid, is to notice that the rotation is " +
      "two simple reflections: mirror the grid across its main diagonal, then mirror each row.",
    steps: [
      "Transpose the grid: for every pair i < j, swap the value at (i, j) with the value at (j, i).",
      "Only swap above the diagonal — running over every pair would swap each one twice and undo the work.",
      "Reverse each row in place.",
      "Print the grid.",
    ],
    algorithm: [
      "for i from 0 to n-1:",
      "    for j from i+1 to n-1:",
      "        swap(m[i][j], m[j][i])",
      "for each row: reverse(row)",
    ],
    whyItWorks:
      "Track a single cell. Transposing sends (i, j) to (j, i). Reversing row j then sends column " +
      "i to column n-1-i, so the cell lands at (j, n-1-i).\n\n" +
      "That is exactly where a clockwise quarter turn puts it: the row index becomes the column " +
      "index, and the column index becomes the row index counted from the other end. Since it " +
      "holds for every cell, the two reflections compose into the rotation.\n\n" +
      "Both steps work in place, which is why no second grid is needed.",
    complexity: {
      time: "O(n^2)",
      space: "O(1) beyond the grid itself",
      explanation:
        "Every cell is touched a constant number of times, and there are n^2 of them. No grid " +
        "can be rotated without reading all of it, so this is the best possible.",
    },
    edgeCases: [
      "A 1 by 1 grid, which the loops leave untouched — correctly, since rotating it changes nothing.",
      "Transposing the full square rather than only above the diagonal, which swaps every pair twice and leaves the grid unchanged. This is the usual bug.",
      "Even and odd sizes, both handled by the same two steps with no special centre case.",
      "Large values at the ends of the range, which are moved but never combined.",
      "n = 700 means 490000 numbers, about five megabytes of output, so it is built in one string rather than streamed value by value.",
    ],
    implementation: `for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++)   // above the diagonal only
        swap(m[i][j], m[j][i]);
for (auto &row : m) reverse(row.begin(), row.end());`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 48, sourceCategory: "Arrays" },
};
