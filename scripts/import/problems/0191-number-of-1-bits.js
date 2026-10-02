module.exports = {
  problemId: "dsa-191",
  slug: "number-of-1-bits",
  title: "Number of 1 Bits",
  difficulty: "Easy",
  topics: ["bit manipulation"],
  timeLimitMs: 2000,
  statement:
    "You are given q unsigned 32-bit integers.\n\n" +
    "For each one, print how many of its 32 bits are set to 1. This count is also called the " +
    "Hamming weight or the population count.",
  inputFormat: "Line 1: the integer q, how many numbers follow.\nNext q lines: one unsigned 32-bit integer each.",
  outputFormat: "q lines, each holding the number of 1 bits in the corresponding input.",
  constraints: ["1 <= q <= 100000", "0 <= each number <= 4294967295"],
  hint: "Subtracting one from a number flips its lowest set bit and everything below it.",
  examples: [
    { input: "2\n11\n128\n", expected: "3\n1", note: "11 is 1011 in binary, so three bits are set; 128 is a single bit." },
    { input: "1\n4294967293\n", expected: "31", note: "All 32 bits set except one." },
  ],
  curated: [
    { label: "Zero values", input: "1\n0\n" },
    { label: "Boundary condition", input: "1\n4294967295\n" },
    { label: "Boundary condition", input: "1\n1\n" },
    { label: "Boundary condition", input: "1\n2147483648\n" },
    { label: "Normal case", input: "4\n0 \n1\n1023\n4294967295\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "q", type: "int", min: 1, max: 100000, scales: true },
      { name: "values", type: "intArray", length: "q", min: 0, max: 4294967295 },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int q;
    if (!(cin >> q)) return 0;

    string out;
    out.reserve(q * 3);
    for (int i = 0; i < q; i++) {
        unsigned long long v;
        cin >> v;
        unsigned int n = (unsigned int)v;
        int count = 0;
        // Brian Kernighan: n & (n-1) clears the lowest set bit, so the loop
        // runs once per set bit rather than 32 times.
        while (n) { n &= (n - 1); count++; }
        out += to_string(count);
        out += '\\n';
    }
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The question is how many 1s appear in the binary form of a number. Nothing about the " +
      "number's value matters, only its bit pattern.",
    approach:
      "The direct method tests each of the 32 bits: check the lowest, shift right, repeat. That " +
      "is always 32 iterations regardless of the number.\n\n" +
      "Brian Kernighan's trick does better. The expression n & (n - 1) clears exactly the " +
      "lowest set bit and leaves everything else alone, so counting how many times it takes to " +
      "reach zero counts the set bits directly. The loop runs once per 1 bit, not once per bit.",
    steps: [
      "Start a counter at 0.",
      "While the number is not zero, replace it with n & (n - 1).",
      "Add one to the counter each time.",
      "When the number reaches zero, the counter holds the answer.",
    ],
    algorithm: ["count = 0", "while n != 0: n = n AND (n - 1); count = count + 1", "print count"],
    whyItWorks:
      "Subtracting 1 from a number turns its lowest set bit into 0 and turns every zero below " +
      "it into a 1. Take 1011000: subtracting 1 gives 1010111. The bits above the lowest set " +
      "bit are untouched, the lowest set bit has flipped off, and everything below has flipped " +
      "on.\n\n" +
      "ANDing the two keeps only the bits they agree on, which is exactly the untouched upper " +
      "part: 1010000. So one bit is removed per step, and no other bit changes.\n\n" +
      "The number therefore reaches zero after precisely as many steps as it had set bits. That " +
      "is why the loop is faster on sparse numbers, where the shift-and-test method would still " +
      "grind through all 32 positions.",
    complexity: {
      time: "O(number of set bits), at most 32 per query",
      space: "O(1)",
      explanation:
        "Each iteration removes one set bit. The shift method is a fixed 32 iterations; a " +
        "lookup table can do it in 4 steps at the cost of memory, and modern hardware has a " +
        "single instruction for it.",
    },
    edgeCases: [
      "Zero, where the loop never runs and the answer is 0.",
      "All 32 bits set, the maximum answer of 32.",
      "A single bit set, including the top bit at 2147483648 — the value that overflows a signed 32-bit int.",
      "Reading into a signed type, which makes the top bit negative and can loop forever on an arithmetic right shift.",
    ],
    implementation: `int count = 0;
while (n) { n &= (n - 1); count++; }   // clears the lowest set bit each time
return count;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 191, sourceCategory: "Bit Manipulation" },
};
