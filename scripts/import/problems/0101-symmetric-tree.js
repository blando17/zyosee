module.exports = {
  problemId: "dsa-101",
  slug: "symmetric-tree",
  title: "Symmetric Tree",
  difficulty: "Easy",
  topics: ["tree", "depth-first search", "breadth-first search"],
  timeLimitMs: 2000,
  statement:
    "You are given a binary tree written in level order.\n\n" +
    "Print true if it is a mirror image of itself around its centre, and false otherwise.\n\n" +
    "A token is either a value or the word null. Children are listed only for nodes that exist.",
  inputFormat: "Line 1: the integer n, the number of tokens.\nLine 2: n tokens in level order, each a value or null.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: ["0 <= n <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "Compare the left subtree against the right one walked in the opposite direction.",
  examples: [
    { input: "7\n1 2 2 3 4 4 3\n", expected: "true", note: "The two halves mirror each other." },
    { input: "7\n1 2 2 null 3 null 3\n", expected: "false", note: "Both 3s hang to the right, so they do not mirror." },
  ],
  curated: [
    { label: "Smallest allowed input", input: "0\n\n" },
    { label: "Boundary condition", input: "1\n1\n" },
    { label: "Special case", input: "3\n1 2 2\n" },
    { label: "Special case", input: "3\n1 2 3\n" },
    { label: "All duplicates", input: "7\n5 5 5 5 5 5 5\n" },
    { label: "Boundary condition", input: "3\n1 2 null\n" },
  ],
  generator: {
    seed: 20260922, cases: 8,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      // A complete tree of random values is essentially never symmetric, so
      // these exercise the false path at scale. Symmetric shapes are curated.
      { name: "tokens", type: "intArray", length: "n", min: -1000, max: 1000 },
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

    // Pair the two halves and walk them in OPPOSITE directions.
    queue<pair<TreeNode*, TreeNode*>> todo;
    if (root) todo.push({root->left, root->right});
    bool symmetric = true;
    while (!todo.empty() && symmetric) {
        auto [a, b] = todo.front(); todo.pop();
        if (!a && !b) continue;
        if (!a || !b || a->val != b->val) { symmetric = false; break; }
        todo.push({a->left, b->right});
        todo.push({a->right, b->left});
    }
    cout << (symmetric ? "true" : "false") << "\\n";
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Symmetry is about the tree folding onto itself along a vertical line through the root. " +
      "It is not the same as the left and right subtrees being identical — they must be " +
      "reflections of one another.",
    approach:
      "Reduce it to comparing two trees, but with a twist. Ask whether the root's left subtree " +
      "mirrors its right subtree, where mirroring means the left child of one lines up with the " +
      "RIGHT child of the other.\n\n" +
      "That single crossed pairing is the entire difference from the Same Tree problem.",
    steps: [
      "If the tree is empty it is symmetric.",
      "Pair the root's left subtree with its right subtree.",
      "Take a pair. If both are empty, this branch mirrors — move on.",
      "If exactly one is empty, or the values differ, it is not symmetric.",
      "Otherwise pair the first's LEFT with the second's RIGHT, and the first's RIGHT with the second's LEFT.",
      "Continue until every pair is exhausted.",
    ],
    algorithm: [
      "queue = [(root.left, root.right)]",
      "while queue is not empty:",
      "    (a, b) = pop()",
      "    if both null: continue",
      "    if exactly one null, or a.val != b.val: return false",
      "    push (a.left, b.right)",
      "    push (a.right, b.left)",
      "return true",
    ],
    whyItWorks:
      "A reflection swaps left and right at every level, not only at the root. Pairing a.left " +
      "with b.right and a.right with b.left applies that swap at each step, so the positions " +
      "compared are genuinely mirror images all the way down.\n\n" +
      "Using a.left with b.left instead — the Same Tree pairing — asks whether the two subtrees " +
      "are IDENTICAL rather than mirrored, which is a different and usually false question. That " +
      "single substitution is the most common bug in this problem.\n\n" +
      "The null handling matters as much as the values: a node facing an empty position means " +
      "the shapes do not reflect, even if every value that exists happens to match.",
    complexity: {
      time: "O(n)",
      space: "O(w), the widest level",
      explanation: "Every node is paired once, and the walk stops at the first mismatch.",
    },
    edgeCases: [
      "An empty tree, symmetric by convention.",
      "A single node, symmetric.",
      "A root with one child, which cannot mirror anything.",
      "Values that match but shapes that do not, such as both children hanging right.",
      "Pairing left with left instead of left with right, which tests identity rather than reflection.",
    ],
    implementation: `push({root->left, root->right});
...
push({a->left,  b->right});   // crossed: this is the mirror
push({a->right, b->left});`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 101, sourceCategory: "Trees" },
};
