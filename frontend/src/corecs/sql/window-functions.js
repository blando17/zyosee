/*
 * Window Functions.
 *
 * Source: "Complete SQL.pdf" Q36-37, Q58, Q63-64, Q77.
 */

export default {
  id: "window-functions",
  name: "Window Functions",
  importance: "high",
  icon: "trendUp",
  blurb:
    "Aggregating without collapsing rows — the tool that turns most hard interview queries into easy ones.",
  source: "Complete SQL Q36-37, 58, 63-64",

  questions: [
    {
      id: "sql-win-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is a window function?",
      short:
        "A calculation across a set of related rows that keeps every row, instead of collapsing them like GROUP BY.",
      answer: [
        { diagram: "window-vs-group" },
        {
          code: `SELECT name,
       dept,
       salary,
       AVG(salary) OVER (PARTITION BY dept) AS dept_avg,
       RANK()      OVER (PARTITION BY dept ORDER BY salary DESC) AS rank_in_dept
FROM   employees;`,
          lang: "sql",
        },
        {
          table: {
            head: ["Part", "Means"],
            rows: [
              ["`OVER (…)`", "Makes it a window function — the clause that defines the window"],
              ["`PARTITION BY dept`", "Reset the calculation for each department"],
              ["`ORDER BY salary DESC`", "Order rows **within** the window — required for ranking"],
              ["Empty `OVER ()`", "The window is the whole result set"],
            ],
          },
        },
        {
          note: "**The difference from `GROUP BY` in one line: `GROUP BY` gives you one row per group, a window function gives you every row plus the group's number alongside it.** That is why you can compare a row to its own group's average in a single pass.",
        },
      ],
      tip: "If a question asks for 'each row, plus something about its group', it is a window function. That pattern covers most of them.",
      tags: ["window function", "over", "partition by"],
    },
    {
      id: "sql-win-02",
      subtopic: "Ranking",
      type: "comparison",
      importance: "high",
      question: "What is the difference between ROW_NUMBER, RANK and DENSE_RANK?",
      short:
        "ROW_NUMBER never ties; RANK ties and skips; DENSE_RANK ties and does not skip.",
      answer: [
        {
          table: {
            head: ["Salary", "ROW_NUMBER", "RANK", "DENSE_RANK"],
            rows: [
              ["5000", "1", "1", "1"],
              ["4000", "2", "**2**", "**2**"],
              ["4000", "3", "**2**", "**2**"],
              ["3000", "4", "**4**", "**3**"],
            ],
          },
        },
        {
          ul: [
            "**`ROW_NUMBER()`** — 1, 2, 3, 4. Always distinct, ties broken arbitrarily.",
            "**`RANK()`** — 1, 2, 2, 4. Ties share a rank, and the next value **skips** the gap.",
            "**`DENSE_RANK()`** — 1, 2, 2, 3. Ties share a rank, and there is **no gap**.",
          ],
        },
        {
          code: `SELECT name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn,
       RANK()       OVER (ORDER BY salary DESC) AS rnk,
       DENSE_RANK() OVER (ORDER BY salary DESC) AS dense
FROM   employees;`,
          lang: "sql",
        },
        {
          note: "**Which one to use for 'Nth highest salary' depends on what the question means.** If two people share second place, is the next one third or fourth? `DENSE_RANK` says third — the third *distinct* salary, which is almost always what is meant. `RANK` says fourth.",
        },
      ],
      tip: "Draw the four-row table. It answers the question faster and more convincingly than three sentences.",
      tags: ["row_number", "rank", "dense_rank", "ties"],
    },
    {
      id: "sql-win-03",
      subtopic: "Other functions",
      type: "conceptual",
      importance: "med",
      question: "What other window functions are worth knowing?",
      short:
        "LAG and LEAD for neighbouring rows, running totals with a frame, and NTILE for buckets.",
      answer: [
        {
          table: {
            head: ["Function", "Gives"],
            rows: [
              ["`LAG(col, n)`", "The value n rows **before** — for month-on-month change"],
              ["`LEAD(col, n)`", "The value n rows **after**"],
              ["`FIRST_VALUE` / `LAST_VALUE`", "The first or last value in the window"],
              ["`NTILE(n)`", "Splits rows into n buckets — quartiles, deciles"],
              ["`SUM() OVER (ORDER BY …)`", "A **running total**"],
            ],
          },
        },
        {
          code: `-- Month-on-month change, and a running total
SELECT month,
       revenue,
       revenue - LAG(revenue) OVER (ORDER BY month)      AS change,
       SUM(revenue)           OVER (ORDER BY month)      AS running_total
FROM   monthly_sales;`,
          lang: "sql",
        },
        {
          note: "Adding `ORDER BY` inside `OVER ()` to an aggregate is what turns it into a **running** calculation. `SUM(x) OVER ()` is the grand total on every row; `SUM(x) OVER (ORDER BY d)` is the total so far.",
        },
      ],
      tags: ["lag", "lead", "running total", "ntile"],
    },
    {
      id: "sql-win-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "With salaries 5000, 4000, 4000, 3000, `DENSE_RANK()` gives the last row:",
      options: ["2", "3", "4", "1"],
      correct: 1,
      answer: [
        { p: "3 — `DENSE_RANK` leaves no gap after a tie. `RANK` would give 4." },
      ],
      tags: ["mcq", "dense_rank"],
    },
    {
      id: "sql-win-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Unlike GROUP BY, a window function:",
      options: [
        "Collapses rows into groups",
        "Keeps every row and adds the calculation alongside",
        "Cannot use aggregates",
        "Runs before WHERE",
      ],
      correct: 1,
      answer: [
        { p: "Keeps every row. That is the entire distinction, and why it can compare a row to its own group." },
      ],
      tags: ["mcq", "window function"],
    },
  ],
};
