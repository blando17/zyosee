module.exports = {
  problemId: "dsa-459",
  slug: "repeated-substring-pattern",
  title: "Repeated Substring Pattern",
  difficulty: "Easy",
  topics: ["string", "pattern matching"],
  timeLimitMs: 2000,
  statement:
    "You are given a string of lower-case letters.\n\n" +
    "Print true if the whole string can be built by writing some shorter piece of it out two or " +
    "more times in a row, and false otherwise.",
  inputFormat: "One line: the string.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["1 <= length of the string <= 100000", "The string contains only lower-case English letters"],
  hint: "Write the string down twice, then look for it again somewhere strictly inside.",
  examples: [
    { input: "abab\n", expected: "true", note: "ab written twice." },
    { input: "aba\n", expected: "false", note: "No shorter piece repeats to make aba." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "a\n" },
    { label: "All duplicates", input: "aaaaaa\n" },
    { label: "Boundary condition", input: "ab\n" },
    { label: "Normal case", input: "abcabcabcabc\n" },
    { label: "Special case", input: "abcabcabcabd\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true, silent: true },
      // Random text is essentially never periodic, so these test the rejection
      // path at scale; the repeating cases are curated above.
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
    if (s.size() < 2) { cout << "false\\n"; return 0; }

    string doubled = s + s;
    bool ok = doubled.substr(1, doubled.size() - 2).find(s) != string::npos;
    cout << (ok ? "true" : "false") << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The string must be some piece p repeated k times with k at least 2. The piece has to be " +
      "shorter than the whole string, which is what stops every string trivially counting as " +
      "itself repeated once.",
    approach:
      "The direct method tries every candidate length that divides n, checks whether the string " +
      "repeats with that period, and costs O(n * number of divisors).\n\n" +
      "The trick is shorter and surprising. Write the string twice, then chop one character off " +
      "each end. The original string appears somewhere in what remains exactly when it is made " +
      "of a repeating piece.",
    steps: [
      "A string shorter than two characters cannot be a repetition, so answer false.",
      "Build doubled = s + s.",
      "Remove the first and the last character of doubled.",
      "Search for s inside that.",
      "Found means true, not found means false.",
    ],
    algorithm: [
      "if length(s) < 2: print false",
      "doubled = s + s",
      "inner = doubled without its first and last character",
      "print true if inner contains s, else false",
    ],
    whyItWorks:
      "Think of s + s as the string written on a loop. A copy of s starting at offset i inside it " +
      "means rotating s by i characters gives back s, so s has period i.\n\n" +
      "Removing the first and last character is what forces the offset to be strictly between 0 " +
      "and n. Offset 0 and offset n are the two trivial copies that every string has, and they " +
      "correspond to the piece being the whole string. Any other offset i is a genuine period " +
      "shorter than n, and the standard periodicity result says the smallest such period must " +
      "divide n — so the string really is a piece repeated a whole number of times.\n\n" +
      "That is why the two chopped characters are essential rather than cosmetic: without them, " +
      "the search always succeeds and the answer is always true.",
    complexity: {
      time: "O(n) with a linear string search, O(n^2) in the worst case with a naive one",
      space: "O(n) for the doubled string",
      explanation:
        "The doubled string is twice the input. C++'s find is not guaranteed linear, but is fast " +
        "in practice; a Knuth-Morris-Pratt search makes the bound strict.",
    },
    edgeCases: [
      "A single character, which cannot be a repetition of anything shorter.",
      "Two identical characters, the smallest true case.",
      "A string of one repeated letter, true for any length above one.",
      "A string that almost repeats, like abcabcabcabd, where only the final character breaks it.",
      "Forgetting to chop the two characters, which makes every string return true.",
    ],
    implementation: `string doubled = s + s;
return doubled.substr(1, doubled.size() - 2).find(s) != string::npos;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 459, sourceCategory: "Strings" },
};
