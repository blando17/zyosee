module.exports = {
  problemId: "dsa-190",
  slug: "reverse-bits",
  title: "Reverse Bits",
  difficulty: "Easy",
  topics: ["bit manipulation"],
  timeLimitMs: 2000,
  statement:
    "You are given q unsigned 32-bit integers.\n\n" +
    "For each one, reverse the order of its 32 bits and print the resulting number. The bit " +
    "that was in position 0 ends up in position 31, and so on.",
  inputFormat: "Line 1: the integer q, how many numbers follow.\nNext q lines: one unsigned 32-bit integer each.",
  outputFormat: "q lines, each holding the bit-reversed value of the corresponding input.",
  constraints: ["1 <= q <= 100000", "0 <= each number <= 4294967295"],
  hint: "Build the answer one bit at a time: shift it left, then take the input's lowest bit.",
  examples: [
    { input: "1\n43261596\n", expected: "964176192", note: "Reversing all 32 bits of 43261596." },
    { input: "1\n1\n", expected: "2147483648", note: "The lowest bit moves to the highest position." },
  ],
  curated: [
    { label: "Zero values", input: "1\n0\n" },
    { label: "Boundary condition", input: "1\n4294967295\n" },
    { label: "Boundary condition", input: "1\n2147483648\n" },
    { label: "Special case", input: "2\n1\n2147483648\n" },
    { label: "Normal case", input: "3\n255\n4278190080\n65535\n" },
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
    out.reserve(q * 11);
    for (int i = 0; i < q; i++) {
        unsigned long long v;
        cin >> v;
        unsigned int n = (unsigned int)v;
        unsigned int result = 0;
        // Exactly 32 rounds: the count is fixed, not "until n is zero", or
        // leading zeros in the input would be dropped from the answer.
        for (int b = 0; b < 32; b++) {
            result = (result << 1) | (n & 1u);
            n >>= 1;
        }
        out += to_string((unsigned long long)result);
        out += '\\n';
    }
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The number is treated as exactly 32 bits, including the leading zeros. Reversing 1 does " +
      "not give 1; it gives 2147483648, because the single set bit travels from position 0 all " +
      "the way to position 31.",
    approach:
      "Build the answer bit by bit. Shift the result left to make room, then drop in the " +
      "input's current lowest bit, then shift the input right to expose the next one. After 32 " +
      "rounds the first bit taken has been shifted left 31 times and sits at the top, which is " +
      "exactly where it belongs.",
    steps: [
      "Start the result at 0.",
      "Repeat 32 times: shift the result left by one, OR in the input's lowest bit, shift the input right by one.",
      "After the 32nd round, the result is the reversed number.",
    ],
    algorithm: [
      "result = 0",
      "repeat 32 times:",
      "    result = (result << 1) OR (n AND 1)",
      "    n = n >> 1",
      "print result",
    ],
    whyItWorks:
      "Follow one bit. The bit read on round k is the input's bit k, and it is then shifted left " +
      "once for each of the remaining 31 - k rounds. It therefore ends at position 31 - k, which " +
      "is the definition of reversing a 32-bit word.\n\n" +
      "The loop count must be a fixed 32, not \"while n is non-zero\". Stopping early looks " +
      "tempting because the input runs out of set bits, but the leading zeros are part of the " +
      "value: reversing 1 needs all 32 rounds to carry that bit to the top. Stopping as soon as " +
      "n hits zero would return 1 unchanged.\n\n" +
      "The type matters too. In a signed 32-bit integer the top bit is the sign, and a right " +
      "shift copies it rather than bringing in a zero, so a number with the top bit set would " +
      "loop forever. Working in an unsigned type avoids that entirely.",
    complexity: {
      time: "O(32) per query, so O(q)",
      space: "O(1)",
      explanation:
        "A fixed 32 iterations regardless of the value. Divide-and-conquer bit swapping does it " +
        "in 5 masked steps, and a byte lookup table in 4.",
    },
    edgeCases: [
      "Zero, which reverses to zero.",
      "All bits set, which also reverses to itself.",
      "1, which becomes 2147483648 — the case that exposes an early-exit loop.",
      "2147483648, which becomes 1.",
      "Signed arithmetic shifting, which copies the sign bit and never terminates.",
    ],
    implementation: `unsigned int result = 0;
for (int b = 0; b < 32; b++) {     // always 32, never "while n"
    result = (result << 1) | (n & 1u);
    n >>= 1;
}
return result;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 190, sourceCategory: "Bit Manipulation" },
};
