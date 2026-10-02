module.exports = {
  problemId: "dsa-14",
  slug: "longest-common-prefix",
  title: "Longest Common Prefix",
  difficulty: "Easy",
  topics: ["string", "trie"],
  timeLimitMs: 2000,
  statement:
    "You are given n strings of lower-case letters.\n\n" +
    "Print the longest prefix that all of them share. If they share no prefix at all, " +
    "print the single word NONE.",
  inputFormat: "Line 1: the integer n.\nNext n lines: one string each.",
  outputFormat: "One line holding the longest common prefix, or NONE if there is none.",
  constraints: ["1 <= n <= 20000", "1 <= length of each string <= 200", "Strings contain only lower-case English letters"],
  hint: "The answer can never be longer than the shortest string.",
  examples: [
    { input: "3\nflower\nflow\nflight\n", expected: "fl", note: "All three begin fl, but not flo." },
    { input: "3\ndog\nracecar\ncar\n", expected: "NONE", note: "They do not even share a first letter." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\nalone\n" },
    { label: "All duplicates", input: "3\nsame\nsame\nsame\n" },
    { label: "Boundary condition", input: "2\na\nab\n" },
    { label: "Special case", input: "2\nprefix\nprefixed\n" },
    { label: "Normal case", input: "4\ninterspecies\ninterstellar\ninterstate\ninteraction\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 20000, scales: true },
      // A tiny alphabet makes short shared prefixes actually occur; over 26
      // letters random words almost never share a first character.
      { name: "words", type: "stringArray", count: "n", length: 8, alphabet: "ab" },
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

    string prefix = w[0];
    for (int i = 1; i < n && !prefix.empty(); i++) {
        size_t k = 0;
        while (k < prefix.size() && k < w[i].size() && prefix[k] == w[i][k]) ++k;
        prefix.resize(k);
    }
    cout << (prefix.empty() ? "NONE" : prefix) << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "A common prefix is a run of characters that every string starts with. The longest one is " +
      "wanted, and it may be empty — this judge prints NONE in that case so the answer is never " +
      "a blank line.",
    approach:
      "Take the first string as a candidate answer and shrink it. Compare it with each remaining " +
      "string, cutting it back to wherever they first differ. Once it is empty nothing can make " +
      "it grow again, so the scan can stop early.\n\n" +
      "Comparing column by column across all strings at once works equally well, and a trie is " +
      "the heavyweight version, useful when many queries are asked of the same set.",
    steps: [
      "Set the candidate prefix to the first string.",
      "For each remaining string, walk both from the left while the characters agree.",
      "Cut the candidate back to that agreed length.",
      "If the candidate becomes empty, stop — there is no common prefix.",
      "Print what survives, or NONE if it is empty.",
    ],
    algorithm: [
      "prefix = words[0]",
      "for each later word w:",
      "    k = length of the agreement between prefix and w",
      "    prefix = prefix[0..k-1]",
      "    if prefix is empty: stop",
      "print prefix or NONE",
    ],
    whyItWorks:
      "The invariant is that the candidate is always a prefix of every string looked at so far. " +
      "It is true at the start, when only the first string has been seen.\n\n" +
      "Cutting to the agreement length keeps it true: the result is a prefix of the old candidate " +
      "and therefore of everything before, and it is a prefix of the new string by construction. " +
      "It also stays the LONGEST such prefix, because any longer one would have to agree past the " +
      "point where these two strings visibly differ.\n\n" +
      "The answer can never exceed the shortest string, which the comparison enforces by stopping " +
      "at whichever runs out first.",
    complexity: {
      time: "O(total number of characters)",
      space: "O(length of the answer)",
      explanation:
        "Each string is read at most up to the current candidate's length, and the candidate only " +
        "ever shrinks. In the worst case every character is compared once.",
    },
    edgeCases: [
      "A single string, which is its own prefix.",
      "Strings sharing nothing, answered as NONE.",
      "One string being a prefix of another, where the shorter one caps the answer.",
      "Identical strings, where the answer is the whole string.",
      "An early mismatch among thousands of strings, which the empty-prefix check exits on immediately.",
    ],
    implementation: `string prefix = words[0];
for (int i = 1; i < n && !prefix.empty(); i++) {
    size_t k = 0;
    while (k < prefix.size() && k < words[i].size() && prefix[k] == words[i][k]) ++k;
    prefix.resize(k);
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 14, sourceCategory: "Strings" },
};
