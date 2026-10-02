module.exports = {
  problemId: "dsa-443",
  slug: "string-compression",
  title: "String Compression",
  difficulty: "Medium",
  topics: ["string", "two pointers"],
  timeLimitMs: 2000,
  statement:
    "You are given a string of lower-case letters.\n\n" +
    "Compress it by replacing each run of the same character with that character followed by " +
    "the length of the run. A run of length 1 is written as the character alone, with no number.\n\n" +
    "Print the compressed string and its length.",
  inputFormat: "One line: the string.",
  outputFormat: "Line 1: the compressed string.\nLine 2: its length.",
  constraints: ["1 <= length of the string <= 100000", "The string contains only lower-case English letters"],
  hint: "A run of 12 is written as the character then the two digits 1 and 2, not as one symbol.",
  examples: [
    { input: "aabbccc\n", expected: "a2b2c3\n6", note: "Three runs, each written as character then count." },
    { input: "abc\n", expected: "abc\n3", note: "Every run has length 1, so no numbers appear." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "a\n" },
    { label: "All duplicates", input: "aaaaaaaaaaaa\n" },
    { label: "Boundary condition", input: "aab\n" },
    { label: "Special case", input: "abbbbbbbbbbbbc\n" },
    { label: "Normal case", input: "aaabbbcccd\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true, silent: true },
      // A two-letter alphabet makes long runs common, which is what the
      // multi-digit counting path needs.
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

    string out;
    out.reserve(s.size());
    size_t i = 0, n = s.size();
    while (i < n) {
        char c = s[i];
        size_t count = 0;
        while (i < n && s[i] == c) { ++i; ++count; }
        out += c;
        if (count > 1) out += to_string(count);
    }
    cout << out << "\\n" << out.size() << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Runs of the same character collapse to the character plus how many there were. The rule " +
      "that a single character keeps no number is what stops the output being longer than the " +
      "input for text with no repeats.",
    approach:
      "One pass is enough. Keep a pointer at the start of the current run and advance it while " +
      "the character stays the same. When it changes, the run is complete and can be written out.",
    steps: [
      "Start at the beginning of the string.",
      "Note the character at the current position.",
      "Advance while the character stays the same, counting as you go.",
      "Append that character to the output.",
      "If the run was longer than one, append the count as digits.",
      "Repeat from the new position until the string is exhausted.",
    ],
    algorithm: [
      "i = 0, out = empty",
      "while i < n:",
      "    c = s[i], count = 0",
      "    while i < n and s[i] == c: i++, count++",
      "    out += c",
      "    if count > 1: out += digits of count",
    ],
    whyItWorks:
      "Every position belongs to exactly one maximal run, because a run ends precisely where the " +
      "character changes. The outer loop visits each run once and the inner loop consumes it " +
      "entirely, so together they cover the string once and never revisit a position.\n\n" +
      "The detail worth stating is that the count is written as digits, not as a single symbol. " +
      "A run of 12 becomes three characters: a, 1, 2. That is why compressing a long run of one " +
      "letter shrinks it enormously, while compressing text with no repeats leaves it untouched " +
      "rather than doubling it.",
    complexity: {
      time: "O(n)",
      space: "O(n) for the output",
      explanation:
        "Each character is read once by the inner loop. The output is never longer than the " +
        "input given the single-character rule, so the extra space is bounded by n.",
    },
    edgeCases: [
      "A single character, which has no count.",
      "A string with no repeats at all, where the output equals the input.",
      "A run of ten or more, where the count takes several digits.",
      "A run running to the very end of the string, which the loop condition must not read past.",
      "A string that is one long run, the best possible compression.",
    ],
    implementation: `while (i < n) {
    char c = s[i];
    size_t count = 0;
    while (i < n && s[i] == c) { ++i; ++count; }
    out += c;
    if (count > 1) out += to_string(count);
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 443, sourceCategory: "Strings" },
};
