module.exports = {
  problemId: "dsa-20",
  slug: "valid-parentheses",
  title: "Valid Parentheses",
  difficulty: "Easy",
  topics: ["string", "stack"],
  timeLimitMs: 2000,
  statement:
    "You are given a string containing only the characters ( ) [ ] { }.\n\n" +
    "Print true if the brackets are balanced, and false otherwise.\n\n" +
    "Brackets are balanced when every opening bracket is closed by the matching kind, " +
    "and closings happen in the reverse order of their openings.",
  inputFormat: "One line: the string of brackets.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["1 <= length of the string <= 100000", "The string contains only ( ) [ ] { }"],
  hint: "A closing bracket must match the most recent opening one that is still unclosed.",
  examples: [
    { input: "()[]{}\n", expected: "true", note: "Each pair opens and closes immediately." },
    { input: "([)]\n", expected: "false", note: "The ) tries to close a [, which is the wrong kind." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "(\n" },
    { label: "Normal case", input: "{[()]}\n" },
    { label: "Special case", input: ")(\n" },
    { label: "Boundary condition", input: "((((((\n" },
    { label: "Special case", input: "))))))\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true, silent: true },
      // Independent draws are almost never balanced, so these mostly test the
      // rejection path at scale. The balanced cases are curated above.
      { name: "s", type: "string", length: "n", alphabet: "()[]{}" },
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

    stack<char> st;
    unordered_map<char, char> closes = {{')', '('}, {'}', '{'}, {']', '['}};
    for (char c : s) {
        if (closes.count(c)) {
            if (st.empty() || st.top() != closes[c]) { cout << "false\\n"; return 0; }
            st.pop();
        } else if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        }
    }
    cout << (st.empty() ? "true" : "false") << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Balanced means two things at once: every bracket is closed by one of the same kind, and " +
      "the nesting never crosses. ([)] fails the second even though the counts are right, which " +
      "is why counting brackets is not enough.",
    approach:
      "Whenever a closing bracket appears, the only opening it may close is the most recent one " +
      "still unclosed. That is exactly last-in-first-out, so a stack of unclosed openings is the " +
      "natural structure.",
    steps: [
      "Start with an empty stack.",
      "Read the string one character at a time.",
      "On an opening bracket, push it.",
      "On a closing bracket, look at the top of the stack. If the stack is empty, or the top is not the matching opening, the string is invalid — stop.",
      "Otherwise pop and carry on.",
      "At the end the string is valid only if the stack is empty; anything left is an opening that was never closed.",
    ],
    algorithm: [
      "stack = empty",
      "for each character c:",
      "    if c opens: push c",
      "    if c closes: if stack empty or top does not match, print false and stop; else pop",
      "print true if stack is empty, false otherwise",
    ],
    whyItWorks:
      "The stack holds precisely the openings that are still waiting to be closed, oldest at the " +
      "bottom. That is the invariant.\n\n" +
      "It is maintained because pushing records a new waiting opening, and popping removes one " +
      "the instant it is satisfied. It also explains both failure modes: a closing bracket with " +
      "an empty stack has nothing to close, and a non-empty stack at the end means openings that " +
      "were never closed.\n\n" +
      "Checking the top rather than merely popping is what catches ([)] — the ) finds [ waiting " +
      "and rejects it, which a counter of each bracket type would miss entirely.",
    complexity: {
      time: "O(n)",
      space: "O(n)",
      explanation:
        "Each character is pushed and popped at most once. A string of only openings makes the " +
        "stack as large as the input, which is the worst case.",
    },
    edgeCases: [
      "A single bracket, which can never be balanced.",
      "A closing bracket first, where the stack is empty and there is nothing to match.",
      "Correct counts but crossed nesting, like ([)], which is the case that rules out counting.",
      "Only openings, where the loop finishes but the stack is not empty.",
      "Deep nesting, which makes the stack as tall as the string is long.",
    ],
    implementation: `stack<char> st;
for (char c : s) {
    if (closes.count(c)) {
        if (st.empty() || st.top() != closes[c]) return false;
        st.pop();
    } else st.push(c);
}
return st.empty();`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 20, sourceCategory: "Strings" },
};
