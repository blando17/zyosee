module.exports = {
  problemId: "dsa-102",
  slug: "binary-tree-level-order-traversal",
  title: "Binary Tree Level Order Traversal",
  difficulty: "Medium",
  topics: ["tree", "breadth-first search"],
  timeLimitMs: 2000,
  statement:
    "You are given a binary tree written in level order.\n\n" +
    "Print its values level by level, from the root downwards, reading each level left to right.\n\n" +
    "A token is either a value or the word null. Children are listed only for nodes that exist.",
  inputFormat: "Line 1: the integer n, the number of tokens.\nLine 2: n tokens in level order, each a value or null.",
  outputFormat:
    "Line 1: the number of levels.\n" +
    "Next lines: one level per line, its values left to right, separated by single spaces.",
  constraints: ["0 <= n <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "A queue visits nodes in exactly this order; the work is knowing where one level ends.",
  examples: [
    { input: "7\n3 9 20 null null 15 7\n", expected: "3\n3\n9 20\n15 7", note: "Three levels, read top to bottom." },
    { input: "1\n1\n", expected: "1\n1", note: "One level holding one node." },
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

    vector<vector<long long>> levels;
    queue<TreeNode*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        int levelSize = (int)q.size();
        vector<long long> level;
        level.reserve(levelSize);
        for (int i = 0; i < levelSize; i++) {
            TreeNode *cur = q.front(); q.pop();
            level.push_back(cur->val);
            if (cur->left) q.push(cur->left);
            if (cur->right) q.push(cur->right);
        }
        levels.push_back(move(level));
    }

    string out = to_string(levels.size());
    out += '\\n';
    for (auto &lv : levels) {
        for (size_t i = 0; i < lv.size(); i++) {
            if (i) out += ' ';
            out += to_string(lv[i]);
        }
        out += '\\n';
    }
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The values are wanted grouped by depth, not as one flat sequence. A plain breadth-first " +
      "walk already produces the right ORDER; the only extra work is knowing where each level " +
      "stops.",
    approach:
      "Use a queue, but process it in batches. At the top of each round the queue holds exactly " +
      "one level, so recording its size first tells you how many nodes belong to that level. " +
      "Remove precisely that many, and whatever gets pushed along the way is the next level.",
    steps: [
      "Put the root in a queue, if there is one.",
      "Record the queue's size — that is how many nodes are on this level.",
      "Remove exactly that many, collecting their values into one list.",
      "Push each removed node's children as you go.",
      "Store the list as a finished level and repeat.",
    ],
    algorithm: [
      "queue = [root] if root else []",
      "while queue is not empty:",
      "    size = length of queue",
      "    level = []",
      "    repeat size times: pop node, append node.val to level, push its children",
      "    append level to result",
    ],
    whyItWorks:
      "The queue is always in breadth-first order, so at the start of a round it holds one " +
      "complete level and nothing more. Children pushed during the round land behind everything " +
      "already there, so they cannot be mistaken for part of the current level.\n\n" +
      "Fixing the size before the loop is what draws the boundary. Re-reading the queue's length " +
      "inside the loop would keep including the newly pushed children and collapse the whole " +
      "tree into a single level.\n\n" +
      "Left-to-right within a level follows from pushing the left child before the right, which " +
      "is the same reason the tokens in the input are read that way.",
    complexity: {
      time: "O(n)",
      space: "O(w) for the queue, O(n) for the output",
      explanation:
        "Every node is queued once. The widest level of a complete tree holds about half the " +
        "nodes, which is the peak queue size.",
    },
    edgeCases: [
      "An empty tree, which has zero levels.",
      "A single node, one level of one.",
      "A tree that is one long branch, where every level holds exactly one node.",
      "A complete tree, where the last level is as wide as all the others combined.",
      "Re-reading the queue size inside the loop, which merges every level into one.",
    ],
    implementation: `while (!q.empty()) {
    int levelSize = q.size();      // the boundary between levels
    vector<long long> level;
    for (int i = 0; i < levelSize; i++) {
        TreeNode *cur = q.front(); q.pop();
        level.push_back(cur->val);
        if (cur->left)  q.push(cur->left);
        if (cur->right) q.push(cur->right);
    }
    levels.push_back(level);
}`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 102, sourceCategory: "Trees" },
};
