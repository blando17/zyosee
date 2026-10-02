module.exports = {
  problemId: "dsa-322",
  slug: "coin-change",
  title: "Coin Change",
  difficulty: "Medium",
  topics: ["array", "dynamic programming"],
  timeLimitMs: 3000,
  statement:
    "You are given coins of c different values, with an unlimited supply of each, and a target " +
    "amount.\n\n" +
    "Print the fewest coins that add up to exactly that amount, or -1 if no combination does.",
  inputFormat: "Line 1: the integer c.\nLine 2: c distinct positive integers, the coin values.\nLine 3: the target amount.",
  outputFormat: "One line holding the fewest coins, or -1.",
  constraints: ["1 <= c <= 12", "1 <= coin value <= 10000", "0 <= amount <= 10000"],
  hint: "The best way to make an amount uses some coin last; try each one.",
  examples: [
    { input: "3\n1 2 5\n11\n", expected: "3", note: "5 + 5 + 1." },
    { input: "1\n2\n3\n", expected: "-1", note: "An odd amount cannot be made from 2s." },
  ],
  curated: [
    { label: "Zero values", input: "3\n1 2 5\n0\n" },
    { label: "Smallest allowed input", input: "1\n1\n1\n" },
    { label: "Boundary condition", input: "1\n10000\n10000\n" },
    { label: "Special case", input: "2\n5 10\n3\n" },
    // Greedy fails here: taking 4 first leaves 2, needing 4+1+1 = three coins,
    // when 3+3 is two.
    { label: "Special case", input: "3\n1 3 4\n6\n" },
    { label: "Largest practical input", input: "4\n1 7 13 99\n10000\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "c", type: "int", min: 1, max: 12, scales: true },
      { name: "coins", type: "intArray", length: "c", min: 1, max: 200, distinct: true },
      { name: "amount", type: "int", min: 0, max: 10000, scales: true },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int c;
    if (!(cin >> c)) return 0;
    vector<long long> coins(c);
    for (int i = 0; i < c; i++) cin >> coins[i];
    long long amount; cin >> amount;

    const long long INF = amount + 1;   // more coins than could ever be needed
    vector<long long> dp(amount + 1, INF);
    dp[0] = 0;
    for (long long coin : coins)
        for (long long j = coin; j <= amount; j++)
            dp[j] = min(dp[j], dp[j - coin] + 1);

    cout << (dp[amount] > amount ? -1 : dp[amount]) << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Coins may be reused freely, so this is not about choosing a subset. The question is the " +
      "smallest number of coins summing to the target, and some targets cannot be made at all.",
    approach:
      "Taking the largest coin that fits, repeatedly, is tempting and wrong. With coins 1, 3 and " +
      "4 making 6, that takes 4 then 1 then 1 — three coins — when 3 and 3 is two. Greedy works " +
      "only for specially structured coin systems.\n\n" +
      "Build up every amount from 0 to the target instead. The best way to make an amount uses " +
      "some coin as its last coin, so try each coin and take the best of what remains.",
    steps: [
      "Make a table holding the fewest coins for every amount from 0 to the target.",
      "Amount 0 needs no coins; every other amount starts as unreachable.",
      "For each coin, and each amount it fits into, see whether using that coin beats the current best.",
      "Using it costs one coin plus however many the remainder needs.",
      "At the end, the target's entry is the answer, or -1 if it was never reached.",
    ],
    algorithm: [
      "dp[0] = 0, everything else = infinity",
      "for each coin:",
      "    for j from coin to amount:",
      "        dp[j] = min(dp[j], dp[j - coin] + 1)",
      "print dp[amount], or -1 if still infinity",
    ],
    whyItWorks:
      "Every way of making an amount ends with some coin. Removing that coin leaves a smaller " +
      "amount made optimally — if it were not optimal, swapping in the better way would improve " +
      "the whole thing. So the best for j really is one plus the best for j minus some coin, " +
      "minimised over the coins.\n\n" +
      "The inner loop runs UPWARDS, and that is deliberate. It means dp[j - coin] may already " +
      "include this same coin, which is exactly what allows a coin to be used many times. " +
      "Running the loop downwards instead would allow each coin at most once — that is the " +
      "knapsack variant, a different problem.\n\n" +
      "Using amount + 1 as the stand-in for infinity is a small trick worth noting: no real " +
      "answer can exceed the amount itself, since the smallest coin is at least 1. So any entry " +
      "still above the amount at the end was never reachable.",
    complexity: {
      time: "O(c * amount)",
      space: "O(amount)",
      explanation:
        "Every coin is tried against every amount. The exponential search over combinations is " +
        "what this replaces.",
    },
    edgeCases: [
      "An amount of 0, which needs no coins.",
      "An amount that cannot be made at all, answered -1.",
      "A single coin that exactly equals the amount.",
      "Coins where greedy gives the wrong answer, such as 1, 3, 4 making 6.",
      "Running the inner loop downwards, which silently solves a different problem.",
    ],
    implementation: `dp[0] = 0;  // everything else starts at amount+1, standing for infinity
for (coin : coins)
    for (j = coin; j <= amount; j++)     // UPWARDS: allows reuse
        dp[j] = min(dp[j], dp[j - coin] + 1);
return dp[amount] > amount ? -1 : dp[amount];`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 322, sourceCategory: "Dynamic Programming" },
};
