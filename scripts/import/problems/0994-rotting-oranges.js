/*
 * The same builder the other grid problems here use: a curated case worth
 * running at full size is described rather than typed out. It produces input
 * only — the expected answer still comes from running the reference solution.
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

// Full rows joined at alternating ends: one strip about twenty thousand cells
// long, so the rot has to travel the length of it.
const snake = (i, j) => (i % 2 === 0 ? true : j === (i % 4 === 1 ? 199 : 0));

module.exports = {
  problemId: "dsa-994",
  slug: "rotting-oranges",
  title: "Rotting Oranges",
  difficulty: "Medium",
  topics: ["graph", "grid", "breadth-first search", "shortest path"],
  timeLimitMs: 2000,

  statement:
    "You are given a grid of r rows and c columns. Each cell holds one of three values:\n\n" +
    "  0 — the cell is empty\n" +
    "  1 — the cell holds a fresh orange\n" +
    "  2 — the cell holds a rotten orange\n\n" +
    "Every minute, any fresh orange that sits directly up, down, left or right of a rotten " +
    "orange becomes rotten itself. Rot does not spread through a corner, and never spreads into " +
    "an empty cell.\n\n" +
    "Print the number of minutes that must pass before no fresh orange is left. If some fresh " +
    "orange can never rot, print -1 instead.",

  inputFormat:
    "Line 1: the integer r, the number of rows.\n" +
    "Line 2: the integer c, the number of columns.\n" +
    "Next r lines: c integers each, every one 0, 1 or 2.",
  outputFormat:
    "One line holding the number of minutes, or -1 if at least one fresh orange never rots.",
  constraints: ["1 <= r <= 200", "1 <= c <= 200", "each cell is 0, 1 or 2"],
  hint:
    "The rot moves outward one step per minute from every rotten orange at once. That is a " +
    "breadth-first search with several starting points, and the answer is the number of rounds " +
    "it takes — provided nothing fresh is left over at the end.",

  examples: [
    {
      input: "3\n3\n2 1 1\n1 1 0\n0 1 1\n",
      expected: "4",
      note:
        "The rot spreads outward from the top left corner. The last orange to go is the one in " +
        "the bottom right, four steps away along cells that hold oranges.",
    },
    {
      input: "3\n3\n2 1 1\n0 1 1\n1 0 1\n",
      expected: "-1",
      note:
        "The orange in the bottom left has empty cells above it and to its right, so the rot " +
        "can never reach it. One orange that never rots is enough to make the answer -1.",
    },
  ],

  curated: [
    { label: "One empty cell", input: "1\n1\n0\n" },
    { label: "One rotten orange and nothing else", input: "1\n1\n2\n" },
    { label: "One fresh orange and nothing to rot it", input: "1\n1\n1\n" },
    { label: "No fresh oranges at all, so no time passes", input: "2\n3\n2 0 2\n0 2 0\n" },
    { label: "Fresh oranges but no rotten one", input: "2\n3\n1 1 1\n1 1 1\n" },
    { label: "A single row, rot starting at one end", input: "1\n10\n2 1 1 1 1 1 1 1 1 1\n" },
    { label: "A single column, rot starting in the middle", input: "7\n1\n1\n1\n1\n2\n1\n1\n1\n" },
    { label: "Reachable only the long way round", input: "3\n5\n2 0 1 1 1\n1 0 1 0 1\n1 1 1 0 1\n" },
    {
      label: "Fresh oranges sealed off by empty cells",
      input: "5\n5\n2 2 2 2 2\n2 0 0 0 2\n2 0 1 0 2\n2 0 0 0 2\n2 2 2 2 2\n",
    },
    {
      label: "Largest grid, all fresh but one rotten corner",
      input: grid(200, 200, (i, j) => (i === 0 && j === 0 ? 2 : 1)),
    },
    {
      label: "Largest grid, rot starting in the middle",
      input: grid(200, 200, (i, j) => (i === 100 && j === 100 ? 2 : 1)),
    },
    { label: "Largest grid, everything already rotten", input: grid(200, 200, () => 2) },
    {
      label: "Largest grid, one snaking strip: the rot travels twenty thousand steps",
      input: grid(200, 200, (i, j) => (i === 0 && j === 0 ? 2 : snake(i, j) ? 1 : 0)),
    },
    {
      label: "Largest grid, one fresh orange walled in",
      input: grid(200, 200, (i, j) => {
        if (i === 100 && j === 100) return 1;
        if (Math.abs(i - 100) + Math.abs(j - 100) === 1) return 0;
        return 2;
      }),
    },
  ],

  generator: {
    seed: 20260924, cases: 10,
    fields: [
      { name: "r", type: "int", min: 1, max: 200, scales: true },
      { name: "c", type: "int", min: 1, max: 200, scales: true },
      { name: "g", type: "intMatrix", rows: "r", cols: "c", min: 0, max: 2 },
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
    vector<vector<int>> g(r, vector<int>(c));

    long long fresh = 0;
    vector<pair<int,int>> frontier;          // everything rotten right now
    for (int i = 0; i < r; i++)
        for (int j = 0; j < c; j++) {
            cin >> g[i][j];
            if (g[i][j] == 1) fresh++;
            else if (g[i][j] == 2) frontier.push_back({i, j});
        }

    const int dr[4] = {1, -1, 0, 0};
    const int dc[4] = {0, 0, 1, -1};

    long long minutes = 0;
    // One pass of this loop is one minute: every orange that is rotten now
    // infects its neighbours, and those become the frontier for the next pass.
    while (fresh > 0 && !frontier.empty()) {
        vector<pair<int,int>> next;
        for (auto [x, y] : frontier) {
            for (int d = 0; d < 4; d++) {
                int nx = x + dr[d], ny = y + dc[d];
                if (nx < 0 || ny < 0 || nx >= r || ny >= c) continue;
                if (g[nx][ny] != 1) continue;
                g[nx][ny] = 2;
                fresh--;
                next.push_back({nx, ny});
            }
        }
        if (next.empty()) break;             // nothing changed, so nothing ever will
        frontier.swap(next);
        minutes++;
    }

    printf("%lld\\n", fresh > 0 ? -1LL : minutes);
    return 0;
}`,
  },

  editorial: {
    understanding:
      "Every rotten orange spreads at the same speed, one cell per minute, and they all start at " +
      "once. So the minute at which a fresh orange turns is its distance to the nearest rotten " +
      "orange, counted in steps through cells that hold oranges.\n\n" +
      "The answer is the largest of those distances, and it is -1 when some fresh orange has no " +
      "finite distance at all — that is, when it cannot be reached.",
    approach:
      "This is a breadth-first search with many sources. Instead of starting from one cell, put " +
      "every rotten orange in the starting set. Breadth-first search then explores in rounds, and " +
      "round k contains exactly the cells at distance k from the nearest source, which is " +
      "precisely the set of oranges that rot in minute k.\n\n" +
      "So the number of completed rounds is the answer. Two details decide whether it is right:\n\n" +
      "Count a round only when it actually rotted something. If the frontier produces no new " +
      "rotten oranges, the spread has finished and that round must not be counted.\n\n" +
      "Keep a running total of fresh oranges. When the spread stops, that total tells you whether " +
      "the answer is a number or -1, and it is far cheaper than scanning the whole grid again.",
    steps: [
      "Read the grid. While reading, count the fresh oranges and collect the positions of the rotten ones.",
      "Set minutes to 0.",
      "While fresh oranges remain and the frontier is not empty:",
      "    build the next frontier: for every cell in the current one, look at its four neighbours and rot any that is fresh, decreasing the fresh count;",
      "    if nothing was rotted, stop — the remaining oranges are unreachable;",
      "    otherwise make that the frontier and add one to minutes.",
      "Print -1 if any fresh orange remains, and minutes otherwise.",
    ],
    algorithm: [
      "fresh = number of cells holding 1",
      "frontier = every cell holding 2",
      "minutes = 0",
      "while fresh > 0 and frontier is not empty:",
      "    next = empty",
      "    for (x, y) in frontier:",
      "        for each neighbour (nx, ny) inside the grid:",
      "            if grid[nx][ny] == 1:",
      "                grid[nx][ny] = 2",
      "                fresh = fresh - 1",
      "                add (nx, ny) to next",
      "    if next is empty: break",
      "    frontier = next",
      "    minutes = minutes + 1",
      "print -1 if fresh > 0 else minutes",
    ],
    whyItWorks:
      "Breadth-first search from a set of sources gives each reached cell its distance to the " +
      "nearest source. The proof is the usual one, by induction on the rounds: round 0 is the " +
      "sources, at distance 0; and a cell first reached in round k+1 has a neighbour in round k, " +
      "so it is at distance at most k+1, while it cannot be nearer or it would have been reached " +
      "earlier.\n\n" +
      "That matches the spreading rule exactly, because an orange rots in the minute after any " +
      "neighbour of it is rotten, which is the same as saying it rots at its distance.\n\n" +
      "The loop stops for one of two reasons. Either nothing fresh is left, and the last counted " +
      "round is the largest distance — the answer. Or a round rots nothing, which means no " +
      "rotten orange has a fresh neighbour; since the rot can only ever move to a neighbour, " +
      "nothing will change again, and the fresh oranges that remain are unreachable.",
    complexity: {
      time: "O(r * c)",
      space: "O(r * c)",
      explanation:
        "Each cell becomes rotten at most once, and it enters a frontier only in the round when " +
        "it does, so the total number of cells across all frontiers is at most the number of " +
        "cells. Each one inspects four neighbours. Reading the grid is the same order of work.\n\n" +
        "The space is the frontier, which in the worst case holds a large part of one row of the " +
        "spread.",
    },
    edgeCases: [
      "No fresh oranges at all, which is 0 minutes and not 1 — the loop must not count a round that rotted nothing.",
      "Fresh oranges with no rotten one anywhere, which is -1 even though nothing is blocked.",
      "A grid of empty cells only, which is 0 minutes.",
      "Fresh oranges fenced off by empty cells, the case that makes -1 more than a formality.",
      "Rot spreading through a corner, which it must not. Using eight neighbours instead of four gives answers that are too small.",
      "A long thin path of oranges, where the answer is far larger than either side of the grid. Counting rounds handles this; guessing from the grid size does not.",
    ],
    implementation: `while (fresh > 0 && !frontier.empty()) {
    vector<pair<int,int>> next;
    for (auto [x, y] : frontier)
        for (int d = 0; d < 4; d++) {
            int nx = x + dr[d], ny = y + dc[d];
            if (nx < 0 || ny < 0 || nx >= r || ny >= c) continue;
            if (g[nx][ny] != 1) continue;
            g[nx][ny] = 2; fresh--; next.push_back({nx, ny});
        }
    if (next.empty()) break;      // rotted nothing, so do not count this minute
    frontier.swap(next);
    minutes++;
}
printf("%lld\\n", fresh > 0 ? -1LL : minutes);`,
  },

  metadata: { importBatch: "dsa-75", sourceNumber: 994, sourceCategory: "Graphs" },
};
