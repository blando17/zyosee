module.exports = {
  problemId: "dsa-242",
  slug: "valid-anagram",
  title: "Valid Anagram",
  difficulty: "Easy",
  topics: ["string", "hash table", "counting"],
  timeLimitMs: 2000,
  statement:
    "You are given two strings of lower-case letters.\n\n" +
    "Print true if the second is a rearrangement of the first — that is, if both use exactly " +
    "the same letters the same number of times.",
  inputFormat: "Line 1: the first string.\nLine 2: the second string.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["1 <= length of each string <= 100000", "Both strings contain only lower-case English letters"],
  hint: "Two strings are anagrams exactly when their letter counts match.",
  examples: [
    { input: "anagram\nnagaram\n", expected: "true", note: "Both use three a, one n, one g, one r and one m." },
    { input: "rat\ncar\n", expected: "false", note: "One has a t, the other a c." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "a\na\n" },
    { label: "Boundary condition", input: "a\nab\n" },
    // The second string SHORTER than the first. Without this, a solution that
    // drops the length check and only watches for a counter going negative
    // passes everything: it can only be wrong when t is a strict sub-multiset
    // of s, which no other case here produces.
    { label: "Boundary condition", input: "ab\na\n" },
    { label: "Boundary condition", input: "aab\nab\n" },
    { label: "All duplicates", input: "aaaa\naaaa\n" },
    { label: "Special case", input: "ab\nba\n" },
    { label: "Normal case", input: "aacc\nccac\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true, silent: true },
      { name: "s", type: "string", length: "n", alphabet: "abcde" },
      { name: "t", type: "string", length: "n", alphabet: "abcde" },
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

    if (s.size() != t.size()) { cout << "false\\n"; return 0; }

    vector<int> count(26, 0);
    for (char c : s) count[c - 'a']++;
    for (char c : t) {
        if (--count[c - 'a'] < 0) { cout << "false\\n"; return 0; }
    }
    cout << "true\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "An anagram uses the same letters in a different order. Order is irrelevant; only how many " +
      "of each letter appears matters. So the question is whether two multisets of letters are equal.",
    approach:
      "Sorting both strings and comparing works and costs O(n log n). Counting is better: with " +
      "only 26 possible letters, a fixed array of 26 counters is enough, and that is O(n) time " +
      "with constant extra space.\n\n" +
      "The neat version does not even need two arrays. Count up for the first string, count down " +
      "for the second, and any counter going negative means the second string has a letter the " +
      "first did not supply.",
    steps: [
      "If the lengths differ, they cannot be anagrams — stop immediately.",
      "Make an array of 26 counters, all zero.",
      "For each letter of the first string, increment its counter.",
      "For each letter of the second string, decrement its counter.",
      "If any decrement takes a counter below zero, the second string used a letter that was not available. Stop and answer false.",
      "If the second string finishes without that happening, they are anagrams.",
    ],
    algorithm: [
      "if length(s) != length(t): print false and stop",
      "count = array of 26 zeros",
      "for each c in s: count[c]++",
      "for each c in t: if --count[c] < 0: print false and stop",
      "print true",
    ],
    whyItWorks:
      "After the first loop the array holds exactly the letter counts of s. Each decrement then " +
      "spends one occurrence of that letter, so going below zero means t wants more of some " +
      "letter than s has.\n\n" +
      "The length check is what makes the single pass sufficient. Without it, a t that is a " +
      "strict sub-multiset of s — say s = aab and t = ab — would never drive a counter negative " +
      "and would be wrongly accepted. Equal lengths plus no counter going negative forces every " +
      "count to match exactly, because the totals are the same and no letter is over-spent.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation:
        "Two passes over the strings, with 26 counters no matter how long the input is. Sorting " +
        "instead would cost O(n log n).",
    },
    edgeCases: [
      "Strings of different lengths, rejected before any counting.",
      "A sub-multiset such as \"ab\" against \"aab\", which is exactly what the length check rules out.",
      "Identical strings, which are anagrams of each other.",
      "A single repeated letter.",
      "Long strings over a small alphabet, where counters grow large but the array does not.",
    ],
    implementation: `if (s.size() != t.size()) return false;
vector<int> count(26, 0);
for (char c : s) count[c - 'a']++;
for (char c : t) if (--count[c - 'a'] < 0) return false;
return true;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 242, sourceCategory: "Strings" },
};
