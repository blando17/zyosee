module.exports = {
  problemId: "dsa-19",
  slug: "remove-nth-node-from-end",
  title: "Remove the Nth Node From the End",
  difficulty: "Medium",
  topics: ["linked list", "two pointers"],
  timeLimitMs: 2000,
  statement:
    "You are given a singly linked list and a number k.\n\n" +
    "Remove the k-th node counting from the END of the list, where k = 1 means the last node, " +
    "and print the values that remain.",
  inputFormat:
    "Line 1: the integer n, the number of nodes.\n" +
    "Line 2: n integers, the values from head to tail.\n" +
    "Line 3: the integer k.",
  outputFormat: "One line holding the remaining values. If the list becomes empty, print nothing.",
  constraints: ["1 <= n <= 100000", "1 <= k <= n", "-1000000000 <= value <= 1000000000"],
  hint: "Send one pointer k steps ahead, then move both until the leader reaches the end.",
  examples: [
    { input: "5\n1 2 3 4 5\n2\n", expected: "1 2 3 5", note: "The second from the end is 4." },
    { input: "3\n1 2 3\n3\n", expected: "2 3", note: "k = 3 on a list of 3 removes the head." },
  ],
  curated: [
    // The list becoming empty. It cannot be an example, because an example
    // needs a non-empty expected output to be checked against the reference.
    { label: "Smallest allowed input", input: "1\n9\n1\n" },
    { label: "Boundary condition", input: "2\n1 2\n1\n" },
    { label: "Boundary condition", input: "2\n1 2\n2\n" },
    { label: "Special case", input: "5\n1 2 3 4 5\n5\n" },
    { label: "All duplicates", input: "4\n7 7 7 7\n3\n" },
    { label: "Negative values", input: "3\n-1 -2 -3\n2\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "values", type: "intArray", length: "n", min: -1000000000, max: 1000000000 },
      // 1 <= k <= n, expressed by naming n as the upper bound so every
      // generated case picks a genuinely different position to remove.
      { name: "k", type: "int", min: 1, max: "n" },
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
    ListNode *head = nullptr, *tail = nullptr;
    for (int i = 0; i < n; i++) {
        long long v; cin >> v;
        ListNode *node = new ListNode(v);
        if (!head) head = tail = node; else { tail->next = node; tail = node; }
    }
    int k; cin >> k;

    // A dummy in front means removing the head needs no special case.
    ListNode dummy(0);
    dummy.next = head;
    ListNode *slow = &dummy, *fast = &dummy;
    for (int i = 0; i <= k; i++) fast = fast->next;
    while (fast) { slow = slow->next; fast = fast->next; }
    slow->next = slow->next->next;

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
      "Counting from the end is the whole difficulty. A singly linked list can only be walked " +
      "forwards, and its length is not known without walking it.",
    approach:
      "The obvious method walks the list once to count the nodes, then walks again to position " +
      "n - k. That is two passes and perfectly correct.\n\n" +
      "One pass is possible with two pointers held a fixed distance apart. Send the leader k " +
      "steps ahead, then advance both together. When the leader falls off the end, the follower " +
      "is exactly k nodes from the end — which is the node to remove.",
    steps: [
      "Put a dummy node in front of the head.",
      "Point both pointers at the dummy.",
      "Advance the leader k + 1 steps.",
      "Advance both one step at a time until the leader is null.",
      "The follower now sits just BEFORE the node to remove, so unlink it.",
      "Return whatever follows the dummy.",
    ],
    algorithm: [
      "dummy.next = head; slow = fast = dummy",
      "repeat k+1 times: fast = fast.next",
      "while fast is not null: slow = slow.next; fast = fast.next",
      "slow.next = slow.next.next",
      "return dummy.next",
    ],
    whyItWorks:
      "The gap between the two pointers never changes once it is set, so the follower's distance " +
      "from the leader is fixed. When the leader reaches null it is one past the last node, which " +
      "puts the follower exactly k + 1 positions back — that is, on the node just before the " +
      "k-th from the end.\n\n" +
      "Landing on the node BEFORE is deliberate, not an off-by-one. A singly linked list cannot " +
      "remove a node it is standing on; it has to change the previous node's pointer, so that " +
      "is where the follower must stop. This is why the leader takes k + 1 steps rather than k.\n\n" +
      "The dummy handles the case where the head itself is removed. Without it, that case needs " +
      "its own branch, and it is the one most often forgotten.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation: "A single pass with two pointers. The counting method needs two passes for the same result.",
    },
    edgeCases: [
      "A one-node list, which becomes empty.",
      "Removing the head, k = n — the case the dummy exists for.",
      "Removing the tail, k = 1.",
      "A two-node list, the smallest where the choice of end matters.",
      "Advancing the leader k steps instead of k + 1, which removes the wrong node.",
    ],
    implementation: `ListNode dummy(0); dummy.next = head;
ListNode *slow = &dummy, *fast = &dummy;
for (int i = 0; i <= k; i++) fast = fast->next;   // k+1 steps
while (fast) { slow = slow->next; fast = fast->next; }
slow->next = slow->next->next;                    // slow is the node BEFORE
return dummy.next;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 19, sourceCategory: "Linked Lists" },
};
