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
  problemId: "dsa-133",
  slug: "clone-graph",
  title: "Clone Graph",
  difficulty: "Medium",
  topics: ["graph", "breadth-first search", "depth-first search", "hash map"],
  timeLimitMs: 2000,

  statement:
    "You are given an undirected graph with n nodes, numbered 0 to n-1, and m edges.\n\n" +
    "Build an independent copy of the part of the graph that can be reached from node 0: a new " +
    "node for every reachable node, and a new edge wherever the original has one. Nothing in " +
    "the copy may point back at the original, and nodes that node 0 cannot reach are not copied " +
    "at all.\n\n" +
    "A judge cannot look inside your program's memory, so report the copy by printing it. " +
    "Number the copied nodes 0 to k-1, in increasing order of the label of the node each was " +
    "copied from, and print each copied node's neighbours using those new numbers.\n\n" +
    "The same edge may be listed more than once; the copy holds one edge for each distinct pair. " +
    "An edge may name the same node twice, and that node is then its own neighbour, listed once.",

  inputFormat:
    "Line 1: the integer n, the number of nodes.\n" +
    "Line 2: the integer m, the number of edges.\n" +
    "Next m lines: two integers u and v, an edge between node u and node v.",
  outputFormat:
    "Line 1: the integer k, the number of nodes in the copy.\n" +
    "Next k lines: for copied node i, its number of neighbours, followed by those neighbours in " +
    "increasing order. A node with no neighbours is a line holding just 0.",
  constraints: [
    "1 <= n <= 50000",
    "0 <= m <= 50000",
    "0 <= u <= n-1",
    "0 <= v <= n-1",
  ],
  hint:
    "Walk out from node 0. The first time you meet a node, make its copy and remember which " +
    "copy belongs to it — that memory is what stops a cycle from sending you round for ever, " +
    "and it is also how you know which copy to join an edge to.",

  examples: [
    {
      input: "4\n4\n0 1\n0 2\n1 3\n2 3\n",
      expected: "4\n2 1 2\n2 0 3\n2 0 3\n2 1 2",
      note:
        "Every node is reachable from node 0, so the copy keeps all four and the numbering is " +
        "unchanged. Copied node 0 is joined to 1 and 2, copied node 1 to 0 and 3, and so on.",
    },
    {
      input: "4\n1\n0 2\n",
      expected: "2\n1 1\n1 0",
      note:
        "Only nodes 0 and 2 are reachable, so the copy has two nodes. Node 0 keeps the number 0 " +
        "and node 2 becomes number 1, because 0 is the smaller original label. Nodes 1 and 3 " +
        "are not copied.",
    },
  ],

  curated: [
    { label: "One node and no edges", input: "1\n0\n" },
    { label: "A node joined to itself", input: "1\n1\n0 0\n" },
    { label: "The same edge listed twice", input: "2\n2\n0 1\n0 1\n" },
    { label: "Node 0 alone while the rest of the graph is joined up", input: "5\n3\n1 2\n2 3\n3 4\n" },
    { label: "A complete graph on six nodes", input: "6\n15\n0 1\n0 2\n0 3\n0 4\n0 5\n1 2\n1 3\n1 4\n1 5\n2 3\n2 4\n2 5\n3 4\n3 5\n4 5\n" },
    { label: "A cycle, which sends a careless traversal round for ever", input: "4\n4\n0 1\n1 2\n2 3\n3 0\n" },
    {
      label: "Two pieces, only one of them reachable, and the numbering closes the gaps",
      input: "8\n4\n0 3\n3 6\n1 2\n2 4\n",
    },
    { label: "A node joined to itself as well as to others", input: "3\n3\n0 0\n0 1\n1 2\n" },
    { label: "Longest path starting at node 0", input: graph(50000, path(50000)) },
    {
      label: "Largest star, so one copied node has fifty thousand neighbours",
      input: graph(50000, Array.from({ length: 49999 }, (_, i) => [0, i + 1])),
    },
    { label: "Full size, node 0 reaching nothing", input: graph(50000, []) },
    {
      label: "Longest path reached only from its far end, so the numbering is reversed",
      input: graph(50000, [[0, 49999], ...path(50000).slice(0, 49998)]),
    },
  ],

  generator: {
    seed: 20260928, cases: 10,
    fields: [
      { name: "n", type: "int", min: 1, max: 50000, scales: true },
      { name: "m", type: "int", min: 1, max: "n", scales: true },
      // The endpoints are bounded by the node count, which changes from case to
      // case, so the bound names the field rather than a fixed number.
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
        if (u != v) adj[v].push_back(u);   // a loop is one neighbour, not two
    }

    // Walk out from node 0, marking a node the moment it is first reached.
    // That mark is what a clone's map of original to copy really is: without
    // it, a cycle sends the traversal round again and again.
    vector<char> reached(n, 0);
    vector<int> found, pending;
    reached[0] = 1;
    pending.push_back(0);
    while (!pending.empty()) {
        int v = pending.back(); pending.pop_back();
        found.push_back(v);
        for (int w : adj[v]) if (!reached[w]) { reached[w] = 1; pending.push_back(w); }
    }

    // The copies are numbered by the original label, so the answer does not
    // depend on the order the traversal happened to find them in.
    sort(found.begin(), found.end());
    vector<int> copyOf(n, -1);
    for (size_t i = 0; i < found.size(); i++) copyOf[found[i]] = (int)i;

    int k = (int)found.size();
    string out;
    out.reserve((size_t)k * 8 + (size_t)m * 14 + 16);
    out += to_string(k);
    out += '\\n';

    vector<int> ns;
    for (int i = 0; i < k; i++) {
        ns.clear();
        // Every neighbour of a reached node is itself reached, so each one has
        // a copy to join to.
        for (int w : adj[found[i]]) ns.push_back(copyOf[w]);
        sort(ns.begin(), ns.end());
        ns.erase(unique(ns.begin(), ns.end()), ns.end());
        out += to_string(ns.size());
        for (int w : ns) { out += ' '; out += to_string(w); }
        out += '\\n';
    }

    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },

  editorial: {
    understanding:
      "Copying a graph is not like copying a list. A list has an end; a graph has cycles, so " +
      "following edges and copying as you go never stops on its own. And a node reached along " +
      "two different routes must produce one copy, not two, or the copy is a different graph " +
      "from the original.\n\n" +
      "Both problems are solved by the same thing: remember, for each original node, the copy " +
      "you made of it. That map is the whole algorithm. Marking a node as reached and looking up " +
      "its copy are the same operation.\n\n" +
      "Printing is only how the copy is shown to a judge that cannot inspect your memory. " +
      "Numbering the copies by the original label, rather than by the order you happened to find " +
      "them in, keeps the answer the same whether you traverse breadth-first or depth-first.",
    approach:
      "Traverse outward from node 0. Keep a map from each original node to its copy. On meeting " +
      "a node:\n\n" +
      "  if it is already in the map, use the copy that is there;\n" +
      "  otherwise make a copy, record it, and queue the node so its neighbours are visited too.\n\n" +
      "Then join the copies: for each original edge inside the reached part, add the matching " +
      "edge between the two copies.\n\n" +
      "Here the map is an array indexed by the original label, which is possible because the " +
      "nodes are numbered. When they are not — bare references with no numbering — the same " +
      "algorithm uses a hash map keyed by the node itself, and nothing else changes.\n\n" +
      "Two details are about the reported form rather than the copying. Sort the reached nodes " +
      "before numbering their copies, so the numbering follows the original labels. And drop " +
      "duplicate neighbours, since a repeated edge is still one edge.",
    steps: [
      "Build an adjacency list. Add each edge in both directions, except an edge whose ends are the same node, which is added once.",
      "Traverse from node 0, marking each node the first time it is reached and collecting the reached nodes.",
      "Sort the reached nodes, and give the copy of the i-th one the number i.",
      "For each copied node, map its original neighbours through that numbering, sort them and drop duplicates.",
      "Print the number of copied nodes, then one line per copied node holding its neighbour count and its neighbours.",
    ],
    algorithm: [
      "reached[0] = true; push 0",
      "while the stack is not empty:",
      "    v = pop; add v to found",
      "    for w in adj[v]:",
      "        if not reached[w]: reached[w] = true; push w",
      "sort found",
      "copyOf[found[i]] = i for every i",
      "for i from 0 to k-1:",
      "    ns = [copyOf[w] for w in adj[found[i]]]",
      "    sort ns; remove duplicates",
      "    print ns.size, then ns",
    ],
    whyItWorks:
      "The traversal reaches exactly the nodes reachable from node 0. Everything it visits was " +
      "reached by following edges, and nothing reachable is missed: if some reachable node were " +
      "missed, there would be a step along the route to it where a neighbour was ignored, which " +
      "the loop never does.\n\n" +
      "It also stops. A node is marked when it is first pushed and is never pushed again, so at " +
      "most n nodes ever enter the stack however many cycles the graph contains. This is exactly " +
      "the guarantee the map gives a clone, stated in terms of marks.\n\n" +
      "The copy is faithful. Every reached node has one copy, since the map holds one entry per " +
      "node. Every neighbour of a reached node is itself reached — it is one edge further along " +
      "the same route — so each edge can be joined to a copy that exists, and no edge points " +
      "back into the original graph.",
    complexity: {
      time: "O(n + m log m) for the reported form, O(n + m) for the copy itself",
      space: "O(n + m)",
      explanation:
        "The traversal visits each node once and each edge twice, which is linear. Copying the " +
        "edges is linear too.\n\n" +
        "The logarithm is only the sorting used to put each node's neighbours in order and drop " +
        "duplicates, which the printed form asks for. A clone held in memory needs neither.",
    },
    edgeCases: [
      "A single node with no edges, whose copy is one node with an empty neighbour list.",
      "A cycle, which is the reason the map exists. Without it the traversal never ends.",
      "A node joined to itself. Its copy must be joined to its own copy — not to the original, and not twice.",
      "The same edge listed more than once, which is still one edge in the copy.",
      "Nodes that node 0 cannot reach, which are not copied. Their absence closes gaps in the numbering, so the copy's labels are not the originals.",
      "A path through every node, which nests a recursive traversal fifty thousand deep. An explicit stack does not.",
    ],
    implementation: `reached[0] = 1; pending.push_back(0);
while (!pending.empty()) {
    int v = pending.back(); pending.pop_back();
    found.push_back(v);
    for (int w : adj[v]) if (!reached[w]) { reached[w] = 1; pending.push_back(w); }
}
sort(found.begin(), found.end());
for (size_t i = 0; i < found.size(); i++) copyOf[found[i]] = (int)i;`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 133, sourceCategory: "Graphs" },
};
