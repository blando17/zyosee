/*
 * One input: the vertex count, the edge count, then one line per edge. The
 * larger cases are described rather than typed out. They are input only — the
 * expected answer still comes from running the reference solution.
 */
function graph(n, edges) {
  return [String(n), String(edges.length), ...edges.map(([u, v]) => `${u} ${v}`)].join("\n") + "\n";
}

const path = (n) => Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);

module.exports = {
  problemId: "dsa-323",
  slug: "number-of-connected-components",
  title: "Number of Connected Components",
  difficulty: "Medium",
  topics: ["graph", "union find", "depth-first search", "breadth-first search"],
  timeLimitMs: 2000,

  statement:
    "You are given an undirected graph with n vertices, numbered 0 to n-1, and m edges.\n\n" +
    "Two vertices belong to the same component when one can be reached from the other by " +
    "following edges. A vertex with no edges at all is a component on its own.\n\n" +
    "Count the components.\n\n" +
    "The same edge may be listed more than once, and an edge may name the same vertex twice; " +
    "neither joins anything that was not already joined.",

  inputFormat:
    "Line 1: the integer n, the number of vertices.\n" +
    "Line 2: the integer m, the number of edges.\n" +
    "Next m lines: two integers u and v, an edge between vertex u and vertex v.",
  outputFormat: "One line holding the number of components.",
  constraints: [
    "1 <= n <= 100000",
    "0 <= m <= 100000",
    "0 <= u <= n-1",
    "0 <= v <= n-1",
  ],
  hint:
    "Start with n separate pieces, one per vertex. Every edge that joins two pieces that were " +
    "not already together reduces the count by one. Edges inside a piece change nothing.",

  examples: [
    {
      input: "5\n3\n0 1\n1 2\n3 4\n",
      expected: "2",
      note:
        "Vertices 0, 1 and 2 are joined into one component, and vertices 3 and 4 into another.",
    },
    {
      input: "5\n4\n0 1\n1 2\n2 3\n3 4\n",
      expected: "1",
      note: "The four edges string every vertex together, so there is a single component.",
    },
  ],

  curated: [
    { label: "One vertex and no edges", input: "1\n0\n" },
    { label: "A vertex joined to itself, which joins nothing", input: "1\n1\n0 0\n" },
    { label: "Many vertices, no edges", input: "6\n0\n" },
    { label: "The same edge listed several times", input: "3\n4\n0 1\n0 1\n0 1\n0 1\n" },
    { label: "A loop inside a component that is already whole", input: "3\n3\n0 1\n1 2\n1 1\n" },
    { label: "A star", input: "5\n4\n0 1\n0 2\n0 3\n0 4\n" },
    { label: "Two pieces, the second reachable from neither vertex 0 nor 1", input: "6\n3\n0 1\n3 4\n4 5\n" },
    { label: "Edges that close a loop rather than joining anything new", input: "4\n5\n0 1\n1 2\n2 0\n2 3\n3 0\n" },
    { label: "Longest path, so every vertex is in one component", input: graph(100000, path(100000)) },
    { label: "Full size, every vertex on its own", input: graph(100000, []) },
    {
      label: "Full size, paired off into fifty thousand components",
      input: graph(100000, Array.from({ length: 50000 }, (_, i) => [2 * i, 2 * i + 1])),
    },
    {
      label: "Full size, one star holding everything",
      input: graph(100000, Array.from({ length: 99999 }, (_, i) => [0, i + 1])),
    },
    {
      /*
       * Every edge joins a vertex to one already in its own piece, so none of
       * them changes the count. A solution that subtracts one per edge rather
       * than one per merge answers 1 here instead of 50000.
       */
      label: "Full size, every edge redundant",
      input: graph(100000, Array.from({ length: 100000 }, (_, i) => [2 * (i % 50000), 2 * (i % 50000) + 1])),
    },
  ],

  generator: {
    seed: 20260927, cases: 10,
    fields: [
      { name: "n", type: "int", min: 1, max: 100000, scales: true },
      { name: "m", type: "int", min: 1, max: "n", scales: true },
      // The endpoints are bounded by the vertex count, which changes from case
      // to case, so the bound names the field rather than a fixed number.
      { name: "top", type: "int", min: "n", minOffset: -1, max: "n", maxOffset: -1, silent: true },
      { name: "edges", type: "intMatrix", rows: "m", cols: 2, min: 0, max: "top" },
    ],
  },

  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int parentOf(vector<int> &parent, int x) {
    // Path compression, written as a loop so a long chain cannot nest.
    int root = x;
    while (parent[root] != root) root = parent[root];
    while (parent[x] != root) { int next = parent[x]; parent[x] = root; x = next; }
    return root;
}

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n, m;
    if (!(cin >> n >> m)) return 0;

    vector<int> parent(n), size_(n, 1);
    for (int i = 0; i < n; i++) parent[i] = i;

    long long components = n;            // every vertex starts on its own
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        int a = parentOf(parent, u), b = parentOf(parent, v);
        if (a == b) continue;            // already together: this edge joins nothing
        if (size_[a] < size_[b]) swap(a, b);
        parent[b] = a;
        size_[a] += size_[b];
        components--;
    }

    printf("%lld\\n", components);
    return 0;
}`,
  },

  editorial: {
    understanding:
      "Before any edge is read, the n vertices form n components, one each. Reading an edge can " +
      "only ever do one of two things: join two components into one, lowering the count by " +
      "exactly one, or fall inside a component that already holds both of its ends, changing " +
      "nothing.\n\n" +
      "So the answer is n minus the number of edges that genuinely joined something. The whole " +
      "problem is telling those edges apart from the rest.",
    approach:
      "Keep a disjoint-set structure, sometimes called union-find. Each component has one vertex " +
      "standing for it, its representative, and every vertex points towards its own.\n\n" +
      "To read an edge, find the representative of each end. If they are the same, both ends " +
      "were already in one component and the edge is ignored. If they differ, point one " +
      "representative at the other — the two components are now one — and lower the count.\n\n" +
      "Two refinements keep this fast. Point the smaller component at the larger, so chains stay " +
      "short. And when walking up to find a representative, point everything along the way " +
      "straight at it, so the next lookup is immediate.\n\n" +
      "Traversal works just as well: mark vertices as visited, and count how many times you have " +
      "to start a fresh traversal. Disjoint sets are the better fit here only because they need " +
      "no adjacency list and no traversal order — they read each edge once and are done.",
    steps: [
      "Set each vertex to be its own representative, and set the count to n.",
      "For each edge u v:",
      "    find the representative of u and of v;",
      "    if they are the same, move on;",
      "    otherwise attach the smaller component to the larger and lower the count by one.",
      "Print the count.",
    ],
    algorithm: [
      "parent[v] = v for every v",
      "components = n",
      "for each edge (u, v):",
      "    a = find(u); b = find(v)",
      "    if a == b: continue",
      "    attach the smaller of a, b to the larger",
      "    components = components - 1",
      "print components",
      "",
      "find(x):  walk parent links to the root, then point everything walked at the root",
    ],
    whyItWorks:
      "The structure holds one invariant: two vertices have the same representative exactly when " +
      "some sequence of edges read so far joins them.\n\n" +
      "It holds at the start, when no edges have been read and every vertex stands alone. It " +
      "survives each edge: joining the two representatives makes exactly the pairs that the new " +
      "edge connects share a representative, and nothing else changes. Compressing a path only " +
      "shortens the route to the same representative, so it cannot alter which vertices share " +
      "one.\n\n" +
      "Given the invariant, the count is right. It starts at n, and it drops by one exactly when " +
      "two components become one, which is exactly when an edge joins ends that were previously " +
      "apart. Every other edge leaves both the structure and the count alone.",
    complexity: {
      time: "O((n + m) * a(n)), which is as good as linear in practice",
      space: "O(n)",
      explanation:
        "With both refinements — attaching the smaller to the larger and compressing paths — a " +
        "sequence of operations costs almost constant time each. The a(n) is the inverse " +
        "Ackermann function, which is below 5 for any input that fits in a computer.\n\n" +
        "The space is two numbers per vertex. Note what is not stored: no adjacency list, so the " +
        "edges need never be kept at all — each one is used the moment it is read.",
    },
    edgeCases: [
      "No edges, which is n components rather than 1 or 0.",
      "A vertex joined to itself. Both ends already share a representative, so the edge is ignored, which is the right answer.",
      "The same edge listed several times, where only the first joins anything. Subtracting one per edge instead of one per merge gives a count that is too low, and can even go negative.",
      "Edges that close a loop inside a component, the same trap in a less obvious shape.",
      "A component that vertex 0 cannot reach. Counting must consider every vertex, not only the piece the first one is in.",
      "A path through every vertex, which a recursive traversal would nest a hundred thousand deep. The loop in find never does.",
    ],
    implementation: `long long components = n;
for each edge (u, v) {
    int a = parentOf(parent, u), b = parentOf(parent, v);
    if (a == b) continue;                 // joins nothing
    if (size_[a] < size_[b]) swap(a, b);  // smaller under larger
    parent[b] = a;
    size_[a] += size_[b];
    components--;
}`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 323, sourceCategory: "Graphs" },
};
