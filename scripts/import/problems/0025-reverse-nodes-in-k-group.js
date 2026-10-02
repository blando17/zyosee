module.exports = {
  problemId: "dsa-25",
  slug: "reverse-nodes-in-k-group",
  title: "Reverse Nodes in k-Group",
  difficulty: "Hard",
  topics: ["linked list", "recursion"],
  timeLimitMs: 2000,
  statement:
    "You are given a singly linked list and a number k.\n\n" +
    "Reverse the nodes k at a time and print the result. If the number of nodes left at the " +
    "end is fewer than k, leave them in their original order.",
  inputFormat:
    "Line 1: the integer n, the number of nodes.\n" +
    "Line 2: n integers, the values from head to tail.\n" +
    "Line 3: the integer k.",
  outputFormat: "One line holding the n values of the resulting list.",
  constraints: ["1 <= n <= 100000", "1 <= k <= n", "-1000000000 <= value <= 1000000000"],
  hint: "Before reversing a group, check that a full group of k nodes is actually there.",
  examples: [
    { input: "5\n1 2 3 4 5\n2\n", expected: "2 1 4 3 5", note: "Two full pairs reverse; the last node is alone and stays." },
    { input: "5\n1 2 3 4 5\n3\n", expected: "3 2 1 4 5", note: "One full group of three; the remaining two are left alone." },
  ],
  curated: [
    { label: "Boundary condition", input: "5\n1 2 3 4 5\n1\n" },
    { label: "Boundary condition", input: "4\n1 2 3 4\n4\n" },
    { label: "Special case", input: "3\n1 2 3\n3\n" },
    { label: "All duplicates", input: "6\n8 8 8 8 8 8\n3\n" },
    { label: "Normal case", input: "7\n1 2 3 4 5 6 7\n3\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "values", type: "intArray", length: "n", min: -1000000000, max: 1000000000 },
      // 1 <= k <= n, so each case reverses genuinely different group sizes.
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

    // Iterative rather than recursive: n can reach 100000 and one stack frame
    // per group would be far too deep.
    ListNode dummy(0);
    dummy.next = head;
    ListNode *groupPrev = &dummy;

    while (true) {
        // Is a full group of k still available?
        ListNode *check = groupPrev;
        for (int i = 0; i < k && check; i++) check = check->next;
        if (!check) break;

        ListNode *prev = check->next, *cur = groupPrev->next;
        for (int i = 0; i < k; i++) {
            ListNode *nxt = cur->next;
            cur->next = prev;
            prev = cur;
            cur = nxt;
        }
        ListNode *newGroupPrev = groupPrev->next;
        groupPrev->next = check;
        groupPrev = newGroupPrev;
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
      "The list is cut into consecutive blocks of k and each complete block is reversed in " +
      "place. A trailing block shorter than k is left exactly as it was, which is the rule that " +
      "makes the problem fiddly rather than just a repeated reversal.",
    approach:
      "Reversing k nodes is the same three-pointer walk as reversing a whole list, stopped after " +
      "k steps. The work is in the joins: after a block is reversed, the node before it must " +
      "point at the block's new front, and the block's new back must point at whatever comes next.\n\n" +
      "Before reversing anything, walk ahead k nodes to confirm a full block exists. Reversing " +
      "first and undoing it afterwards is much harder to get right.",
    steps: [
      "Put a dummy in front so the first block has a predecessor like every other.",
      "From the current block's predecessor, walk k nodes ahead. If you run off the end, stop — the rest is short and stays as it is.",
      "Reverse exactly k nodes, starting the reversal with the node AFTER the block so the block's tail is already joined on.",
      "Point the predecessor at the block's new front.",
      "The block's old front is now its back, so it becomes the predecessor of the next block.",
      "Repeat.",
    ],
    algorithm: [
      "dummy.next = head; groupPrev = dummy",
      "loop:",
      "    check = groupPrev advanced k nodes; if null, stop",
      "    reverse k nodes starting at groupPrev.next, seeding prev with check.next",
      "    newGroupPrev = groupPrev.next   # the old front, now the back",
      "    groupPrev.next = check          # check is the old back, now the front",
      "    groupPrev = newGroupPrev",
    ],
    whyItWorks:
      "Seeding the reversal with the node after the block is the trick that removes all the " +
      "re-joining. The first node reversed points at the successor of the block rather than at " +
      "null, so the block's tail is connected the moment the reversal finishes.\n\n" +
      "Walking ahead first is what guarantees the short-tail rule. If fewer than k nodes remain, " +
      "the walk hits null and the loop exits with those nodes untouched.\n\n" +
      "Saving the old front before rewiring matters because after `groupPrev.next = check` there " +
      "is no other way to reach it, and it is exactly the predecessor the next block needs.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation:
        "Every node is visited twice: once by the look-ahead check and once by the reversal. " +
        "The recursive version is also O(n) time but uses stack proportional to n / k, which is " +
        "why this one is written as a loop.",
    },
    edgeCases: [
      "k = 1, where nothing changes.",
      "k equal to n, a single reversal of the whole list.",
      "n not divisible by k, leaving a short tail that must stay in order.",
      "Reversing a block before checking a full one exists, which corrupts the tail.",
      "Losing the old front before it becomes the next predecessor, which drops the rest of the list.",
    ],
    implementation: `ListNode *check = groupPrev;
for (int i = 0; i < k && check; i++) check = check->next;
if (!check) break;                    // short tail: leave it alone

ListNode *prev = check->next;          // seed with the node AFTER the block
ListNode *cur = groupPrev->next;
for (int i = 0; i < k; i++) { ... standard reversal ... }

ListNode *newGroupPrev = groupPrev->next;
groupPrev->next = check;
groupPrev = newGroupPrev;`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 25, sourceCategory: "Linked Lists" },
};
