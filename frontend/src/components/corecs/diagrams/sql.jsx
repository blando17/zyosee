import { Box, Arrow, Caption } from "./primitives.jsx";

/*
 * SQL diagrams.
 *
 * Drawn with the shared primitives so every diagram in the app is on one
 * 320-wide grid at one stroke weight. See primitives.jsx for the house style.
 */

/* Two overlapping circles with a chosen region filled — the join pictures. */
function Venn({ x, y, fill, label }) {
  const on = "fill-brand-400";
  const off = "fill-surface";
  const r = 22;
  const lc = x - 11;
  const rc = x + 11;
  return (
    <g>
      <defs>
        <clipPath id={`clip-l-${label}`}>
          <circle cx={lc} cy={y} r={r} />
        </clipPath>
        <clipPath id={`clip-r-${label}`}>
          <circle cx={rc} cy={y} r={r} />
        </clipPath>
      </defs>

      {/* base */}
      <circle cx={lc} cy={y} r={r} className={fill.left ? on : off} opacity={fill.left ? 0.85 : 1} />
      <circle cx={rc} cy={y} r={r} className={fill.right ? on : off} opacity={fill.right ? 0.85 : 1} />
      {/* overlap, drawn last so it wins */}
      <g clipPath={`url(#clip-l-${label})`}>
        <circle cx={rc} cy={y} r={r} className={fill.both ? on : off} opacity={fill.both ? 0.85 : 1} />
      </g>

      <circle cx={lc} cy={y} r={r} className="fill-none stroke-brand-600" strokeWidth="1.2" />
      <circle cx={rc} cy={y} r={r} className="fill-none stroke-brand-600" strokeWidth="1.2" />
      <text x={lc - 10} y={y + 3} textAnchor="middle" className="fill-ink-900 text-[7px] font-bold">
        A
      </text>
      <text x={rc + 10} y={y + 3} textAnchor="middle" className="fill-ink-900 text-[7px] font-bold">
        B
      </text>
      <text x={x} y={y + 36} textAnchor="middle" className="fill-ink-800 text-[7px] font-bold">
        {label}
      </text>
    </g>
  );
}

