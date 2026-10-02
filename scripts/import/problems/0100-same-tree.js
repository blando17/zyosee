module.exports = {
  problemId: "dsa-100",
  slug: "same-tree",
  title: "Same Tree",
  difficulty: "Easy",
  topics: ["tree", "depth-first search", "breadth-first search"],
  timeLimitMs: 2000,
  statement:
    "You are given two binary trees, each written in level order.\n\n" +
    "Print true if they are identical — the same shape AND the same values in the same places. " +
    "Print false otherwise.\n\n" +
    "A token is either a value or the word null. Children are listed only for nodes that exist.",
  inputFormat:
    "Line 1: the token count of the first tree.\nLine 2: its tokens.\n" +
    "Line 3: the token count of the second tree.\nLine 4: its tokens.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["0 <= tokens per tree <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "Walk both trees in step; they must run out at the same moment.",
  examples: [
    { input: "3\n1 2 3\n3\n1 2 3\n", expected: "true", note: "Same shape and same values." },
    { input: "3\n1 2 null\n3\n1 null 2\n", expected: "false", note: "Same values, but one leans left and the other right." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "0\n\n0\n\n" },
    { label: "Boundary condition", input: "1\n1\n0\n\n" },
    { label: "Special case", input: "3\n1 2 3\n3\n1 2 4\n" },
    // Two DIFFERENT trees with the same inorder traversal: 1 with a right
    // child 2, against 2 with a left child 1. Both read 1 2 inorder. Without
    // this, a solution that just compares inorder sequences passes everything.
    { label: "Special case", input: "3\n1 null 2\n2\n2 1\n" },
    // Same idea for preorder: 1-then-2 appears in both.
    { label: "Special case", input: "2\n1 2\n3\n1 null 2\n" },
    { label: "All duplicates", input: "7\n5 5 5 5 5 5 5\n7\n5 5 5 5 5 5 5\n" },
    { label: "Boundary condition", input: "3\n1 2 3\n5\n1 2 3 4 null\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "a", type: "intArray", length: "n", min: -1000, max: 1000 },
      { name: "m", type: "int", min: 1, max: 100000, scales: true },
      // Two independently drawn trees are essentially never identical, so these
      // cases exercise the false path at scale. Identical and near-identical
      // pairs are curated above.
      { name: "b", type: "intArray", length: "m", min: -1000, max: 1000 },
    ],
  },
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    long long val;
    TreeNode *left, *right;
    TreeNode(long long v) : val(v), left(nullptr), right(nullptr) {}
};

/*
 * Reads a tree written in level order.
 *
 * Line 1 is the token count; line 2 is the tokens. A token is a value or the
 * word null. Children are listed only for nodes that exist, which is what keeps
 * the format compact for a lopsided tree — a complete-array layout would need
 * 2^depth slots to describe a single long branch.
 */
TreeNode* readTree() {
    int n;
    if (!(cin >> n)) return nullptr;
    vector<string> t(n);
    for (int i = 0; i < n; i++) cin >> t[i];
    if (n == 0 || t[0] == "null") return nullptr;

    TreeNode *root = new TreeNode(stoll(t[0]));
    queue<TreeNode*> q;
    q.push(root);
    int i = 1;
    while (!q.empty() && i < n) {
        TreeNode *cur = q.front(); q.pop();
        if (i < n) { if (t[i] != "null") { cur->left = new TreeNode(stoll(t[i])); q.push(cur->left); } i++; }
        if (i < n) { if (t[i] != "null") { cur->right = new TreeNode(stoll(t[i])); q.push(cur->right); } i++; }
    }
    return root;
}
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    TreeNode *p = readTree();
    TreeNode *q = readTree();

    // Iterative, walking both trees in lockstep.
    queue<pair<TreeNode*, TreeNode*>> todo;
    todo.push({p, q});
    bool same = true;
    while (!todo.empty() && same) {
        auto [a, b] = todo.front(); todo.pop();
        if (!a && !b) continue;
        if (!a || !b || a->val != b->val) { same = false; break; }
        todo.push({a->left, b->left});
        todo.push({a->right, b->right});
    }
    cout << (same ? "true" : "false") << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Identical means structurally identical as well as equal in value. Two trees holding the " +
      "same multiset of numbers in different shapes are not the same tree, which is the point of " +
      "the second example.",
    approach:
      "Walk both trees together, visiting corresponding positions at the same time. At each " +
      "step there are three possibilities: both positions are empty, exactly one is empty, or " +
      "both hold a node.\n\n" +
      "Only the middle case is a failure by shape; the third is a failure only if the values " +
      "differ. Comparing serialisations would also work but needs care, because a format that " +
      "omits nulls can give two different trees the same string.",
    steps: [
      "Start with the two roots paired together.",
      "Take a pair. If both are empty, this branch matches — move on.",
      "If exactly one is empty, the shapes differ. Answer false.",
      "If the values differ, answer false.",
      "Otherwise pair the two left children and the two right children, and continue.",
      "If every pair is exhausted without a failure, the trees are identical.",
    ],
    algorithm: [
      "queue = [(rootA, rootB)]",
      "while queue is not empty:",
      "    (a, b) = pop()",
      "    if a and b are both null: continue",
      "    if exactly one is null, or a.val != b.val: return false",
      "    push (a.left, b.left) and (a.right, b.right)",
      "return true",
    ],
    whyItWorks:
      "Pairing corresponding positions means the comparison is between the same location in " +
      "both trees, which is exactly what structural identity requires.\n\n" +
      "The three-way check is what catches shape differences. Pushing null children rather than " +
      "skipping them is deliberate: a missing node on one side has to be compared with whatever " +
      "is on the other side, and skipping it would let a tree match a larger one that merely " +
      "agrees where they overlap.\n\n" +
      "The order of the checks matters too. Testing both-null first, then either-null, then the " +
      "values, means the value comparison only ever runs on two real nodes and can never " +
      "dereference a null.",
    complexity: {
      time: "O(min(n, m))",
      space: "O(w), the widest level reached before a difference is found",
      explanation:
        "The walk stops at the first difference, so identical trees cost a full traversal and " +
        "different ones often much less.",
    },
    edgeCases: [
      "Both trees empty, which are the same.",
      "One empty and one not.",
      "The same values in mirrored shapes, which must be false.",
      "One tree being a prefix of the other, caught by the either-null check.",
      "A difference only in the last leaf, which needs the full traversal.",
    ],
    implementation: `if (!a && !b) continue;                       // both absent: fine
if (!a || !b || a->val != b->val) return false; // shape or value differs
push({a->left, b->left});
push({a->right, b->right});`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 100, sourceCategory: "Trees" },
};
