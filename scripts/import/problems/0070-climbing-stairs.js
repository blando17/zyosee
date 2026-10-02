module.exports = {
  problemId: "dsa-70",
  slug: "climbing-stairs",
  title: "Climbing Stairs",
  difficulty: "Easy",
  topics: ["dynamic programming", "math"],
  timeLimitMs: 2000,
  statement:
    "You are climbing a staircase of n steps. Each move takes you up either one step or two.\n\n" +
    "For each of q staircases, print how many distinct ways there are to reach the top.",
  inputFormat: "Line 1: the integer q, the number of staircases.\nLine 2: q integers, the height of each staircase.",
  outputFormat: "q lines, each holding the number of ways for the corresponding staircase.",
  constraints: ["1 <= q <= 100000", "1 <= n <= 90"],
  hint: "The last move was either one step or two, so the ways split into two groups.",
  examples: [
    { input: "2\n2 3\n", expected: "2\n3", note: "Two steps: 1+1 or 2. Three steps: 1+1+1, 1+2 or 2+1." },
    { input: "1\n1\n", expected: "1", note: "One step has a single way." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n1\n" },
    { label: "Boundary condition", input: "1\n2\n" },
    { label: "Largest allowed input", input: "1\n90\n" },
    { label: "Normal case", input: "5\n5 10 20 45 90\n" },
    { label: "All duplicates", input: "4\n7 7 7 7\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "q", type: "int", min: 1, max: 100000, scales: true },
      { name: "heights", type: "intArray", length: "q", min: 1, max: 90 },
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

    // Every answer up to the limit, computed once and reused. The values are
    // Fibonacci numbers; the 90th is about 2.9 * 10^18, which is why they are
    // held in a 64-bit type.
    const int LIMIT = 90;
    vector<long long> ways(LIMIT + 1);
    ways[1] = 1;
    if (LIMIT >= 2) ways[2] = 2;
    for (int i = 3; i <= LIMIT; i++) ways[i] = ways[i - 1] + ways[i - 2];

    string out;
    out.reserve(q * 20);
    for (int i = 0; i < q; i++) {
        int n; cin >> n;
        out += to_string(ways[n]);
        out += '\\n';
    }
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Each way to the top is a sequence of moves of size one and two that add up to n. Counting " +
      "them by listing them is hopeless: the count grows exponentially.",
    approach:
      "Think backwards from the top. The final move was either a single step, arriving from " +
      "step n - 1, or a double step, arriving from step n - 2. Those two groups share nothing " +
      "and cover everything, so the count for n is the sum of the counts for n - 1 and n - 2.\n\n" +
      "That is the Fibonacci recurrence. Computing it from the bottom up takes n additions; " +
      "computing it recursively without memoising takes exponential time, because the same " +
      "sub-staircases are recounted over and over.",
    steps: [
      "There is one way to climb a staircase of one step, and two ways for two steps.",
      "For every later n, add the counts for n - 1 and n - 2.",
      "Work upwards until the required n is reached.",
      "Since many staircases are asked about, compute the whole table once and answer each query by lookup.",
    ],
    algorithm: [
      "ways[1] = 1, ways[2] = 2",
      "for i from 3 to limit: ways[i] = ways[i-1] + ways[i-2]",
      "answer each query by reading ways[n]",
    ],
    whyItWorks:
      "The split is exhaustive and disjoint, which is what makes addition the right operation. " +
      "Every route ends with exactly one final move, and that move is either one step or two — " +
      "never both, never neither. So no route is counted twice and none is missed.\n\n" +
      "The base cases have to be right or everything above them is wrong. One step has a single " +
      "route; two steps have two, not one. Setting ways[2] = 1 shifts the whole sequence and is " +
      "the usual mistake.\n\n" +
      "Precomputing matters here because there are up to 100000 queries. Recomputing per query " +
      "would be 100000 * 90 additions rather than 90.",
    complexity: {
      time: "O(limit + q)",
      space: "O(limit)",
      explanation:
        "The table is built once in 90 additions and every query is a lookup. Plain recursion " +
        "would be O(2^n) per query; even memoised recursion pays the recursion overhead.",
    },
    edgeCases: [
      "A staircase of one step, the base case.",
      "Two steps, where the answer is 2 and not 1.",
      "The largest allowed staircase, whose answer needs 64 bits.",
      "Repeated queries, which the precomputed table answers instantly.",
      "Storing the counts in a 32-bit type, which overflows around n = 45.",
    ],
    implementation: `ways[1] = 1; ways[2] = 2;
for (int i = 3; i <= LIMIT; i++) ways[i] = ways[i-1] + ways[i-2];
// then answer every query by lookup`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 70, sourceCategory: "Dynamic Programming" },
};
