module.exports = {
  problemId: "dsa-104",
  slug: "maximum-depth-of-binary-tree",
  title: "Maximum Depth of Binary Tree",
  difficulty: "Easy",
  topics: ["tree", "breadth-first search", "depth-first search"],
  timeLimitMs: 2000,
  statement:
    "You are given a binary tree written in level order.\n\n" +
    "Print its maximum depth: the number of nodes on the longest path from the root down to a " +
    "leaf. An empty tree has depth 0.\n\n" +
    "A token is either a value or the word null. Children are listed only for nodes that exist.",
  inputFormat: "Line 1: the integer n, the number of tokens.\nLine 2: n tokens in level order, each a value or null.",
  outputFormat: "One line holding the maximum depth.",
  constraints: ["0 <= n <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "The depth of a node is one more than the deeper of its two subtrees.",
  examples: [
    { input: "7\n3 9 20 null null 15 7\n", expected: "3", note: "The path 3 to 20 to 15 has three nodes." },
    { input: "1\n1\n", expected: "1", note: "A single node has depth 1." },
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
      // No null tokens, so every generated case is a COMPLETE tree: valid and
      // it scales, but only log n deep and always the same shape. Lopsided and
      // null-containing trees are curated above.
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

    // Breadth-first, counting levels. Recursion would be the shorter code but
    // a tree that is one long branch recurses once per node.
    long long depth = 0;
    queue<TreeNode*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        int levelSize = (int)q.size();
        depth++;
        for (int i = 0; i < levelSize; i++) {
            TreeNode *cur = q.front(); q.pop();
            if (cur->left) q.push(cur->left);
            if (cur->right) q.push(cur->right);
        }
    }
    cout << depth << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Depth is counted in NODES, not in edges, so a single node has depth 1 rather than 0. " +
      "An empty tree has depth 0, which is the base every method needs.",
    approach:
      "The recursive definition is one line: the depth of a node is one more than the larger of " +
      "its children's depths. It is elegant and it recurses as deep as the tree is tall, which " +
      "for a tree that is one long branch means once per node.\n\n" +
      "Breadth-first search avoids that. Process the tree one level at a time and count how many " +
      "levels there are; the queue never holds more than one level's worth of nodes.",
    steps: [
      "Put the root in a queue, if there is one.",
      "Note how many nodes are in the queue — that is the current level.",
      "Add one to the depth.",
      "Remove exactly that many nodes, pushing each one's children.",
      "Repeat until the queue is empty.",
    ],
    algorithm: [
      "queue = [root] if root else []",
      "depth = 0",
      "while queue is not empty:",
      "    size = length of queue",
      "    depth = depth + 1",
      "    repeat size times: pop a node, push its children",
      "print depth",
    ],
    whyItWorks:
      "Capturing the queue's size BEFORE the inner loop is the whole mechanism. At that moment " +
      "the queue holds exactly the nodes of one level and nothing else, because the previous " +
      "round removed every node of the level above and added only their children.\n\n" +
      "Removing precisely that many keeps the boundary clean: the children pushed during the " +
      "round belong to the next level and are not touched until the next iteration. So each " +
      "pass through the outer loop handles exactly one level, and counting the passes counts " +
      "the levels.\n\n" +
      "Reading the size inside the loop instead would mix levels together and give the wrong answer.",
    complexity: {
      time: "O(n)",
      space: "O(w) where w is the widest level, up to n/2 for a complete tree",
      explanation:
        "Every node enters and leaves the queue once. A long thin tree uses almost no memory " +
        "here, which is the opposite of the recursive version's behaviour.",
    },
    edgeCases: [
      "An empty tree, giving 0.",
      "A single node, giving 1 — the off-by-one people hit by counting edges.",
      "A tree that is one long branch, where the depth equals the number of nodes.",
      "A complete tree, where the depth is about log n but the queue is at its widest.",
      "Reading the queue size inside the loop rather than before it, which merges levels.",
    ],
    implementation: `while (!q.empty()) {
    int levelSize = q.size();      // fixed BEFORE the loop: one level exactly
    depth++;
    for (int i = 0; i < levelSize; i++) {
        TreeNode *cur = q.front(); q.pop();
        if (cur->left)  q.push(cur->left);
        if (cur->right) q.push(cur->right);
    }
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 104, sourceCategory: "Trees" },
};
