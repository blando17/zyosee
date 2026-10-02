module.exports = {
  problemId: "dsa-125",
  slug: "valid-palindrome",
  title: "Valid Palindrome",
  difficulty: "Easy",
  topics: ["string", "two pointers"],
  timeLimitMs: 2000,
  statement:
    "You are given a line of text.\n\n" +
    "Ignoring everything that is not a letter or a digit, and treating upper and lower case as " +
    "the same, print true if the text reads the same forwards and backwards.",
  inputFormat: "One line of text, which may contain spaces and punctuation.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["1 <= length of the line <= 100000", "The line contains printable ASCII characters"],
  hint: "Walk in from both ends, skipping anything that is not a letter or a digit.",
  examples: [
    { input: "A man, a plan, a canal: Panama\n", expected: "true", note: "Ignoring punctuation and case it reads amanaplanacanalpanama." },
    { input: "race a car\n", expected: "false", note: "raceacar is not the same backwards." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "a\n" },
    { label: "Special case", input: ".,!?\n" },
    { label: "Normal case", input: "0P\n" },
    { label: "Boundary condition", input: "ab\n" },
    { label: "Special case", input: "12321\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true, silent: true },
      { name: "s", type: "string", length: "n", alphabet: "aAbB 09,.:!" },
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

    int left = 0, right = (int)s.size() - 1;
    while (left < right) {
        while (left < right && !isalnum((unsigned char)s[left])) ++left;
        while (left < right && !isalnum((unsigned char)s[right])) --right;
        if (tolower((unsigned char)s[left]) != tolower((unsigned char)s[right])) {
            cout << "false\\n";
            return 0;
        }
        ++left; --right;
    }
    cout << "true\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Only letters and digits count, and case is ignored. So the question is whether the " +
      "filtered, lower-cased text is a palindrome — but the filtering does not have to happen " +
      "as a separate step.",
    approach:
      "Building a cleaned copy and comparing it to its reverse is correct and easy to read, and " +
      "costs an extra string. Two pointers walking inwards do the same work in place: each side " +
      "skips over anything that does not count, and then the two surviving characters are compared.",
    steps: [
      "Put one pointer at each end.",
      "Advance the left pointer past anything that is not a letter or a digit.",
      "Retreat the right pointer the same way.",
      "Compare the two characters, lower-cased. If they differ, it is not a palindrome.",
      "Step both pointers inwards and repeat until they meet or cross.",
      "If the loop finishes without a mismatch, it is a palindrome.",
    ],
    algorithm: [
      "left = 0, right = n-1",
      "while left < right:",
      "    while left < right and s[left] is not alphanumeric: left++",
      "    while left < right and s[right] is not alphanumeric: right--",
      "    if lower(s[left]) != lower(s[right]): print false and stop",
      "    left++, right--",
      "print true",
    ],
    whyItWorks:
      "A palindrome is defined by its characters pairing up: the first with the last, the second " +
      "with the second last, and so on. Skipping ignored characters does not disturb that " +
      "pairing, it only changes which positions hold the pair.\n\n" +
      "The inner loops keep the `left < right` guard so that a string of nothing but punctuation " +
      "cannot run a pointer off the end. When the pointers meet, every pair has been checked; a " +
      "middle character in an odd-length string pairs with itself and needs no comparison.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation:
        "Each pointer only ever moves inwards, so between them they cross the string once. " +
        "Nothing is copied, which is the advantage over filtering first.",
    },
    edgeCases: [
      "A single character, which is trivially a palindrome.",
      "Text with no letters or digits at all, which is an empty sequence and therefore a palindrome.",
      "\"0P\", where P and 0 are adjacent in ASCII case-conversion but are not equal — a case-handling bug returns true here.",
      "Mixed case, which is why both sides are lower-cased before comparing.",
      "Punctuation clustered at one end, which makes one pointer skip much further than the other.",
    ],
    implementation: `while (left < right) {
    while (left < right && !isalnum(s[left])) ++left;
    while (left < right && !isalnum(s[right])) --right;
    if (tolower(s[left]) != tolower(s[right])) return false;
    ++left; --right;
}
return true;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 125, sourceCategory: "Strings" },
};
