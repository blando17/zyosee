/*
 * Curated grids big enough to be interesting are built rather than typed out.
 * The input is still only text, and its expected output still comes from the
 * reference solution — nothing here decides an answer.
 */
function grid(rows, cols, cell) {
  const lines = [String(rows), String(cols)];
  for (let i = 0; i < rows; i += 1) {
    const row = new Array(cols);
    for (let j = 0; j < cols; j += 1) row[j] = cell(i, j);
    lines.push(row.join(" "));
  }
  return lines.join("\n") + "\n";
}

module.exports = {
  problemId: "dsa-200",
  slug: "number-of-islands",
  title: "Number of Islands",
  difficulty: "Medium",
  topics: ["graph", "grid", "breadth-first search", "depth-first search", "flood fill"],
  timeLimitMs: 2000,

  statement:
    "You are given a grid of r rows and c columns. Each cell holds 1 for land or 0 for water.\n\n" +
    "An island is a group of land cells joined edge to edge. Two land cells belong to the same " +
    "island when one can be reached from the other by repeatedly stepping up, down, left or " +
    "right onto another land cell. Cells that touch only at a corner are not joined.\n\n" +
    "Count the islands.",

  inputFormat:
    "Line 1: the integer r, the number of rows.\n" +
    "Line 2: the integer c, the number of columns.\n" +
    "Next r lines: c integers each, every one either 0 or 1.",
  outputFormat: "One line holding the number of islands.",
  constraints: ["1 <= r <= 200", "1 <= c <= 200", "each cell is 0 or 1"],
  hint:
    "Walk the grid once. The first time you step on a land cell that you have not seen before, " +
    "you have found a new island — then erase the whole island before moving on, so none of its " +
    "other cells starts a second count.",

  examples: [
    {
      input: "4\n5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1\n",
      expected: "3",
      note:
        "The square of four land cells in the top left is one island, the lone cell in the " +
        "middle is another, and the pair at the bottom right is the third.",
    },
    {
      input: "3\n3\n1 0 1\n0 0 0\n1 0 1\n",
      expected: "4",
      note:
        "Four land cells, none of them joined to another. The two in the top row are separated " +
        "by water, and corners do not count as a join, so each cell is its own island.",
    },
  ],

  curated: [
    { label: "One water cell", input: "1\n1\n0\n" },
    { label: "One land cell", input: "1\n1\n1\n" },
    { label: "All land", input: "3\n4\n1 1 1 1\n1 1 1 1\n1 1 1 1\n" },
    { label: "All water", input: "3\n4\n0 0 0 0\n0 0 0 0\n0 0 0 0\n" },
    { label: "Single row, alternating", input: "1\n9\n1 0 1 0 1 0 1 0 1\n" },
    { label: "Single column, alternating", input: "9\n1\n1\n0\n1\n0\n1\n0\n1\n0\n1\n" },
    {
      label: "Touching only at corners",
      input: "4\n4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1\n",
    },
    {
      label: "A ring of land around water",
      input: "5\n5\n1 1 1 1 1\n1 0 0 0 1\n1 0 0 0 1\n1 0 0 0 1\n1 1 1 1 1\n",
    },
    {
      label: "Largest grid, checkerboard: every land cell is its own island",
      input: grid(200, 200, (i, j) => ((i + j) % 2 === 0 ? 1 : 0)),
    },
    {
      label: "Largest grid, all land: one island covering every cell",
      input: grid(200, 200, () => 1),
    },
    {
      /*
       * Full rows joined at alternating ends, so the island is a single strip
       * about twenty thousand cells long. A flood fill that recurses once per
       * cell nests that deep, which is the point of the case.
       */
      label: "Largest grid, one snaking island: the deepest possible fill",
      input: grid(200, 200, (i, j) =>
        i % 2 === 0 ? 1 : j === (i % 4 === 1 ? 199 : 0) ? 1 : 0
      ),
    },
    { label: "Largest grid, all water", input: grid(200, 200, () => 0) },
  ],

  generator: {
    seed: 20260923, cases: 10,
    fields: [
      { name: "r", type: "int", min: 1, max: 200, scales: true },
      { name: "c", type: "int", min: 1, max: 200, scales: true },
      { name: "g", type: "intMatrix", rows: "r", cols: "c", min: 0, max: 1 },
    ],
  },

  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int r, c;
    if (!(cin >> r >> c)) return 0;
    vector<vector<char>> g(r, vector<char>(c));
    for (int i = 0; i < r; i++)
        for (int j = 0; j < c; j++) { int v; cin >> v; g[i][j] = (char)v; }

    const int dr[4] = {1, -1, 0, 0};
    const int dc[4] = {0, 0, 1, -1};

    // An explicit stack, not recursion: one snaking island can cover every
    // cell of the grid, and forty thousand nested calls is not safe.
    vector<pair<int,int>> pending;
    long long islands = 0;

    for (int i = 0; i < r; i++) {
        for (int j = 0; j < c; j++) {
            if (g[i][j] != 1) continue;
            islands++;
            g[i][j] = 0;               // sunk on the way in, so never counted twice
            pending.push_back({i, j});
            while (!pending.empty()) {
                auto [x, y] = pending.back(); pending.pop_back();
                for (int d = 0; d < 4; d++) {
                    int nx = x + dr[d], ny = y + dc[d];
                    if (nx < 0 || ny < 0 || nx >= r || ny >= c) continue;
                    if (g[nx][ny] != 1) continue;
                    g[nx][ny] = 0;
                    pending.push_back({nx, ny});
                }
            }
        }
    }

    printf("%lld\\n", islands);
    return 0;
}`,
  },

  editorial: {
    understanding:
      "The grid is a graph in disguise. Every land cell is a vertex, and two land cells share an " +
      "edge when they sit next to each other up, down, left or right. An island is then just a " +
      "connected component of that graph, and the question is how many components there are.\n\n" +
      "Seeing it that way removes the temptation to invent grid-specific rules. Counting " +
      "components is a problem with one standard answer: visit everything once, and count how " +
      "many times you had to start a fresh visit.",
    approach:
      "Scan the grid in reading order. Most cells are water, or land you have already visited, " +
      "and both are skipped. When you reach a land cell you have not seen, you have found an " +
      "island nobody has counted, so add one to the total and then erase that entire island " +
      "before moving on.\n\n" +
      "Erasing is the whole trick. Once the island is gone, the scan will walk over the rest of " +
      "its cells and see water, so a single island can never be counted twice. It also means no " +
      "separate visited grid is needed — the grid itself records what has been seen.\n\n" +
      "How you erase the island does not matter. Breadth-first and depth-first both reach exactly " +
      "the cells of that island and no others, because that is what connected means.",
    steps: [
      "Read the grid.",
      "For each cell in reading order:",
      "    if it is water, or already erased, move on;",
      "    otherwise add one to the count;",
      "    then flood the island: start from this cell, and repeatedly take a cell, set it to water, and add any neighbour that is still land.",
      "Print the count.",
    ],
    algorithm: [
      "count = 0",
      "for each cell (i, j):",
      "    if grid[i][j] != 1: continue",
      "    count = count + 1",
      "    grid[i][j] = 0",
      "    push (i, j)",
      "    while the stack is not empty:",
      "        (x, y) = pop",
      "        for each of the four neighbours (nx, ny):",
      "            if inside the grid and grid[nx][ny] == 1:",
      "                grid[nx][ny] = 0        // erase on the way in",
      "                push (nx, ny)",
      "print count",
    ],
    whyItWorks:
      "Two claims together give the answer.\n\n" +
      "First, the flood starting at a cell reaches exactly its island. Every cell it visits was " +
      "reached by a chain of side-by-side land cells, so it is in the island; and every cell of " +
      "the island is reached, because if some cell were missed there would have to be a step " +
      "along that chain where a land neighbour was ignored, which the loop never does.\n\n" +
      "Second, the count is right. The scan adds one exactly when it meets a land cell that is " +
      "still land, and immediately erases that cell's whole island, so the next cell of the same " +
      "island reads as water. Each island therefore contributes exactly one, and every island is " +
      "reached, because the scan visits every cell and an island has at least one.\n\n" +
      "Note where the erasing happens: a cell is set to water when it is pushed, not when it is " +
      "popped. Erasing on the way out lets a cell be pushed several times by different " +
      "neighbours, which still gives the right count but can fill the stack with copies.",
    complexity: {
      time: "O(r * c)",
      space: "O(r * c) in the worst case",
      explanation:
        "The scan looks at every cell once. A cell is pushed at most once, because it stops " +
        "being land the moment it is pushed, and each popped cell inspects four neighbours. So " +
        "the total work is a constant amount per cell.\n\n" +
        "The space is the stack, which in the worst case — a single island covering the grid — " +
        "holds a large fraction of the cells. That is unavoidable for any traversal; the only " +
        "choice is whether those frames live on your stack or the machine's.",
    },
    edgeCases: [
      "A grid with no land at all, which prints 0.",
      "A one by one grid, both values.",
      "A grid that is a single row or a single column, where two of the four neighbours are always off the edge.",
      "Land cells touching only at a corner, which are separate islands. A solver that checks eight neighbours instead of four gets this wrong and nothing else, which makes it a quiet bug.",
      "Counting on the way out rather than on the way in, so an island whose cells are reached from several sides is pushed repeatedly.",
      "A single island covering the whole grid. Recursing once per cell nests forty thousand deep here, which a default stack may not survive — one of the tests is shaped exactly like that.",
    ],
    implementation: `if (g[i][j] != 1) continue;
islands++;
g[i][j] = 0;                    // erase when pushed, not when popped
pending.push_back({i, j});
while (!pending.empty()) {
    auto [x, y] = pending.back(); pending.pop_back();
    for (int d = 0; d < 4; d++) {
        int nx = x + dr[d], ny = y + dc[d];
        if (nx < 0 || ny < 0 || nx >= r || ny >= c) continue;
        if (g[nx][ny] != 1) continue;
        g[nx][ny] = 0;
        pending.push_back({nx, ny});
    }
}`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 200, sourceCategory: "Graphs" },
};
