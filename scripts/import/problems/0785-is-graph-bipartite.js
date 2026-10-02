/*
 * One input: the vertex count, the edge count, then one line per edge. The
 * larger cases are described rather than typed out. They are input only — the
 * expected answer still comes from running the reference solution.
 */
function graph(n, edges) {
  return [String(n), String(edges.length), ...edges.map(([u, v]) => `${u} ${v}`)].join("\n") + "\n";
}

// A single cycle 0-1-2-...-(n-1)-0. Two-colourable exactly when n is even.
const cycle = (n) => Array.from({ length: n }, (_, i) => [i, (i + 1) % n]);
const path = (n) => Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);

module.exports = {
  problemId: "dsa-785",
  slug: "is-graph-bipartite",
  title: "Is Graph Bipartite",
  difficulty: "Medium",
  topics: ["graph", "breadth-first search", "depth-first search", "colouring"],
  timeLimitMs: 2000,

  statement:
    "You are given an undirected graph with n vertices, numbered 0 to n-1, and m edges.\n\n" +
    "The graph is bipartite when its vertices can be split into two groups so that every edge " +
    "joins a vertex in one group to a vertex in the other — no edge may have both ends in the " +
    "same group. A vertex in neither group is not allowed: every vertex must be placed.\n\n" +
    "Decide whether the graph is bipartite. The graph need not be connected.\n\n" +
    "The same edge may be listed more than once. An edge may also name the same vertex twice, " +
    "and such a vertex can never be placed, since both of its ends would land in the same group.",

  inputFormat:
    "Line 1: the integer n, the number of vertices.\n" +
    "Line 2: the integer m, the number of edges.\n" +
    "Next m lines: two integers u and v, an edge between vertex u and vertex v.",
  outputFormat: 'One line holding either "true" or "false", in lower case.',
  constraints: [
    "1 <= n <= 100000",
    "0 <= m <= 100000",
    "0 <= u <= n-1",
    "0 <= v <= n-1",
  ],
  hint:
    "Try to two-colour the graph. Give a vertex one colour, give all of its neighbours the " +
    "other, and keep going. Either the colouring completes, or you meet an edge whose two ends " +
    "already share a colour — and then no colouring can work.",

  examples: [
    {
      input: "4\n4\n0 1\n1 2\n2 3\n3 0\n",
      expected: "true",
      note:
        "A cycle of four vertices. Put 0 and 2 in one group and 1 and 3 in the other, and every " +
        "edge crosses between them.",
    },
    {
      input: "3\n3\n0 1\n1 2\n2 0\n",
      expected: "false",
      note:
        "A triangle. Whichever group vertex 0 goes in, vertex 1 must go in the other and vertex " +
        "2 back in the first — but vertex 2 is joined to vertex 0 as well.",
    },
  ],

  curated: [
    { label: "One vertex and no edges", input: "1\n0\n" },
    { label: "A vertex joined to itself", input: "1\n1\n0 0\n" },
    { label: "Many vertices, no edges", input: "6\n0\n" },
    { label: "The same edge listed twice, which is not an odd cycle", input: "2\n2\n0 1\n0 1\n" },
    { label: "Two separate edges", input: "4\n2\n0 1\n2 3\n" },
    { label: "A complete bipartite graph with three on each side", input: "6\n9\n0 3\n0 4\n0 5\n1 3\n1 4\n1 5\n2 3\n2 4\n2 5\n" },
    { label: "A star, which is always bipartite", input: "5\n4\n0 1\n0 2\n0 3\n0 4\n" },
    {
      label: "A bipartite part first, then a triangle that is not",
      input: "7\n7\n0 1\n1 2\n2 3\n3 0\n4 5\n5 6\n6 4\n",
    },
    {
      label: "A triangle reachable from nowhere else, so vertex 0 alone misses it",
      input: "6\n4\n0 1\n3 4\n4 5\n5 3\n",
    },
    { label: "Longest even cycle", input: graph(100000, cycle(100000)) },
    { label: "Longest odd cycle", input: graph(99999, cycle(99999)) },
    { label: "Longest path", input: graph(100000, path(100000)) },
    {
      label: "Longest path with one edge closing an odd loop",
      input: graph(100000, [...path(100000).slice(0, 99998), [0, 99998]]),
    },
    { label: "Full size, every vertex on its own", input: graph(100000, []) },
  ],

  generator: {
    seed: 20260926, cases: 10,
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

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n, m;
    if (!(cin >> n >> m)) return 0;

    vector<vector<int>> adj(n);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);      // a loop lands in its own list twice, which is fine
    }

    vector<signed char> colour(n, -1);
    vector<int> pending;
    bool ok = true;

    // Every vertex, not just vertex 0: the graph may be in several pieces, and
    // the piece that fails may be one nothing else reaches.
    for (int s = 0; s < n && ok; s++) {
        if (colour[s] != -1) continue;
        colour[s] = 0;
        pending.push_back(s);
        while (!pending.empty() && ok) {
            int v = pending.back(); pending.pop_back();
            for (int w : adj[v]) {
                if (colour[w] == -1) {
                    colour[w] = (signed char)(1 - colour[v]);
                    pending.push_back(w);
                } else if (colour[w] == colour[v]) {
                    ok = false;
                    break;
                }
            }
        }
        pending.clear();
    }

    printf("%s\\n", ok ? "true" : "false");
    return 0;
}`,
  },

  editorial: {
    understanding:
      "Splitting the vertices into two groups is the same as painting each vertex one of two " +
      "colours so that no edge joins two vertices of the same colour.\n\n" +
      "Once one vertex of a connected piece is painted, everything else in that piece is forced: " +
      "its neighbours must take the other colour, their neighbours must take the first, and so " +
      "on. There is no choice to make and nothing to search — only a colouring to carry out and " +
      "then check.",
    approach:
      "Traverse the graph, painting as you go. Start at an unpainted vertex, give it colour 0, " +
      "and then repeatedly take a painted vertex and look at its neighbours. An unpainted " +
      "neighbour takes the opposite colour and joins the queue. A neighbour that is already " +
      "painted is the interesting case: if its colour differs, all is well; if it matches, the " +
      "edge joins two vertices of the same colour and no valid split exists.\n\n" +
      "When the piece runs out, move on to the next unpainted vertex. This has to be done for " +
      "every vertex, not only vertex 0 — a graph in several pieces may be perfectly fine " +
      "everywhere the traversal from vertex 0 reaches and still contain a triangle elsewhere.\n\n" +
      "Breadth-first and depth-first are equally correct here; the order of the traversal never " +
      "changes which colour a vertex is forced into. An explicit stack or queue is worth " +
      "preferring over recursion, since one piece can be a path through all hundred thousand " +
      "vertices.",
    steps: [
      "Build an adjacency list, adding each edge in both directions.",
      "Set every colour to unpainted.",
      "For each vertex s in turn:",
      "    if s is already painted, move on;",
      "    paint it 0 and traverse its piece;",
      "    for each neighbour: paint it the opposite colour if unpainted, and otherwise check that its colour differs from the vertex it was reached from.",
      'Print "false" if any check failed, and "true" otherwise.',
    ],
    algorithm: [
      "colour[v] = none for every v",
      "for s from 0 to n-1:",
      "    if colour[s] != none: continue",
      "    colour[s] = 0",
      "    push s",
      "    while the stack is not empty:",
      "        v = pop",
      "        for w in adj[v]:",
      "            if colour[w] == none:",
      "                colour[w] = 1 - colour[v]",
      "                push w",
      "            else if colour[w] == colour[v]:",
      "                answer is false",
      "answer is true",
    ],
    whyItWorks:
      "If the traversal finishes without a clash, the colouring it produced is a valid split. " +
      "Every edge was looked at from both ends, so no edge went unchecked, and none of them had " +
      "matching colours.\n\n" +
      "The other direction is the one worth spelling out. Suppose the traversal finds an edge " +
      "between two vertices of the same colour, and claim no valid split exists.\n\n" +
      "Follow each of the two vertices back along the path the traversal used to reach it, until " +
      "the two paths meet at their common starting point. Those two paths plus the offending " +
      "edge form a cycle. The colour of a vertex is the parity of its distance along its path, " +
      "so the two paths have lengths of the same parity, and the cycle they form with one extra " +
      "edge has odd length.\n\n" +
      "A graph with an odd cycle can never be split: walking around the cycle, colours must " +
      "alternate, so after an odd number of steps you arrive back where you started holding the " +
      "opposite colour. So a clash proves a real obstruction, not merely a bad guess of where to " +
      "start.",
    complexity: {
      time: "O(n + m)",
      space: "O(n + m)",
      explanation:
        "Each vertex is painted once and enters the stack once, and each edge is looked at " +
        "twice, once from each end. Building the adjacency list is the same order of work.\n\n" +
        "The space is the adjacency list, at two entries per edge, plus one colour per vertex.",
    },
    edgeCases: [
      "No edges, which is bipartite — put everything in one group.",
      "A vertex joined to itself, which is never bipartite. The colouring catches it with no special case: the vertex is compared against itself and the colours match.",
      "The same edge listed twice, which is bipartite. A solver that counts edges rather than checking colours can mistake this for a two-cycle.",
      "A graph in several pieces where only one piece has an odd cycle. Traversing from vertex 0 alone reports true, which is the usual bug and is invisible on connected tests.",
      "An even cycle, which is bipartite, against an odd cycle, which is not. The answer turns on the parity alone, not on the size.",
      "A path through every vertex, which nests a recursive traversal a hundred thousand deep.",
    ],
    implementation: `for (int s = 0; s < n && ok; s++) {
    if (colour[s] != -1) continue;          // every vertex, not just vertex 0
    colour[s] = 0;
    pending.push_back(s);
    while (!pending.empty() && ok) {
        int v = pending.back(); pending.pop_back();
        for (int w : adj[v]) {
            if (colour[w] == -1) { colour[w] = 1 - colour[v]; pending.push_back(w); }
            else if (colour[w] == colour[v]) { ok = false; break; }
        }
    }
    pending.clear();
}`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 785, sourceCategory: "Graphs" },
};