const DIAGRAMS = {
  "join-types": {
    title: "Which rows each join keeps",
    height: 136,
    draw: () => (
      <>
        <Venn x={54} y={30} label="INNER" fill={{ both: true }} />
        <Venn x={160} y={30} label="LEFT" fill={{ left: true, both: true }} />
        <Venn x={266} y={30} label="RIGHT" fill={{ right: true, both: true }} />
        <Venn x={106} y={94} label="FULL OUTER" fill={{ left: true, right: true, both: true }} />
        <Venn x={214} y={94} label="CROSS — every pair" fill={{ left: true, right: true, both: true }} />
        <Caption x={160} y={132}>
          an outer join fills the missing side with NULL
        </Caption>
      </>
    ),
  },

  "query-order": {
    title: "The order a query actually runs in, which is not the order you write it",
    height: 142,
    draw: () => (
      <>
        <Caption x={72} y={12} bold>
          Written
        </Caption>
        <Caption x={240} y={12} bold>
          Executed
        </Caption>
        {[
          ["SELECT", "5"],
          ["FROM", "1"],
          ["WHERE", "2"],
          ["GROUP BY", "3"],
          ["HAVING", "4"],
          ["ORDER BY", "6"],
          ["LIMIT", "7"],
        ].map(([kw], i) => (
          <Box key={kw} x={16} y={18 + i * 17} w={112} h={14} label={kw} rx={3} />
        ))}
        {[
          ["FROM / JOIN", "brand"],
          ["WHERE", "brand"],
          ["GROUP BY", "brand"],
          ["HAVING", "brand"],
          ["SELECT", "deep"],
          ["ORDER BY", "brand"],
          ["LIMIT", "brand"],
        ].map(([kw, tone], i) => (
          <Box key={kw} x={186} y={18 + i * 17} w={118} h={14} label={kw} tone={tone} rx={3} />
        ))}
        <Arrow d="M134 60 L 180 60" />
        <Caption x={160} y={136}>
          SELECT runs fifth — which is why a column alias cannot be used in WHERE
        </Caption>
      </>
    ),
  },

  "where-vs-having": {
    title: "WHERE filters rows before grouping; HAVING filters groups after",
    height: 116,
    draw: () => (
      <>
        <Box x={4} y={40} w={58} h={26} label="All rows" />
        <Box x={80} y={40} w={62} h={26} label="WHERE" sub="row filter" tone="brand" />
        <Box x={160} y={40} w={62} h={26} label="GROUP BY" sub="build groups" tone="deep" />
        <Box x={240} y={40} w={62} h={26} label="HAVING" sub="group filter" tone="brand" />
        <Arrow d="M64 53 L 76 53" />
        <Arrow d="M144 53 L 156 53" />
        <Arrow d="M224 53 L 236 53" />
        <Caption x={110} y={82}>
          cannot see aggregates
        </Caption>
        <Caption x={270} y={82}>
          can — it is what it filters on
        </Caption>
        <Caption x={160} y={106}>
          WHERE COUNT(*) &gt; 5 is an error; HAVING COUNT(*) &gt; 5 is the point
        </Caption>
      </>
    ),
  },

  "window-vs-group": {
    title: "GROUP BY collapses rows; a window function keeps them",
    height: 132,
    draw: () => (
      <>
        <Caption x={78} y={12} bold>
          GROUP BY
        </Caption>
        {["CSE 80", "CSE 90", "ECE 70"].map((r, i) => (
          <Box key={r} x={10} y={20 + i * 18} w={62} h={15} label={r} rx={3} />
        ))}
        <Arrow d="M78 46 L 96 46" />
        {["CSE 85", "ECE 70"].map((r, i) => (
          <Box key={r} x={102} y={29 + i * 18} w={54} h={15} label={r} tone="deep" rx={3} />
        ))}
        <Caption x={80} y={98}>
          3 rows in, 2 rows out
        </Caption>
        <Caption x={80} y={110}>
          the detail is gone
        </Caption>

        <line x1="166" y1="8" x2="166" y2="124" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />

        <Caption x={244} y={12} bold>
          Window function
        </Caption>
        {["CSE 80", "CSE 90", "ECE 70"].map((r, i) => (
          <Box key={r} x={176} y={20 + i * 18} w={62} h={15} label={r} rx={3} />
        ))}
        <Arrow d="M244 46 L 258 46" />
        {["CSE 80 · 85", "CSE 90 · 85", "ECE 70 · 70"].map((r, i) => (
          <Box key={r} x={252} y={20 + i * 18} w={64} h={15} label={r} tone="deep" rx={3} />
        ))}
        <Caption x={244} y={98}>
          3 rows in, 3 rows out
        </Caption>
        <Caption x={244} y={110}>
          the average rides alongside
        </Caption>
      </>
    ),
  },

  "sql-families": {
    title: "The four families of SQL command",
    height: 128,
    draw: () => (
      <>
        {[
          ["DDL", "Data Definition", "CREATE · ALTER · DROP · TRUNCATE", 8, "deep"],
          ["DML", "Data Manipulation", "SELECT · INSERT · UPDATE · DELETE", 38, "brand"],
          ["DCL", "Data Control", "GRANT · REVOKE", 68, "brand"],
          ["TCL", "Transaction Control", "COMMIT · ROLLBACK · SAVEPOINT", 98, "brand"],
        ].map(([abbr, name, cmds, y, tone]) => (
          <g key={abbr}>
            <Box x={8} y={y} w={52} h={22} label={abbr} tone={tone} rx={4} />
            <Caption x={68} y={y + 9} anchor="start" bold>
              {name}
            </Caption>
            <Caption x={68} y={y + 19} anchor="start">
              {cmds}
            </Caption>
          </g>
        ))}
        <Caption x={160} y={126}>
          only DML changes rows — DDL changes the shape, and auto-commits
        </Caption>
      </>
    ),
  },
};

export default DIAGRAMS;
