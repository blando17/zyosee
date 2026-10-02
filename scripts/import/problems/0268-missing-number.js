module.exports = {
  problemId: "dsa-268",
  slug: "missing-number",
  title: "Missing Number",
  difficulty: "Easy",
  topics: ["array", "bit manipulation", "math"],
  timeLimitMs: 2000,
  statement:
    "You are given n distinct integers, all taken from the range 0 to n inclusive.\n\n" +
    "That range holds n + 1 numbers, so exactly one of them is absent. Print it.",
  inputFormat: "Line 1: the integer n.\nLine 2: n distinct integers, each between 0 and n.",
  outputFormat: "One line holding the missing number.",
  constraints: ["1 <= n <= 100000", "0 <= each value <= n", "All values are distinct"],
  hint: "Compare what the full range would give you against what the array actually gives.",
  examples: [
    { input: "3\n3 0 1\n", expected: "2", note: "The range 0 to 3 is missing 2." },
    { input: "2\n0 1\n", expected: "2", note: "The range 0 to 2 is missing the largest." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n0\n" },
    { label: "Boundary condition", input: "1\n1\n" },
    { label: "Boundary condition", input: "5\n1 2 3 4 5\n" },
    { label: "Boundary condition", input: "5\n0 1 2 3 4\n" },
    { label: "Normal case", input: "9\n9 6 4 2 3 5 7 0 1\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      // n distinct values drawn from the n+1 possibilities in [0, n] IS an
      // array with exactly one missing — the structure falls out of the bounds
      // rather than needing a special shape.
      { name: "a", type: "intArray", length: "n", min: 0, max: "n", distinct: true },
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

    // XOR everything the range should contain, and everything it does.
    // Every present number cancels, leaving the absent one.
    long long acc = 0;
    for (long long i = 0; i <= n; i++) acc ^= i;
    long long x;
    for (int i = 0; i < n; i++) { cin >> x; acc ^= x; }
    cout << acc << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The array holds n of the n + 1 numbers from 0 to n, so exactly one is absent. Everything " +
      "needed to find it is already known: the full range is fixed, and only the array varies.",
    approach:
      "Sorting and scanning for the first gap is O(n log n). A boolean array of seen values is " +
      "O(n) time but O(n) memory.\n\n" +
      "Two O(n) time, O(1) memory methods exist. The sum method adds up 0 through n and " +
      "subtracts the array's sum. The XOR method does the same thing with exclusive-or, and has " +
      "the advantage that it cannot overflow.",
    steps: [
      "Start an accumulator at 0.",
      "XOR into it every number from 0 to n — the range as it should be.",
      "XOR into it every value in the array — the range as it actually is.",
      "Whatever survives is the missing number.",
    ],
    algorithm: [
      "acc = 0",
      "for i from 0 to n: acc = acc XOR i",
      "for each value v in the array: acc = acc XOR v",
      "print acc",
    ],
    whyItWorks:
      "Every number that is present gets XORed exactly twice — once from the range and once " +
      "from the array — and a value XORed with itself is 0. The missing number appears only in " +
      "the range half, so it is XORed once and survives.\n\n" +
      "Because XOR is commutative and associative, the two loops can be interleaved in any order " +
      "and the cancellation still happens.\n\n" +
      "The sum method is equally valid here and arguably more obvious: n(n+1)/2 minus the " +
      "array's sum. At n = 100000 both sums reach about 5 billion, well past a 32-bit integer.\n\n" +
      "It is worth being precise about what that means, because the usual warning overstates it. " +
      "On two's-complement hardware both sums wrap by the same modulus, and the wrapping cancels " +
      "in the subtraction — so a 32-bit sum method usually still prints the right answer. What " +
      "makes it a bug is not arithmetic but the language: signed overflow is undefined behaviour " +
      "in C++, so the compiler is entitled to assume it never happens and optimise accordingly. " +
      "Relying on the cancellation is relying on luck.\n\n" +
      "XOR sidesteps the question entirely: it has no overflow to reason about. A 64-bit sum is " +
      "equally safe and just as clear.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation:
        "Two passes, one accumulator. Sorting would be O(n log n); a seen-array would be O(n) memory.",
    },
    edgeCases: [
      "n = 1 with the array holding 0, so 1 is missing.",
      "n = 1 with the array holding 1, so 0 is missing.",
      "0 missing, where the array is 1 through n.",
      "n missing, where the array is 0 through n-1 — the case a naive maximum-based method gets wrong.",
      "Large n, where the sum method overflows a 32-bit type but XOR does not.",
    ],
    implementation: `long long acc = 0;
for (long long i = 0; i <= n; i++) acc ^= i;   // the range as it should be
for (each value v) acc ^= v;                    // as it actually is
return acc;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 268, sourceCategory: "Bit Manipulation" },
};
