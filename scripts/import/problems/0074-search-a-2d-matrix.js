module.exports = {
  problemId: "dsa-74",
  slug: "search-a-2d-matrix",
  title: "Search a 2D Matrix",
  difficulty: "Medium",
  topics: ["array", "matrix", "binary search"],
  timeLimitMs: 2000,
  statement:
    "You are given a grid of r rows and c columns with two properties: each row is sorted in " +
    "increasing order, and the first value of every row is greater than the last value of the " +
    "row above it.\n\n" +
    "Print true if the target appears somewhere in the grid, and false otherwise.",
  inputFormat:
    "Line 1: two integers r and c.\n" +
    "Next r lines: c integers each, one row of the grid.\n" +
    "Last line: the target.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["1 <= r, c <= 1000", "1 <= r * c <= 1000000", "-1000000000 <= value <= 1000000000"],
  hint: "Read row by row and the whole grid is one sorted sequence.",
  examples: [
    { input: "3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n3\n", expected: "true", note: "3 is in the first row." },
    { input: "3 4\n1 3 5 7\n10 11 16 20\n23 30 34 60\n13\n", expected: "false", note: "13 falls between rows and is absent." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1 1\n5\n5\n" },
    { label: "Boundary condition", input: "1 1\n5\n4\n" },
    { label: "Boundary condition", input: "2 2\n1 3\n5 7\n1\n" },
    { label: "Boundary condition", input: "2 2\n1 3\n5 7\n7\n" },
    { label: "Special case", input: "2 2\n1 3\n5 7\n4\n" },
    { label: "Special case", input: "1 4\n1 2 3 4\n0\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "r", type: "int", min: 1, max: 1000, scales: true },
      { name: "c", type: "int", min: 1, max: 1000, scales: true },
      // One sorted array of r * c values, printed r per line by the format.
      // That is exactly the grid's defining property: read row by row it is a
      // single increasing sequence.
      { name: "v", type: "intArray", length: ["r", "c"], min: -1000000000, max: 1000000000, sorted: true },
      { name: "target", type: "sumOfK", from: "v", k: 1 },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long r, c;
    if (!(cin >> r >> c)) return 0;
    vector<long long> v(r * c);
    for (long long i = 0; i < r * c; i++) cin >> v[i];
    long long target;
    cin >> target;

    // Read row by row the grid IS a sorted array, so one binary search over
    // the flat indices is enough; index i lives at row i/c, column i%c.
    long long left = 0, right = r * c - 1;
    bool found = false;
    while (left <= right) {
        long long mid = left + (right - left) / 2;
        if (v[mid] == target) { found = true; break; }
        if (v[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    cout << (found ? "true" : "false") << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The two properties together are stronger than they first look. Rows are sorted, and each " +
      "row starts above where the previous one ended — so reading the grid row by row produces " +
      "one increasing sequence with no breaks.",
    approach:
      "The obvious method is two searches: one down the first column to find the right row, then " +
      "one along that row. That works and is O(log r + log c).\n\n" +
      "The simpler observation is that the grid is already a sorted array laid out in rows. A " +
      "single binary search over the flat positions 0 to r*c-1 does the whole job, converting " +
      "each position back to a row and column only when it needs to read a value.",
    steps: [
      "Treat the grid as a flat sequence of r * c values.",
      "Binary search over the flat indices.",
      "To read the value at flat index i, use row i / c and column i % c.",
      "Compare with the target and halve the window as usual.",
      "Report whether it was found.",
    ],
    algorithm: [
      "left = 0, right = r*c - 1",
      "while left <= right:",
      "    mid = left + (right - left) / 2",
      "    value = grid[mid / c][mid % c]",
      "    if value == target: return true",
      "    if value < target: left = mid + 1",
      "    else: right = mid - 1",
      "return false",
    ],
    whyItWorks:
      "The flattening is valid precisely because of the second property. Without it — if rows " +
      "were sorted but could overlap in value — the flat sequence would rise and fall at every " +
      "row boundary, and binary search would be meaningless. The guarantee that each row starts " +
      "above the previous one's end is what makes the whole thing monotonic.\n\n" +
      "The index arithmetic is the only other piece. Row-major order means flat index i is the " +
      "i-th value read row by row, so its row is i / c and its column is the remainder i % c. " +
      "Dividing by r instead of c is the usual slip, and it happens to work on a square grid — " +
      "which is why it survives casual testing.\n\n" +
      "Once those two facts hold, the search is ordinary binary search with the same invariant " +
      "and the same termination argument.",
    complexity: {
      time: "O(log(r * c))",
      space: "O(1)",
      explanation:
        "One binary search over r*c positions. The two-stage row-then-column search is " +
        "O(log r + log c), which is the same quantity written differently.",
    },
    edgeCases: [
      "A one-by-one grid.",
      "A single row or a single column, where one of the dimensions is degenerate.",
      "A target smaller than everything or larger than everything.",
      "A target that falls in the gap between two rows, which is the case that would fool a row-only search.",
      "A non-square grid, which exposes dividing by the wrong dimension.",
    ],
    implementation: `long long left = 0, right = r * c - 1;
while (left <= right) {
    long long mid = left + (right - left) / 2;
    long long value = grid[mid / c][mid % c];   // row-major: / c and % c
    if (value == target) return true;
    if (value < target) left = mid + 1;
    else right = mid - 1;
}
return false;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 74, sourceCategory: "Binary Search" },
};
