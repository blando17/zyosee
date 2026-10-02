/*
 * I/O and Disk Management.
 *
 * Source: "Operating System Notes.pdf" pp.54-58, "Os.pdf" pp.16-17.
 *
 * TWO DISK SCHEDULING ERRORS IN THE SOURCES.
 *
 *   The 58-page notes give SCAN the same seek sequence as LOOK — neither
 *   reaching the end of the disk. Going to the end is the ONLY thing that
 *   distinguishes SCAN from LOOK, so that example erases the difference it
 *   exists to show.
 *
 *   `Os.pdf` p16 prints LOOK's total head movement as 291. It is 299. The
 *   other five totals on that page (640, 236, 331, 382, 322) are all correct,
 *   and its SCAN example correctly sweeps to cylinder 199.
 *
 * Every total below was recomputed from the seek order.
 */

const REQUESTS = [98, 183, 37, 122, 14, 124, 65, 67];

export default {
  id: "io-disk",
  name: "I/O & Disk Management",
  importance: "med",
  icon: "signal",
  blurb:
    "How the CPU talks to devices without wasting its time, and how the disk arm is routed to keep seek time down.",
  source: "Operating System Notes pp.54-58 · Os.pdf pp.16-17",

  questions: [
    {
      id: "os-io-01",
      subtopic: "I/O",
      type: "conceptual",
      importance: "med",
      question: "What are interrupts, and how does the CPU handle one?",
      short:
        "A signal that an event needs attention. The CPU finishes the current instruction, saves context, runs the ISR, and resumes.",
      answer: [
        {
          table: {
            head: ["Type", "Source", "Timing", "Examples"],
            rows: [
              ["Hardware interrupt", "A device", "**Asynchronous** — any time", "Key press, timer tick, disk I/O finished"],
              ["Software interrupt (trap)", "An instruction", "**Synchronous** — at a known point", "System call, divide by zero, page fault"],
            ],
          },
        },
        { p: "**The handling path:**" },
        {
          ol: [
            "The interrupt arrives.",
            "The CPU finishes the **current instruction** — it does not stop mid-instruction.",
            "It saves context: program counter, status word, registers.",
            "It looks the handler up in the interrupt vector table and jumps to the **ISR**.",
            "The ISR runs and clears the interrupt.",
            "Context is restored and the interrupted program resumes.",
          ],
        },
        {
          note: "Step 2 is what makes interrupts safe. An interrupt landing halfway through an instruction would leave the CPU in a state with no consistent way to resume, so the hardware always reaches an instruction boundary first.",
        },
        {
          p: "Interrupts are what make an OS event-driven rather than polling. Without them the CPU would have to keep asking every device whether anything had happened.",
        },
      ],
      tags: ["interrupt", "isr"],
    },
    {
      id: "os-io-02",
      subtopic: "I/O",
      type: "comparison",
      importance: "med",
      question: "What is DMA, and how does it differ from interrupt-driven I/O?",
      short:
        "Interrupt-driven I/O has the CPU copy every word. DMA lets the device write straight to memory and interrupt only when the whole transfer is done.",
      answer: [
        { diagram: "dma" },
        {
          table: {
            head: ["", "Programmed I/O", "Interrupt-driven I/O", "DMA"],
            rows: [
              ["CPU involvement", "Total — it polls and copies", "High — one interrupt and one copy per word", "**Minimal** — set up, then one interrupt at the end"],
              ["Data path", "Device → CPU → memory", "Device → CPU → memory", "**Device → memory directly**"],
              ["Good for", "Nothing much", "Slow devices, a few bytes at a time", "Disks, networks, anything bulk"],
            ],
          },
        },
        {
          p: "Without DMA, reading a 4 KB disk block means roughly a thousand interrupts and a thousand CPU-mediated copies. With DMA it is one setup, one transfer the CPU is not part of, and one interrupt.",
        },
        {
          note: "**Cycle stealing:** the DMA controller and the CPU share the memory bus, so DMA does take cycles the CPU could have used. It is far less than doing the copy itself, but it is not free.",
        },
      ],
      tags: ["dma", "interrupt", "io"],
    },
    {
      id: "os-io-03",
      subtopic: "I/O",
      type: "comparison",
      importance: "low",
      question: "What are buffering and spooling?",
      short:
        "Buffering absorbs speed mismatches between a device and the CPU. Spooling queues whole jobs for a device that can only do one at a time.",
      answer: [
        {
          ul: [
            "**Single buffering** — one buffer between the device and the CPU. The CPU waits while it refills.",
            "**Double buffering** — two buffers, so the device fills one while the CPU drains the other. No waiting, if the rates are close.",
            "**Circular buffering** — several buffers in a ring, for a producer and consumer running at genuinely different speeds.",
          ],
        },
        {
          p: "**Spooling** (Simultaneous Peripheral Operation On-Line) is different in kind: output is written to disk first and fed to the device later. It is what lets ten people send to one printer at once — each job goes to the spool directory immediately and the printer works through the queue.",
        },
        {
          note: "Buffering smooths a **rate** mismatch; spooling resolves a **contention** problem. Buffering is about one transfer being lumpy, spooling is about several jobs wanting one device.",
        },
      ],
      tags: ["buffering", "spooling"],
    },
    {
      id: "os-io-04",
      subtopic: "Disk structure",
      type: "definition",
      importance: "med",
      question: "Describe the structure of a hard disk, and how access time is made up.",
      short:
        "Platters, tracks, sectors, cylinders. Access time = seek time + rotational latency + transfer time, and seek dominates.",
      answer: [
        { diagram: "disk-structure" },
        {
          table: {
            head: ["Part", "What it is"],
            rows: [
              ["Platter", "A magnetic disk; both surfaces store data"],
              ["Track", "A concentric circle on one surface"],
              ["Sector", "A slice of a track — the smallest unit, usually 512 B or 4 KB"],
              ["Cylinder", "The same track across every platter"],
              ["Read/write head", "One per surface, all moving together on the arm"],
            ],
          },
        },
        {
          formula: [
            { name: "Access time", expr: "seek time + rotational latency + transfer time" },
            { name: "Average rotational latency", expr: "half a revolution = 30000 ÷ RPM ms" },
          ],
        },
        {
          note: "**Seek time dominates** — milliseconds, against fractions of a millisecond for the rest — because it is the only part that moves a physical arm. That is why every disk scheduling algorithm exists to minimise seek time and none of them care about the other two terms.",
        },
        {
          p: "A **cylinder** matters for the same reason: data on the same cylinder is reachable from every platter with no arm movement at all.",
        },
      ],
      tags: ["disk", "seek time", "cylinder"],
    },
    {
      id: "os-io-05",
      subtopic: "Disk scheduling",
      type: "comparison",
      importance: "high",
      question: "Compare the six disk scheduling algorithms.",
      short:
        "FCFS fair and slow; SSTF fast and starves; SCAN and C-SCAN sweep; LOOK and C-LOOK are the same without the pointless trip to the end.",
      answer: [
        {
          table: {
            head: ["Algorithm", "Rule", "Starvation", "Wait time"],
            rows: [
              ["FCFS", "Serve in arrival order", "No", "High and uneven"],
              ["SSTF", "Nearest request to the head", "**Yes** — far requests can wait forever", "Low average, very uneven"],
              ["SCAN (elevator)", "Sweep to one end, reverse, sweep back", "No", "Fairly even"],
              ["C-SCAN", "Sweep one way only, then jump back to the start", "No", "**Most uniform**"],
              ["LOOK", "Like SCAN, but turn at the last request", "No", "Even, less movement"],
              ["C-LOOK", "Like C-SCAN, but jump to the first request", "No", "Uniform, least movement"],
            ],
          },
        },
        {
          note: "**SCAN vs LOOK is the distinction most often got wrong.** SCAN travels all the way to cylinder 0 or 199 even if there is nothing there; LOOK turns around at the furthest actual request. Same idea, and LOOK is strictly better — which is why real systems use LOOK and C-LOOK, and call them SCAN.",
        },
        {
          note: "Your 58-page notes give SCAN and LOOK **identical** seek sequences, neither reaching the end of the disk. That erases the only difference between them; the cheat-sheet version on Os.pdf p16 has it right.",
          tone: "warn",
        },
      ],
      tip: "If you only remember one thing: C-SCAN's jump back exists to make wait time uniform, because in plain SCAN the cylinders in the middle get visited twice as often as the ends.",
      tags: ["disk scheduling", "scan", "look", "sstf"],
    },
    {
      id: "os-io-n1",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "Compute total head movement for all six disk scheduling algorithms.",
      short:
        "FCFS 640 · SSTF 236 · SCAN 331 · C-SCAN 382 · LOOK 299 · C-LOOK 322",
      given: {
        head: ["", "Value"],
        rows: [
          ["Request queue", "98, 183, 37, 122, 14, 124, 65, 67"],
          ["Head starts at", "53"],
          ["Disk range", "0 to 199"],
          ["Initial direction", "Towards higher cylinders"],
        ],
      },
      find: ["Seek order and total head movement for each algorithm"],
      solution: [
        { p: "**FCFS** — serve them exactly as they arrived." },
        {
          seek: { head: 53, order: REQUESTS, total: 640, low: 0, high: 199 },
        },
        {
          p: "45 + 85 + 146 + 85 + 108 + 110 + 59 + 2 = **640**. The zig-zag in the picture is the cost of ignoring where the head already is.",
        },
        { p: "**SSTF** — always jump to the nearest pending request." },
        {
          seek: { head: 53, order: [65, 67, 37, 14, 98, 122, 124, 183], total: 236, low: 0, high: 199 },
        },
        {
          p: "12 + 2 + 30 + 23 + 84 + 24 + 2 + 59 = **236**, a 63% improvement on FCFS. The price is starvation: a request at cylinder 190 would keep being passed over while requests near the head kept arriving.",
        },
        { p: "**SCAN** — sweep up to the end of the disk, then reverse." },
        {
          seek: {
            head: 53,
            order: [65, 67, 98, 122, 124, 183, 199, 37, 14],
            total: 331,
            low: 0,
            high: 199,
          },
        },
        { p: "Up to 199 (146), then down to 14 (185): **331**. Note the trip from 183 to 199 serves nothing — that is what LOOK removes." },
        { p: "**C-SCAN** — sweep up only, jump back to 0, sweep up again." },
        {
          seek: {
            head: 53,
            order: [65, 67, 98, 122, 124, 183, 199, 0, 14, 37],
            total: 382,
            low: 0,
            high: 199,
          },
        },
        {
          p: "146 up, 199 back, then 37 up = **382**. The most total movement of any of them, bought in exchange for the most uniform wait time — a request just behind the head waits one full sweep, never two.",
        },
        { p: "**LOOK** — SCAN, but turn at the last real request rather than the end." },
        {
          seek: { head: 53, order: [65, 67, 98, 122, 124, 183, 37, 14], total: 299, low: 0, high: 199 },
        },
        { p: "Up to 183 (130), then down to 14 (169): **299**. Saves 32 against SCAN by not visiting 199 for nothing." },
        { p: "**C-LOOK** — C-SCAN, but jump to the first real request rather than to 0." },
        {
          seek: { head: 53, order: [65, 67, 98, 122, 124, 183, 14, 37], total: 322, low: 0, high: 199 },
        },
        { p: "130 up, 169 jump back, 23 up = **322**. Saves 60 against C-SCAN." },
        {
          table: {
            head: ["Algorithm", "Total head movement", "Rank"],
            rows: [
              ["SSTF", "236", "1 — fastest, but starves"],
              ["LOOK", "299", "2"],
              ["C-LOOK", "322", "3"],
              ["SCAN", "331", "4"],
              ["C-SCAN", "382", "5"],
              ["FCFS", "640", "6 — fair and nothing else"],
            ],
          },
        },
        {
          note: "Your notes print LOOK as **291**. Adding the hops — 12 + 2 + 31 + 24 + 2 + 59 + 146 + 23 — gives **299**. The other five totals on that page are correct.",
          tone: "warn",
        },
      ],
      tip: "Write the seek order first, then the differences, then sum. Trying to total it in one pass is where the arithmetic goes wrong.",
      tags: ["disk scheduling", "numerical"],
    },
    {
      id: "os-io-06",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "A request for cylinder 190 has been pending for thirty seconds while nearby requests keep being served. Which algorithm is running?",
      short: "SSTF. SCAN, LOOK or their circular variants fix it.",
      answer: [
        {
          p: "**SSTF.** It always picks the closest request, so a steady stream of requests near the head means a distant one is never closest and never chosen.",
        },
        {
          p: "Every sweep-based algorithm fixes this by construction: SCAN, C-SCAN, LOOK and C-LOOK all pass over every cylinder in order, so a request is served within at most one sweep whatever else arrives.",
        },
        {
          note: "The same shape as CPU scheduling. SSTF is SJF for disk arms — greedy, optimal on average, and starving by design. Sweeping is the disk's version of Round Robin.",
        },
      ],
      tags: ["scenario", "sstf", "starvation"],
    },
    {
      id: "os-io-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which component of disk access time is usually the largest?",
      options: ["Rotational latency", "Transfer time", "Seek time", "Controller overhead"],
      correct: 2,
      answer: [
        { p: "Seek time — it is the only part that physically moves the arm, and it dominates by an order of magnitude." },
      ],
      tags: ["mcq", "disk"],
    },
    {
      id: "os-io-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "The difference between SCAN and LOOK is that:",
      options: [
        "SCAN is preemptive",
        "SCAN travels to the end of the disk even with no request there",
        "LOOK serves requests in arrival order",
        "There is no difference",
      ],
      correct: 1,
      answer: [
        {
          p: "SCAN always reaches cylinder 0 or the last cylinder; LOOK turns around at the furthest actual request. That is the whole difference, and it makes LOOK strictly better.",
        },
      ],
      tags: ["mcq", "scan", "look"],
    },
    {
      id: "os-io-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "DMA reduces:",
      options: [
        "Disk seek time",
        "CPU involvement in data transfer",
        "The number of disk requests",
        "Memory usage",
      ],
      correct: 1,
      answer: [
        {
          p: "CPU involvement. The device writes straight into memory and interrupts once at the end, instead of the CPU copying every word.",
        },
      ],
      tags: ["mcq", "dma"],
    },
  ],
};
