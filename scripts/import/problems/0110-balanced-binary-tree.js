module.exports = {
  problemId: "dsa-110",
  slug: "balanced-binary-tree",
  title: "Balanced Binary Tree",
  difficulty: "Easy",
  topics: ["tree", "depth-first search"],
  timeLimitMs: 2000,
  statement:
    "You are given a binary tree written in level order.\n\n" +
    "Print true if it is height-balanced: at EVERY node, the heights of the two subtrees differ " +
    "by at most one. Print false otherwise.\n\n" +
    "A token is either a value or the word null. Children are listed only for nodes that exist.",
  inputFormat: "Line 1: the integer n, the number of tokens.\nLine 2: n tokens in level order, each a value or null.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["0 <= n <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "Compute each node's height once, from the bottom up, and check the balance on the way.",
  examples: [
    { input: "7\n3 9 20 null null 15 7\n", expected: "true", note: "Every node's subtrees differ in height by at most one." },
    { input: "7\n1 2 2 3 3 null null\n", expected: "true", note: "Both sides of the root reach height 2 and 1." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "0\n\n" },
    { label: "Special case", input: "3\n1 2 3\n" },
    // A branch three deep on one side and nothing on the other: the clearest
    // unbalanced shape, and one the complete trees above can never produce.
    { label: "Boundary condition", input: "4\n1 2 null 3\n" },
    { label: "Special case", input: "7\n1 2 null 3 null 4 null\n" },
    { label: "Boundary condition", input: "5\n1 2 3 4 null\n" },
    /*
     * Balanced AT THE ROOT but not below it.
     *
     *        1          both sides of the root reach height 3, so a check
     *      /   \        that looks only at the root says "balanced"
     *     2     3
     *    /       \      but node 2 has a left subtree of height 2 and no
     *   4         5     right subtree at all, a difference of 2
     *  /           \
     * 6             7
     *
     * Without this case, checking only the root passes every other test here.
     */
    { label: "Special case", input: "11\n1 2 3 4 null null 5 6 null null 7\n" },
    { label: "All duplicates", input: "7\n5 5 5 5 5 5 5\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      // Complete trees are ALWAYS balanced, so these cases only ever exercise
      // the true path — at scale, which is still worth having. Every
      // unbalanced shape is curated above.
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

    // Iterative post-order: a node's height is only known once both children
    // are done, so each node is pushed twice — once to schedule its children,
    // once to be measured.
    unordered_map<TreeNode*, long long> height;
    stack<pair<TreeNode*, bool>> st;
    if (root) st.push({root, false});
    bool balanced = true;

    while (!st.empty()) {
        auto [node, measured] = st.top(); st.pop();
        if (!node) continue;
        if (!measured) {
            st.push({node, true});
            st.push({node->right, false});
            st.push({node->left, false});
        } else {
            long long L = node->left ? height[node->left] : 0;
            long long R = node->right ? height[node->right] : 0;
            if (llabs(L - R) > 1) balanced = false;
            height[node] = 1 + max(L, R);
        }
    }

    cout << (balanced ? "true" : "false") << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "The condition applies at every node, not only at the root. A tree whose two halves have " +
      "equal height can still be unbalanced deeper down, which is why checking the root alone is " +
      "not enough.",
    approach:
      "The naive method asks, for each node, what the heights of its two subtrees are — and " +
      "computing a height walks the whole subtree. Doing that at every node re-walks the same " +
      "nodes over and over, giving O(n^2) on a lopsided tree.\n\n" +
      "The fix is to compute heights bottom-up and check the balance at the same moment. Each " +
      "node is then measured exactly once, and its answer is available when its parent needs it.",
    steps: [
      "Work through the tree in post-order, so both children are finished before their parent.",
      "At each node, take the heights already computed for its two children, treating a missing child as height 0.",
      "If they differ by more than one, the tree is not balanced.",
      "Record this node's height as one more than the taller child.",
      "Continue to the root.",
    ],
    algorithm: [
      "for each node in post-order:",
      "    L = height of left child, or 0",
      "    R = height of right child, or 0",
      "    if |L - R| > 1: not balanced",
      "    height[node] = 1 + max(L, R)",
    ],
    whyItWorks:
      "Post-order guarantees both children are measured before the parent, so each height is " +
      "read rather than recomputed. That turns the repeated work of the naive method into a " +
      "single pass.\n\n" +
      "Checking during the same pass is what makes one traversal enough. The balance condition " +
      "at a node depends only on its two subtree heights, and both are available at exactly the " +
      "moment the node is measured.\n\n" +
      "The iterative form pushes each node twice with a flag: the first visit schedules its " +
      "children, the second measures it. That flag is what a recursive version gets for free " +
      "from the call stack, and writing it explicitly is what keeps a 100000-node branch from " +
      "overflowing.",
    complexity: {
      time: "O(n)",
      space: "O(n)",
      explanation:
        "Each node is pushed and popped twice and measured once. The naive height-at-every-node " +
        "method is O(n^2) on a lopsided tree.",
    },
    edgeCases: [
      "An empty tree, which is balanced.",
      "A single node, balanced.",
      "A branch three deep on one side with nothing on the other, the smallest clearly unbalanced case.",
      "An imbalance deep in the tree with a balanced root, which checking only the root would miss.",
      "A long branch, where a recursive solution overflows.",
    ],
    implementation: `// post-order: both children measured before the parent
long long L = node->left  ? height[node->left]  : 0;
long long R = node->right ? height[node->right] : 0;
if (llabs(L - R) > 1) balanced = false;
height[node] = 1 + max(L, R);`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 110, sourceCategory: "Trees" },
};
