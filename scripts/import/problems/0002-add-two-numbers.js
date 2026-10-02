module.exports = {
  problemId: "dsa-2",
  slug: "add-two-numbers",
  title: "Add Two Numbers",
  difficulty: "Medium",
  topics: ["linked list", "math", "simulation"],
  timeLimitMs: 2000,
  statement:
    "Two non-negative numbers are each stored as a linked list of single digits, with the " +
    "LEAST significant digit first. So the list 2 4 3 represents the number 342.\n\n" +
    "Add the two numbers and print the sum in the same form, least significant digit first. " +
    "Neither input has a leading zero, unless the number is zero itself.",
  inputFormat:
    "Line 1: the integer n, the number of digits in the first number.\n" +
    "Line 2: n digits, least significant first.\n" +
    "Line 3: the integer m, the number of digits in the second number.\n" +
    "Line 4: m digits, least significant first.",
  outputFormat: "One line holding the digits of the sum, least significant first, separated by single spaces.",
  constraints: ["1 <= n <= 100000", "1 <= m <= 100000", "0 <= each digit <= 9"],
  hint: "Add column by column, exactly as you would on paper, carrying into the next column.",
  examples: [
    { input: "3\n2 4 3\n3\n5 6 4\n", expected: "7 0 8", note: "342 + 465 = 807, written least significant first." },
    { input: "1\n5\n1\n5\n", expected: "0 1", note: "5 + 5 = 10, so the carry creates a new digit." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n0\n1\n0\n" },
    { label: "Boundary condition", input: "3\n9 9 9\n1\n1\n" },
    { label: "Special case", input: "1\n0\n3\n1 2 3\n" },
    { label: "All duplicates", input: "4\n9 9 9 9\n4\n9 9 9 9\n" },
    { label: "Normal case", input: "2\n1 8\n2\n0 0\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "a", type: "intArray", length: "n", min: 0, max: 9 },
      { name: "m", type: "int", min: 1, max: 100000, scales: true },
      { name: "b", type: "intArray", length: "m", min: 0, max: 9 },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode(int v) : val(v), next(nullptr) {}
};

ListNode* build(int count) {
    ListNode *head = nullptr, *tail = nullptr;
    for (int i = 0; i < count; i++) {
        int v; cin >> v;
        ListNode *node = new ListNode(v);
        if (!head) head = tail = node; else { tail->next = node; tail = node; }
    }
    return head;
}

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; if (!(cin >> n)) return 0;
    ListNode *l1 = build(n);
    int m; cin >> m;
    ListNode *l2 = build(m);

    ListNode dummy(0);
    ListNode *cur = &dummy;
    int carry = 0;
    // The carry is part of the loop condition: a final carry makes a new digit.
    while (l1 || l2 || carry) {
        int sum = carry;
        if (l1) { sum += l1->val; l1 = l1->next; }
        if (l2) { sum += l2->val; l2 = l2->next; }
        carry = sum / 10;
        cur->next = new ListNode(sum % 10);
        cur = cur->next;
    }

    string out;
    for (ListNode *p = dummy.next; p; p = p->next) {
        if (!out.empty()) out += ' ';
        out += to_string(p->val);
    }
    out += '\\n';
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The digits are stored backwards on purpose. Written least significant first, the two " +
      "lists line up exactly the way columns line up in long addition — the heads are the units, " +
      "the next nodes are the tens, and so on. No reversing is needed.",
    approach:
      "Walk both lists together, adding matching digits plus whatever was carried. Each column " +
      "produces one output digit and one carry into the next.\n\n" +
      "Converting the lists to integers and adding those is tempting and wrong: with up to " +
      "100000 digits the numbers are far beyond any built-in type.",
    steps: [
      "Start with a carry of zero and a dummy head for the result.",
      "While either list still has digits, or a carry remains, take one step.",
      "Add the carry and whichever digits are still available.",
      "The new digit is that sum modulo 10; the new carry is the sum divided by 10.",
      "Append the digit and advance whichever lists contributed.",
      "Stop when both lists are exhausted and no carry remains.",
    ],
    algorithm: [
      "carry = 0, result = empty",
      "while l1 or l2 or carry:",
      "    sum = carry",
      "    if l1: sum += l1.val; l1 = l1.next",
      "    if l2: sum += l2.val; l2 = l2.next",
      "    carry = sum / 10",
      "    append (sum mod 10) to result",
    ],
    whyItWorks:
      "This is long addition with the columns already lined up. Each position's digit depends " +
      "only on the two input digits there and the carry from the position below, which is " +
      "precisely what the loop computes.\n\n" +
      "Because each digit is at most 9, a column sum is at most 9 + 9 + 1 = 19, so the carry is " +
      "always 0 or 1 and one digit of output is always produced. That is why no carry can ever " +
      "skip a column.\n\n" +
      "Including `carry` in the loop condition is the part most often missed. Without it, 5 + 5 " +
      "prints only 0 and silently drops the leading 1, because both lists ran out before the " +
      "final carry was written.",
    complexity: {
      time: "O(max(n, m))",
      space: "O(max(n, m)) for the result",
      explanation:
        "One pass over the longer list. The result has at most one more digit than the longer " +
        "input, created by a final carry.",
    },
    edgeCases: [
      "Lists of different lengths, where one runs out and contributes nothing further.",
      "A final carry, such as 5 + 5, which adds a digit the inputs did not have.",
      "A carry rippling the whole way, such as 999 + 1.",
      "Either number being zero.",
      "Very long inputs, which is why the digits are never combined into one integer.",
    ],
    implementation: `while (l1 || l2 || carry) {       // carry keeps the loop alive
    int sum = carry;
    if (l1) { sum += l1->val; l1 = l1->next; }
    if (l2) { sum += l2->val; l2 = l2->next; }
    carry = sum / 10;
    append(sum % 10);
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 2, sourceCategory: "Linked Lists" },
};
