module.exports = {
  problemId: "dsa-51",
  slug: "n-queens",
  title: "N-Queens",
  difficulty: "Hard",
  topics: ["backtracking"],
  timeLimitMs: 4000,
  statement:
    "Place n queens on an n by n board so that no two attack each other. Queens attack along " +
    "rows, columns and both diagonals.\n\n" +
    "Print every arrangement. Each row holds exactly one queen, so an arrangement is described " +
    "by the column of the queen in each row, from the top row down.\n\n" +
    "Sort the arrangements by comparing those columns in order.",
  inputFormat: "One line: the integer n.",
  outputFormat:
    "Line 1: the number of arrangements.\n" +
    "Next lines: one arrangement per line, n column numbers counting from 0, separated by " +
    "single spaces.",
  constraints: ["1 <= n <= 9"],
  hint: "Place one queen per row, and record which columns and diagonals are already taken.",
  examples: [
    { input: "4\n", expected: "2\n1 3 0 2\n2 0 3 1", note: "The two arrangements on a 4 by 4 board." },
    { input: "1\n", expected: "1\n0", note: "One queen on a 1 by 1 board." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n" },
    { label: "Special case", input: "2\n" },
    { label: "Special case", input: "3\n" },
    { label: "Normal case", input: "6\n" },
    { label: "Largest allowed input", input: "9\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      // 9 is the ceiling: there are 352 arrangements at n = 9, but 14200 at
      // n = 12 and 2.7 million at n = 15.
      { name: "n", type: "int", min: 1, max: 9, scales: true },
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

    vector<vector<int>> all;
    vector<int> cols(n);
    // Three flags per constraint, so "is this square safe" is three lookups
    // rather than a scan of the board.
    vector<char> usedCol(n, 0), usedDiag(2 * n, 0), usedAnti(2 * n, 0);

    function<void(int)> place = [&](int row) {
        if (row == n) { all.push_back(cols); return; }
        for (int c = 0; c < n; c++) {
            int d = row - c + n;      // constant along one diagonal
            int a = row + c;          // constant along the other
            if (usedCol[c] || usedDiag[d] || usedAnti[a]) continue;
            usedCol[c] = usedDiag[d] = usedAnti[a] = 1;
            cols[row] = c;
            place(row + 1);
            usedCol[c] = usedDiag[d] = usedAnti[a] = 0;
        }
    };
    place(0);

    // Columns are tried in increasing order at every row, so the arrangements
    // already come out sorted; the sort makes that independent of that fact.
    sort(all.begin(), all.end());

    string out = to_string(all.size());
    out += '\\n';
    for (auto &sol : all) {
        for (int i = 0; i < n; i++) {
            if (i) out += ' ';
            out += to_string(sol[i]);
        }
        out += '\\n';
    }
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "No two queens may share a row, a column or a diagonal. The row constraint is worth " +
      "noticing first: with n queens on n rows, every row holds exactly one. That reduces the " +
      "problem from choosing squares to choosing one column per row.",
    approach:
      "Place queens one row at a time. For each row, try every column that is not already " +
      "attacked, place a queen, and move to the next row. When all n rows are filled, record " +
      "the arrangement.\n\n" +
      "The important part is testing safety cheaply. Scanning the board for each candidate is " +
      "O(n) per test; three boolean arrays make it O(1).",
    steps: [
      "Work down the board one row at a time.",
      "For each column, check whether that column or either diagonal is already occupied.",
      "If it is free, mark all three, record the column for this row, and recurse to the next row.",
      "Unmark all three afterwards before trying the next column.",
      "When the last row is filled, record the arrangement.",
    ],
    algorithm: [
      "place(row):",
      "    if row == n: record cols; return",
      "    for c from 0 to n-1:",
      "        if column c or diagonal (row - c) or anti-diagonal (row + c) is used: skip",
      "        mark all three; cols[row] = c; place(row + 1); unmark all three",
    ],
    whyItWorks:
      "The diagonal encoding is the piece worth understanding. Along a down-right diagonal the " +
      "difference row - column never changes; along a down-left diagonal the sum row + column " +
      "never changes. So each diagonal has a single identifying number, and occupancy is one " +
      "array lookup. The difference is shifted by n to keep the index non-negative.\n\n" +
      "Because a queen is placed in every row by construction, and columns and diagonals are " +
      "checked explicitly, an arrangement that survives to the last row satisfies every " +
      "constraint — there is nothing left to verify at the end.\n\n" +
      "Unmarking after the recursive call is what makes this a search rather than a single " +
      "guess. Without it the first failed branch would leave squares permanently blocked and " +
      "almost every arrangement would be missed.\n\n" +
      "Trying columns in increasing order at every row means the arrangements are generated in " +
      "sorted order already; the explicit sort simply makes the output independent of that.",
    complexity: {
      time: "much better than n^n, but still exponential",
      space: "O(n) for the recursion and the flags, plus the output",
      explanation:
        "The pruning is what makes it tractable: whole subtrees die as soon as a row has no safe " +
        "column. There are 92 arrangements at n = 8 and 352 at n = 9, but 2.7 million at n = 15.",
    },
    edgeCases: [
      "n = 1, which has one arrangement.",
      "n = 2 and n = 3, which have none at all — the count is 0 and nothing follows.",
      "The largest allowed n, giving 352 arrangements.",
      "Forgetting to unmark, which collapses the search to almost nothing.",
      "Checking only columns and forgetting the diagonals, which reports far too many.",
    ],
    implementation: `int d = row - c + n;    // constant along one diagonal
int a = row + c;        // constant along the other
if (usedCol[c] || usedDiag[d] || usedAnti[a]) continue;
usedCol[c] = usedDiag[d] = usedAnti[a] = 1;
place(row + 1);
usedCol[c] = usedDiag[d] = usedAnti[a] = 0;   // undo`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 51, sourceCategory: "Recursion and Backtracking" },
};
