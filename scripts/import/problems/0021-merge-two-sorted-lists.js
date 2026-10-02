module.exports = {
  problemId: "dsa-21",
  slug: "merge-two-sorted-lists",
  title: "Merge Two Sorted Lists",
  difficulty: "Easy",
  topics: ["linked list", "two pointers", "recursion"],
  timeLimitMs: 2000,
  statement:
    "You are given two singly linked lists, each already sorted in non-decreasing order.\n\n" +
    "Splice them into one sorted list and print its values from head to tail.",
  inputFormat:
    "Line 1: the integer n, the length of the first list.\n" +
    "Line 2: n integers in non-decreasing order.\n" +
    "Line 3: the integer m, the length of the second list.\n" +
    "Line 4: m integers in non-decreasing order.",
  outputFormat: "One line holding the n + m values in non-decreasing order. For two empty lists, print nothing.",
  constraints: ["0 <= n <= 100000", "0 <= m <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "The smallest node not yet used is always at the head of one list or the other.",
  examples: [
    { input: "3\n1 2 4\n3\n1 3 4\n", expected: "1 1 2 3 4 4", note: "Take the smaller head each time." },
    { input: "0\n\n1\n0\n", expected: "0", note: "One list is empty, so the other is the answer." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "0\n\n0\n\n" },
    { label: "Special case", input: "3\n1 2 3\n3\n4 5 6\n" },
    { label: "All duplicates", input: "3\n2 2 2\n3\n2 2 2\n" },
    { label: "Negative values", input: "2\n-5 -1\n2\n-4 0\n" },
    { label: "Boundary condition", input: "1\n1000000000\n1\n-1000000000\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "a", type: "intArray", length: "n", min: -1000000000, max: 1000000000, sorted: true },
      { name: "m", type: "int", min: 1, max: 100000, scales: true },
      { name: "b", type: "intArray", length: "m", min: -1000000000, max: 1000000000, sorted: true },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

struct ListNode {
    long long val;
    ListNode *next;
    ListNode(long long v) : val(v), next(nullptr) {}
};

ListNode* build(int count) {
    ListNode *head = nullptr, *tail = nullptr;
    for (int i = 0; i < count; i++) {
        long long v; cin >> v;
        ListNode *node = new ListNode(v);
        if (!head) head = tail = node; else { tail->next = node; tail = node; }
    }
    return head;
}

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; if (!(cin >> n)) return 0;
    ListNode *a = build(n);
    int m; cin >> m;
    ListNode *b = build(m);

    // A dummy head removes the "is this the first node" special case.
    ListNode dummy(0);
    ListNode *tail = &dummy;
    while (a && b) {
        if (a->val <= b->val) { tail->next = a; a = a->next; }
        else { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = a ? a : b;

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
      "Both lists are already in order, so nothing needs sorting. The work is deciding which " +
      "list contributes the next node, over and over.",
    approach:
      "Keep a pointer at the head of each list. The smallest value not yet placed must be at one " +
      "of those two heads, because everything behind them is already used and everything ahead " +
      "is larger. Take the smaller, advance that pointer, repeat.\n\n" +
      "A dummy head node makes the code much shorter. Without it, every append needs an " +
      "\"is the result still empty?\" check.",
    steps: [
      "Create a dummy node and point a tail pointer at it.",
      "While both lists still have nodes, compare their heads.",
      "Attach the smaller node to the tail and advance that list's pointer.",
      "Move the tail on to the node just attached.",
      "When one list runs out, attach whatever remains of the other in one step — it is already sorted.",
      "The answer starts after the dummy.",
    ],
    algorithm: [
      "dummy = new node; tail = dummy",
      "while a and b are both non-null:",
      "    if a.val <= b.val: tail.next = a; a = a.next",
      "    else: tail.next = b; b = b.next",
      "    tail = tail.next",
      "tail.next = whichever of a, b is non-null",
      "return dummy.next",
    ],
    whyItWorks:
      "The invariant is that the result so far is sorted and every value in it is no larger than " +
      "anything still in either list. It holds trivially at the start.\n\n" +
      "Each step keeps it: since both lists are sorted, their heads are the smallest values each " +
      "still holds, so the smaller of the two is the smallest value anywhere outside the result. " +
      "Appending it therefore keeps the result sorted.\n\n" +
      "The tail attachment at the end is not a shortcut but a correctness point: the remaining " +
      "list is already sorted and every value in it is at least as large as everything placed, " +
      "so it can be joined wholesale rather than node by node.\n\n" +
      "Using <= rather than < makes the merge stable, keeping equal values from the first list ahead.",
    complexity: {
      time: "O(n + m)",
      space: "O(1), since the nodes are relinked rather than copied",
      explanation:
        "Each node is visited once and neither pointer moves backwards. The recursive form is " +
        "equally fast but uses stack proportional to the total length.",
    },
    edgeCases: [
      "Both lists empty, where the answer is empty.",
      "One list empty, where the other is attached immediately by the final step.",
      "Lists that do not interleave at all, where one is consumed entirely before the other starts.",
      "Equal values across both lists, decided by the comparison.",
      "Values at the ends of the allowed range.",
    ],
    implementation: `ListNode dummy(0);
ListNode *tail = &dummy;
while (a && b) {
    if (a->val <= b->val) { tail->next = a; a = a->next; }
    else { tail->next = b; b = b->next; }
    tail = tail->next;
}
tail->next = a ? a : b;   // the rest is already sorted
return dummy.next;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 21, sourceCategory: "Linked Lists" },
};
