import { Box, Arrow, Caption } from "./primitives.jsx";

/*
 * Database Management Systems diagrams.
 *
 * Drawn with the shared primitives so every diagram in the app is on one
 * 320-wide grid at one stroke weight. See primitives.jsx for the house style
 * and for why these are SVG rather than cropped images.
 */

const DIAGRAMS = {
  "three-schema": {
    title: "The three-schema architecture, and the two kinds of data independence it buys",
    height: 140,
    draw: () => (
      <>
        <Box x={60} y={10} w={200} h={26} label="External / View level" sub="what each user group sees" tone="brand" />
        <Box x={60} y={58} w={200} h={26} label="Conceptual / Logical level" sub="the whole database, as tables" tone="deep" />
        <Box x={60} y={106} w={200} h={26} label="Internal / Physical level" sub="files, pages, indexes on disk" tone="plain" />

        <Arrow d="M50 36 L 50 58" label="logical" lx={22} ly={44} />
        <Arrow d="M50 58 L 50 36" />
        <Caption x={22} y={54}>
          independence
        </Caption>

        <Arrow d="M270 84 L 270 106" label="physical" lx={296} ly={92} />
        <Arrow d="M270 106 L 270 84" />
        <Caption x={296} y={102}>
          independence
        </Caption>

        <Caption x={160} y={48}>
          change a view without touching the tables
        </Caption>
        <Caption x={160} y={96}>
          change the storage without touching the tables
        </Caption>
      </>
    ),
  },

  "er-notation": {
    title: "ER diagram notation: entities, attributes, relationships and their weak forms",
    height: 136,
    draw: () => (
      <>
        <Caption x={54} y={12} bold>
          Entity
        </Caption>
        <rect x="14" y="18" width="80" height="24" rx="3" className="fill-brand-100 stroke-brand-600" strokeWidth="1.2" />
        <text x="54" y="33" textAnchor="middle" className="fill-ink-900 text-[7.5px] font-bold">
          Student
        </text>
        <rect x="18" y="54" width="72" height="22" rx="3" className="fill-none stroke-brand-600" strokeWidth="1.1" />
        <rect x="14" y="50" width="80" height="30" rx="3" className="fill-none stroke-brand-600" strokeWidth="1.2" />
        <text x="54" y="69" textAnchor="middle" className="fill-ink-900 text-[7px] font-bold">
          Dependent
        </text>
        <Caption x={54} y={90}>
          double = weak
        </Caption>

        <Caption x={160} y={12} bold>
          Attribute
        </Caption>
        <ellipse cx="160" cy="30" rx="40" ry="12" className="fill-brand-50 stroke-brand-500" strokeWidth="1.2" />
        <text x="160" y="33" textAnchor="middle" className="fill-ink-900 text-[7px] font-bold" textDecoration="underline">
          rollNo
        </text>
        <ellipse cx="160" cy="64" rx="40" ry="12" className="fill-brand-50 stroke-brand-500" strokeWidth="1.2" strokeDasharray="3 2" />
        <text x="160" y="67" textAnchor="middle" className="fill-ink-900 text-[7px]">
          age
        </text>
        <Caption x={160} y={90}>
          underline = key · dashed = derived
        </Caption>

        <Caption x={266} y={12} bold>
          Relationship
        </Caption>
        <path d="M266 18 l36 14 l-36 14 l-36 -14 z" className="fill-brand-200 stroke-brand-600" strokeWidth="1.2" />
        <text x="266" y="35" textAnchor="middle" className="fill-ink-900 text-[7px] font-bold">
          enrols
        </text>
        <Caption x={266} y={62}>
          double diamond =
        </Caption>
        <Caption x={266} y={74}>
          identifying (for a weak entity)
        </Caption>

        <line x1="8" y1="104" x2="312" y2="104" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />
        <Caption x={160} y={120} bold>
          Cardinality: 1:1 |—| · 1:N |—&lt; · M:N &gt;—&lt;
        </Caption>
        <Caption x={160} y={132}>
          a double line on a connector means total participation
        </Caption>
      </>
    ),
  },

  "er-cardinality": {
    title: "One-to-one, one-to-many and many-to-many relationships",
    height: 126,
    draw: () => {
      const row = (y, left, right, label, leftN, rightN) => (
        <g key={label}>
          <Box x={6} y={y} w={84} h={22} label={left} rx={4} />
          <line x1="90" y1={y + 11} x2="230" y2={y + 11} className="stroke-brand-600" strokeWidth="1.2" />
          <text x="160" y={y + 7} textAnchor="middle" className="fill-ink-800 text-[7px] font-bold">
            {label}
          </text>
          <text x="100" y={y + 22} textAnchor="middle" className="fill-brand-700 text-[7px] font-bold">
            {leftN}
          </text>
          <text x="220" y={y + 22} textAnchor="middle" className="fill-brand-700 text-[7px] font-bold">
            {rightN}
          </text>
          <Box x={230} y={y} w={84} h={22} label={right} rx={4} />
        </g>
      );
      return (
        <>
          {row(12, "Student", "Library card", "1 : 1", "1", "1")}
          {row(52, "Department", "Students", "1 : N", "1", "N")}
          {row(92, "Students", "Courses", "M : N", "M", "N")}
          <Caption x={160} y={124}>
            an M:N relationship becomes its own table when mapped to the relational model
          </Caption>
        </>
      );
    },
  },

  generalization: {
    title: "Generalization collects shared attributes upward; specialization pushes differences down",
    height: 126,
    draw: () => (
      <>
        <Box x={110} y={16} w={100} h={30} label="PERSON" sub="name · address" tone="deep" />
        <Box x={14} y={84} w={126} h={30} label="STUDENT" sub="programme · rollNo" tone="brand" />
        <Box x={180} y={84} w={126} h={30} label="INSTRUCTOR" sub="department · salary" tone="brand" />

        <path d="M136 82 l8 -10 l8 10 z" className="fill-surface stroke-brand-600" strokeWidth="1.1" />
        <line x1="144" y1="72" x2="144" y2="50" className="stroke-brand-600" strokeWidth="1.2" />
        <path d="M228 82 l8 -10 l8 10 z" className="fill-surface stroke-brand-600" strokeWidth="1.1" />
        <line x1="236" y1="72" x2="182" y2="50" className="stroke-brand-600" strokeWidth="1.2" />

        <text x="160" y="64" textAnchor="middle" className="fill-ink-800 text-[7px] font-bold">
          ISA
        </text>
        <Arrow d="M14 76 L 14 50" label="generalize ↑" lx={44} ly={70} />
        <Arrow d="M306 50 L 306 76" label="specialize ↓" lx={276} ly={70} />
        <Caption x={160} y={124}>
          the same picture read in two directions
        </Caption>
      </>
    ),
  },

  "key-hierarchy": {
    title: "Super key contains candidate key contains primary key",
    height: 132,
    draw: () => (
      <>
        <rect x="26" y="10" width="268" height="112" rx="10" className="fill-brand-100 stroke-brand-400" strokeWidth="1.2" />
        <Caption x={160} y={24} bold>
          Super key — any unique column set
        </Caption>
        <Caption x={160} y={36}>
          {"{rollNo, mobileNo}"}
        </Caption>

        <rect x="54" y="44" width="212" height="70" rx="9" className="fill-brand-200 stroke-brand-500" strokeWidth="1.2" />
        <Caption x={160} y={58} bold>
          Candidate key — minimal super key
        </Caption>
        <Caption x={160} y={70}>
          {"{rollNo}  ·  {email}"}
        </Caption>

        <rect x="86" y="78" width="148" height="30" rx="7" className="fill-brand-300 stroke-brand-600" strokeWidth="1.2" />
        <text x="160" y="92" textAnchor="middle" className="fill-ink-900 text-[7.5px] font-bold">
          Primary key
        </text>
        <text x="160" y="103" textAnchor="middle" className="fill-ink-900 text-[6.5px]">
          the one chosen · never NULL
        </text>

        <Caption x={160} y={128}>
          the unchosen candidates are the alternate keys
        </Caption>
      </>
    ),
  },

  "normal-forms": {
    title: "The normal forms, each fixing the anomaly the previous one leaves behind",
    height: 146,
    draw: () => (
      <>
        {[
          ["UNF", "multi-valued cells", 8, "warn"],
          ["1NF", "atomic values only", 36, "brand"],
          ["2NF", "no partial dependency", 64, "brand"],
          ["3NF", "no transitive dependency", 92, "brand"],
          ["BCNF", "every determinant is a key", 120, "deep"],
        ].map(([label, rule, y, tone]) => (
          <g key={label}>
            <Box x={16} y={y} w={62} h={22} label={label} tone={tone} rx={4} />
            <Caption x={86} y={y + 14} anchor="start">
              {rule}
            </Caption>
          </g>
        ))}
        {[30, 58, 86, 114].map((y) => (
          <Arrow key={y} d={`M47 ${y} L 47 ${y + 6}`} />
        ))}
        <Caption x={286} y={72} anchor="middle">
          stricter
        </Caption>
        <Arrow d="M286 96 L 286 24" />
      </>
    ),
  },

  "transaction-states": {
    title: "The states a transaction moves through",
    height: 134,
    draw: () => (
      <>
        <Box x={8} y={52} w={68} h={26} label="Active" sub="running" tone="brand" />
        <Box x={110} y={52} w={84} h={26} label="Partially" sub="committed" tone="brand" />
        <Box x={232} y={52} w={80} h={26} label="Committed" sub="permanent" tone="deep" />
        <Box x={100} y={104} w={68} h={24} label="Failed" tone="warn" />
        <Box x={206} y={104} w={80} h={24} label="Aborted" sub="rolled back" />

        <Arrow d="M78 65 L 106 65" label="last statement" lx={92} ly={40} />
        <Arrow d="M196 65 L 228 65" label="commit" lx={212} ly={40} />
        <Arrow d="M40 80 C 60 98, 84 110, 98 114" label="error" lx={44} ly={110} />
        <Arrow d="M150 80 L 140 100" />
        <Arrow d="M170 116 L 202 116" label="undo" lx={186} ly={128} />
        <Caption x={160} y={20}>
          only Committed and Aborted are final
        </Caption>
      </>
    ),
  },

  "precedence-graph": {
    title: "Conflict serializability: a cycle in the precedence graph means the schedule is unsafe",
    height: 128,
    draw: () => (
      <>
        <Caption x={80} y={14} bold>
          No cycle — serializable
        </Caption>
        <circle cx="34" cy="60" r="16" className="fill-brand-200 stroke-brand-600" strokeWidth="1.2" />
        <text x="34" y="64" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          T1
        </text>
        <circle cx="126" cy="60" r="16" className="fill-brand-200 stroke-brand-600" strokeWidth="1.2" />
        <text x="126" y="64" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          T2
        </text>
        <Arrow d="M52 60 L 108 60" />
        <Caption x={80} y={96}>
          equivalent to running T1 then T2
        </Caption>

        <line x1="160" y1="8" x2="160" y2="120" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />

        <Caption x={242} y={14} bold>
          Cycle — not serializable
        </Caption>
        <circle cx="196" cy="60" r="16" className="fill-amber-100 stroke-amber-500" strokeWidth="1.2" />
        <text x="196" y="64" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          T1
        </text>
        <circle cx="288" cy="60" r="16" className="fill-amber-100 stroke-amber-500" strokeWidth="1.2" />
        <text x="288" y="64" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          T2
        </text>
        <Arrow d="M210 52 C 236 40, 250 40, 274 52" />
        <Arrow d="M274 70 C 250 82, 236 82, 210 70" />
        <Caption x={242} y={102}>
          no serial order can produce this
        </Caption>
      </>
    ),
  },

  "two-phase-locking": {
    title: "Two-phase locking: acquire everything before releasing anything",
    height: 132,
    draw: () => (
      <>
        <line x1="30" y1="100" x2="300" y2="100" className="stroke-brand-400" strokeWidth="1.2" />
        <line x1="30" y1="16" x2="30" y2="100" className="stroke-brand-400" strokeWidth="1.2" />
        <path d="M30 96 L 150 28 L 290 96" className="fill-none stroke-brand-600" strokeWidth="1.8" />
        <line x1="150" y1="28" x2="150" y2="100" className="stroke-brand-400" strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="150" cy="28" r="3" className="fill-brand-600" />

        <text x="14" y="58" textAnchor="middle" className="fill-ink-800 text-[7px] font-bold" transform="rotate(-90 14 58)">
          locks held
        </text>
        <Caption x={86} y={70} bold>
          Growing
        </Caption>
        <Caption x={86} y={82}>
          acquire only
        </Caption>
        <Caption x={224} y={70} bold>
          Shrinking
        </Caption>
        <Caption x={224} y={82}>
          release only
        </Caption>
        <Caption x={150} y={22}>
          lock point
        </Caption>
        <Caption x={160} y={116} bold>
          time →
        </Caption>
        <Caption x={160} y={128}>
          Strict 2PL additionally holds every exclusive lock until commit
        </Caption>
      </>
    ),
  },

  "lock-compatibility": {
    title: "Shared locks coexist; an exclusive lock excludes everything",
    height: 118,
    draw: () => (
      <>
        <Caption x={160} y={14} bold>
          Requested
        </Caption>
        <Box x={128} y={20} w={58} h={20} label="S" tone="brand" rx={4} />
        <Box x={196} y={20} w={58} h={20} label="X" tone="deep" rx={4} />
        <Caption x={60} y={56} bold>
          Held: S
        </Caption>
        <Caption x={60} y={84} bold>
          Held: X
        </Caption>

        <rect x="128" y="46" width="58" height="22" rx="4" className="fill-emerald-100 stroke-emerald-500" strokeWidth="1.1" />
        <text x="157" y="61" textAnchor="middle" className="fill-ink-900 text-[7.5px] font-bold">
          granted
        </text>
        {[
          [196, 46],
          [128, 74],
          [196, 74],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <rect x={x} y={y} width="58" height="22" rx="4" className="fill-rose-100 stroke-rose-400" strokeWidth="1.1" />
            <text x={x + 29} y={y + 15} textAnchor="middle" className="fill-ink-900 text-[7.5px] font-bold">
              wait
            </text>
          </g>
        ))}
        <Caption x={160} y={110}>
          many readers or one writer, never both
        </Caption>
      </>
    ),
  },

  "btree-vs-bplus": {
    title: "A B-tree stores data in every node; a B+ tree keeps it all in linked leaves",
    height: 136,
    draw: () => {
      const node = (x, y, w, label, key, tone) => (
        <g key={key}>
          <rect x={x} y={y} width={w} height="16" rx="2" className={tone} strokeWidth="1.1" />
          <text x={x + w / 2} y={y + 11} textAnchor="middle" className="fill-ink-900 text-[6.5px] font-bold">
            {label}
          </text>
        </g>
      );
      const deep = "fill-brand-300 stroke-brand-600";
      const leaf = "fill-brand-100 stroke-brand-500";
      return (
        <>
          <Caption x={78} y={12} bold>
            B-tree
          </Caption>
          {node(58, 18, 40, "40", "b1", deep)}
          {node(14, 50, 34, "20", "b2", deep)}
          {node(100, 50, 34, "60", "b3", deep)}
          {[
            [6, "10 15"],
            [44, "25 30"],
            [92, "50 55"],
            [130, "70 90"],
          ].map(([x, l], i) => node(x, 82, 34, l, `bl${i}`, leaf))}
          <line x1="70" y1="34" x2="31" y2="50" className="stroke-brand-500" strokeWidth="0.9" />
          <line x1="86" y1="34" x2="117" y2="50" className="stroke-brand-500" strokeWidth="0.9" />
          <line x1="23" y1="66" x2="23" y2="82" className="stroke-brand-500" strokeWidth="0.9" />
          <line x1="39" y1="66" x2="61" y2="82" className="stroke-brand-500" strokeWidth="0.9" />
          <line x1="109" y1="66" x2="109" y2="82" className="stroke-brand-500" strokeWidth="0.9" />
          <line x1="125" y1="66" x2="147" y2="82" className="stroke-brand-500" strokeWidth="0.9" />
          <Caption x={78} y={112}>
            data sits in internal nodes too
          </Caption>
          <Caption x={78} y={124}>
            leaves are not linked
          </Caption>

          <line x1="164" y1="8" x2="164" y2="130" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />

          <Caption x={244} y={12} bold>
            B+ tree
          </Caption>
          {node(222, 18, 44, "40 | 70", "p1", deep)}
          {node(178, 50, 34, "20", "p2", deep)}
          {node(266, 50, 34, "70", "p3", deep)}
          {[
            [170, "10 15"],
            [208, "20 30"],
            [246, "40 50"],
            [284, "70 80"],
          ].map(([x, l], i) => node(x, 82, 34, l, `pl${i}`, leaf))}
          <line x1="234" y1="34" x2="195" y2="50" className="stroke-brand-500" strokeWidth="0.9" />
          <line x1="254" y1="34" x2="283" y2="50" className="stroke-brand-500" strokeWidth="0.9" />
          <line x1="187" y1="66" x2="187" y2="82" className="stroke-brand-500" strokeWidth="0.9" />
          <line x1="203" y1="66" x2="225" y2="82" className="stroke-brand-500" strokeWidth="0.9" />
          <line x1="275" y1="66" x2="263" y2="82" className="stroke-brand-500" strokeWidth="0.9" />
          <line x1="291" y1="66" x2="301" y2="82" className="stroke-brand-500" strokeWidth="0.9" />
          {[204, 242, 280].map((x) => (
            <line key={x} x1={x} y1="90" x2={x + 4} y2="90" className="stroke-brand-700" strokeWidth="1.4" markerEnd="url(#corecs-arrow)" />
          ))}
          <Caption x={244} y={112}>
            all data in the leaves
          </Caption>
          <Caption x={244} y={124}>
            leaves linked — range scans are cheap
          </Caption>
        </>
      );
    },
  },

  "clustered-index": {
    title: "A clustered index orders the table itself; a non-clustered one points into it",
    height: 130,
    draw: () => (
      <>
        <Caption x={78} y={12} bold>
          Clustered — one per table
        </Caption>
        <Box x={14} y={18} w={128} h={20} label="Index: rollNo 1,2,3,4" tone="deep" rx={4} />
        {[1, 2, 3, 4].map((n, i) => (
          <Box key={n} x={14} y={46 + i * 18} w={128} h={16} label={`row ${n}`} tone="brand" rx={3} />
        ))}
        <Caption x={78} y={124}>
          rows physically stored in key order
        </Caption>

        <line x1="160" y1="8" x2="160" y2="124" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />

        <Caption x={244} y={12} bold>
          Non-clustered — many allowed
        </Caption>
        <Box x={180} y={18} w={60} h={20} label="Index" tone="deep" rx={4} />
        {["Amit", "Neha", "Pooja"].map((n, i) => (
          <Box key={n} x={180} y={46 + i * 18} w={60} h={16} label={n} rx={3} />
        ))}
        {[3, 1, 4].map((n, i) => (
          <Box key={i} x={258} y={46 + i * 18} w={54} h={16} label={`row ${n}`} tone="brand" rx={3} />
        ))}
        <Caption x={285} y={40}>
          table (unsorted)
        </Caption>
        {[0, 1, 2].map((i) => (
          <Arrow key={i} d={`M242 ${54 + i * 18} L 256 ${54 + i * 18}`} />
        ))}
        <Caption x={244} y={124}>
          table order is unrelated to the index
        </Caption>
      </>
    ),
  },

  sharding: {
    title: "Sharding splits one logical database across independent servers",
    height: 128,
    draw: () => (
      <>
        <Box x={106} y={10} w={108} h={26} label="Application" tone="deep" />
        <Box x={92} y={50} w={136} h={22} label="Shard key → which server" tone="warn" rx={4} />
        <Arrow d="M160 38 L 160 48" />

        {[
          ["Shard A", "Delhi", 6],
          ["Shard B", "Mumbai", 112],
          ["Shard C", "Chennai", 218],
        ].map(([label, sub, x]) => (
          <Box key={label} x={x} y={92} w={96} h={28} label={label} sub={sub} tone="brand" />
        ))}
        <Arrow d="M120 74 L 62 90" />
        <Arrow d="M160 74 L 160 90" />
        <Arrow d="M200 74 L 258 90" />
        <Caption x={160} y={86}>
          shared-nothing — each shard owns its data outright
        </Caption>
      </>
    ),
  },

  "wal-recovery": {
    title: "Write-ahead logging: the log record reaches disk before the data page does",
    height: 126,
    draw: () => (
      <>
        <Box x={6} y={16} w={80} h={28} label="Transaction" sub="UPDATE …" tone="brand" />
        <Box x={116} y={16} w={88} h={28} label="Log buffer" sub="old + new value" tone="deep" />
        <Box x={234} y={16} w={80} h={28} label="Log on disk" sub="durable" tone="warn" />
        <Box x={116} y={80} w={88} h={28} label="Data page" sub="written later" />

        <Arrow d="M88 30 L 113 30" />
        <Arrow d="M206 30 L 231 30" label="1 · flush first" lx={218} ly={58} />
        <Arrow d="M160 46 L 160 78" label="2 · then" lx={88} ly={66} />

        <Caption x={160} y={120}>
          a crash between the two is recoverable — redo from the log, or undo with it
        </Caption>
      </>
    ),
  },
};

export default DIAGRAMS;
