module.exports = {
  problemId: "dsa-1143",
  slug: "longest-common-subsequence",
  title: "Longest Common Subsequence",
  difficulty: "Medium",
  topics: ["string", "dynamic programming"],
  timeLimitMs: 3000,
  statement:
    "You are given two strings of lower-case letters.\n\n" +
    "A subsequence is what is left after deleting some characters without reordering the rest. " +
    "Print the length of the longest subsequence that both strings share.",
  inputFormat: "Line 1: the first string.\nLine 2: the second string.",
  outputFormat: "One line holding the length of the longest common subsequence, or 0 if they share none.",
  constraints: ["1 <= length of each string <= 1000", "Both strings contain only lower-case English letters"],
  hint: "Compare the last characters: either they match and both shrink, or one of them must go.",
  examples: [
    { input: "abcde\nace\n", expected: "3", note: "ace is a subsequence of both." },
    { input: "abc\ndef\n", expected: "0", note: "They share no characters at all." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "a\na\n" },
    { label: "Boundary condition", input: "a\nb\n" },
    { label: "All duplicates", input: "aaaa\naa\n" },
    { label: "Special case", input: "abcdef\nfedcba\n" },
    { label: "Special case", input: "abcdef\nabcdef\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "m", type: "int", min: 1, max: 1000, scales: true, silent: true },
      { name: "n", type: "int", min: 1, max: 1000, scales: true, silent: true },
      // A small alphabet so the two strings genuinely share long subsequences.
      // Over 26 letters the answer would be short and uninteresting.
      { name: "s", type: "string", length: "m", alphabet: "abcd" },
      { name: "t", type: "string", length: "n", alphabet: "abcd" },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string s, t;
    if (!getline(cin, s)) return 0;
    if (!getline(cin, t)) t = "";
    int m = (int)s.size(), n = (int)t.size();

    // Two rows instead of the full table: row i depends only on row i-1.
    vector<int> prev(n + 1, 0), cur(n + 1, 0);
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s[i - 1] == t[j - 1]) cur[j] = prev[j - 1] + 1;
            else cur[j] = max(prev[j], cur[j - 1]);
        }
        swap(prev, cur);
    }
    cout << prev[n] << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "A common subsequence keeps the relative order of both strings but may skip characters in " +
      "either. Only its length is wanted. Trying every subsequence is 2^m, which is hopeless.",
    approach:
      "Compare the two strings from the end. If the last characters match, that character can " +
      "safely be part of the answer, and the problem shrinks to the two strings without it. If " +
      "they differ, at least one of those two characters is unused — so try dropping each and " +
      "take the better.\n\n" +
      "Those two cases give a recurrence over prefix pairs, and there are only m * n of them, so " +
      "filling a table solves it.",
    steps: [
      "Build a table where entry (i, j) is the answer for the first i characters of one string and the first j of the other.",
      "An empty prefix shares nothing, so the first row and column are 0.",
      "If the two current characters match, the entry is one more than the diagonal entry.",
      "If they differ, it is the larger of the entry above and the entry to the left.",
      "The bottom-right entry is the answer.",
    ],
    algorithm: [
      "dp[i][0] = dp[0][j] = 0",
      "for i from 1 to m, for j from 1 to n:",
      "    if s[i-1] == t[j-1]: dp[i][j] = dp[i-1][j-1] + 1",
      "    else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])",
      "print dp[m][n]",
    ],
    whyItWorks:
      "When the last characters match, there is always a longest common subsequence that uses " +
      "them. If some best answer did not, appending this matching pair would make it longer, " +
      "contradicting that it was best. So taking the match loses nothing, which is why the " +
      "matching case needs no maximum.\n\n" +
      "When they differ, they cannot both be the final character of the answer, so at least one " +
      "is unused. Dropping each in turn covers both possibilities, and the larger result is the " +
      "answer.\n\n" +
      "The two-row optimisation works because row i only ever reads row i - 1 and earlier " +
      "entries of row i. Keeping the whole table is only needed to RECONSTRUCT the subsequence, " +
      "which this problem does not ask for.",
    complexity: {
      time: "O(m * n)",
      space: "O(min(m, n)) with two rows, O(m * n) if the whole table is kept",
      explanation:
        "Every prefix pair is solved once. At 1000 by 1000 that is a million entries, which is " +
        "comfortable; the full table would be four megabytes.",
    },
    edgeCases: [
      "Strings sharing nothing, answering 0.",
      "One string being a subsequence of the other, answering its full length.",
      "Identical strings.",
      "Repeated characters, where the diagonal step must not double-count.",
      "Reversed strings, where the answer is 1 rather than the full length — subsequences keep order.",
    ],
    implementation: `if (s[i-1] == t[j-1]) cur[j] = prev[j-1] + 1;   // match: take it, no max needed
else                  cur[j] = max(prev[j], cur[j-1]);
swap(prev, cur);                                 // only two rows are ever live`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 1143, sourceCategory: "Dynamic Programming" },
};
