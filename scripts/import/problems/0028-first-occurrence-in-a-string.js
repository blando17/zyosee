module.exports = {
  problemId: "dsa-28",
  slug: "first-occurrence-in-a-string",
  title: "Find the First Occurrence in a String",
  difficulty: "Easy",
  topics: ["string", "pattern matching", "two pointers"],
  timeLimitMs: 2000,
  statement:
    "You are given two strings, a haystack and a needle.\n\n" +
    "Print the index of the first position where the needle occurs inside the haystack, " +
    "counting from 0. If the needle never occurs, print -1.",
  inputFormat: "Line 1: the haystack.\nLine 2: the needle.",
  outputFormat: "One line holding the index of the first occurrence, or -1.",
  constraints: [
    "1 <= length of the haystack <= 100000",
    "1 <= length of the needle <= 100000",
    "Both strings contain only lower-case English letters",
  ],
  hint: "Try each starting position in turn, and stop at the first that matches.",
  examples: [
    { input: "sadbutsad\nsad\n", expected: "0", note: "sad occurs at 0 and again at 6; the first is wanted." },
    { input: "alphabet\nbeta\n", expected: "-1", note: "alphabet contains bet but never beta." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "a\na\n" },
    { label: "Boundary condition", input: "a\nab\n" },
    { label: "Special case", input: "aaaaa\naaa\n" },
    { label: "Special case", input: "aaaab\naaab\n" },
    { label: "Normal case", input: "mississippi\nissip\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true, silent: true },
      { name: "m", type: "int", min: 1, max: 4, silent: true },
      { name: "haystack", type: "string", length: "n", alphabet: "ab" },
      { name: "needle", type: "string", length: "m", alphabet: "ab" },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string h, nd;
    if (!getline(cin, h)) return 0;
    if (!getline(cin, nd)) nd = "";

    size_t pos = h.find(nd);
    cout << (pos == string::npos ? -1 : (long long)pos) << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "This is substring search. The answer is the smallest starting index at which the needle " +
      "lines up with the haystack, or -1 when it never does.",
    approach:
      "The straightforward method tries every starting position from 0 up to n - m and compares " +
      "the m characters there. That is O(n * m) in the worst case, which is slow when the two " +
      "strings share long repeated prefixes.\n\n" +
      "Knuth-Morris-Pratt does the same job in O(n + m) by precomputing, for each prefix of the " +
      "needle, the longest proper prefix that is also a suffix. On a mismatch it slides the " +
      "needle by that amount instead of restarting, so the haystack pointer never moves backwards.",
    steps: [
      "Line the needle up at position 0 of the haystack.",
      "Compare characters left to right.",
      "On a full match, the current starting index is the answer.",
      "On a mismatch, move the starting position on and try again.",
      "If the needle no longer fits in what is left, there is no occurrence: answer -1.",
    ],
    algorithm: [
      "for start from 0 to n - m:",
      "    if haystack[start .. start+m-1] equals needle: print start and stop",
      "print -1",
    ],
    whyItWorks:
      "Trying starting positions in increasing order is what makes the first match found the " +
      "earliest one, which is what the problem asks for. Stopping at n - m is not an " +
      "optimisation but a correctness condition: beyond it the needle would run past the end.\n\n" +
      "The reason a smarter search is possible is that a partial match already tells you " +
      "something. If the first k characters matched before failing, the next possible start is " +
      "not start + 1 but start plus k minus the longest border of that prefix, because anything " +
      "closer would contradict what was just read. That observation is all KMP is.",
    complexity: {
      time: "O(n * m) naively, O(n + m) with Knuth-Morris-Pratt",
      space: "O(1) naively, O(m) for the KMP table",
      explanation:
        "The naive worst case is repetitive text such as aaaa...b searched for aaab, where every " +
        "start matches almost to the end before failing.",
    },
    edgeCases: [
      "A needle longer than the haystack, which can never fit and must answer -1 without reading past the end.",
      "A needle equal to the haystack, matching at index 0.",
      "Several occurrences, where only the earliest counts.",
      "Repetitive text such as aaaaa searched for aaa, the case that punishes the naive method.",
      "A needle that almost matches at every position, like aaab in aaaab.",
    ],
    implementation: `size_t pos = haystack.find(needle);
cout << (pos == string::npos ? -1 : (long long)pos) << "\\n";`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 28, sourceCategory: "Strings" },
};
