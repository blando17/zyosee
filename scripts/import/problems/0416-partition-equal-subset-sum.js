module.exports = {
  problemId: "dsa-416",
  slug: "partition-equal-subset-sum",
  title: "Partition Equal Subset Sum",
  difficulty: "Medium",
  topics: ["array", "dynamic programming"],
  timeLimitMs: 3000,
  statement:
    "You are given an array of positive integers.\n\n" +
    "Print true if it can be split into two groups whose sums are equal, and false otherwise. " +
    "Every value must go into exactly one of the two groups.",
  inputFormat: "Line 1: the integer n.\nLine 2: n positive integers.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["1 <= n <= 200", "1 <= value <= 100"],
  hint: "If the total is odd it is hopeless. Otherwise, can some subset reach exactly half?",
  examples: [
    { input: "4\n1 5 11 5\n", expected: "true", note: "1 + 5 + 5 equals 11." },
    { input: "4\n1 2 3 5\n", expected: "false", note: "The total is 11, which is odd." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n1\n" },
    { label: "Boundary condition", input: "2\n1 1\n" },
    { label: "Boundary condition", input: "2\n1 2\n" },
    { label: "All duplicates", input: "4\n5 5 5 5\n" },
    { label: "Special case", input: "3\n2 2 4\n" },
    /*
     * The cases that catch reusing a value.
     *
     * [1,5] totals 6, so the target is 3. The reachable subset sums are
     * 0, 1, 5 and 6 — never 3, so the answer is false. A solution whose inner
     * loop runs upwards can reach 3 by using the single 1 three times, and
     * wrongly answers true. [2,6] is the same trap with a target of 4.
     *
     * Every other case here either fails the parity test first or happens to
     * be reachable anyway, so without these the bug is invisible.
     */
    { label: "Special case", input: "2\n1 5\n" },
    { label: "Special case", input: "2\n2 6\n" },
    { label: "Largest practical input", input: "6\n100 100 100 100 100 100\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 200, scales: true },
      // A narrow value range makes an even split plausible often enough that
      // the true path is exercised. Over 1..100 with random values, roughly
      // half the cases fail the parity test alone.
      { name: "a", type: "intArray", length: "n", min: 1, max: 8 },
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
    vector<int> a(n);
    long long sum = 0;
    for (int i = 0; i < n; i++) { cin >> a[i]; sum += a[i]; }

    if (sum % 2 != 0) { cout << "false\\n"; return 0; }
    long long target = sum / 2;

    // reachable[j] = some subset of the values seen so far sums to exactly j.
    vector<char> reachable(target + 1, 0);
    reachable[0] = 1;
    for (int v : a)
        // DOWNWARDS, so each value is used at most once.
        for (long long j = target; j >= v; j--)
            if (reachable[j - v]) reachable[j] = 1;

    cout << (reachable[target] ? "true" : "false") << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Splitting into two equal halves means one group sums to exactly half the total. So the " +
      "question reduces to: is there a subset summing to half? The other group is then whatever " +
      "is left, and its sum is forced.",
    approach:
      "First check parity. An odd total cannot be halved, and that single test disposes of " +
      "roughly half of all inputs immediately.\n\n" +
      "Otherwise this is a subset-sum question, which is a knapsack where each item is either " +
      "taken or not and the only thing that matters is whether a total is reachable. Track a " +
      "set of reachable sums as a boolean array.",
    steps: [
      "Add up every value. If the total is odd, answer false.",
      "Set the target to half the total.",
      "Start with only 0 reachable — the empty subset.",
      "For each value, mark every sum that becomes reachable by adding it to an already reachable sum.",
      "Answer whether the target is reachable.",
    ],
    algorithm: [
      "if sum is odd: return false",
      "target = sum / 2",
      "reachable = {0}",
      "for each value v:",
      "    for j from target down to v:",
      "        if reachable[j - v]: reachable[j] = true",
      "return reachable[target]",
    ],
    whyItWorks:
      "The two groups must both sum to half, so finding one is enough — the rest is the other " +
      "group automatically. That is what turns a partition question into a subset-sum question.\n\n" +
      "The inner loop runs DOWNWARDS, and this is the crux. Going upwards would let " +
      "reachable[j - v] already include the current value, so the same value could be used " +
      "several times — solving the unbounded version where each item has unlimited copies. " +
      "Going downwards guarantees that reachable[j - v] still describes the state BEFORE this " +
      "value was considered, so each value is used at most once.\n\n" +
      "That single loop direction is the entire difference between this problem and Coin Change, " +
      "where reuse is exactly what is wanted and the loop runs upwards.",
    complexity: {
      time: "O(n * sum)",
      space: "O(sum)",
      explanation:
        "Pseudo-polynomial: it depends on the total, not just the count. With n = 200 and values " +
        "up to 100 the total is at most 20000, so the table is small. Enumerating subsets would " +
        "be 2^200.",
    },
    edgeCases: [
      "An odd total, rejected before any table is built.",
      "A single value, which cannot be split.",
      "Two equal values, the smallest true case.",
      "All values equal with an odd count, where the total is odd or the halves cannot match.",
      "Running the inner loop upwards, which allows reusing a value and wrongly answers true.",
    ],
    implementation: `if (sum % 2) return false;
reachable[0] = true;
for (int v : a)
    for (long long j = target; j >= v; j--)   // DOWNWARDS: each value once
        if (reachable[j - v]) reachable[j] = true;
return reachable[target];`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 416, sourceCategory: "Dynamic Programming" },
};
