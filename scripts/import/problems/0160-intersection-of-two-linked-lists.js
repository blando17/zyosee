module.exports = {
  problemId: "dsa-160",
  slug: "intersection-of-two-linked-lists",
  title: "Intersection of Two Linked Lists",
  difficulty: "Easy",
  topics: ["linked list", "two pointers"],
  timeLimitMs: 2000,
  statement:
    "Two singly linked lists may join and share a common tail. Once they join they never " +
    "separate, so the shared part runs to the end of both.\n\n" +
    "The two lists are described by three pieces: the part belonging only to the first list, " +
    "the part belonging only to the second, and the tail they share.\n\n" +
    "Print the value of the first shared node, or NONE if the lists never join.",
  inputFormat:
    "Line 1: three integers a, b and c — the length of the first list's own part, the second " +
    "list's own part, and the shared tail.\n" +
    "Line 2: a integers, the first list's own values.\n" +
    "Line 3: b integers, the second list's own values.\n" +
    "Line 4: c integers, the shared tail's values.",
  outputFormat: "One line holding the value of the first shared node, or NONE if there is no shared tail.",
  constraints: ["0 <= a, b, c <= 50000", "a + c >= 1", "b + c >= 1", "-1000000000 <= value <= 1000000000"],
  hint: "Walk both lists and, on reaching the end, start again on the other one.",
  examples: [
    {
      input: "2 3 3\n4 1\n5 6 1\n8 4 5\n",
      expected: "8",
      note: "The lists are 4 1 8 4 5 and 5 6 1 8 4 5; they join at the node holding 8.",
    },
    { input: "2 3 0\n1 2\n3 4 5\n\n", expected: "NONE", note: "The shared tail is empty, so they never join." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "0 0 1\n\n\n7\n" },
    { label: "Special case", input: "0 3 2\n\n1 2 3\n9 9\n" },
    { label: "Boundary condition", input: "1 1 1\n1\n1\n1\n" },
    { label: "All duplicates", input: "2 2 2\n5 5\n5 5\n5 5\n" },
    { label: "Special case", input: "3 0 2\n1 2 3\n\n4 5\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "a", type: "int", min: 1, max: 50000, scales: true },
      { name: "b", type: "int", min: 1, max: 50000, scales: true },
      { name: "c", type: "int", min: 1, max: 50000, scales: true },
      { name: "onlyA", type: "intArray", length: "a", min: -1000000000, max: 1000000000 },
      { name: "onlyB", type: "intArray", length: "b", min: -1000000000, max: 1000000000 },
      { name: "shared", type: "intArray", length: "c", min: -1000000000, max: 1000000000 },
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

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long a, b, c;
    if (!(cin >> a >> b >> c)) return 0;

    auto readChain = [](long long count, ListNode **tailOut) {
        ListNode *head = nullptr, *tail = nullptr;
        for (long long i = 0; i < count; i++) {
            long long v; cin >> v;
            ListNode *node = new ListNode(v);
            if (!head) head = tail = node; else { tail->next = node; tail = node; }
        }
        *tailOut = tail;
        return head;
    };

    ListNode *tailA = nullptr, *tailB = nullptr, *tailS = nullptr;
    ListNode *headA = readChain(a, &tailA);
    ListNode *headB = readChain(b, &tailB);
    ListNode *shared = readChain(c, &tailS);

    // Both private parts are joined to the SAME shared chain, which is what
    // makes the two lists genuinely share nodes rather than equal values.
    if (tailA) tailA->next = shared; else headA = shared;
    if (tailB) tailB->next = shared; else headB = shared;

    ListNode *p = headA, *q = headB;
    while (p != q) {
        p = p ? p->next : headB;
        q = q ? q->next : headA;
    }

    if (p) cout << p->val << "\\n";
    else cout << "NONE\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The lists share actual nodes, not merely equal values. Once they meet they continue " +
      "together, so the shared part is a suffix of both. The question is where that suffix begins.",
    approach:
      "The difficulty is that the two lists usually have different lengths, so walking them in " +
      "step compares nodes at different distances from the join.\n\n" +
      "Measuring both lengths and advancing the longer one by the difference works. The neater " +
      "trick needs no measuring: walk both, and when a pointer reaches the end, send it to the " +
      "head of the OTHER list. Each pointer then travels the same total distance, so they " +
      "arrive at the join together.",
    steps: [
      "Point one pointer at each head.",
      "Advance both a node at a time.",
      "When a pointer runs off the end, restart it at the other list's head.",
      "Stop when the two pointers hold the same node.",
      "That node is the join, or null if there is none.",
    ],
    algorithm: [
      "p = headA, q = headB",
      "while p != q:",
      "    p = p.next if p else headB",
      "    q = q.next if q else headA",
      "return p",
    ],
    whyItWorks:
      "Call the private parts x and y and the shared tail z. The first pointer walks x + z, then " +
      "switches and walks y, reaching the join after x + z + y steps. The second walks y + z then " +
      "x, reaching it after y + z + x steps. Those are the same number, so they arrive together.\n\n" +
      "When the lists do not intersect, both pointers walk x + y and then x + y again, and both " +
      "become null at the same moment. Null equals null, so the loop ends and returns null — " +
      "which is why the no-intersection case needs no special handling at all.\n\n" +
      "The comparison must be between nodes. Two lists can hold identical values without sharing " +
      "a single node, and comparing values would report a join that is not there.",
    complexity: {
      time: "O(a + b + c)",
      space: "O(1)",
      explanation:
        "Each pointer makes at most two passes over the combined length. The hash-set method is " +
        "the same time but O(n) memory.",
    },
    edgeCases: [
      "No shared tail at all, where both pointers become null together.",
      "One list being entirely the shared tail, so its private part is empty.",
      "Lists of very different lengths, which is what the switch compensates for.",
      "Identical values in the private parts, which must not be mistaken for a join.",
      "A shared tail of a single node.",
    ],
    implementation: `ListNode *p = headA, *q = headB;
while (p != q) {
    p = p ? p->next : headB;   // switch lists at the end
    q = q ? q->next : headA;
}
return p;                      // the join, or null`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 160, sourceCategory: "Linked Lists" },
};
