module.exports = {
  problemId: "dsa-145",
  slug: "binary-tree-postorder-traversal",
  title: "Binary Tree Postorder Traversal",
  difficulty: "Easy",
  topics: ["tree", "stack", "depth-first search"],
  timeLimitMs: 2000,
  statement:
    "You are given a binary tree written in level order.\n\n" +
    "Print its values in postorder: the whole left subtree, then the whole right subtree, then " +
    "the node itself.\n\n" +
    "A token is either a value or the word null. Children are listed only for nodes that exist.",
  inputFormat: "Line 1: the integer n, the number of tokens.\nLine 2: n tokens in level order, each a value or null.",
  outputFormat: "One line holding the values in postorder. For an empty tree, print nothing.",
  constraints: ["0 <= n <= 100000", "-1000000000 <= value <= 1000000000"],
  hint: "Produce node, right, left — then reverse the whole thing.",
  examples: [
    { input: "4\n1 null 2 3\n", expected: "3 2 1", note: "Both subtrees before the node, all the way up." },
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

    // Postorder is left, right, node. Producing node, right, left is a trivial
    // variant of preorder, and reversing that gives exactly postorder.
    vector<long long> rev;
    stack<TreeNode*> st;
    if (root) st.push(root);
    while (!st.empty()) {
        TreeNode *cur = st.top(); st.pop();
        rev.push_back(cur->val);
        if (cur->left) st.push(cur->left);
        if (cur->right) st.push(cur->right);
    }
    reverse(rev.begin(), rev.end());

    string out;
    out.reserve(rev.size() * 12);
    for (size_t i = 0; i < rev.size(); i++) {
        if (i) out += ' ';
        out += to_string(rev[i]);
    }
    out += '\\n';
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Postorder visits a node only after both its subtrees are done. It is the order in which " +
      "a tree can be safely deleted, or in which an expression tree can be evaluated, because " +
      "everything a node depends on is finished before the node itself.",
    approach:
      "Postorder is the awkward one to write iteratively. A node has to be left on the stack " +
      "while its left subtree runs, put back while its right subtree runs, and only then " +
      "printed — which needs a record of whether the right child has already been handled.\n\n" +
      "There is a much cleaner route. Preorder is node, left, right. Swap the two pushes and it " +
      "becomes node, right, left. Reverse that sequence and you get left, right, node — which is " +
      "postorder.",
    steps: [
      "Run a preorder traversal with the pushes swapped, so children come off right before left.",
      "Collect the values into a list instead of printing them.",
      "Reverse the list.",
      "Print it.",
    ],
    algorithm: [
      "stack = [root], result = []",
      "while stack is not empty:",
      "    cur = pop(); append cur.val to result",
      "    if cur.left: push cur.left",
      "    if cur.right: push cur.right",
      "reverse result",
    ],
    whyItWorks:
      "The traversal produced is node, right, left at every level. Reversing a sequence reverses " +
      "it at every level too, so node-right-left becomes left-right-node throughout — and that " +
      "is the definition of postorder.\n\n" +
      "The trade is memory for simplicity. The whole traversal must be stored before it can be " +
      "reversed, where the two-stack or last-visited-pointer methods can print as they go. For " +
      "a problem that prints every value anyway, that costs nothing extra.",
    complexity: {
      time: "O(n)",
      space: "O(n)",
      explanation:
        "One pass to build the reversed order and one to flip it. The n here is the output list, " +
        "which this problem needs regardless.",
    },
    edgeCases: [
      "An empty tree.",
      "A single node.",
      "A long left branch, where the root is printed last.",
      "Forgetting the reverse, which produces node-right-left order.",
      "Swapping the pushes back to left-then-right, which produces the mirror.",
    ],
    implementation: `// node, right, left  ->  reverse  ->  left, right, node
while (!st.empty()) {
    TreeNode *cur = st.top(); st.pop();
    rev.push_back(cur->val);
    if (cur->left)  st.push(cur->left);
    if (cur->right) st.push(cur->right);
}
reverse(rev.begin(), rev.end());`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 145, sourceCategory: "Trees" },
};
