module.exports = {
  problemId: "dsa-5",
  slug: "longest-palindromic-substring",
  title: "Longest Palindromic Substring",
  difficulty: "Medium",
  topics: ["string", "dynamic programming", "two pointers"],
  timeLimitMs: 3000,
  statement:
    "You are given a string of lower-case letters.\n\n" +
    "Print the longest run of neighbouring characters that reads the same forwards and " +
    "backwards.\n\n" +
    "If several runs tie for longest, print the one that starts earliest.",
  inputFormat: "One line: the string.",
  outputFormat: "One line holding the longest palindromic substring.",
  constraints: ["1 <= length of the string <= 2000", "The string contains only lower-case English letters"],
  hint: "A palindrome stays a palindrome when you peel a matching pair off both ends.",
  examples: [
    { input: "babad\n", expected: "bab", note: "aba is also length 3, but bab starts earlier." },
    { input: "cbbd\n", expected: "bb", note: "The only palindrome longer than one character." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "a\n" },
    { label: "All duplicates", input: "aaaaaaaa\n" },
    { label: "Special case", input: "abcde\n" },
    { label: "Boundary condition", input: "aa\n" },
    { label: "Normal case", input: "forgeeksskeegfor\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 2000, scales: true, silent: true },
      // Two letters so long palindromes arise by chance; over 26 letters the
      // answer would almost always be a single character.
      { name: "s", type: "string", length: "n", alphabet: "ab" },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string s;
    if (!getline(cin, s)) return 0;
    int n = (int)s.size();
    if (n == 0) return 0;

    int start = 0, best = 1;

    // Grow outwards from every centre: n single characters and n-1 gaps.
    auto expand = [&](int l, int r) {
        while (l >= 0 && r < n && s[l] == s[r]) { --l; ++r; }
        int len = r - l - 1;
        if (len > best) { best = len; start = l + 1; }
    };
    for (int i = 0; i < n; i++) { expand(i, i); expand(i, i + 1); }

    cout << s.substr(start, best) << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "A substring is a contiguous run, not a subsequence. Among all runs that read the same " +
      "both ways, the longest is wanted, and ties are broken by starting earliest so the answer " +
      "is unique.",
    approach:
      "Checking every substring is O(n^3). Two better routes exist.\n\n" +
      "Expanding around centres is the simpler one. Every palindrome has a centre: a character " +
      "for odd lengths, or the gap between two characters for even lengths. There are 2n - 1 " +
      "centres, and growing outwards from each costs at most O(n).\n\n" +
      "Dynamic programming is the other: a run is a palindrome when its two ends match and the " +
      "run inside them is one too. That fills an n by n table and uses O(n^2) memory, which is " +
      "why the centre method is usually preferred.",
    steps: [
      "Take each position as an odd-length centre and grow outwards while the characters on both sides match.",
      "Take each gap between neighbours as an even-length centre and grow the same way.",
      "After each expansion, note the length reached.",
      "Keep the longest, and on a tie keep the one found first, which is the earliest start.",
      "Print that substring.",
    ],
    algorithm: [
      "best = 1, start = 0",
      "for each i:",
      "    expand(i, i)      # odd-length centre",
      "    expand(i, i + 1)  # even-length centre",
      "expand(l, r): while in range and s[l] == s[r]: l--, r++",
      "              length = r - l - 1; keep it if it beats best",
      "print s[start .. start + best - 1]",
    ],
    whyItWorks:
      "Every palindrome has exactly one centre, and the loop visits all 2n - 1 of them, so none " +
      "can be missed. Growing outwards while the ends match finds the LONGEST palindrome at that " +
      "centre, because the first mismatch is a hard stop: no larger palindrome can share that " +
      "centre once its ends disagree.\n\n" +
      "The tie-break falls out of the order. Centres are visited left to right and the answer is " +
      "only replaced on a strictly greater length, so an equally long palindrome found later " +
      "never displaces an earlier one.\n\n" +
      "After the loop exits, l and r sit one step outside the palindrome on each side, which is " +
      "why the length is r - l - 1 and the start is l + 1 rather than l.",
    complexity: {
      time: "O(n^2)",
      space: "O(1) beyond the input",
      explanation:
        "2n - 1 centres, each expanding at most n/2 steps. The dynamic programming version has " +
        "the same time bound but needs O(n^2) memory; Manacher's algorithm reaches O(n).",
    },
    edgeCases: [
      "A single character, which is a palindrome of length 1.",
      "No repeats at all, where the answer is the first character.",
      "Even-length answers such as bb, which the odd-centre loop alone would miss entirely.",
      "Ties such as babad, resolved by taking the earliest start.",
      "A string of one repeated letter, where the answer is the whole string and expansion runs to both ends.",
    ],
    implementation: `auto expand = [&](int l, int r) {
    while (l >= 0 && r < n && s[l] == s[r]) { --l; ++r; }
    int len = r - l - 1;            // l and r are now one step outside
    if (len > best) { best = len; start = l + 1; }
};
for (int i = 0; i < n; i++) { expand(i, i); expand(i, i + 1); }`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 5, sourceCategory: "Strings" },
};
