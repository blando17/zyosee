module.exports = {
  problemId: "dsa-17",
  slug: "letter-combinations-of-a-phone-number",
  title: "Letter Combinations of a Phone Number",
  difficulty: "Medium",
  topics: ["string", "backtracking"],
  timeLimitMs: 3000,
  statement:
    "On an old telephone keypad each digit carries a group of letters:\n\n" +
    "  2 abc    3 def    4 ghi    5 jkl\n" +
    "  6 mno    7 pqrs   8 tuv    9 wxyz\n\n" +
    "You are given a string of digits. Print every string of letters it could stand for, taking " +
    "one letter from each digit in order, sorted alphabetically.\n\n" +
    "If the input is the single character 0, there are no digits and no combinations.",
  inputFormat: "One line: the digits, or the single character 0 for an empty input.",
  outputFormat: "Line 1: the number of combinations.\nNext lines: one combination per line, in alphabetical order.",
  constraints: ["1 <= length of the line <= 7", "Digits are between 2 and 9, or the line is exactly 0"],
  hint: "Extend a partial string one digit at a time; the branching is the group size.",
  examples: [
    { input: "23\n", expected: "9\nad\nae\naf\nbd\nbe\nbf\ncd\nce\ncf", note: "Three letters for 2 and three for 3." },
    { input: "0\n", expected: "0", note: "No digits, so no combinations." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "2\n" },
    { label: "Special case", input: "7\n" },
    { label: "Special case", input: "9\n" },
    { label: "Largest allowed input", input: "7979797\n" },
    { label: "All duplicates", input: "2222\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      // 7 digits of 4 letters each is 16384 combinations; 10 would be a
      // million, so the length is capped rather than the alphabet.
      { name: "len", type: "int", min: 1, max: 7, scales: true, silent: true },
      { name: "digits", type: "string", length: "len", alphabet: "23456789" },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string digits;
    if (!getline(cin, digits)) return 0;
    if (digits == "0") digits = "";

    vector<string> keys = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};

    vector<string> all;
    string current;
    function<void(size_t)> build = [&](size_t index) {
        if (index == digits.size()) { all.push_back(current); return; }
        for (char ch : keys[digits[index] - '0']) {
            current.push_back(ch);
            build(index + 1);
            current.pop_back();
        }
    };
    if (!digits.empty()) build(0);

    sort(all.begin(), all.end());

    string out = to_string(all.size());
    out += '\\n';
    for (auto &s : all) { out += s; out += '\\n'; }
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Each digit contributes exactly one letter, chosen from its own group. So the number of " +
      "combinations is the product of the group sizes — three or four per digit, multiplying " +
      "fast.",
    approach:
      "Backtracking, one digit at a time. Keep a partial string; for each letter of the current " +
      "digit's group, append it, recurse to the next digit, then remove it. When the string " +
      "reaches the full length, it is a complete combination.\n\n" +
      "An iterative version builds the set outwards instead: start with one empty string and, " +
      "for each digit, replace every string so far with copies extended by each of its letters.",
    steps: [
      "If the input has no digits, there are no combinations at all.",
      "Start with an empty partial string at the first digit.",
      "For each letter of that digit's group, append it and move to the next digit.",
      "Once past the last digit, record the string.",
      "Remove the letter before trying the next, so the partial string stays correct.",
      "Sort the results alphabetically.",
    ],
    algorithm: [
      "build(index):",
      "    if index == length: record current; return",
      "    for each letter of keys[digits[index]]:",
      "        current.push(letter); build(index + 1); current.pop()",
    ],
    whyItWorks:
      "The recursion depth is the number of digits and the branching factor is the group size, " +
      "so the leaves of the tree are exactly the complete combinations — one per choice of " +
      "letters. None is missed and none repeats, because each path through the tree makes a " +
      "different set of choices.\n\n" +
      "The undo after each recursive call is what lets one shared buffer serve the whole tree. " +
      "Without it, letters from a finished branch would still be attached when the next branch " +
      "starts.\n\n" +
      "Visiting each group in alphabetical order actually produces the results already sorted, " +
      "because the choice at each level is made in order. The final sort is kept anyway so the " +
      "output order does not depend on that happening to be true.\n\n" +
      "The empty input must be answered with no combinations, not with one empty combination. " +
      "That is a real distinction and the usual off-by-one here.",
    complexity: {
      time: "O(k * 4^k) where k is the number of digits",
      space: "O(k) for the recursion, plus the output",
      explanation:
        "Each of up to 4^k combinations costs O(k) to build and print. The output is that large, " +
        "so this is optimal.",
    },
    edgeCases: [
      "No digits, giving zero combinations rather than one empty string.",
      "A single digit, giving its group.",
      "7 and 9, which carry four letters rather than three.",
      "Repeated digits, which multiply independently.",
      "The longest allowed input, giving 16384 combinations.",
    ],
    implementation: `void build(size_t index) {
    if (index == digits.size()) { all.push_back(current); return; }
    for (char ch : keys[digits[index] - '0']) {
        current.push_back(ch);
        build(index + 1);
        current.pop_back();          // undo
    }
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 17, sourceCategory: "Recursion and Backtracking" },
};
