module.exports = {
  problemId: "dsa-56",
  slug: "merge-intervals",
  title: "Merge Intervals",
  difficulty: "Medium",
  topics: ["array", "sorting", "intervals"],
  timeLimitMs: 2000,

  statement:
    "You are given n intervals, each written as a start and an end.\n\n" +
    "Merge every group of intervals that overlap or touch, and print the resulting intervals " +
    "sorted by start.\n\n" +
    "Two intervals overlap when one begins at or before the other ends.",

  inputFormat:
    "Line 1: the integer n, the number of intervals.\n" +
    "Next n lines: two integers, the start and end of one interval, with start <= end.",
  outputFormat:
    "Line 1: the number of intervals after merging.\n" +
    "Next lines: two integers per line, the start and end of each merged interval, sorted by start.",
  constraints: ["1 <= n <= 100000", "0 <= start <= end <= 1000000"],
  hint: "Sort by start first. Then each interval either extends the last one or begins a new one.",

  examples: [
    {
      input: "4\n1 3\n2 6\n8 10\n15 18\n",
      expected: "3\n1 6\n8 10\n15 18",
      note: "1-3 and 2-6 overlap and become 1-6; the others stand alone.",
    },
    {
      input: "2\n1 4\n4 5\n",
      expected: "1\n1 5",
      note: "Intervals that merely touch still merge.",
    },
  ],

  curated: [
    { label: "Smallest allowed input", input: "1\n0 0\n" },
    { label: "All duplicates", input: "3\n2 5\n2 5\n2 5\n" },
    { label: "Special case", input: "3\n1 100\n2 3\n4 5\n" },
    { label: "Normal case", input: "4\n5 6\n1 2\n3 4\n7 8\n" },
    { label: "Largest allowed input", input: "2\n0 1000000\n999999 1000000\n" },
  ],

  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      // rowSorted makes each pair read low then high, which is the start <= end
      // promise the statement makes.
      { name: "intervals", type: "intMatrix", rows: "n", cols: 2, min: 0, max: 1000000, rowSorted: true },
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
    vector<pair<long long, long long>> v(n);
    for (int i = 0; i < n; i++) cin >> v[i].first >> v[i].second;

    sort(v.begin(), v.end());

    vector<pair<long long, long long>> merged;
    for (auto &iv : v) {
        if (merged.empty() || merged.back().second < iv.first) merged.push_back(iv);
        else merged.back().second = max(merged.back().second, iv.second);
    }

    string out;
    out.reserve(merged.size() * 24 + 16);
    out += to_string(merged.size());
    out += '\\n';
    for (auto &iv : merged) {
        out += to_string(iv.first);
        out += ' ';
        out += to_string(iv.second);
        out += '\\n';
    }
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },

  editorial: {
    understanding:
      "Overlapping intervals describe the same stretch of the line twice. Merging replaces each " +
      "overlapping group with the single interval covering all of it. Touching counts as " +
      "overlapping here: 1-4 and 4-5 become 1-5.",
    approach:
      "In the order given, an interval can overlap anything — so you would have to compare all " +
      "pairs. Sorting by start removes that: once the intervals are in order, anything that " +
      "overlaps the group being built must start at or before that group's current end, and the " +
      "only group it can touch is the most recent one.",
    steps: [
      "Sort the intervals by start.",
      "Take the first as the group being built.",
      "For each interval in turn, compare its start with the end of the group being built.",
      "If the start is greater, the group is finished — output it and start a new group here.",
      "Otherwise they overlap, so widen the group's end to the larger of the two ends.",
      "Output the final group, then print how many groups there were.",
    ],
    algorithm: [
      "sort intervals by start",
      "merged = empty list",
      "for each interval iv:",
      "    if merged is empty or merged.back.end < iv.start: append iv",
      "    else: merged.back.end = max(merged.back.end, iv.end)",
      "print merged",
    ],
    whyItWorks:
      "After sorting, starts never decrease. So when an interval starts after the current group " +
      "ends, every interval still to come also starts after it, and that group can never grow " +
      "again — it is safe to close it and never revisit it.\n\n" +
      "The max when widening is the part people miss. A later interval can be entirely contained " +
      "in the group, like 2-3 inside 1-100. Its end is smaller, and assigning it directly would " +
      "shrink the group and wrongly split off everything after it.",
    complexity: {
      time: "O(n log n)",
      space: "O(n)",
      explanation:
        "The sort dominates; the merge itself is one pass. The output can hold up to n intervals " +
        "when nothing overlaps.",
    },
    edgeCases: [
      "A single interval, which is returned unchanged.",
      "Intervals that only touch at a point, which must merge.",
      "One interval swallowing several later ones, which is what the max protects.",
      "Identical intervals, which collapse into one.",
      "Input given out of order, which is why the sort comes first.",
      "n intervals none of which overlap, where the output is as large as the input.",
    ],
    implementation: `sort(v.begin(), v.end());
for (auto &iv : v) {
    if (merged.empty() || merged.back().second < iv.first) merged.push_back(iv);
    else merged.back().second = max(merged.back().second, iv.second);
}`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 56, sourceCategory: "Arrays" },
};
