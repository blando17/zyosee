module.exports = {
  problemId: "dsa-136",
  slug: "single-number",
  title: "Single Number",
  difficulty: "Easy",
  topics: ["array", "bit manipulation"],
  timeLimitMs: 2000,
  statement:
    "You are given an array in which every value appears exactly twice, except for one value " +
    "that appears only once.\n\n" +
    "Print that value.\n\n" +
    "The array always has an odd number of elements.",
  inputFormat: "Line 1: the integer n, an odd number.\nLine 2: n integers.",
  outputFormat: "One line holding the value that appears only once.",
  constraints: ["1 <= n <= 99999", "n is odd", "-1000000000 <= value <= 1000000000", "Exactly one value appears once; every other appears exactly twice"],
  hint: "Find an operation that cancels a value against itself.",
  examples: [
    { input: "3\n2 2 1\n", expected: "1", note: "The two 2s pair off, leaving 1." },
    { input: "5\n4 1 2 1 2\n", expected: "4", note: "1 and 2 each appear twice." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n7\n" },
    { label: "Negative values", input: "3\n-3 -3 -9\n" },
    { label: "Zero values", input: "3\n0 5 5\n" },
    { label: "Special case", input: "5\n1 1 2 2 0\n" },
    { label: "Overflow risk", input: "3\n1000000000 -1000000000 1000000000\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      // step: 2 forces an odd size, which the problem requires.
      { name: "n", type: "int", min: 1, max: 99999, step: 2, scales: true },
      // pairsPlusOne builds the structure the problem promises. A plain random
      // array would have many values appearing once and no defined answer.
      { name: "a", type: "intArray", length: "n", min: -1000000000, max: 1000000000, pairsPlusOne: true },
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

    long long result = 0;
    long long x;
    for (int i = 0; i < n; i++) { cin >> x; result ^= x; }
    cout << result << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Every value cancels against its twin except one. The task is to find the survivor without " +
      "needing to know which values were paired.",
    approach:
      "Counting occurrences in a hash map works and costs O(n) memory. Sorting and scanning for " +
      "a value unlike its neighbours works too, at O(n log n).\n\n" +
      "Exclusive-or does it in one pass with a single variable. Take the XOR of every value in " +
      "the array; the paired values annihilate each other and only the lone value is left.",
    steps: [
      "Start with a result of 0.",
      "Read each value in turn and XOR it into the result.",
      "After the last value, the result is the answer.",
    ],
    algorithm: ["result = 0", "for each value v: result = result XOR v", "print result"],
    whyItWorks:
      "Three properties of XOR do all the work. A value XORed with itself is 0, so any pair " +
      "cancels. A value XORed with 0 is unchanged, so the survivor passes through untouched. " +
      "And XOR is both commutative and associative, so the order the values arrive in does not " +
      "matter — the pairs cancel wherever they happen to sit.\n\n" +
      "Put together: the XOR of the whole array equals the XOR of all the pairs, which is 0, " +
      "XORed with the lone value. That is just the lone value.\n\n" +
      "The order-independence is what makes this work on an unsorted array with no bookkeeping " +
      "at all. Nothing has to remember which values it has already seen, which is why the memory " +
      "is constant rather than proportional to n.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation:
        "One pass, one accumulator. The hash-map method is the same time but O(n) space; sorting " +
        "is O(n log n).",
    },
    edgeCases: [
      "A single element, which is trivially the answer.",
      "The lone value being 0, where the result accumulates and cancels back to 0.",
      "Negative values, which XOR correctly in two's complement.",
      "The lone value appearing first or last, which the order-independence handles.",
      "Large values, kept in a 64-bit accumulator here so the sign bit is never a surprise.",
    ],
    implementation: `long long result = 0;
for (each value v) result ^= v;   // pairs cancel, the single survives
return result;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 136, sourceCategory: "Bit Manipulation" },
};
