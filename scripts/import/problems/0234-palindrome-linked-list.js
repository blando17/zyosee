module.exports = {
  problemId: "dsa-234",
  slug: "palindrome-linked-list",
  title: "Palindrome Linked List",
  difficulty: "Easy",
  topics: ["linked list", "two pointers", "recursion"],
  timeLimitMs: 2000,
  statement:
    "You are given a singly linked list.\n\n" +
    "Print true if its values read the same forwards and backwards, and false otherwise.",
  inputFormat: "Line 1: the integer n, the number of nodes.\nLine 2: n integers, the values from head to tail.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["1 <= n <= 100000", "0 <= value <= 9"],
  hint: "Find the middle, reverse the second half, then compare the halves.",
  examples: [
    { input: "4\n1 2 2 1\n", expected: "true", note: "It reads the same both ways." },
    { input: "2\n1 2\n", expected: "false", note: "Backwards it would be 2 1." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "1\n5\n" },
    { label: "All duplicates", input: "6\n7 7 7 7 7 7\n" },
    { label: "Boundary condition", input: "3\n1 2 1\n" },
    { label: "Special case", input: "3\n1 2 3\n" },
    { label: "Normal case", input: "5\n9 8 7 8 9\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      // Digits 0-1 so short lists are palindromes by chance now and then;
      // long random lists essentially never are, so the true cases are curated.
      { name: "values", type: "intArray", length: "n", min: 0, max: 1 },
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

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; if (!(cin >> n)) return 0;

    ListNode *head = nullptr, *tail = nullptr;
    for (int i = 0; i < n; i++) {
        int v; cin >> v;
        ListNode *node = new ListNode(v);
        if (!head) head = tail = node; else { tail->next = node; tail = node; }
    }

    // Walk to the middle, reversing the first half as we go.
    ListNode *slow = head, *fast = head, *prev = nullptr;
    while (fast && fast->next) {
        fast = fast->next->next;
        ListNode *temp = slow->next;
        slow->next = prev;
        prev = slow;
        slow = temp;
    }
    // An odd length leaves slow on the middle node, which belongs to neither half.
    if (fast) slow = slow->next;

    bool ok = true;
    while (slow && prev) {
        if (slow->val != prev->val) { ok = false; break; }
        slow = slow->next;
        prev = prev->next;
    }
    cout << (ok ? "true" : "false") << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "A palindrome reads the same in both directions. The difficulty is that a singly linked " +
      "list can only be walked forwards, so there is no way to read it backwards directly.",
    approach:
      "Copying the values into an array and comparing from both ends is simple and costs O(n) " +
      "extra memory. Doing it in place is the interesting version.\n\n" +
      "One pass with a slow and a fast pointer finds the middle: when the fast pointer has moved " +
      "two steps for every one of the slow pointer, the slow pointer is halfway. Reversing the " +
      "first half as the slow pointer passes over it costs nothing extra, and then the two halves " +
      "can be walked towards each other in opposite directions.",
    steps: [
      "Move slow one node at a time and fast two, so fast reaches the end as slow reaches the middle.",
      "As slow advances, flip each node it leaves behind to point backwards, building the reversed first half.",
      "When the loop ends, if the length was odd, skip the middle node — it pairs with itself.",
      "Walk the reversed first half and the untouched second half together, comparing values.",
      "Any mismatch means it is not a palindrome.",
    ],
    algorithm: [
      "slow = fast = head, prev = null",
      "while fast and fast.next:",
      "    fast = fast.next.next",
      "    temp = slow.next; slow.next = prev; prev = slow; slow = temp",
      "if fast: slow = slow.next          # odd length: skip the middle",
      "while slow and prev: compare values, advance both",
    ],
    whyItWorks:
      "The fast pointer moves twice as far as the slow one, so when it reaches the end the slow " +
      "pointer has covered exactly half. Reversing during that same walk means the first half is " +
      "already reversed by the time the middle is reached, with no second pass.\n\n" +
      "The odd-length check is what the `if (fast)` line is for. When the length is odd, fast " +
      "finishes on the last node rather than past it, and slow sits on the exact middle — a node " +
      "with no partner. Skipping it is correct because a single central element never affects " +
      "whether a sequence is a palindrome.\n\n" +
      "After that, prev walks outwards from the middle through the first half while slow walks " +
      "forwards through the second, so the pairs compared are exactly first-with-last, " +
      "second-with-second-last, and so on.",
    complexity: {
      time: "O(n)",
      space: "O(1)",
      explanation:
        "Two passes at most, with a fixed number of pointers. The array copy is also O(n) time " +
        "but O(n) space; the recursive version uses O(n) stack.",
    },
    edgeCases: [
      "A single node, trivially a palindrome.",
      "Even length, where there is no middle node to skip.",
      "Odd length, where there is — the case the fast-pointer check exists for.",
      "All values identical, always a palindrome.",
      "A mismatch at the very first pair, which the loop catches immediately.",
      "The list being left reversed in its first half, which does not matter here but would if the caller reused it.",
    ],
    implementation: `while (fast && fast->next) {
    fast = fast->next->next;
    ListNode *temp = slow->next;
    slow->next = prev;      // reverse while finding the middle
    prev = slow;
    slow = temp;
}
if (fast) slow = slow->next;   // odd length: skip the middle node
while (slow && prev) { if (slow->val != prev->val) return false; ... }`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 234, sourceCategory: "Linked Lists" },
};
