module.exports = {
  problemId: "dsa-88",
  slug: "merge-sorted-array",
  title: "Merge Sorted Array",
  difficulty: "Easy",
  topics: ["array", "two pointers", "sorting"],
  timeLimitMs: 2000,

  statement:
    "You are given two arrays that are each already sorted in non-decreasing order.\n\n" +
    "Merge them into a single sorted array and print it.",

  inputFormat:
    "Line 1: two integers m and n, the lengths of the two arrays.\n" +
    "Line 2: m integers in non-decreasing order.\n" +
    "Line 3: n integers in non-decreasing order.",
  outputFormat: "One line holding the m + n values in non-decreasing order, separated by single spaces.",
  constraints: ["1 <= m <= 100000", "1 <= n <= 100000", "-1000000000 <= values <= 1000000000"],
  hint: "Both inputs are already sorted, so you never have to sort anything — only choose.",

  examples: [
    { input: "3 3\n1 2 3\n2 5 6\n", expected: "1 2 2 3 5 6", note: "Take the smaller front value each time." },
    { input: "1 1\n5\n1\n", expected: "1 5", note: "The second array's only value comes first." },
  ],

  curated: [
    { label: "Smallest allowed input", input: "1 1\n0\n0\n" },
    { label: "All duplicates", input: "3 3\n2 2 2\n2 2 2\n" },
    { label: "Special case", input: "3 3\n1 2 3\n4 5 6\n" },
    { label: "Negative values", input: "3 3\n-9 -5 -1\n-8 -4 0\n" },
    { label: "Overflow risk", input: "2 2\n-1000000000 1000000000\n-1000000000 1000000000\n" },
  ],

  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "m", type: "int", min: 1, max: 100000, scales: true },
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "a", type: "intArray", length: "m", min: -1000000000, max: 1000000000, sorted: true },
      { name: "b", type: "intArray", length: "n", min: -1000000000, max: 1000000000, sorted: true },
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
    vector<long long> a(m), b(n);
    for (long long i = 0; i < m; i++) cin >> a[i];
    for (long long i = 0; i < n; i++) cin >> b[i];

    string out;
    out.reserve((m + n) * 12);
    long long i = 0, j = 0;
    while (i < m || j < n) {
        long long take;
        if (j >= n || (i < m && a[i] <= b[j])) take = a[i++];
        else take = b[j++];
        if (!out.empty()) out += ' ';
        out += to_string(take);
    }
    out += '\\n';
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },

  editorial: {
    understanding:
      "Two sorted lists have to become one sorted list. Nothing needs re-sorting; the order " +
      "inside each input is already right, and only the interleaving has to be decided.",
    approach:
      "Sorting the concatenation works and costs O((m+n) log(m+n)), but it throws away what you " +
      "were given. Keep one pointer in each array instead. The smallest value not yet written " +
      "must be at one of the two pointers, because everything behind them is written and " +
      "everything ahead of them is larger.",
    steps: [
      "Put a pointer at the start of each array.",
      "Compare the two values under the pointers.",
      "Write the smaller one out and advance that pointer.",
      "When one array runs out, write the rest of the other straight through.",
      "Stop when both are exhausted.",
    ],
    algorithm: [
      "i = 0, j = 0",
      "while i < m or j < n:",
      "    if j is exhausted, or a[i] <= b[j]: output a[i], i = i + 1",
      "    else: output b[j], j = j + 1",
    ],
    whyItWorks:
      "The invariant is that everything already written is sorted and is no larger than anything " +
      "remaining. It holds at the start, when nothing is written.\n\n" +
      "Each step preserves it. Because both arrays are sorted, the smallest unwritten value in " +
      "array a is a[i] and in b is b[j]. The smaller of those two is therefore the smallest " +
      "unwritten value overall, so appending it keeps the output sorted and keeps the invariant " +
      "true. When the loop ends nothing remains, so the output is the full sorted merge.\n\n" +
      "Using <= rather than < is what makes the merge stable, which matters when equal values " +
      "come from different arrays.",
    complexity: {
      time: "O(m + n)",
      space: "O(m + n) for the output, O(1) beyond it",
      explanation: "Every value is looked at once and written once; neither pointer ever moves back.",
    },
    edgeCases: [
      "One array entirely smaller than the other, so one runs out immediately and the tail is copied.",
      "Equal values across both arrays, where the comparison decides the tie.",
      "All values identical.",
      "Values at both ends of the allowed range, which is why the sums and the values are kept in a 64-bit type.",
      "Large m and n together: 200000 numbers is over two megabytes of output, so it is built in one string rather than streamed with <<.",
    ],
    implementation: `long long i = 0, j = 0;
while (i < m || j < n) {
    if (j >= n || (i < m && a[i] <= b[j])) out += to_string(a[i++]);
    else out += to_string(b[j++]);
}`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 88, sourceCategory: "Arrays" },
};
