module.exports = {
  problemId: "dsa-121",
  slug: "best-time-to-buy-and-sell-stock",
  title: "Best Time to Buy and Sell Stock",
  difficulty: "Easy",
  topics: ["array", "greedy"],
  timeLimitMs: 2000,

  statement:
    "You are given an array where the i-th value is the price of a stock on day i.\n\n" +
    "Choose one day to buy and a later day to sell. Print the largest profit you can make. " +
    "If no choice of days makes a profit, print 0.",

  inputFormat: "Line 1: the integer n, the number of days.\nLine 2: n integers, the price on each day.",
  outputFormat: "One line holding the largest profit, or 0 if there is none.",
  constraints: ["1 <= n <= 100000", "0 <= prices[i] <= 10000"],
  hint: "Track the cheapest price seen so far while scanning left to right.",

  examples: [
    { input: "6\n7 1 5 3 6 4\n", expected: "5", note: "Buy on day 2 at 1 and sell on day 5 at 6." },
    { input: "5\n7 6 4 3 1\n", expected: "0", note: "Prices only fall, so no purchase makes a profit." },
  ],

  curated: [
    { label: "Smallest allowed input", input: "1\n5\n" },
    { label: "All duplicates", input: "6\n4 4 4 4 4 4\n" },
    { label: "Special case", input: "2\n0 10000\n" },
    { label: "Largest allowed input", input: "2\n10000 0\n" },
  ],

  generator: {
    seed: 20260922,
    cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "prices", type: "intArray", length: "n", min: 0, max: 10000 },
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
    vector<int> prices(n);
    for (int i = 0; i < n; i++) cin >> prices[i];

    int minPrice = INT_MAX, best = 0;
    for (int price : prices) {
        minPrice = min(minPrice, price);
        best = max(best, price - minPrice);
    }
    cout << best << "\\n";
    return 0;
}`,
  },

  editorial: {
    understanding:
      "You may buy once and sell once, and the sale must come after the purchase. " +
      "The answer is the largest difference between a later price and an earlier one, " +
      "or 0 when every later price is lower.",
    approach:
      "The obvious solution compares every pair of days, which is quadratic and too slow at " +
      "n = 100000. The useful observation is that you never need to compare pairs: for any day " +
      "you might sell on, the best day to have bought is simply the cheapest day before it.",
    steps: [
      "Walk through the prices once, left to right.",
      "Keep the smallest price seen so far in a variable.",
      "At each day, work out the profit if you sold today, having bought at that smallest price.",
      "Keep the largest such profit.",
      "Print it; it stays 0 if no day ever beats the minimum before it.",
    ],
    algorithm: [
      "minPrice = +infinity, best = 0",
      "for each price p: minPrice = min(minPrice, p)",
      "                  best = max(best, p - minPrice)",
      "print best",
    ],
    whyItWorks:
      "Every valid transaction has a buy day before a sell day. When the scan reaches the sell " +
      "day, minPrice already holds the cheapest price on or before it, so p - minPrice is the " +
      "best profit achievable selling on that day. Taking the maximum over all sell days " +
      "therefore considers every transaction, without ever enumerating them.\n\n" +
      "Updating minPrice before computing the profit is what keeps it honest: buying and selling " +
      "on the same day gives a profit of 0, which is allowed and never beats the answer.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation: "One pass over the prices, holding two integers.",
    },
    edgeCases: [
      "A single day: no sale is possible, so the answer is 0.",
      "Prices that only fall: best never rises above 0.",
      "All prices equal: every difference is 0.",
      "The minimum appearing last: it can never be bought from, which the order of the two updates handles.",
    ],
    implementation: `int minPrice = INT_MAX, best = 0;
for (int price : prices) {
    minPrice = min(minPrice, price);
    best = max(best, price - minPrice);
}
cout << best << "\\n";`,
  },

  // Internal only. publicView never returns this, so it cannot reach the page.
  metadata: { importBatch: "dsa-75", sourceNumber: 121, sourceCategory: "Arrays" },
};
