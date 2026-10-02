module.exports = {
  problemId: "dsa-94",
  slug: "binary-tree-inorder-traversal",
  title: "Binary Tree Inorder Traversal",
  difficulty: "Easy",
  topics: ["tree", "stack", "depth-first search"],
  timeLimitMs: 2000,
  statement:
    "You are given a binary tree written in level order.\n\n" +
    "Print its values in inorder: the whole left subtree, then the node itself, then the whole " +
    "right subtree.\n\n" +
    "A token is either a value or the word null. Children are listed only for nodes that exist.",
  inputFormat: "Line 1: the integer n, the number of tokens.\nLine 2: n tokens in level order, each a value or null.",
  outputFormat: "One line holding the values in inorder. For an empty tree, print nothing.",
  constraints: ["0 <= n <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "Go as far left as you can, then take a node, then turn right and repeat.",
  examples: [
    { input: "4\n1 null 2 3\n", expected: "1 3 2", note: "1 has only a right child 2, whose left child is 3." },
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
      // No null tokens, so every generated case is a COMPLETE tree. That is a
      // valid input and it scales, but its depth is only log n and its shape
      // never varies. Lopsided and null-containing trees are curated above.
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
    TreeNode *root = readTree();

    // Iterative, because a lopsided tree of 100000 nodes would overflow the
    // stack if this recursed.
    string out;
    stack<TreeNode*> st;
    TreeNode *cur = root;
    while (cur || !st.empty()) {
        while (cur) { st.push(cur); cur = cur->left; }
        cur = st.top(); st.pop();
        if (!out.empty()) out += ' ';
        out += to_string(cur->val);
        cur = cur->right;
    }
    out += '\\n';
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Inorder means each node is printed between its two subtrees. For a binary search tree " +
      "that happens to produce the values in sorted order, which is why this traversal appears " +
      "so often.",
    approach:
      "The recursive definition is three lines: traverse left, visit, traverse right. The catch " +
      "is depth — a tree that is one long branch recurses once per node, and at 100000 nodes " +
      "that overflows the stack.\n\n" +
      "The iterative version keeps the same order using an explicit stack, which lives on the " +
      "heap and can grow as far as needed.",
    steps: [
      "Start at the root with an empty stack.",
      "Walk left as far as possible, pushing every node passed.",
      "When there is no further left, pop a node — its left subtree is finished, so it is this node's turn.",
      "Print it, then move to its right child.",
      "Repeat until both the stack and the current pointer are empty.",
    ],
    algorithm: [
      "stack = empty, cur = root",
      "while cur or stack is not empty:",
      "    while cur: push cur; cur = cur.left",
      "    cur = pop()",
      "    output cur.val",
      "    cur = cur.right",
    ],
    whyItWorks:
      "The stack holds exactly the nodes whose left subtrees are being explored and which have " +
      "not been printed yet. Pushing while walking left records that chain; popping means the " +
      "left subtree below that node is now complete.\n\n" +
      "Printing at the moment of the pop is what makes it inorder rather than preorder. A " +
      "preorder traversal prints on the way down; this prints on the way back up, after the left " +
      "side is done and before the right side starts.\n\n" +
      "Moving to the right child rather than popping again is what hands the same treatment to " +
      "the right subtree: it becomes the new starting point and the walk-left step repeats.",
    complexity: {
      time: "O(n)",
      space: "O(h) where h is the height, up to O(n) for a lopsided tree",
      explanation:
        "Every node is pushed once and popped once. The stack holds one entry per level of the " +
        "current path, which is log n for a balanced tree and n for a single branch.",
    },
    edgeCases: [
      "An empty tree, where the loop never runs.",
      "A single node.",
      "A tree that is one long left branch, which fills the stack to its maximum.",
      "A tree that is one long right branch, where the stack never holds more than one node.",
      "Recursing instead of iterating, which is correct but overflows on a deep tree.",
    ],
    implementation: `stack<TreeNode*> st;
TreeNode *cur = root;
while (cur || !st.empty()) {
    while (cur) { st.push(cur); cur = cur->left; }
    cur = st.top(); st.pop();
    output(cur->val);          // after the left subtree, before the right
    cur = cur->right;
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 94, sourceCategory: "Trees" },
};
