module.exports = {
  problemId: "dsa-206",
  slug: "reverse-linked-list",
  title: "Reverse Linked List",
  difficulty: "Easy",
  topics: ["linked list", "recursion"],
  timeLimitMs: 2000,
  statement:
    "You are given a singly linked list, written as its values from head to tail.\n\n" +
    "Reverse it and print the values of the reversed list, again from head to tail.",
  inputFormat: "Line 1: the integer n, the number of nodes.\nLine 2: n integers, the values from head to tail.",
  outputFormat: "One line holding the n values of the reversed list, separated by single spaces. For an empty list, print nothing.",
  constraints: ["0 <= n <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "Walk the list once, turning each link around as you pass it.",
  examples: [
    { input: "5\n1 2 3 4 5\n", expected: "5 4 3 2 1", note: "The tail becomes the head." },
    { input: "1\n7\n", expected: "7", note: "A single node reverses to itself." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "0\n\n" },
    { label: "Boundary condition", input: "2\n1 2\n" },
    { label: "All duplicates", input: "4\n5 5 5 5\n" },
    { label: "Negative values", input: "3\n-1 -2 -3\n" },
    { label: "Overflow risk", input: "2\n-1000000000 1000000000\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "values", type: "intArray", length: "n", min: -1000000000, max: 1000000000 },
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
    int n;
    if (!(cin >> n)) return 0;

    ListNode *head = nullptr, *tail = nullptr;
    for (int i = 0; i < n; i++) {
        long long v; cin >> v;
        ListNode *node = new ListNode(v);
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }

    // Walk once, turning each link around.
    ListNode *prev = nullptr;
    while (head) {
        ListNode *nextNode = head->next;
        head->next = prev;
        prev = head;
        head = nextNode;
    }

    string out;
    out.reserve((size_t)n * 12);
    for (ListNode *p = prev; p; p = p->next) {
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
      "Reversing a linked list means every arrow points the other way. The node that was last " +
      "becomes the head, and the node that was head ends up pointing at nothing.",
    approach:
      "Copying the values into an array and reversing that works, but it misses the point and " +
      "costs O(n) extra memory. The list can be reversed in place with three pointers: the node " +
      "being processed, the one before it, and the one after it.\n\n" +
      "The third pointer is not optional. The moment you redirect a node's next pointer you have " +
      "lost the rest of the list, so the successor must be saved first.",
    steps: [
      "Start with prev pointing at nothing and current at the head.",
      "Save the current node's successor, because the next step destroys that link.",
      "Point the current node back at prev.",
      "Move prev to the current node and current to the saved successor.",
      "Repeat until current runs off the end; prev is then the new head.",
    ],
    algorithm: [
      "prev = null, current = head",
      "while current is not null:",
      "    nextNode = current.next     # save it before overwriting",
      "    current.next = prev         # turn the arrow around",
      "    prev = current",
      "    current = nextNode",
      "return prev",
    ],
    whyItWorks:
      "The invariant is that everything from prev backwards is already reversed, and everything " +
      "from current onwards is still in its original order. At the start prev is empty and the " +
      "whole list is untouched, which satisfies it.\n\n" +
      "Each iteration moves exactly one node across the boundary: its arrow is flipped to join " +
      "the reversed part, and both pointers advance. When current reaches the end, nothing is " +
      "left unreversed and prev holds the head of the result.\n\n" +
      "Returning prev rather than current is easy to get wrong — current is null by then, which " +
      "is why the loop exited.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation:
        "One pass, three pointers, no allocation. The recursive version is also O(n) time but " +
        "uses O(n) stack, which overflows on a long list.",
    },
    edgeCases: [
      "An empty list, where the loop never runs and the answer is also empty.",
      "A single node, which is its own reverse.",
      "Two nodes, the smallest case where anything actually moves.",
      "Forgetting to save the successor, which loses the rest of the list on the first step.",
      "Returning current instead of prev, which returns null every time.",
    ],
    implementation: `ListNode *prev = nullptr;
while (head) {
    ListNode *nextNode = head->next;  // save before overwriting
    head->next = prev;
    prev = head;
    head = nextNode;
}
return prev;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 206, sourceCategory: "Linked Lists" },
};
