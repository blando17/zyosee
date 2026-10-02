module.exports = {
  problemId: "dsa-238",
  slug: "product-of-array-except-self",
  title: "Product of Array Except Self",
  difficulty: "Medium",
  topics: ["array", "prefix sum"],
  timeLimitMs: 2000,

  statement:
    "You are given an array of n integers.\n\n" +
    "Print an array of the same length where the i-th value is the product of every element " +
    "of the input except the one at position i.\n\n" +
    "Solve it without using division.",

  inputFormat: "Line 1: the integer n, the length of the array.\nLine 2: n integers, the array.",
  outputFormat: "One line holding n integers separated by single spaces.",
  constraints: [
    "2 <= n <= 100000",
    "-9 <= a[i] <= 9",
    "Every answer fits in a signed 64-bit integer",
  ],
  hint: "Each answer is everything to its left multiplied by everything to its right.",

  examples: [
    { input: "4\n1 2 3 4\n", expected: "24 12 8 6", note: "For the first position, 2 x 3 x 4 = 24." },
    { input: "5\n-1 1 0 -3 3\n", expected: "0 0 9 0 0", note: "A single zero makes every answer zero except at the zero itself." },
  ],

  curated: [
    { label: "Smallest allowed input", input: "2\n3 4\n" },
    { label: "Zero values", input: "4\n1 0 3 4\n" },
    { label: "Special case", input: "4\n0 0 3 4\n" },
    { label: "Negative values", input: "5\n-2 -3 -4 -5 -6\n" },
    { label: "All duplicates", input: "6\n2 2 2 2 2 2\n" },
    { label: "Overflow risk", input: "8\n9 9 9 9 9 9 9 9\n" },
  ],

  /*
   * Generated values are kept to -1..1 on purpose. The products in this problem
   * grow as fast as the array is long, so random values in the full -9..9 range
   * would overflow any integer type long before n reaches its limit, and the
   * expected output would be meaningless. Restricting the values keeps every
   * product inside -1..1 while still exercising the full input size, and the
   * curated cases above cover the interesting values at small n.
   */
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 2, max: 100000, scales: true },
      { name: "a", type: "intArray", length: "n", min: -1, max: 1 },
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
    vector<long long> a(n), res(n, 1);
    for (int i = 0; i < n; i++) cin >> a[i];

    long long left = 1, right = 1;
    for (int i = 0; i < n; i++) {
        res[i] *= left;
        left *= a[i];
        res[n - 1 - i] *= right;
        right *= a[n - 1 - i];
    }

    string out;
    out.reserve(n * 12);
    for (int i = 0; i < n; i++) {
        if (i) out += ' ';
        out += to_string(res[i]);
    }
    out += '\\n';
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },

  editorial: {
    understanding:
      "Each output position asks for the product of the whole array with one element left out. " +
      "Dividing the total product by that element would be the obvious route, and it is exactly " +
      "what the problem forbids — for good reason, since it breaks the moment any element is zero.",
    approach:
      "Split the product around the gap. Everything except position i is everything to its LEFT " +
      "multiplied by everything to its RIGHT. Both of those can be built by sweeping the array " +
      "once in each direction, carrying a running product that deliberately excludes the current " +
      "element.",
    steps: [
      "Start an answer array filled with 1.",
      "Sweep left to right with a running product that starts at 1.",
      "At each position, multiply the answer there by the running product — which at that moment is the product of everything strictly to the left.",
      "Then fold the current element into the running product, so it is ready for the next position.",
      "Sweep right to left in the same way with a second running product.",
      "Each answer has now been multiplied by its left product and its right product.",
    ],
    algorithm: [
      "res = array of n ones; left = 1; right = 1",
      "for i from 0 to n-1:",
      "    res[i] = res[i] * left",
      "    left = left * a[i]",
      "    res[n-1-i] = res[n-1-i] * right",
      "    right = right * a[n-1-i]",
      "print res",
    ],
    whyItWorks:
      "The ordering inside the loop is the whole trick. The answer at position i is multiplied by " +
      "the running product BEFORE the current element is folded in, so the element at i is never " +
      "part of its own answer. That is what replaces the division.\n\n" +
      "After the left-to-right sweep, res[i] holds the product of a[0..i-1]. After the " +
      "right-to-left sweep it has also been multiplied by the product of a[i+1..n-1]. Together " +
      "that is every element except a[i], which is the definition of the answer.\n\n" +
      "Zeros need no special handling, which is the real advantage over dividing: a zero simply " +
      "makes every running product past it zero, and only the position holding the zero escapes.",
    complexity: {
      time: "O(n)",
      space: "O(n) for the answer, O(1) beyond it",
      explanation:
        "Both sweeps happen in the same loop, so the array is traversed once with two running " +
        "products. No extra prefix arrays are stored.",
    },
    edgeCases: [
      "Exactly one zero: its own answer is the product of the rest, every other answer is zero.",
      "Two or more zeros: every answer is zero.",
      "Negative values, where the sign of each answer depends on how many negatives lie outside it.",
      "The smallest array, n = 2, where each answer is simply the other element.",
      "Products that grow quickly, which is why the running products are 64-bit.",
    ],
    implementation: `long long left = 1, right = 1;
for (int i = 0; i < n; i++) {
    res[i] *= left;          // left product excludes a[i]
    left *= a[i];
    res[n - 1 - i] *= right; // right product excludes a[n-1-i]
    right *= a[n - 1 - i];
}`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 238, sourceCategory: "Arrays" },
};
