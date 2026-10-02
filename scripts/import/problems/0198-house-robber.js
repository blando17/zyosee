module.exports = {
  problemId: "dsa-198",
  slug: "house-robber",
  title: "House Robber",
  difficulty: "Medium",
  topics: ["array", "dynamic programming"],
  timeLimitMs: 2000,
  statement:
    "A row of n houses each hold some amount of money. You may take from any set of houses, " +
    "except that taking from two houses standing next to each other sets off an alarm.\n\n" +
    "Print the largest total you can take.",
  inputFormat: "Line 1: the integer n.\nLine 2: n integers, the money in each house.",
  outputFormat: "One line holding the largest total.",
  constraints: ["1 <= n <= 100000", "0 <= money <= 10000"],
  hint: "At each house you either take it and skip the one before, or skip it and keep the best so far.",
  examples: [
    { input: "4\n1 2 3 1\n", expected: "4", note: "Take houses 0 and 2 for 1 + 3." },
    { input: "5\n2 7 9 3 1\n", expected: "12", note: "Take houses 0, 2 and 4 for 2 + 9 + 1." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n7\n" },
    { label: "Boundary condition", input: "2\n5 9\n" },
    { label: "Zero values", input: "4\n0 0 0 0\n" },
    { label: "All duplicates", input: "5\n4 4 4 4 4\n" },
    { label: "Special case", input: "3\n100 1 100\n" },
    { label: "Overflow risk", input: "5\n10000 10000 10000 10000 10000\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "money", type: "intArray", length: "n", min: 0, max: 10000 },
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

    // best = the answer for the houses seen so far
    // prev = the answer for everything up to the one before that
    long long best = 0, prev = 0;
    for (int i = 0; i < n; i++) {
        long long v; cin >> v;
        long long take = prev + v;
        long long skip = best;
        prev = best;
        best = max(take, skip);
    }
    cout << best << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Any set of houses is allowed as long as no two are adjacent. The largest total over all " +
      "such sets is wanted. Trying every set is 2^n, which is hopeless.",
    approach:
      "Walk the row once and ask, at each house, one question: what is the best total using only " +
      "the houses up to here?\n\n" +
      "There are exactly two ways to achieve it. Either this house is taken, in which case the " +
      "one before it cannot be, and the total is its money plus the best up to two houses back. " +
      "Or it is skipped, and the total is simply the best up to the previous house. The answer " +
      "is the larger.",
    steps: [
      "Keep two running numbers: the best total including everything up to the previous house, and the best up to the house before that.",
      "At each house, work out the take option: its money plus the older of the two numbers.",
      "The skip option is just the more recent number.",
      "Take the larger of the two and shift both numbers along.",
      "After the last house, the more recent number is the answer.",
    ],
    algorithm: [
      "best = 0, prev = 0",
      "for each house value v:",
      "    take = prev + v",
      "    skip = best",
      "    prev = best",
      "    best = max(take, skip)",
      "print best",
    ],
    whyItWorks:
      "The two options are exhaustive — a house is either taken or not — and mutually exclusive, " +
      "so the maximum of the two is the true best.\n\n" +
      "The reason only two numbers are needed is that the recurrence reaches back exactly two " +
      "positions and no further. Whether a house three back was taken has no bearing on this " +
      "decision; it is already accounted for inside the totals being carried.\n\n" +
      "The order of the updates matters. `prev` must be set to the OLD `best` before `best` is " +
      "overwritten, otherwise the next house would be allowed to take two adjacent houses. " +
      "Writing the two assignments the wrong way round is the usual bug and produces answers " +
      "that are too large.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation:
        "One pass holding two numbers. A full table would be O(n) memory and give the same " +
        "answer; only two of its entries are ever needed at once.",
    },
    edgeCases: [
      "A single house, where the answer is its money.",
      "Two houses, where only the larger may be taken.",
      "All zeros, where the answer is 0.",
      "A large value between two small ones, where skipping both neighbours wins.",
      "Every house holding the maximum, where the total needs more than 32 bits at large n.",
    ],
    implementation: `long long best = 0, prev = 0;
for (each value v) {
    long long take = prev + v, skip = best;
    prev = best;              // shift BEFORE overwriting best
    best = max(take, skip);
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 198, sourceCategory: "Dynamic Programming" },
};
