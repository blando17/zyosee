module.exports = {
  problemId: "dsa-49",
  slug: "group-anagrams",
  title: "Group Anagrams",
  difficulty: "Medium",
  topics: ["string", "hash table", "sorting"],
  timeLimitMs: 3000,
  statement:
    "You are given n strings of lower-case letters.\n\n" +
    "Gather them into groups, where two strings belong together exactly when one is a " +
    "rearrangement of the other.\n\n" +
    "So that the answer is unique, sort the strings inside each group, then sort the groups by " +
    "their first string.",
  inputFormat: "Line 1: the integer n.\nNext n lines: one string each.",
  outputFormat:
    "Line 1: the number of groups.\n" +
    "Next lines: one group per line, its strings sorted and separated by single spaces, with " +
    "the groups themselves sorted by their first string.",
  constraints: ["1 <= n <= 20000", "1 <= length of each string <= 100", "Strings contain only lower-case English letters"],
  hint: "Give every string a label that is identical for anagrams and different for everything else.",
  examples: [
    {
      input: "6\neat\ntea\ntan\nate\nnat\nbat\n",
      expected: "3\nate eat tea\nbat\nnat tan",
      note: "eat, tea and ate use the same letters; so do tan and nat.",
    },
    { input: "2\nab\nba\n", expected: "1\nab ba", note: "Both are rearrangements of the same two letters." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\nsolo\n" },
    { label: "All duplicates", input: "3\nabc\nabc\nabc\n" },
    { label: "Special case", input: "3\nabc\ndef\nghi\n" },
    { label: "Normal case", input: "4\nlisten\nsilent\nenlist\ngoogle\n" },
    { label: "Boundary condition", input: "2\na\na\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 20000, scales: true },
      // Short words over three letters so genuine anagram groups actually form;
      // over a full alphabet random words would each sit alone.
      { name: "words", type: "stringArray", count: "n", length: 4, alphabet: "abc" },
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
    vector<string> w(n);
    for (int i = 0; i < n; i++) cin >> w[i];

    unordered_map<string, vector<string>> groups;
    for (const string &s : w) {
        string key = s;
        sort(key.begin(), key.end());
        groups[key].push_back(s);
    }

    vector<vector<string>> out;
    out.reserve(groups.size());
    for (auto &g : groups) {
        vector<string> members = g.second;
        sort(members.begin(), members.end());
        out.push_back(move(members));
    }
    sort(out.begin(), out.end());

    string text = to_string(out.size());
    text += '\\n';
    for (auto &g : out) {
        for (size_t i = 0; i < g.size(); i++) {
            if (i) text += ' ';
            text += g[i];
        }
        text += '\\n';
    }
    fwrite(text.data(), 1, text.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Anagrams share a multiset of letters. Grouping them means deciding, for every pair, " +
      "whether they use the same letters — but doing that pairwise would be quadratic.",
    approach:
      "Give each string a canonical label that depends only on its letters and not their order. " +
      "Two strings are anagrams exactly when their labels are equal, so grouping becomes nothing " +
      "more than bucketing by label in a hash map.\n\n" +
      "Sorting the string's own characters is the simplest such label: eat, tea and ate all " +
      "become aet. A count of the 26 letters written as a string works too and avoids the sort.",
    steps: [
      "Make an empty map from label to list of strings.",
      "For each string, build its label by sorting its characters.",
      "Append the original string to the list under that label.",
      "When every string is placed, the map's values are the groups.",
      "Sort each group, then sort the groups, so the answer is in one fixed order.",
    ],
    algorithm: [
      "groups = empty map from string to list",
      "for each word s:",
      "    key = s with its characters sorted",
      "    groups[key].append(s)",
      "for each group: sort its members",
      "sort the groups",
      "print the count, then one group per line",
    ],
    whyItWorks:
      "Sorting a string's characters is a canonical form: it depends only on which letters are " +
      "present and how many, which is precisely what being an anagram means. Equal multisets " +
      "therefore give equal labels, and different multisets give different ones — so the buckets " +
      "are exactly the anagram classes, no more and no less.\n\n" +
      "The final two sorts do no algorithmic work. They exist because a hash map has no order of " +
      "its own, so without them two correct runs could print the same groups in different orders " +
      "and a judge could not compare the output at all.",
    complexity: {
      time: "O(n * k log k) where k is the longest string, plus the final sorting",
      space: "O(total number of characters)",
      explanation:
        "Each string is sorted once to make its label. Counting letters instead makes the label " +
        "O(k) and drops the log factor.",
    },
    edgeCases: [
      "A single string, which forms one group alone.",
      "Repeated identical strings, which land in the same group and must all be kept.",
      "No anagrams at all, giving n groups of one.",
      "All strings anagrams of each other, giving one large group.",
      "Relying on the map's order and skipping the sorts, which makes the output non-deterministic.",
    ],
    implementation: `for (const string &s : words) {
    string key = s;
    sort(key.begin(), key.end());   // canonical label
    groups[key].push_back(s);
}
// sort inside each group, then sort the groups, so the answer is unique`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 49, sourceCategory: "Strings" },
};
