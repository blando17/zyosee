/*
 * Builds one input: the vertex count, the edge count, then one line per edge.
 * Cases large enough to separate a linear solution from a quadratic one are
 * described here rather than typed out; they are still only input, and the
 * expected answer still comes from running the reference solution.
 */
function courses(n, edges) {
  return [String(n), String(edges.length), ...edges.map(([a, b]) => `${a} ${b}`)].join("\n") + "\n";
}

// 0 before 1 before 2 ... a chain of n courses with no choice about the order.
const chain = (n) => Array.from({ length: n - 1 }, (_, i) => [i + 1, i]);

module.exports = {
  problemId: "dsa-207",
  slug: "course-schedule",
  title: "Course Schedule",
  difficulty: "Medium",
  topics: ["graph", "topological sort", "cycle detection", "breadth-first search"],
  timeLimitMs: 2000,

  statement:
    "There are n courses, numbered 0 to n-1, and m prerequisite rules. A rule \"a b\" means that " +
    "course b must be taken before course a.\n\n" +
    "Decide whether it is possible to take every course.\n\n" +
    "The same rule may be listed more than once, and a rule may name the same course twice.",

  inputFormat:
    "Line 1: the integer n, the number of courses.\n" +
    "Line 2: the integer m, the number of prerequisite rules.\n" +
    "Next m lines: two integers a and b, meaning course b must be taken before course a.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: [
    "1 <= n <= 100000",
    "0 <= m <= 100000",
    "0 <= a <= n-1",
    "0 <= b <= n-1",
  ],
  hint:
    "Every course you can take right now is one with nothing left outstanding. Take those, " +
    "cross them off the rules they satisfy, and see which courses that frees. If you run out of " +
    "courses you can take before you run out of courses, something is waiting on itself.",

  examples: [
    {
      input: "2\n1\n1 0\n",
      expected: "true",
      note: "Take course 0, then course 1. Nothing blocks that order.",
    },
    {
      input: "2\n2\n1 0\n0 1\n",
      expected: "false",
      note:
        "Course 1 waits for course 0 and course 0 waits for course 1, so neither can ever be " +
        "the first one taken.",
    },
  ],

  curated: [
    { label: "One course and no rules", input: "1\n0\n" },
    { label: "A course that is its own prerequisite", input: "1\n1\n0 0\n" },
    { label: "Many courses, no rules at all", input: "6\n0\n" },
    { label: "A three course cycle", input: "3\n3\n1 0\n2 1\n0 2\n" },
    { label: "The same rule listed several times", input: "3\n5\n1 0\n1 0\n2 1\n2 1\n2 1\n" },
    { label: "Every course waiting on the same first one", input: "5\n4\n1 0\n2 0\n3 0\n4 0\n" },
    { label: "Two courses both needed by a third", input: "4\n4\n2 0\n2 1\n3 2\n3 0\n" },
    {
      label: "A cycle hidden among courses that are otherwise fine",
      input: "7\n6\n1 0\n2 1\n4 3\n5 4\n6 5\n4 6\n",
    },
    { label: "Longest chain, taken in one possible order", input: courses(100000, chain(100000)) },
    {
      label: "Longest chain with a single rule closing it into a loop",
      input: courses(100000, [...chain(100000), [0, 99999]]),
    },
    { label: "Every course independent, at full size", input: courses(100000, []) },
    {
      label: "One first course that every other course waits on, at full size",
      input: courses(100000, Array.from({ length: 99999 }, (_, i) => [i + 1, 0])),
    },
  ],

  generator: {
    seed: 20260925, cases: 10,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "m", type: "int", min: 1, max: "n", scales: true },
      // The endpoints are bounded by the course count, which changes from case
      // to case, so the bound names the field rather than a fixed number.
      { name: "top", type: "int", min: "n", minOffset: -1, max: "n", maxOffset: -1, silent: true },
      { name: "rules", type: "intMatrix", rows: "m", cols: 2, min: 0, max: "top" },
    ],
  },

  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n, m;
    if (!(cin >> n >> m)) return 0;

    vector<vector<int>> unlocks(n);   // course -> courses waiting on it
    vector<int> waitingOn(n, 0);      // how many rules a course is still waiting for
    for (int i = 0; i < m; i++) {
        int a, b;
        cin >> a >> b;                // b must come before a
        unlocks[b].push_back(a);
        waitingOn[a]++;
    }

    vector<int> ready;
    for (int i = 0; i < n; i++) if (waitingOn[i] == 0) ready.push_back(i);

    long long taken = 0;
    while (!ready.empty()) {
        int course = ready.back(); ready.pop_back();
        taken++;
        for (int next : unlocks[course])
            if (--waitingOn[next] == 0) ready.push_back(next);
    }

    printf("%s\\n", taken == n ? "true" : "false");
    return 0;
}`,
  },

  editorial: {
    understanding:
      "Draw an arrow from b to a for every rule \"a b\". A valid plan is an order of all n " +
      "courses in which every arrow points forwards, and such an order exists exactly when the " +
      "arrows contain no cycle.\n\n" +
      "That is the whole problem: is this directed graph free of cycles? Everything else is a " +
      "way of answering that question.",
    approach:
      "Rather than hunting for cycles, build the plan and see whether it covers everything.\n\n" +
      "For each course, count how many rules it is still waiting on. A course with a count of " +
      "zero can be taken now, so collect all of those. Taking a course frees the courses that " +
      "were waiting on it: for each one, drop its count by one, and if it reaches zero it joins " +
      "the ready set.\n\n" +
      "Repeat until the ready set is empty, keeping a tally of how many courses were taken. If " +
      "the tally is n the plan worked. If it is less, the courses left over are all waiting on " +
      "each other.\n\n" +
      "This is Kahn's algorithm, and the reason to prefer it here is that it needs no recursion. " +
      "A chain of a hundred thousand courses would nest a depth-first search that deep, which " +
      "the call stack may not survive.",
    steps: [
      "Read the rules. For each rule a b, add a to the list of courses that b unlocks, and add one to the number of rules a is waiting on.",
      "Collect every course waiting on nothing into the ready set.",
      "While the ready set is not empty:",
      "    take a course out of it and add one to the tally;",
      "    for every course it unlocks, drop that course's count by one and add it to the ready set if the count hits zero.",
      'Print "true" if the tally is n, and "false" otherwise.',
    ],
    algorithm: [
      "for each rule (a, b):",
      "    unlocks[b].add(a)",
      "    waitingOn[a] = waitingOn[a] + 1",
      "ready = every course with waitingOn == 0",
      "taken = 0",
      "while ready is not empty:",
      "    course = remove one from ready",
      "    taken = taken + 1",
      "    for next in unlocks[course]:",
      "        waitingOn[next] = waitingOn[next] - 1",
      "        if waitingOn[next] == 0: add next to ready",
      "print taken == n",
    ],
    whyItWorks:
      "A course is only taken once its count reaches zero, and the count only reaches zero once " +
      "every course it waits on has been taken. So the order in which courses come out of the " +
      "ready set is a valid plan for the courses it contains — whatever it takes, it could " +
      "genuinely take.\n\n" +
      "The remaining question is whether every course comes out. Suppose some do not. Each one " +
      "is still waiting on at least one course, and that course was never taken either, so it is " +
      "also in the leftover group. Follow those links from any leftover course: each step stays " +
      "inside a finite group, so some course must repeat, and that repetition is a cycle. A " +
      "cycle can never be taken, because its first course would have to come before itself.\n\n" +
      "Conversely, if the arrows have a cycle, none of its courses can ever reach a count of " +
      "zero, so the tally falls short. Tally equals n and no cycle are therefore the same " +
      "condition, which is what makes the count a correct test.",
    complexity: {
      time: "O(n + m)",
      space: "O(n + m)",
      explanation:
        "Each course enters the ready set at most once, because its count reaches zero only " +
        "once. Each rule is examined exactly once, when the course it waits on is taken. Reading " +
        "the input is the same order of work.\n\n" +
        "The space is the lists of unlocked courses, which hold one entry per rule, plus a count " +
        "per course.",
    },
    edgeCases: [
      "No rules at all, which is always possible — every course is ready from the start.",
      "A rule naming the same course twice, which is a cycle of length one. The counting handles it with no special case: that course waits on itself and never becomes ready.",
      "The same rule listed twice, which is not a cycle. It adds two to the count and is decremented twice, so it cancels out — but only if you never assume a course is unlocked the first time one of its rules is satisfied.",
      "A cycle among courses that are unreachable from the rest, which still makes the answer false. Starting only from course 0 would miss it; starting from every course with a count of zero does not.",
      "A chain a hundred thousand courses long. This is why the ready set is an explicit list rather than recursion.",
      "Reading the rule in the wrong direction. It is easy to add the arrow from a to b instead of b to a; the answer is then right for the reversed problem, and a cycle is a cycle in either direction, so many tests still pass.",
    ],
    implementation: `for each rule (a, b):  unlocks[b].push_back(a);  waitingOn[a]++;

ready = { i : waitingOn[i] == 0 }
taken = 0;
while (!ready.empty()) {
    int course = ready.back(); ready.pop_back();
    taken++;
    for (int next : unlocks[course])
        if (--waitingOn[next] == 0) ready.push_back(next);
}
answer = (taken == n);`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 207, sourceCategory: "Graphs" },
};
