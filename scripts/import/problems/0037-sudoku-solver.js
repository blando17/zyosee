module.exports = {
  problemId: "dsa-37",
  slug: "sudoku-solver",
  title: "Sudoku Solver",
  difficulty: "Hard",
  topics: ["backtracking", "matrix"],
  timeLimitMs: 5000,
  statement:
    "You are given a partly filled 9 by 9 sudoku grid. A dot marks an empty square.\n\n" +
    "Fill every empty square so that each row, each column and each of the nine 3 by 3 boxes " +
    "contains the digits 1 to 9 exactly once, and print the completed grid.\n\n" +
    "Every grid given has exactly one solution.",
  inputFormat: "Nine lines of nine characters each: a digit 1 to 9, or a dot for an empty square.",
  outputFormat: "Nine lines of nine digits: the completed grid.",
  constraints: ["The grid is 9 by 9", "Squares hold a digit 1 to 9 or a dot", "The puzzle has exactly one solution"],
  hint: "Fill the first empty square with each digit that fits, and recurse; undo if the branch fails.",
  examples: [
    {
      input: "53..7....\n6..195...\n.98....6.\n8...6...3\n4..8.3..1\n7...2...6\n.6....28.\n...419..5\n....8..79\n",
      expected:
        "534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179",
      note: "The classic worked example.",
    },
    {
      input: "534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n34528617.\n",
      expected:
        "534678912\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179",
      note: "A single empty square, whose value is forced.",
    },
  ],
  curated: [
    { label: "Boundary condition", input: "123456789\n456789123\n789123456\n214365897\n365897214\n897214365\n531642978\n642978531\n97853164.\n" },
    { label: "Normal case", input: "53467891.\n672195348\n198342567\n859761423\n426853791\n713924856\n961537284\n287419635\n345286179\n" },
    // 17 givens is the proven minimum for a uniquely solvable sudoku, and the
    // hardest shape for a plain backtracking search.
    { label: "Largest practical input", input: ".........\n.....3.85\n..1.2....\n...5.7...\n..4...1..\n.9.......\n5......73\n..2.1....\n....4...9\n" },
    { label: "Special case", input: "8........\n..36.....\n.7..9.2..\n.5...7...\n....457..\n...1...3.\n..1....68\n..85...1.\n.9....4..\n" },
  ],
  /*
   * No generator, deliberately.
   *
   * Every other problem here can have its inputs generated from ranges, because
   * any values within the constraints form a valid case. A sudoku cannot: a
   * random grid is almost never a valid puzzle, let alone one with exactly one
   * solution. Producing one requires solving a sudoku and removing clues while
   * checking uniqueness, which is a solver in its own right and far outside
   * what a range-based generator can express.
   *
   * So the cases here are real puzzles, each checked to be valid and uniquely
   * solvable before being written down.
   */
  generator: null,
  reference: {
    language: "cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    // Exactly what the input format promises: nine lines of nine characters.
    // An earlier version also accepted the grid as one 81-character line, and
    // the two branches were in the wrong order — a long line matched the
    // nine-character case first, so only its first nine characters were read
    // and the rest of the grid came out blank. Supporting one format removes
    // the possibility entirely.
    vector<string> g;
    string line;
    while ((int)g.size() < 9 && getline(cin, line)) {
        if (line.size() >= 9) g.push_back(line.substr(0, 9));
    }
    if ((int)g.size() < 9) return 0;

    auto fits = [&](int r, int c, char ch) {
        for (int i = 0; i < 9; i++) {
            if (g[r][i] == ch) return false;
            if (g[i][c] == ch) return false;
            if (g[r / 3 * 3 + i / 3][c / 3 * 3 + i % 3] == ch) return false;
        }
        return true;
    };

    function<bool()> solve = [&]() -> bool {
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                if (g[r][c] != '.') continue;
                for (char ch = '1'; ch <= '9'; ch++) {
                    if (!fits(r, c, ch)) continue;
                    g[r][c] = ch;
                    if (solve()) return true;
                    g[r][c] = '.';    // undo
                }
                return false;         // no digit works here: this branch is dead
            }
        }
        return true;                  // no empty square left
    };
    solve();

    string out;
    for (int r = 0; r < 9; r++) { out += g[r]; out += '\\n'; }
    fwrite(out.data(), 1, out.size(), stdout);
    return 0;
}`,
  },
  editorial: {
    understanding:
      "Every empty square must take a digit that does not already appear in its row, its column " +
      "or its 3 by 3 box. The three constraints interact, so filling squares greedily in some " +
      "fixed order does not work — a choice that looks fine now can make a later square " +
      "impossible.",
    approach:
      "Backtracking. Find the first empty square, try each digit that currently fits, and " +
      "recurse. If the recursion fails, undo the digit and try the next. If no digit fits, this " +
      "branch is hopeless and the failure propagates back up.\n\n" +
      "The search space is astronomically large on paper, but the constraints prune it brutally: " +
      "most branches die within a few squares.",
    steps: [
      "Scan for the first empty square. If there is none, the grid is complete.",
      "For each digit from 1 to 9, check whether it already appears in that row, column or box.",
      "If it fits, write it in and recurse.",
      "If the recursion succeeds, the grid is solved — stop.",
      "Otherwise erase the digit and try the next.",
      "If no digit fits, report failure so the caller undoes its own choice.",
    ],
    algorithm: [
      "solve():",
      "    find the first empty square; if none, return true",
      "    for ch from '1' to '9':",
      "        if ch fits: place it; if solve(): return true; erase it",
      "    return false",
    ],
    whyItWorks:
      "The search is exhaustive over legal partial grids: every digit that could go in a square " +
      "is tried, and a branch is only abandoned when it provably cannot be completed. So if a " +
      "solution exists it is found.\n\n" +
      "Returning false after the digit loop — rather than continuing to the next square — is the " +
      "part that makes it correct rather than merely slow. An empty square with no legal digit " +
      "means the grid ALREADY cannot be completed, so there is nothing to gain by looking " +
      "further; the caller must change an earlier choice.\n\n" +
      "Erasing the digit before trying the next is the backtracking step. Without it the grid " +
      "would keep values from failed attempts and the constraint checks would be answering " +
      "questions about a state that no longer exists.\n\n" +
      "The box index is worth reading carefully: r / 3 * 3 and c / 3 * 3 give the box's top-left " +
      "corner, and i / 3 and i % 3 walk its nine squares. Writing it wrong tends to check a " +
      "band of the grid rather than a box, which passes easy puzzles and fails hard ones.",
    complexity: {
      time: "exponential in the number of empty squares, but fast in practice",
      space: "O(81) for the grid plus recursion depth",
      explanation:
        "No useful polynomial bound exists — sudoku on an n by n board is NP-complete. Pruning " +
        "is what makes the 9 by 9 case trivial for a computer.",
    },
    edgeCases: [
      "A grid with a single empty square, where the answer is forced.",
      "A grid with 17 givens, the proven minimum for a unique solution and the hardest for a plain search.",
      "An already-complete grid, where the search returns immediately.",
      "Continuing past a square with no legal digit, which explores a dead branch forever.",
      "Forgetting to erase on failure, which corrupts every later constraint check.",
    ],
    implementation: `for (char ch = '1'; ch <= '9'; ch++) {
    if (!fits(r, c, ch)) continue;
    g[r][c] = ch;
    if (solve()) return true;
    g[r][c] = '.';          // undo
}
return false;               // no digit fits: this branch is dead`,
  },
  metadata: { importBatch: "dsa-75", sourceNumber: 37, sourceCategory: "Recursion and Backtracking" },
};
