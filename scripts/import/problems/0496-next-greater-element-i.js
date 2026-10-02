module.exports = {
  problemId: "dsa-496",
  slug: "next-greater-element-i",
  title: "Next Greater Element",
  difficulty: "Easy",
  topics: ["array", "stack", "monotonic stack", "hash table"],
  timeLimitMs: 2000,
  statement:
    "You are given two arrays of integers, queries and data.\n\n" +
    "For each value in queries, find where it first occurs in data and print the first value " +
    "after it that is strictly greater. Print -1 if there is no such value, or if the query " +
    "does not occur in data at all.",
  inputFormat:
    "Line 1: the integer p, the number of queries.\nLine 2: p integers, the queries.\n" +
    "Line 3: the integer n, the length of data.\nLine 4: n integers, the data.",
  outputFormat: "One line holding p integers, the answer to each query, separated by single spaces.",
  constraints: ["1 <= p <= 100000", "1 <= n <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "Answer every value of data in one pass first, then look each query up.",
  examples: [
    { input: "3\n4 1 2\n4\n1 3 4 2\n", expected: "-1 3 -1", note: "After 4 nothing is greater; after 1 comes 3; after 2 nothing." },
    { input: "2\n2 4\n3\n1 2 3\n", expected: "3 -1", note: "4 never occurs in data, so its answer is -1." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n5\n1\n5\n" },
    { label: "Boundary condition", input: "1\n9\n1\n5\n" },
    { label: "All duplicates", input: "2\n7 7\n4\n7 7 7 7\n" },
    { label: "Special case", input: "3\n1 2 3\n3\n3 2 1\n" },
    { label: "Special case", input: "3\n1 2 3\n3\n1 2 3\n" },
    { label: "Negative values", input: "2\n-5 -1\n3\n-5 -3 -1\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "p", type: "int", min: 1, max: 100000, scales: true },
      // A narrow range so queries genuinely occur in data most of the time.
      // Over a wide range almost every answer would be -1 for the boring
      // reason that the query is simply absent.
      { name: "queries", type: "intArray", length: "p", min: -20, max: 20 },
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "data", type: "intArray", length: "n", min: -20, max: 20 },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int p;
    if (!(cin >> p)) return 0;
    vector<long long> q(p);
    for (int i = 0; i < p; i++) cin >> q[i];
    int n; cin >> n;
    vector<long long> d(n);
    for (int i = 0; i < n; i++) cin >> d[i];

    // One pass over data answers every value in it. Only the FIRST occurrence
    // of a value is recorded, which is what the statement asks for.
    unordered_map<long long, long long> nextGreater;
    stack<long long> st;
    for (int i = 0; i < n; i++) {
        while (!st.empty() && st.top() < d[i]) {
            if (!nextGreater.count(st.top())) nextGreater[st.top()] = d[i];
            st.pop();
        }
        st.push(d[i]);
    }

    string out;
    out.reserve((size_t)p * 12);
    for (int i = 0; i < p; i++) {
        auto it = nextGreater.find(q[i]);
        if (i) out += ' ';
        out += to_string(it == nextGreater.end() ? -1 : it->second);
    }
    out += '\\n';
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Each query asks the same question about a different value: standing where that value " +
      "first appears in data, what is the first larger value to its right? Answering each query " +
      "by scanning data is O(p * n).",
    approach:
      "Turn it around. One pass over data can answer the question for EVERY value it contains, " +
      "stored in a hash map. Then each query is a single lookup.\n\n" +
      "The pass uses a monotonic stack. Hold the values whose answer is not yet known, with the " +
      "stack decreasing from bottom to top. When a new value arrives, it is the next greater " +
      "element for everything on the stack smaller than it.",
    steps: [
      "Walk through data with an empty stack.",
      "While the current value is greater than the top of the stack, that value is the top's answer — record it and pop.",
      "Push the current value.",
      "Anything left on the stack at the end has no greater value to its right.",
      "Answer each query by looking it up, defaulting to -1.",
    ],
    algorithm: [
      "for each value v in data:",
      "    while stack not empty and stack.top < v:",
      "        record answer[stack.top] = v; pop",
      "    push v",
      "for each query: print answer[query] if known, else -1",
    ],
    whyItWorks:
      "The stack holds values still waiting for an answer, decreasing from bottom to top. When v " +
      "arrives and beats the top, v is the FIRST later value to do so — anything earlier and " +
      "larger would have popped it already. That is precisely the definition of next greater.\n\n" +
      "Each value is pushed and popped at most once, so the pass is linear despite the inner loop.\n\n" +
      "Two details are easy to miss. The statement asks about the value's FIRST occurrence, so a " +
      "repeated value must not have its answer overwritten by a later occurrence — the " +
      "`if not already recorded` check is what preserves that. And a query absent from data has " +
      "no entry at all, which is why the lookup defaults to -1 rather than assuming presence.",
    complexity: {
      time: "O(n + p)",
      space: "O(n) for the stack and the map",
      explanation:
        "One amortised-linear pass over data and one lookup per query. The direct method is O(p * n).",
    },
    edgeCases: [
      "A query that never occurs in data, answered -1.",
      "Data that only decreases, where nothing has a next greater element.",
      "Data that only increases, where every value is popped immediately.",
      "Repeated values in data, where only the first occurrence's answer counts.",
      "Repeated queries, which are independent lookups.",
    ],
    implementation: `for (value v : data) {
    while (!st.empty() && st.top() < v) {
        if (!answer.count(st.top())) answer[st.top()] = v;  // first occurrence only
        st.pop();
    }
    st.push(v);
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 496, sourceCategory: "Stacks and Queues" },
};
