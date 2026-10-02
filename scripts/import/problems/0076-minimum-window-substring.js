module.exports = {
  problemId: "dsa-76",
  slug: "minimum-window-substring",
  title: "Minimum Window Substring",
  difficulty: "Hard",
  topics: ["string", "sliding window", "hash table"],
  timeLimitMs: 3000,
  statement:
    "You are given two strings s and t.\n\n" +
    "Find the shortest run of neighbouring characters in s that contains every character of t, " +
    "counting repeats — so if t has two copies of a letter, the window needs two as well.\n\n" +
    "If several windows tie for shortest, print the one that starts earliest. If no window " +
    "works, print the single word NONE.",
  inputFormat: "Line 1: the string s.\nLine 2: the string t.",
  outputFormat: "One line holding the shortest window, or NONE if there is none.",
  constraints: [
    "1 <= length of s <= 100000",
    "1 <= length of t <= 1000",
    "Both strings contain only lower-case English letters",
  ],
  hint: "Grow a window to the right until it is valid, then shrink it from the left while it stays valid.",
  examples: [
    { input: "adobecodebanc\nabc\n", expected: "banc", note: "banc is the shortest run containing a, b and c." },
    { input: "a\naa\n", expected: "NONE", note: "s has only one a, but t needs two." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "a\na\n" },
    { label: "Boundary condition", input: "a\nb\n" },
    { label: "All duplicates", input: "aaaa\naa\n" },
    { label: "Special case", input: "abc\nabc\n" },
    { label: "Normal case", input: "aabbccaabb\nabc\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true, silent: true },
      { name: "m", type: "int", min: 1, max: 5, silent: true },
      { name: "s", type: "string", length: "n", alphabet: "abc" },
      { name: "t", type: "string", length: "m", alphabet: "abc" },
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
    if (t.empty() || s.size() < t.size()) { cout << "NONE\\n"; return 0; }

    vector<int> need(256, 0);
    for (unsigned char c : t) need[c]++;

    int missing = (int)t.size();
    int bestLen = INT_MAX, bestStart = 0, left = 0;

    for (int right = 0; right < (int)s.size(); right++) {
        unsigned char c = s[right];
        if (need[c] > 0) missing--;
        need[c]--;

        while (missing == 0) {
            if (right - left + 1 < bestLen) { bestLen = right - left + 1; bestStart = left; }
            unsigned char d = s[left++];
            need[d]++;
            if (need[d] > 0) missing++;
        }
    }

    if (bestLen == INT_MAX) cout << "NONE\\n";
    else cout << s.substr(bestStart, bestLen) << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The window must cover t as a multiset, not a set: two copies of a letter in t demand two " +
      "in the window. The window is contiguous, and among all valid ones the shortest is wanted.",
    approach:
      "Trying every pair of endpoints is O(n^2) windows and far too slow. A sliding window is " +
      "linear because neither endpoint ever moves backwards.\n\n" +
      "Extend the right edge until the window is valid. Then pull the left edge in as far as it " +
      "can go while staying valid, recording the size each time. Extend again, and repeat.",
    steps: [
      "Count what t needs, letter by letter.",
      "Move the right edge one character at a time, spending one unit of that letter's need.",
      "Track how many required characters are still missing; when it reaches zero the window is valid.",
      "While it is valid, record the window if it is the shortest yet, then move the left edge in and give back what it held.",
      "If giving it back makes a need positive again, the window has stopped being valid and the right edge must move on.",
      "Print the best window, or NONE if none was ever valid.",
    ],
    algorithm: [
      "need = letter counts of t; missing = length of t",
      "for right from 0 to n-1:",
      "    if need[s[right]] > 0: missing--",
      "    need[s[right]]--",
      "    while missing == 0:",
      "        record the window if it is the shortest so far",
      "        need[s[left]]++; if need[s[left]] > 0: missing++",
      "        left++",
    ],
    whyItWorks:
      "The counters are allowed to go negative on purpose, and that is the part worth " +
      "understanding. A negative count means the window holds more of that letter than t needs, " +
      "so releasing one of them does not break validity — which is exactly why `missing` is only " +
      "incremented when the count comes back above zero.\n\n" +
      "Shrinking while valid is what makes each recorded window minimal for its right edge. Since " +
      "every valid window has some right edge, and each is shrunk as far as possible, the best " +
      "over all right edges is the global best.\n\n" +
      "The tie-break follows from the strict comparison: a later window of equal length never " +
      "replaces an earlier one.",
    complexity: {
      time: "O(n + m)",
      space: "O(1), a fixed 256 counters",
      explanation:
        "Both edges only move right, so each character is added once and removed once. The inner " +
        "while loop does not make it quadratic — the left edge cannot pass the right.",
    },
    edgeCases: [
      "t longer than s, which can never fit and answers NONE.",
      "Repeated letters in t, which is why counts are used rather than a set of seen letters.",
      "No valid window at all.",
      "The whole of s being the only valid window.",
      "Several shortest windows, resolved by taking the earliest.",
      "Letters in s that t does not want, which drive their counters negative and must not be treated as progress.",
    ],
    implementation: `for (int right = 0; right < n; right++) {
    if (need[s[right]] > 0) missing--;
    need[s[right]]--;                 // may go negative: a surplus
    while (missing == 0) {
        record window [left, right];
        need[s[left]]++;
        if (need[s[left]] > 0) missing++;   // only a real loss breaks validity
        left++;
    }
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 76, sourceCategory: "Strings" },
};
