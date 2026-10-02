module.exports = {
  problemId: "dsa-141",
  slug: "linked-list-cycle",
  title: "Linked List Cycle",
  difficulty: "Easy",
  topics: ["linked list", "two pointers"],
  timeLimitMs: 2000,
  statement:
    "You are given a linked list that may loop back on itself.\n\n" +
    "The list is described by its n values followed by a number pos. If pos is -1 the list " +
    "ends normally. Otherwise the last node points back at the node at index pos, counting " +
    "from 0, forming a loop.\n\n" +
    "Print true if the list contains a loop, and false otherwise.",
  inputFormat:
    "Line 1: the integer n, the number of nodes.\n" +
    "Line 2: n integers, the values from head to tail.\n" +
    "Line 3: the integer pos, or -1 for no loop.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["1 <= n <= 100000", "-1 <= pos < n", "-1000000000 <= value <= 1000000000"],
  hint: "Two runners at different speeds on a circular track must eventually meet.",
  examples: [
    { input: "4\n3 2 0 -4\n1\n", expected: "true", note: "The tail points back at index 1, so there is a loop." },
    { input: "2\n1 2\n-1\n", expected: "false", note: "The list ends normally." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n1\n-1\n" },
    { label: "Special case", input: "1\n1\n0\n" },
    { label: "Boundary condition", input: "2\n1 2\n0\n" },
    { label: "Boundary condition", input: "2\n1 2\n1\n" },
    { label: "Normal case", input: "5\n1 2 3 4 5\n2\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "values", type: "intArray", length: "n", min: -1000000000, max: 1000000000 },
      // -1 <= pos < n. Naming n as the bound means generated cases now form
      // real loops at varying depths as well as ending normally, instead of
      // only ever testing the no-loop path.
      { name: "pos", type: "int", min: -1, max: "n", maxOffset: -1 },
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
    int n; if (!(cin >> n)) return 0;
    vector<ListNode*> nodes;
    nodes.reserve(n);
    for (int i = 0; i < n; i++) {
        long long v; cin >> v;
        ListNode *node = new ListNode(v);
        if (i) nodes[i - 1]->next = node;
        nodes.push_back(node);
    }
    int pos; cin >> pos;
    if (pos >= 0 && n > 0) nodes[n - 1]->next = nodes[pos];

    ListNode *head = n ? nodes[0] : nullptr;
    ListNode *slow = head, *fast = head;
    bool found = false;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) { found = true; break; }
    }
    cout << (found ? "true" : "false") << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "A loop means following next pointers never ends. The question is only whether that " +
      "happens, not where the loop begins or how long it is.",
    approach:
      "Recording every node visited in a hash set and watching for a repeat works, and costs " +
      "O(n) memory.\n\n" +
      "Floyd's cycle detection does it with two pointers and no extra memory. One moves a node " +
      "at a time, the other two. If the list ends, the fast one falls off. If it loops, the two " +
      "must eventually land on the same node.",
    steps: [
      "Start both pointers at the head.",
      "Each round, move the slow pointer one node and the fast pointer two.",
      "If the fast pointer or the node after it is null, the list ends — there is no loop.",
      "If the two pointers ever hold the same node, there is one.",
    ],
    algorithm: [
      "slow = fast = head",
      "while fast and fast.next:",
      "    slow = slow.next",
      "    fast = fast.next.next",
      "    if slow == fast: return true",
      "return false",
    ],
    whyItWorks:
      "If there is no loop the fast pointer reaches the end, and since it moves two at a time it " +
      "gets there in about half the steps. The loop condition catches both the case where it " +
      "lands on null and where it lands on the last node.\n\n" +
      "If there is a loop, both pointers end up inside it and neither can leave. Once both are " +
      "in, consider the gap between them measured around the loop: the fast pointer closes it by " +
      "exactly one node every round, because it gains two positions while the slow one gains " +
      "one. A gap that shrinks by one each round and cannot be skipped over must reach zero, and " +
      "zero means they are on the same node.\n\n" +
      "That last point is why the step sizes must differ by exactly one. A fast pointer moving " +
      "three at a time closes the gap by two and can step straight over the meeting point.\n\n" +
      "Note that the comparison is between NODES, not values. Two nodes can hold the same value " +
      "without being the same node, and comparing values would report loops that do not exist.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation:
        "Without a loop the fast pointer reaches the end in n/2 rounds. With one, the pointers " +
        "meet within a number of rounds bounded by the length of the loop.",
    },
    edgeCases: [
      "A single node pointing at itself, the smallest possible loop.",
      "A single node pointing at nothing.",
      "A loop covering the whole list, where the tail points back at the head.",
      "A loop covering only the tail node.",
      "Repeated values with no loop, which is why nodes are compared rather than values.",
    ],
    implementation: `ListNode *slow = head, *fast = head;
while (fast && fast->next) {
    slow = slow->next;
    fast = fast->next->next;
    if (slow == fast) return true;   // same NODE, not same value
}
return false;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 141, sourceCategory: "Linked Lists" },
};
