module.exports = {
  problemId: "dsa-46",
  slug: "permutations",
  title: "Permutations",
  difficulty: "Medium",
  topics: ["array", "backtracking"],
  timeLimitMs: 3000,
  statement:
    "You are given an array of n distinct integers.\n\n" +
    "Print every possible ordering of them, sorted: compare two orderings by their first " +
    "differing value.",
  inputFormat: "Line 1: the integer n.\nLine 2: n distinct integers.",
  outputFormat: "Line 1: the number of orderings.\nNext lines: one ordering per line, its n values separated by single spaces.",
  constraints: ["1 <= n <= 8", "-1000000000 <= value <= 1000000000", "All values are distinct"],
  hint: "Choose the first value, then permute what is left.",
  examples: [
    {
      input: "3\n1 2 3\n",
      expected: "6\n1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1",
      note: "Six orderings of three values, in sorted order.",
    },
    { input: "1\n5\n", expected: "1\n5", note: "One value has a single ordering." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n0\n" },
    { label: "Boundary condition", input: "2\n2 1\n" },
    { label: "Negative values", input: "3\n-1 -2 -3\n" },
    { label: "Largest allowed input", input: "8\n1 2 3 4 5 6 7 8\n" },
    { label: "Special case", input: "4\n4 3 2 1\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      // 8 is the ceiling because the count is n factorial: 8! is 40320 lines,
      // while 11! would be nearly forty million.
      { name: "n", type: "int", min: 1, max: 8, scales: true },
      { name: "a", type: "intArray", length: "n", min: -1000000000, max: 1000000000, distinct: true },
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

    // Sorting first means next_permutation walks them in exactly the order the
    // statement asks for, with no final sort of the whole collection.
    sort(a.begin(), a.end());

    string out;
    long long count = 1;
    for (int i = 2; i <= n; i++) count *= i;
    out += to_string(count);
    out += '\\n';

    do {
        for (int i = 0; i < n; i++) {
            if (i) out += ' ';
            out += to_string(a[i]);
        }
        out += '\\n';
    } while (next_permutation(a.begin(), a.end()));

    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "An ordering uses every value exactly once, so there are n factorial of them. The " +
      "difficulty is producing them all, each once, in a fixed order.",
    approach:
      "The backtracking view: choose which value goes first, then recursively order what " +
      "remains. Tracking which values are already used, or swapping the chosen value into " +
      "position, are the two usual ways to write it.\n\n" +
      "There is also a direct route. Sort the values, then repeatedly step to the next ordering " +
      "in sorted sequence until there is none. That produces them already in the required order " +
      "and needs no recursion at all.",
    steps: [
      "Sort the values, giving the first ordering.",
      "Print it.",
      "Step to the next ordering in sorted sequence.",
      "Repeat until the last ordering — the fully descending one — has been printed.",
    ],
    algorithm: [
      "sort the values",
      "repeat:",
      "    print the current ordering",
      "while a next ordering exists",
    ],
    whyItWorks:
      "The next-ordering step has a neat rule worth knowing. Scan from the right for the last " +
      "position whose value is smaller than the one after it — that is the only place a change " +
      "can make the ordering larger by the smallest possible amount. Swap it with the smallest " +
      "value to its right that still exceeds it, then reverse everything after it, which puts " +
      "that tail into its smallest arrangement.\n\n" +
      "That produces the immediately next ordering every time, so starting from the sorted one " +
      "and repeating visits all n factorial exactly once, in sorted order.\n\n" +
      "The backtracking version reaches the same set but usually not in sorted order unless the " +
      "input is sorted first and the choices are made in ascending order — which is why the " +
      "recursive solutions to this problem so often need a sort at the end.",
    complexity: {
      time: "O(n * n!)",
      space: "O(n) beyond the output",
      explanation:
        "There are n! orderings and each costs O(n) to print. That is optimal: the output is " +
        "that large. The stepping itself is O(n) amortised per ordering.",
    },
    edgeCases: [
      "A single value, giving one ordering.",
      "Two values, giving two.",
      "Input given out of order, which is why sorting comes first.",
      "The largest allowed n, giving 40320 lines.",
      "Negative values, which sort before positive ones.",
    ],
    implementation: `sort(a.begin(), a.end());
do {
    print(a);
} while (next_permutation(a.begin(), a.end()));`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 46, sourceCategory: "Recursion and Backtracking" },
};
