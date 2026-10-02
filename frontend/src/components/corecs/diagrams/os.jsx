import { Box, Oval, Arrow, Caption } from "./primitives.jsx";

/*
 * Operating Systems diagrams.
 *
 * Drawn with the shared primitives so every diagram in the app is on one
 * 320-wide grid at one stroke weight. See primitives.jsx for the house
 * style and for why these are SVG rather than cropped images.
 */

const DIAGRAMS = {
  "process-states": {
    title: "The five-state process model, with the transitions between states",
    height: 150,
    draw: () => (
      <>
        <Oval cx={40} cy={30} rx={26} ry={13} label="New" tone="plain" />
        <Oval cx={130} cy={70} rx={28} ry={14} label="Ready" />
        <Oval cx={230} cy={70} rx={30} ry={14} label="Running" tone="deep" />
        <Oval cx={290} cy={30} rx={28} ry={13} label="Terminated" tone="plain" />
        <Oval cx={180} cy={125} rx={28} ry={13} label="Waiting" tone="plain" />

        <Arrow d="M64 35 C 85 45, 95 55, 103 64" label="admit" lx={78} ly={40} />
        <Arrow d="M158 65 L 199 65" label="dispatch" lx={178} ly={59} />
        <Arrow d="M199 78 C 185 88, 160 86, 158 76" label="preempt" lx={178} ly={95} />
        <Arrow d="M256 60 C 268 50, 272 44, 276 38" label="exit" lx={276} ly={57} />
        <Arrow d="M238 84 C 228 105, 215 118, 206 122" label="I/O wait" lx={244} ly={110} />
        <Arrow d="M155 118 C 140 108, 132 95, 130 85" label="event done" lx={118} ly={112} />
      </>
    ),
  },

  pcb: {
    title: "What a Process Control Block stores",
    height: 150,
    draw: () => (
      <>
        <rect x="70" y="6" width="180" height="138" rx="8" className="fill-brand-50 stroke-brand-400" strokeWidth="1.3" />
        <Caption x={160} y={18} bold>
          Process Control Block
        </Caption>
        {[
          ["Process ID (PID)", "unique number"],
          ["Process state", "ready / running / waiting"],
          ["Program counter", "next instruction"],
          ["CPU registers", "saved on a context switch"],
          ["Scheduling info", "priority, queue pointers"],
          ["Memory info", "base, limit, page tables"],
          ["Accounting", "CPU time used, limits"],
          ["I/O status", "open files, devices"],
        ].map(([label, sub], i) => (
          <g key={label}>
            <rect
              x="78"
              y={24 + i * 15}
              width="164"
              height="13"
              rx="3"
              className={i % 2 ? "fill-surface stroke-brand-200" : "fill-brand-100 stroke-brand-300"}
              strokeWidth="0.8"
            />
            <text x="83" y={33 + i * 15} className="fill-ink-900 text-[6.5px] font-bold">
              {label}
            </text>
            <text x="238" y={33 + i * 15} textAnchor="end" className="fill-ink-500 text-[6px]">
              {sub}
            </text>
          </g>
        ))}
      </>
    ),
  },

  "context-switch": {
    title: "A context switch: P1's state is saved to its PCB, P2's is restored from its own",
    height: 140,
    draw: () => (
      <>
        <Box x={6} y={20} w={74} h={26} label="Process P1" sub="running" tone="deep" />
        <Box x={240} y={20} w={74} h={26} label="Process P2" sub="idle" />
        <Box x={6} y={96} w={74} h={26} label="Process P1" sub="idle" />
        <Box x={240} y={96} w={74} h={26} label="Process P2" sub="running" tone="deep" />

        <rect x="104" y="14" width="112" height="112" rx="8" className="fill-brand-50 stroke-brand-400" strokeDasharray="4 2" strokeWidth="1.2" />
        <Caption x={160} y={28} bold>
          Kernel
        </Caption>
        <Box x={114} y={36} w={92} h={22} label="Save P1 state" sub="into PCB1" tone="brand" />
        <Box x={114} y={66} w={92} h={22} label="Load P2 state" sub="from PCB2" tone="brand" />
        <Caption x={160} y={104}>
          no user work happens here
        </Caption>
        <Caption x={160} y={114}>
          — this interval is pure overhead
        </Caption>

        <Arrow d="M82 36 L 110 44" />
        <Arrow d="M210 77 L 238 100" />
      </>
    ),
  },

  "sched-queues": {
    title: "Job queue, ready queue and waiting queue, and the three schedulers that move processes between them",
    height: 140,
    draw: () => (
      <>
        <Box x={4} y={46} w={62} h={28} label="Job queue" sub="on disk" />
        <Box x={110} y={46} w={68} h={28} label="Ready queue" sub="in memory" tone="brand" />
        <Box x={232} y={46} w={62} h={28} label="CPU" sub="running" tone="deep" />
        <Box x={110} y={104} w={68} h={26} label="Waiting queue" sub="blocked on I/O" />
        <Box x={110} y={6} w={68} h={24} label="Swapped out" sub="on disk" />

        <Arrow d="M68 60 L 106 60" label="long-term" lx={87} ly={54} />
        <Arrow d="M180 56 L 228 56" label="short-term" lx={204} ly={50} />
        <Arrow d="M228 68 C 205 78, 190 74, 180 68" />
        <Arrow d="M240 74 C 232 96, 205 110, 182 114" label="I/O request" lx={255} ly={98} />
        <Arrow d="M124 102 L 132 78" label="I/O done" lx={98} ly={92} />
        <Arrow d="M150 44 L 150 32" label="medium-term" lx={200} ly={38} />
        <Arrow d="M138 32 L 138 44" />
      </>
    ),
  },

  "sched-mlfq": {
    title: "Multilevel feedback queue: using a whole quantum demotes a process, aging promotes it",
    height: 140,
    draw: () => (
      <>
        <Caption x={26} y={14} bold>
          High
        </Caption>
        <Caption x={26} y={124} bold>
          Low
        </Caption>
        {[
          ["Queue 0 — RR, q = 4", 22],
          ["Queue 1 — RR, q = 8", 56],
          ["Queue 2 — RR, q = 16", 90],
        ].map(([label, y], i) => (
          <Box key={label} x={56} y={y} w={150} h={24} label={label} tone={i === 0 ? "deep" : "brand"} />
        ))}
        <Box x={56} y={112} w={150} h={22} label="Queue 3 — FCFS" />

        <Arrow d="M214 34 C 244 40, 244 52, 214 62" label="used whole" lx={272} ly={44} />
        <Arrow d="M214 68 C 244 74, 244 86, 214 96" label="quantum →" lx={272} ly={56} />
        <Arrow d="M214 102 C 240 108, 240 116, 214 120" label="demoted" lx={272} ly={68} />
        <Arrow d="M50 118 C 20 96, 20 50, 50 32" label="aging" lx={16} ly={76} dashed />
      </>
    ),
  },

  "user-kernel": {
    title: "User mode and kernel mode, and the system call that crosses between them",
    height: 130,
    draw: () => (
      <>
        <rect x="8" y="6" width="304" height="48" rx="8" className="fill-brand-50 stroke-brand-300" strokeWidth="1.2" />
        <Caption x={160} y={18} bold>
          User mode — limited privilege
        </Caption>
        <Box x={22} y={24} w={80} h={24} label="Application" />
        <Box x={120} y={24} w={80} h={24} label="Shell" />
        <Box x={218} y={24} w={80} h={24} label="Compiler" />

        <line x1="8" y1="66" x2="312" y2="66" className="stroke-brand-500" strokeWidth="1.4" strokeDasharray="5 3" />
        <Caption x={160} y={62} bold>
          protection boundary
        </Caption>

        <rect x="8" y="74" width="304" height="50" rx="8" className="fill-brand-100 stroke-brand-400" strokeWidth="1.2" />
        <Caption x={160} y={86} bold>
          Kernel mode — full hardware access
        </Caption>
        <Box x={22} y={92} w={80} h={24} label="Scheduler" tone="deep" />
        <Box x={120} y={92} w={80} h={24} label="Memory mgr" tone="deep" />
        <Box x={218} y={92} w={80} h={24} label="Drivers" tone="deep" />

        <Arrow d="M148 50 L 148 88" label="trap" lx={128} ly={72} />
        <Arrow d="M172 88 L 172 50" label="return" lx={196} ly={72} />
      </>
    ),
  },

  "syscall-flow": {
    title: "What happens when a program makes a system call",
    height: 118,
    draw: () => (
      <>
        <Box x={4} y={14} w={70} h={30} label="User program" sub="calls read()" />
        <Box x={90} y={14} w={70} h={30} label="Library stub" sub="syscall number" />
        <Box x={176} y={14} w={68} h={30} label="Trap" sub="mode switch" tone="warn" />
        <Box x={258} y={14} w={58} h={30} label="Kernel" sub="dispatcher" tone="deep" />
        <Box x={176} y={70} w={68} h={30} label="Handler runs" sub="does the work" tone="brand" />
        <Box x={60} y={70} w={90} h={30} label="Return to user mode" sub="result in a register" />

        <Arrow d="M76 29 L 86 29" />
        <Arrow d="M162 29 L 172 29" />
        <Arrow d="M246 29 L 255 29" />
        <Arrow d="M286 46 C 286 62, 260 76, 248 82" />
        <Arrow d="M174 85 L 154 85" />
        <Arrow d="M80 68 C 60 58, 44 52, 38 46" />
        <Caption x={160} y={112}>
          the only way user code reaches privileged hardware
        </Caption>
      </>
    ),
  },

  "fork-tree": {
    title: "fork() returns twice: zero in the child, the child's PID in the parent",
    height: 126,
    draw: () => (
      <>
        <Box x={110} y={6} w={100} h={26} label="Parent process" sub="calls fork()" tone="deep" />
        <Box x={14} y={56} w={112} h={28} label="Child" sub="fork() returns 0" tone="brand" />
        <Box x={192} y={56} w={112} h={28} label="Parent" sub="fork() returns child PID" tone="brand" />
        <Box x={14} y={96} w={112} h={24} label="exec() — new program" />
        <Box x={192} y={96} w={112} h={24} label="wait() — for the child" />

        <Arrow d="M140 34 L 92 52" />
        <Arrow d="M180 34 L 232 52" />
        <Arrow d="M70 86 L 70 92" />
        <Arrow d="M248 86 L 248 92" />
        <Arrow d="M128 108 L 188 108" dashed label="exit status" lx={158} ly={104} />
      </>
    ),
  },

  "thread-models": {
    title: "The three multithreading models: many-to-one, one-to-one and many-to-many",
    height: 128,
    draw: () => (
      <>
        {[
          { x: 4, title: "Many-to-one", user: 3, kernel: 1 },
          { x: 112, title: "One-to-one", user: 3, kernel: 3 },
          { x: 220, title: "Many-to-many", user: 4, kernel: 2 },
        ].map((model) => (
          <g key={model.title}>
            <rect x={model.x} y="14" width="96" height="102" rx="7" className="fill-surface stroke-brand-300" strokeWidth="1.1" />
            <Caption x={model.x + 48} y={10} bold>
              {model.title}
            </Caption>
            <Caption x={model.x + 48} y={30}>
              user threads
            </Caption>
            {Array.from({ length: model.user }).map((_, i) => (
              <circle
                key={i}
                cx={model.x + 48 + (i - (model.user - 1) / 2) * 20}
                cy={42}
                r="6"
                className="fill-brand-200 stroke-brand-500"
                strokeWidth="1"
              />
            ))}
            <line
              x1={model.x + 8}
              y1="68"
              x2={model.x + 88}
              y2="68"
              className="stroke-brand-400"
              strokeDasharray="3 2"
              strokeWidth="1"
            />
            {Array.from({ length: model.user }).map((_, i) => {
              const from = model.x + 48 + (i - (model.user - 1) / 2) * 20;
              const target = Math.min(i, model.kernel - 1);
              const to = model.x + 48 + (target - (model.kernel - 1) / 2) * 24;
              return <line key={i} x1={from} y1="48" x2={to} y2="84" className="stroke-brand-500" strokeWidth="0.9" />;
            })}
            {Array.from({ length: model.kernel }).map((_, i) => (
              <circle
                key={i}
                cx={model.x + 48 + (i - (model.kernel - 1) / 2) * 24}
                cy={90}
                r="6"
                className="fill-brand-500 stroke-brand-700"
                strokeWidth="1"
              />
            ))}
            <Caption x={model.x + 48} y={110}>
              kernel threads
            </Caption>
          </g>
        ))}
      </>
    ),
  },

  "process-memory": {
    title: "A process in memory: text, data, heap growing up, stack growing down",
    height: 150,
    draw: () => (
      <>
        <rect x="90" y="8" width="140" height="132" rx="6" className="fill-surface stroke-brand-400" strokeWidth="1.3" />
        {[
          ["Stack", "local variables, return addresses", 12, 26, "deep"],
          ["", "", 40, 22, null],
          ["Heap", "malloc / new", 64, 26, "brand"],
          ["Data", "global and static variables", 94, 22, "plain"],
          ["Text", "the program's instructions", 118, 20, "plain"],
        ].map(([label, sub, y, h, tone], i) =>
          tone ? (
            <Box key={i} x={96} y={y} w={128} h={h} label={label} sub={sub} tone={tone} rx={4} />
          ) : (
            <g key={i}>
              <text x="160" y={y + 14} textAnchor="middle" className="fill-ink-500 text-[6.5px]">
                free space
              </text>
            </g>
          )
        )}
        <Arrow d="M240 34 L 240 52" label="stack grows" lx={278} ly={40} />
        <Arrow d="M240 62 L 240 48" />
        <Caption x={278} y={60} anchor="middle">
          down
        </Caption>
        <Arrow d="M78 62 L 78 48" label="heap grows up" lx={44} ly={72} />
        <Caption x={160} y={146}>
          text and data are fixed in size; heap and stack are not
        </Caption>
      </>
    ),
  },

  "critical-section": {
    title: "The critical section problem: entry, critical section, exit and remainder",
    height: 126,
    draw: () => (
      <>
        <Box x={6} y={16} w={94} h={94} label="" tone="plain" rx={7} />
        <Caption x={53} y={12} bold>
          Process P1
        </Caption>
        <Box x={14} y={24} w={78} h={18} label="Entry section" tone="brand" rx={4} />
        <Box x={14} y={46} w={78} h={18} label="Critical section" tone="warn" rx={4} />
        <Box x={14} y={68} w={78} h={18} label="Exit section" tone="brand" rx={4} />
        <Box x={14} y={90} w={78} h={16} label="Remainder" rx={4} />

        <Box x={220} y={16} w={94} h={94} label="" tone="plain" rx={7} />
        <Caption x={267} y={12} bold>
          Process P2
        </Caption>
        <Box x={228} y={24} w={78} h={18} label="Entry section" tone="brand" rx={4} />
        <Box x={228} y={46} w={78} h={18} label="Critical section" tone="warn" rx={4} />
        <Box x={228} y={68} w={78} h={18} label="Exit section" tone="brand" rx={4} />
        <Box x={228} y={90} w={78} h={16} label="Remainder" rx={4} />

        <Box x={120} y={44} w={80} h={36} label="Shared resource" sub="one at a time" tone="deep" />
        <Arrow d="M96 56 L 116 58" />
        <Arrow d="M224 58 L 204 56" />
        <Caption x={160} y={120}>
          mutual exclusion · progress · bounded wait
        </Caption>
      </>
    ),
  },

  "deadlock-rag": {
    title: "Resource allocation graphs: a cycle means deadlock with single-instance resources",
    height: 134,
    draw: () => (
      <>
        <Caption x={80} y={12} bold>
          No cycle — no deadlock
        </Caption>
        <circle cx="30" cy="54" r="13" className="fill-brand-100 stroke-brand-500" strokeWidth="1.2" />
        <text x="30" y="57" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          P1
        </text>
        <circle cx="130" cy="54" r="13" className="fill-brand-100 stroke-brand-500" strokeWidth="1.2" />
        <text x="130" y="57" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          P2
        </text>
        <rect x="66" y="16" width="28" height="22" rx="3" className="fill-brand-200 stroke-brand-600" strokeWidth="1.2" />
        <text x="80" y="31" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          R1
        </text>
        <rect x="66" y="72" width="28" height="22" rx="3" className="fill-brand-200 stroke-brand-600" strokeWidth="1.2" />
        <text x="80" y="87" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          R2
        </text>
        <Arrow d="M40 44 L 64 32" />
        <Arrow d="M96 32 L 120 44" />
        <Arrow d="M120 66 L 96 80" />
        <Caption x={80} y={110}>
          P2 holds nothing P1 waits for
        </Caption>

        <line x1="160" y1="8" x2="160" y2="126" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />

        <Caption x={244} y={12} bold>
          Cycle — deadlock
        </Caption>
        <circle cx="194" cy="54" r="13" className="fill-brand-100 stroke-brand-500" strokeWidth="1.2" />
        <text x="194" y="57" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          P1
        </text>
        <circle cx="294" cy="54" r="13" className="fill-brand-100 stroke-brand-500" strokeWidth="1.2" />
        <text x="294" y="57" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          P2
        </text>
        <rect x="230" y="16" width="28" height="22" rx="3" className="fill-amber-100 stroke-amber-500" strokeWidth="1.2" />
        <text x="244" y="31" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          R1
        </text>
        <rect x="230" y="72" width="28" height="22" rx="3" className="fill-amber-100 stroke-amber-500" strokeWidth="1.2" />
        <text x="244" y="87" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          R2
        </text>
        <Arrow d="M204 44 L 228 32" />
        <Arrow d="M260 32 L 284 44" />
        <Arrow d="M284 66 L 260 80" />
        <Arrow d="M228 80 L 204 66" />
        <Caption x={244} y={110}>
          P1 → R1 → P2 → R2 → P1
        </Caption>
      </>
    ),
  },

  "paging-translation": {
    title: "Address translation: the page number is replaced by a frame number, the offset is untouched",
    height: 140,
    draw: () => (
      <>
        <Caption x={70} y={14} bold>
          Logical address
        </Caption>
        <rect x="14" y="20" width="56" height="22" rx="4" className="fill-brand-100 stroke-brand-500" strokeWidth="1.2" />
        <text x="42" y="35" textAnchor="middle" className="fill-ink-900 text-[7.5px] font-bold">
          page p
        </text>
        <rect x="70" y="20" width="56" height="22" rx="4" className="fill-surface stroke-brand-400" strokeWidth="1.2" />
        <text x="98" y="35" textAnchor="middle" className="fill-ink-900 text-[7.5px] font-bold">
          offset d
        </text>

        <Box x={110} y={62} w={100} h={30} label="Page table" sub="one per process" tone="deep" />
        <Arrow d="M42 44 C 42 56, 90 60, 126 60" label="index" lx={72} ly={58} />

        <Caption x={250} y={14} bold>
          Physical address
        </Caption>
        <rect x="194" y="20" width="56" height="22" rx="4" className="fill-brand-300 stroke-brand-600" strokeWidth="1.2" />
        <text x="222" y="35" textAnchor="middle" className="fill-ink-900 text-[7.5px] font-bold">
          frame f
        </text>
        <rect x="250" y="20" width="56" height="22" rx="4" className="fill-surface stroke-brand-400" strokeWidth="1.2" />
        <text x="278" y="35" textAnchor="middle" className="fill-ink-900 text-[7.5px] font-bold">
          offset d
        </text>

        <Arrow d="M196 62 C 214 54, 220 50, 222 44" label="gives f" lx={244} ly={58} />
        <Arrow d="M112 46 C 160 52, 240 52, 276 44" dashed label="offset copied unchanged" lx={196} ly={108} />

        <Box x={60} y={108} w={200} h={24} label="Physical memory — frame f, byte d" tone="brand" />
        <Arrow d="M236 46 L 200 104" />
      </>
    ),
  },

  "tlb-lookup": {
    title: "TLB hit and miss: a cache in front of the page table",
    height: 122,
    draw: () => (
      <>
        <Box x={4} y={44} w={62} h={28} label="CPU" sub="logical addr" />
        <Box x={88} y={44} w={62} h={28} label="TLB" sub="recent mappings" tone="deep" />
        <Box x={176} y={10} w={80} h={28} label="TLB hit" sub="frame at once" tone="brand" />
        <Box x={176} y={78} w={80} h={28} label="TLB miss" sub="read page table" tone="warn" />
        <Box x={268} y={44} w={48} h={28} label="RAM" tone="plain" />

        <Arrow d="M68 58 L 84 58" />
        <Arrow d="M152 50 L 174 34" label="hit" lx={160} ly={38} />
        <Arrow d="M152 66 L 174 88" label="miss" lx={160} ly={84} />
        <Arrow d="M258 26 C 280 32, 288 38, 290 42" />
        <Arrow d="M258 90 C 282 84, 290 78, 292 74" />
        <Arrow d="M216 76 L 216 42" dashed label="update TLB" lx={246} ly={60} />
        <Caption x={160} y={118}>
          a hit avoids one whole memory access
        </Caption>
      </>
    ),
  },

  segmentation: {
    title: "Segmentation: a logical address is a segment number plus an offset checked against a limit",
    height: 132,
    draw: () => (
      <>
        <rect x="8" y="20" width="48" height="20" rx="4" className="fill-brand-100 stroke-brand-500" strokeWidth="1.2" />
        <text x="32" y="34" textAnchor="middle" className="fill-ink-900 text-[7.5px] font-bold">
          seg s
        </text>
        <rect x="56" y="20" width="48" height="20" rx="4" className="fill-surface stroke-brand-400" strokeWidth="1.2" />
        <text x="80" y="34" textAnchor="middle" className="fill-ink-900 text-[7.5px] font-bold">
          offset d
        </text>

        <Box x={120} y={16} w={86} h={30} label="Segment table" sub="base · limit" tone="deep" />
        <Arrow d="M34 44 C 60 56, 110 46, 118 38" />

        <Box x={116} y={66} w={94} h={24} label="d < limit ?" tone="warn" />
        <Arrow d="M163 48 L 163 62" />
        <Box x={232} y={60} w={82} h={26} label="base + d" sub="physical address" tone="brand" />
        <Arrow d="M212 74 L 229 73" label="yes" lx={220} ly={68} />
        <Box x={116} y={102} w={94} h={22} label="Segmentation fault" tone="plain" />
        <Arrow d="M163 92 L 163 99" label="no" lx={176} ly={98} />
        <Caption x={273} y={100}>
          segments are variable size
        </Caption>
      </>
    ),
  },

  "virtual-memory": {
    title: "Virtual memory: some pages are in RAM, the rest sit on the backing store",
    height: 130,
    draw: () => (
      <>
        <Box x={6} y={48} w={54} h={28} label="CPU" />
        <rect x="96" y="12" width="76" height="106" rx="6" className="fill-surface stroke-brand-400" strokeWidth="1.3" />
        <Caption x={134} y={24} bold>
          RAM
        </Caption>
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x="104"
            y={32 + i * 20}
            width="60"
            height="16"
            rx="3"
            className={i === 1 || i === 3 ? "fill-brand-200 stroke-brand-500" : "fill-brand-50 stroke-brand-300"}
            strokeWidth="1"
          />
        ))}
        <Caption x={134} y={126}>
          only what is needed
        </Caption>

        <ellipse cx="264" cy="26" rx="44" ry="10" className="fill-brand-100 stroke-brand-500" strokeWidth="1.2" />
        <path d="M220 26 L 220 96 A 44 10 0 0 0 308 96 L 308 26" className="fill-brand-50 stroke-brand-500" strokeWidth="1.2" />
        <text x="264" y="66" textAnchor="middle" className="fill-ink-900 text-[8px] font-bold">
          Backing store
        </text>
        <text x="264" y="78" textAnchor="middle" className="fill-ink-500 text-[6.5px]">
          the rest of the pages
        </text>

        <Arrow d="M62 62 L 92 62" />
        <Arrow d="M176 56 L 216 56" label="page fault" lx={196} ly={50} />
        <Arrow d="M216 74 L 176 74" label="page in" lx={196} ly={86} />
      </>
    ),
  },

  "page-fault-curve": {
    title: "Page fault rate against the number of frames: too few thrashes, too many wastes memory",
    height: 130,
    draw: () => (
      <>
        <line x1="34" y1="106" x2="306" y2="106" className="stroke-brand-400" strokeWidth="1.2" />
        <line x1="34" y1="14" x2="34" y2="106" className="stroke-brand-400" strokeWidth="1.2" />
        <rect x="132" y="14" width="86" height="92" className="fill-brand-100" opacity="0.6" />
        <path
          d="M46 20 C 80 34, 110 76, 150 88 C 190 96, 240 98, 298 99"
          className="fill-none stroke-brand-600"
          strokeWidth="1.8"
        />
        <Caption x={175} y={26} bold>
          ideal range
        </Caption>
        <Caption x={80} y={48}>
          thrashing
        </Caption>
        <Caption x={262} y={88}>
          frames wasted
        </Caption>
        <Caption x={170} y={120} bold>
          number of frames →
        </Caption>
        <text x="14" y="62" textAnchor="middle" className="fill-ink-800 text-[7px] font-bold" transform="rotate(-90 14 62)">
          page fault rate
        </text>
      </>
    ),
  },

  "directory-structures": {
    title: "Single-level, two-level and tree-structured directories",
    height: 122,
    draw: () => (
      <>
        {[
          { x: 6, title: "Single-level", rows: [[1], [4]] },
          { x: 112, title: "Two-level", rows: [[1], [2], [4]] },
          { x: 218, title: "Tree", rows: [[1], [2], [3]] },
        ].map((model, m) => (
          <g key={model.title}>
            <Caption x={model.x + 48} y={12} bold>
              {model.title}
            </Caption>
            <rect x={model.x + 34} y="18" width="28" height="12" rx="2" className="fill-brand-300 stroke-brand-600" strokeWidth="1" />
            <text x={model.x + 48} y="27" textAnchor="middle" className="fill-ink-900 text-[6px] font-bold">
              root
            </text>
            {model.rows.slice(1).map((row, r) => {
              const count = m === 0 ? 4 : m === 1 ? (r === 0 ? 2 : 4) : r === 0 ? 2 : 4;
              const y = 46 + r * 28;
              return (
                <g key={r}>
                  {Array.from({ length: count }).map((_, i) => {
                    const cx = model.x + 48 + (i - (count - 1) / 2) * (count > 2 ? 22 : 34);
                    const parentCount = r === 0 ? 1 : m === 0 ? 1 : 2;
                    const pIndex = r === 0 ? 0 : Math.floor(i / (count / parentCount));
                    const px = model.x + 48 + (pIndex - (parentCount - 1) / 2) * 34;
                    const py = r === 0 ? 30 : y - 16;
                    return (
                      <g key={i}>
                        <line x1={px} y1={py} x2={cx} y2={y} className="stroke-brand-400" strokeWidth="0.8" />
                        <rect
                          x={cx - 9}
                          y={y}
                          width="18"
                          height="11"
                          rx="2"
                          className={r === 0 && m > 0 ? "fill-brand-200 stroke-brand-500" : "fill-surface stroke-brand-300"}
                          strokeWidth="0.9"
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}
            <Caption x={model.x + 48} y={114}>
              {m === 0 ? "name clashes" : m === 1 ? "one dir per user" : "sub-directories"}
            </Caption>
          </g>
        ))}
      </>
    ),
  },

  "disk-structure": {
    title: "Disk geometry: platters, tracks, sectors and the cylinder across them",
    height: 132,
    draw: () => (
      <>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <ellipse cx="150" cy={34 + i * 34} rx="80" ry="18" className="fill-brand-50 stroke-brand-500" strokeWidth="1.2" />
            <ellipse cx="150" cy={34 + i * 34} rx="48" ry="11" className="fill-none stroke-brand-300" strokeWidth="0.9" />
            <ellipse cx="150" cy={34 + i * 34} rx="18" ry="4" className="fill-brand-200 stroke-brand-400" strokeWidth="0.9" />
          </g>
        ))}
        <line x1="150" y1="10" x2="150" y2="126" className="stroke-brand-600" strokeWidth="2" />
        <Caption x={150} y={8}>
          spindle
        </Caption>
        {[0, 1, 2].map((i) => (
          <line key={i} x1="232" y1={34 + i * 34} x2="278" y2={34 + i * 34} className="stroke-brand-600" strokeWidth="1.4" />
        ))}
        <line x1="278" y1="30" x2="278" y2="106" className="stroke-brand-600" strokeWidth="2" />
        <Caption x={292} y={70} anchor="middle" bold>
          arm
        </Caption>
        <Caption x={46} y={18} bold>
          platter
        </Caption>
        <Caption x={84} y={52}>
          track
        </Caption>
        <line x1="150" y1="16" x2="150" y2="120" className="stroke-amber-500" strokeWidth="1.2" strokeDasharray="3 2" />
        <Caption x={188} y={126}>
          a cylinder is the same track on every platter
        </Caption>
      </>
    ),
  },

  dma: {
    title: "Direct memory access: the device moves data to memory without the CPU copying it",
    height: 118,
    draw: () => (
      <>
        <Box x={8} y={14} w={76} h={30} label="CPU" sub="sets up, then leaves" />
        <Box x={122} y={14} w={86} h={30} label="DMA controller" tone="deep" />
        <Box x={240} y={14} w={72} h={30} label="I/O device" />
        <Box x={122} y={76} w={86} h={28} label="Main memory" tone="brand" />

        <Arrow d="M86 24 L 118 24" label="1 · configure" lx={102} ly={62} />
        <Arrow d="M212 29 L 237 29" label="2 · read" lx={224} ly={22} />
        <Arrow d="M165 48 L 165 72" label="3 · transfer" lx={202} ly={62} />
        <Arrow d="M124 74 C 70 66, 48 56, 46 48" dashed label="4 · interrupt when done" lx={64} ly={96} />
        <Caption x={160} y={114}>
          the CPU is free for the whole of step 3
        </Caption>
      </>
    ),
  },

  "os-architectures": {
    title: "Monolithic, microkernel and layered kernel architectures compared",
    height: 126,
    draw: () => (
      <>
        {[
          { x: 4, title: "Monolithic" },
          { x: 112, title: "Microkernel" },
          { x: 220, title: "Layered" },
        ].map((m, i) => (
          <g key={m.title}>
            <Caption x={m.x + 48} y={12} bold>
              {m.title}
            </Caption>
            <Box x={m.x} y={18} w={96} h={16} label="User applications" rx={4} />
            {i === 0 && (
              <>
                <Box x={m.x} y={40} w={96} h={48} label="Kernel" sub="everything, one space" tone="deep" rx={4} />
              </>
            )}
            {i === 1 && (
              <>
                {["File srv", "Mem srv", "Dev srv"].map((label, j) => (
                  <Box key={label} x={m.x + j * 33} y={40} w={30} h={18} label={label} tone="brand" rx={3} />
                ))}
                <Box x={m.x} y={64} w={96} h={24} label="Microkernel" sub="IPC + scheduling" tone="deep" rx={4} />
              </>
            )}
            {i === 2 &&
              ["Layer N — UI", "Layer 2 — files", "Layer 1 — memory", "Layer 0 — hardware"].map((label, j) => (
                <Box
                  key={label}
                  x={m.x}
                  y={40 + j * 13}
                  w={96}
                  h={11}
                  label={label}
                  tone={j === 3 ? "deep" : "brand"}
                  rx={2}
                />
              ))}
            <Box x={m.x} y={94} w={96} h={16} label="Hardware" rx={4} />
            <Caption x={m.x + 48} y={122}>
              {i === 0 ? "fast, hard to maintain" : i === 1 ? "safe, IPC overhead" : "clear, easy to verify"}
            </Caption>
          </g>
        ))}
      </>
    ),
  },

  "producer-consumer": {
    title: "Producer and consumer sharing a bounded buffer, guarded by three semaphores",
    height: 118,
    draw: () => (
      <>
        <Box x={4} y={36} w={72} h={34} label="Producer" sub="wait(empty)" tone="brand" />
        <Box x={244} y={36} w={72} h={34} label="Consumer" sub="wait(full)" tone="brand" />
        <rect x="98" y="34" width="124" height="38" rx="6" className="fill-surface stroke-brand-500" strokeWidth="1.3" />
        <Caption x={160} y={30} bold>
          Bounded buffer, size N
        </Caption>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x={104 + i * 23}
            y="42"
            width="20"
            height="22"
            rx="2"
            className={i < 3 ? "fill-brand-300 stroke-brand-600" : "fill-brand-50 stroke-brand-300"}
            strokeWidth="1"
          />
        ))}
        <Arrow d="M78 52 L 96 52" label="insert" lx={87} ly={46} />
        <Arrow d="M224 52 L 242 52" label="remove" lx={233} ly={46} />
        <Caption x={160} y={92} bold>
          mutex = 1 · empty = N · full = 0
        </Caption>
        <Caption x={160} y={106}>
          producer blocks when full, consumer blocks when empty
        </Caption>
      </>
    ),
  },

  "dining-philosophers": {
    title: "Five philosophers, five forks, and the deadlock if all pick up their left fork at once",
    height: 140,
    draw: () => {
      const cx = 160;
      const cy = 70;
      const r = 48;
      return (
        <>
          <circle cx={cx} cy={cy} r="30" className="fill-brand-100 stroke-brand-400" strokeWidth="1.2" />
          <text x={cx} y={cy + 3} textAnchor="middle" className="fill-ink-500 text-[6.5px]">
            table
          </text>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const px = cx + Math.cos(a) * r;
            const py = cy + Math.sin(a) * r;
            const fa = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
            return (
              <g key={i}>
                <line
                  x1={cx + Math.cos(fa) * 20}
                  y1={cy + Math.sin(fa) * 20}
                  x2={cx + Math.cos(fa) * 32}
                  y2={cy + Math.sin(fa) * 32}
                  className="stroke-amber-600"
                  strokeWidth="2"
                />
                <circle cx={px} cy={py} r="12" className="fill-brand-200 stroke-brand-600" strokeWidth="1.2" />
                <text x={px} y={py + 3} textAnchor="middle" className="fill-ink-900 text-[7.5px] font-bold">
                  P{i}
                </text>
              </g>
            );
          })}
          <Caption x={cx} y={132}>
            a philosopher needs both neighbouring forks to eat
          </Caption>
        </>
      );
    },
  },

  "memory-hierarchy": {
    title: "Memory hierarchy: faster and smaller at the top, cheaper and larger at the bottom",
    height: 130,
    draw: () => (
      <>
        {[
          ["Registers", "~1 ns", 40],
          ["Cache (L1–L3)", "~2–20 ns", 80],
          ["Main memory (RAM)", "~100 ns", 130],
          ["SSD", "~100 µs", 180],
          ["Hard disk / tape", "~10 ms", 230],
        ].map(([label, speed, w], i) => (
          <g key={label}>
            <rect
              x={160 - w / 2}
              y={10 + i * 22}
              width={w}
              height="18"
              rx="3"
              className={i < 2 ? "fill-brand-300 stroke-brand-600" : "fill-brand-100 stroke-brand-400"}
              strokeWidth="1.1"
            />
            <text x="160" y={22 + i * 22} textAnchor="middle" className="fill-ink-900 text-[7px] font-bold">
              {label}
            </text>
            <text x="308" y={22 + i * 22} textAnchor="end" className="fill-ink-500 text-[6px]">
              {speed}
            </text>
          </g>
        ))}
        <Arrow d="M18 116 L 18 20" label="faster, smaller, dearer" lx={14} ly={70} />
        <Caption x={160} y={126}>
          each level caches the one below it
        </Caption>
      </>
    ),
  },

  "file-allocation": {
    title: "Contiguous, linked and indexed file allocation on the same disk blocks",
    height: 138,
    draw: () => (
      <>
        {[
          { title: "Contiguous", y: 14, blocks: [3, 4, 5, 6, 7], linked: false },
          { title: "Linked", y: 58, blocks: [1, 4, 7, 11], linked: true },
          { title: "Indexed", y: 102, blocks: [2, 5, 8, 11], linked: false, index: true },
        ].map((row) => (
          <g key={row.title}>
            <Caption x={4} y={row.y + 12} anchor="start" bold>
              {row.title}
            </Caption>
            {Array.from({ length: 13 }).map((_, i) => (
              <rect
                key={i}
                x={58 + i * 19}
                y={row.y}
                width="17"
                height="17"
                rx="2"
                className={
                  row.blocks.includes(i)
                    ? "fill-brand-300 stroke-brand-600"
                    : "fill-surface stroke-brand-200"
                }
                strokeWidth="0.9"
              />
            ))}
            {Array.from({ length: 13 }).map((_, i) => (
              <text key={i} x={66 + i * 19} y={row.y + 12} textAnchor="middle" className="fill-ink-500 text-[6px]">
                {i}
              </text>
            ))}
            {row.linked &&
              row.blocks.slice(0, -1).map((b, i) => (
                <path
                  key={i}
                  d={`M${75 + b * 19} ${row.y + 8} C ${80 + b * 19} ${row.y - 6}, ${60 + row.blocks[i + 1] * 19} ${row.y - 6}, ${65 + row.blocks[i + 1] * 19} ${row.y + 2}`}
                  className="fill-none stroke-brand-600"
                  strokeWidth="1"
                  markerEnd="url(#corecs-arrow)"
                />
              ))}
            {row.index && (
              <Caption x={160} y={row.y + 32}>
                one index block holds every address
              </Caption>
            )}
          </g>
        ))}
      </>
    ),
  },
};

export default DIAGRAMS;
