module.exports = {
  problemId: "dsa-739",
  slug: "daily-temperatures",
  title: "Daily Temperatures",
  difficulty: "Medium",
  topics: ["array", "stack", "monotonic stack"],
  timeLimitMs: 2000,
  statement:
    "You are given the temperature recorded on each of n days.\n\n" +
    "For every day, print how many days you must wait until a warmer temperature. If no later " +
    "day is warmer, print 0 for that day.",
  inputFormat: "Line 1: the integer n.\nLine 2: n integers, the temperature on each day.",
  outputFormat: "One line holding n integers: the wait for each day, separated by single spaces.",
  constraints: ["1 <= n <= 100000", "-1000000000 <= temperature <= 1000000000"],
  hint: "Keep the days you have not answered yet, with their temperatures never increasing.",
  examples: [
    { input: "8\n73 74 75 71 69 72 76 73\n", expected: "1 1 4 2 1 1 0 0", note: "Day 0 waits one day for 74; day 6 never gets warmer." },
    { input: "3\n30 40 50\n", expected: "1 1 0", note: "Each day is warmer than the last." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n50\n" },
    { label: "All duplicates", input: "5\n40 40 40 40 40\n" },
    { label: "Special case", input: "5\n50 40 30 20 10\n" },
    { label: "Special case", input: "5\n10 20 30 40 50\n" },
    { label: "Negative values", input: "4\n-5 -10 -1 -20\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      // A narrow range gives plenty of equal temperatures, which is what
      // separates a correct strict comparison from a sloppy one.
      { name: "t", type: "intArray", length: "n", min: -30, max: 50 },
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
    vector<long long> t(n);
    for (int i = 0; i < n; i++) cin >> t[i];

    vector<long long> res(n, 0);
    // Holds indices of days still waiting for a warmer one. Their
    // temperatures never increase from bottom to top.
    stack<int> st;
    for (int i = 0; i < n; i++) {
        while (!st.empty() && t[i] > t[st.top()]) {
            int day = st.top(); st.pop();
            res[day] = i - day;
        }
        st.push(i);
    }

    string out;
    out.reserve((size_t)n * 7);
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
      "For each day the answer is the distance to the next strictly warmer day. Comparing every " +
      "pair is O(n^2), which at 100000 days is ten billion comparisons.",
    approach:
      "Scan left to right keeping a stack of days that are still waiting for an answer. The " +
      "trick is that this stack is automatically ordered: its temperatures never increase from " +
      "bottom to top.\n\n" +
      "When today's temperature beats the day on top of the stack, today IS that day's answer. " +
      "Pop it, record the distance, and keep going — today may answer several waiting days at once.",
    steps: [
      "Start with an empty stack and an answer array of zeros.",
      "For each day in order, compare its temperature with the day on top of the stack.",
      "While today is strictly warmer, pop that day and record the gap between the two indices.",
      "Push today's index; it is now waiting for its own answer.",
      "Any day still on the stack at the end never gets warmer, and keeps its 0.",
    ],
    algorithm: [
      "stack = empty, res = array of zeros",
      "for i from 0 to n-1:",
      "    while stack not empty and t[i] > t[stack.top]:",
      "        day = pop(); res[day] = i - day",
      "    push i",
    ],
    whyItWorks:
      "The stack holds exactly the days with no answer yet, and their temperatures are " +
      "non-increasing from bottom to top. That property maintains itself: a day is only pushed " +
      "after every warmer day above it has been popped.\n\n" +
      "It is also why popping is correct. When today beats the top of the stack, today is the " +
      "FIRST day that does — any earlier warmer day would have popped it already. So the " +
      "distance recorded is the nearest one.\n\n" +
      "Each index is pushed once and popped at most once, which is why the nested while loop does " +
      "not make this quadratic. The total work across the whole scan is bounded by 2n.\n\n" +
      "The comparison must be strict. Using >= would pop a day on an equal temperature, and an " +
      "equal day is not warmer — arrays with repeated values are exactly where that shows up.",
    complexity: {
      time: "O(n)",
      space: "O(n)",
      explanation:
        "Amortised: every index enters and leaves the stack once. The stack is as large as the " +
        "input when temperatures only fall.",
    },
    edgeCases: [
      "A single day, which has no later day and answers 0.",
      "Temperatures that only fall, where every answer is 0 and the stack grows to n.",
      "Temperatures that only rise, where every day is popped immediately.",
      "All temperatures equal, which the strict comparison must not pop.",
      "One warm day answering many waiting days at once.",
    ],
    implementation: `for (int i = 0; i < n; i++) {
    while (!st.empty() && t[i] > t[st.top()]) {   // strict: equal is not warmer
        int day = st.top(); st.pop();
        res[day] = i - day;
    }
    st.push(i);
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 739, sourceCategory: "Stacks and Queues" },
};
