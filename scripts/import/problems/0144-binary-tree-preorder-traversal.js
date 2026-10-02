module.exports = {
  problemId: "dsa-144",
  slug: "binary-tree-preorder-traversal",
  title: "Binary Tree Preorder Traversal",
  difficulty: "Easy",
  topics: ["tree", "stack", "depth-first search"],
  timeLimitMs: 2000,
  statement:
    "You are given a binary tree written in level order.\n\n" +
    "Print its values in preorder: the node itself, then its whole left subtree, then its " +
    "whole right subtree.\n\n" +
    "A token is either a value or the word null. Children are listed only for nodes that exist.",
  inputFormat: "Line 1: the integer n, the number of tokens.\nLine 2: n tokens in level order, each a value or null.",
  outputFormat: "One line holding the values in preorder. For an empty tree, print nothing.",
  constraints: ["0 <= n <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "Push the right child before the left, so the left comes off the stack first.",
  examples: [
    { input: "4\n1 null 2 3\n", expected: "1 2 3", note: "The root first, then everything below it." },
    { input: "1\n7\n", expected: "7", note: "A single node is its own traversal." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "0\n\n" },
    { label: "Special case", input: "3\n1 2 3\n" },
    { label: "Boundary condition", input: "5\n1 2 null 3 null\n" },
    { label: "Special case", input: "5\n1 null 2 null 3\n" },
    { label: "All duplicates", input: "7\n5 5 5 5 5 5 5\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      // No null tokens, so every generated case is a COMPLETE tree: valid input
      // that scales, but only log n deep and always the same shape. Lopsided
      // and null-containing trees are curated above.
      { name: "tokens", type: "intArray", length: "n", min: -1000000000, max: 1000000000 },
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
 * word null. Children are listed only for nodes that exist, which keeps the
 * format compact for a lopsided tree — a complete-array layout would need
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
    TreeNode *root = readTree();

    string out;
    stack<TreeNode*> st;
    if (root) st.push(root);
    while (!st.empty()) {
        TreeNode *cur = st.top(); st.pop();
        if (!out.empty()) out += ' ';
        out += to_string(cur->val);
        // Right first, so the left child is on top and comes off next.
        if (cur->right) st.push(cur->right);
        if (cur->left) st.push(cur->left);
    }
    out += '\\n';
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Preorder visits a node before either of its subtrees. It is the traversal that produces " +
      "a tree's structure in the order you would write it down, which is why it is used for " +
      "copying and serialising trees.",
    approach:
      "Recursion is the direct expression: print, go left, go right. On a lopsided tree of " +
      "100000 nodes that recurses 100000 deep and overflows.\n\n" +
      "Preorder is the one traversal with an easy iterative form, because a node is finished " +
      "with the moment it is printed. Keep a stack of nodes still to visit, pop one, print it, " +
      "and push its children.",
    steps: [
      "Push the root, if there is one.",
      "Pop a node and print it immediately.",
      "Push its right child, then its left child.",
      "Repeat until the stack is empty.",
    ],
    algorithm: [
      "stack = [root]",
      "while stack is not empty:",
      "    cur = pop()",
      "    output cur.val",
      "    if cur.right: push cur.right",
      "    if cur.left: push cur.left",
    ],
    whyItWorks:
      "A stack returns what went in last. Pushing the right child before the left therefore " +
      "means the LEFT is on top and is processed first, which is the order preorder requires. " +
      "Getting these two pushes the wrong way round produces a mirror-image traversal and is " +
      "the usual bug.\n\n" +
      "Printing at the pop works because preorder owes a node nothing after its own value: " +
      "everything else belongs to its subtrees, which are still on the stack and will be handled " +
      "in turn. Inorder and postorder cannot do this, which is why both need extra bookkeeping.",
    complexity: {
      time: "O(n)",
      space: "O(h), up to O(n) for a lopsided tree",
      explanation: "Each node is pushed once and popped once; the stack holds at most one node per level plus siblings.",
    },
    edgeCases: [
      "An empty tree, where nothing is pushed.",
      "A single node.",
      "A long left branch and a long right branch, which stress the stack differently.",
      "Pushing left before right, which reverses the traversal.",
    ],
    implementation: `stack<TreeNode*> st;
if (root) st.push(root);
while (!st.empty()) {
    TreeNode *cur = st.top(); st.pop();
    output(cur->val);
    if (cur->right) st.push(cur->right);   // right first
    if (cur->left)  st.push(cur->left);    // so left comes off next
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 144, sourceCategory: "Trees" },
};
