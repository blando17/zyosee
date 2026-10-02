/*
 * Virtual Memory.
 *
 * Source: "Operating System Notes.pdf" pp.42-47, "Os.pdf" pp.12-13, 20.
 *
 * THE THREE PAGE-REPLACEMENT EXAMPLES IN THE NOTES DISAGREE WITH EACH OTHER.
 *
 * The same reference string with three frames appears on pp.12, 13 and 20 of
 * `Os.pdf` with three different answers:
 *
 *   p12   FIFO 9   LRU 10  OPT 7
 *   p13   FIFO 9   LRU 7   OPT 6   second-chance 8
 *   p20   FIFO 9   LRU 7
 *
 * None of them is right. Simulated: FIFO 10, LRU 9, OPT 7, second-chance 9.
 * The traces below were generated rather than transcribed, which is why the
 * frame contents are shown column by column — so the count can be checked
 * rather than taken on trust.
 *
 * The Belady's anomaly example on p13 IS correct (9 faults at 3 frames, 10 at
 * 4), and it is reproduced unchanged.
 */

const REF = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2];

export default {
  id: "virtual-memory",
  name: "Virtual Memory",
  importance: "high",
  icon: "history",
  blurb:
    "Running programs larger than RAM by keeping only what is needed in memory — and choosing what to throw out when it fills.",
  source: "Operating System Notes pp.42-47 · Os.pdf pp.12-13, 20",

  questions: [
    {
      id: "os-vm-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is virtual memory?",
      short:
        "A technique that lets a process run without being entirely in RAM, using disk as an extension of memory.",
      answer: [
        {
          p: "Virtual memory separates the **logical** address space a program sees from the **physical** memory it actually occupies. Only the pages currently needed are in RAM; the rest sit on disk in the backing store.",
        },
        { diagram: "virtual-memory" },
        {
          ul: [
            "A program can be **larger than physical memory**.",
            "More processes fit in memory at once, so the degree of multiprogramming rises.",
            "Each process gets its own address space, which is where isolation comes from.",
          ],
        },
        {
          note: "The cost is that a memory access can now turn into a **disk access**, which is roughly a hundred thousand times slower. Everything else in this topic is about keeping that from happening often.",
        },
      ],
      tags: ["virtual memory", "demand paging"],
    },
    {
      id: "os-vm-02",
      subtopic: "Demand paging",
      type: "how",
      importance: "high",
      question: "What is demand paging, and what happens on a page fault?",
      short:
        "Pages are loaded only when referenced. A reference to a missing page traps to the OS, which fetches it and restarts the instruction.",
      answer: [
        {
          p: "**Demand paging** loads a page only when it is actually referenced — a process starts with nothing in memory and pages in as it runs. Nothing is loaded speculatively.",
        },
        { p: "**The page fault path:**" },
        {
          ol: [
            "The CPU references a page whose valid bit is 0 → **trap to the OS**.",
            "The OS checks the reference is legal. Illegal → terminate the process.",
            "Find the page on disk.",
            "Find a free frame. If there is none, run the **page replacement** algorithm to free one.",
            "Read the page from disk into the frame — this is the slow part, and the process is blocked throughout.",
            "Update the page table: set the frame number and the valid bit.",
            "**Restart the instruction** that faulted.",
          ],
        },
        {
          note: "Step 7 is the subtle one. The instruction is restarted from the beginning, not resumed — which means the hardware has to be able to undo any partial effects it had already had. That requirement is why not every CPU could support demand paging.",
        },
        {
          p: "A page fault is **not an error**. It is the normal, expected mechanism; the process never learns it happened.",
        },
      ],
      tip: "Emphasise that the process is unaware. 'Handled transparently by the OS' is the phrase.",
      tags: ["demand paging", "page fault"],
    },
    {
      id: "os-vm-03",
      subtopic: "Page replacement",
      type: "comparison",
      importance: "high",
      question: "Compare the page replacement algorithms.",
      short:
        "FIFO simple but suffers Belady's anomaly; LRU is the good practical choice; Optimal is the unimplementable benchmark; clock is LRU's cheap approximation.",
      answer: [
        {
          table: {
            head: ["Algorithm", "Evicts", "Cost", "Belady's anomaly", "Used in practice"],
            rows: [
              ["FIFO", "The oldest loaded page", "O(1) — a queue", "**Yes**", "Rarely"],
              ["LRU", "The least recently used page", "Needs usage tracking", "No", "Approximated widely"],
              ["Optimal (OPT)", "The page used furthest in the future", "Requires future knowledge", "No", "Never — it is the benchmark"],
              ["Second chance / clock", "Oldest page with reference bit 0", "O(1) per access", "No", "**Yes** — this is what real systems use"],
              ["LIFO", "The most recently loaded page", "O(1)", "—", "No — usually evicts what you just needed"],
              ["Random", "Any page", "O(1)", "—", "Rarely"],
            ],
          },
        },
        {
          p: "**Why clock rather than true LRU.** Exact LRU means updating a timestamp or moving a list node on *every single memory access*, which is far too expensive in hardware. The clock algorithm uses one **reference bit** per page that the hardware sets for free, sweeps a pointer round the frames, and gives any page with the bit set one more chance before evicting it. It approximates LRU at FIFO's cost, which is why it wins.",
        },
      ],
      tip: "Optimal cannot be implemented and is still worth knowing — it is how you tell whether a real algorithm is doing well or badly.",
      tags: ["page replacement", "fifo", "lru", "optimal", "clock"],
    },
    {
      id: "os-vm-n1",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "Count the page faults under FIFO with 3 frames.",
      short: "10 page faults.",
      given: {
        head: ["", "Value"],
        rows: [
          ["Reference string", "7 0 1 2 0 3 0 4 2 3 0 3 2"],
          ["Frames", "3"],
          ["Policy", "FIFO — evict the page that was loaded earliest"],
        ],
      },
      find: ["The frame contents at each step", "Total page faults"],
      solution: [
        {
          p: "FIFO keeps a queue of load order. On a fault with no free frame, the front of the queue is evicted regardless of how often it has been used.",
        },
        {
          frames: {
            refs: REF,
            rows: [
              [7, 7, 7, 2, 2, 2, 2, 4, 4, 4, 0, 0, 0],
              ["", 0, 0, 0, 0, 3, 3, 3, 2, 2, 2, 2, 2],
              ["", "", 1, 1, 1, 1, 0, 0, 0, 3, 3, 3, 3],
            ],
            faults: [true, true, true, true, false, true, true, true, true, true, true, false, false],
            total: 10,
          },
        },
        {
          p: "Only three references hit: the second `0` (step 5), and the final `3` and `2`. **10 faults out of 13 references.**",
        },
        {
          p: "Watch step 7. Page `0` was referenced two steps earlier and is still evicted at step 11, because FIFO only knows when a page arrived, not whether anybody is using it. That blindness is FIFO's whole weakness.",
        },
        {
          note: "Your notes print **9** for this on three separate pages. Simulating the string gives 10 — the trace above can be checked column by column.",
          tone: "warn",
        },
      ],
      tags: ["fifo", "page replacement", "numerical"],
    },
    {
      id: "os-vm-n2",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "Count the page faults under LRU with 3 frames.",
      short: "9 page faults — one better than FIFO.",
      given: {
        head: ["", "Value"],
        rows: [
          ["Reference string", "7 0 1 2 0 3 0 4 2 3 0 3 2"],
          ["Frames", "3"],
          ["Policy", "LRU — evict the page unused for longest"],
        ],
      },
      find: ["The frame contents at each step", "Total page faults"],
      solution: [
        {
          frames: {
            refs: REF,
            rows: [
              [7, 7, 7, 2, 2, 2, 2, 4, 4, 4, 0, 0, 0],
              ["", 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3],
              ["", "", 1, 1, 1, 3, 3, 3, 2, 2, 2, 2, 2],
            ],
            faults: [true, true, true, true, false, true, false, true, true, true, true, false, false],
            total: 9,
          },
        },
        {
          p: "The difference from FIFO is step 7. Page `0` was referenced at step 5, so LRU keeps it and evicts page `1` instead — which is never used again. **9 faults**, one fewer than FIFO.",
        },
        {
          p: "That is the whole argument for LRU: recent use is a decent predictor of imminent use, and load order is not a predictor of anything.",
        },
        {
          note: "Your notes give **10** on p12 and **7** on p13 and p20 for the same input. Neither is right; the trace above gives 9.",
          tone: "warn",
        },
      ],
      tip: "When tracing LRU by hand, write the recency order beside each column. Tracking it in your head is where mistakes come from.",
      tags: ["lru", "page replacement", "numerical"],
    },
    {
      id: "os-vm-n3",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "Count the page faults under Optimal with 3 frames.",
      short: "7 page faults — the theoretical minimum for this string.",
      given: {
        head: ["", "Value"],
        rows: [
          ["Reference string", "7 0 1 2 0 3 0 4 2 3 0 3 2"],
          ["Frames", "3"],
          ["Policy", "Optimal — evict the page whose next use is furthest away"],
        ],
      },
      find: ["The frame contents at each step", "Total page faults"],
      solution: [
        {
          frames: {
            refs: REF,
            rows: [
              [7, 7, 7, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
              ["", 0, 0, 0, 0, 0, 0, 4, 4, 4, 0, 0, 0],
              ["", "", 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3],
            ],
            faults: [true, true, true, true, false, true, false, true, false, false, true, false, false],
            total: 7,
          },
        },
        {
          p: "At step 4, Optimal looks ahead: `7` is never referenced again, so it goes. FIFO would have evicted `7` too — by luck — but at step 8 the algorithms part company. Optimal evicts `0`, because `0` is not needed until step 11 while `2` and `3` are needed sooner.",
        },
        {
          table: {
            head: ["Algorithm", "Faults", "Excess over Optimal"],
            rows: [
              ["FIFO", "10", "+3"],
              ["LRU", "9", "+2"],
              ["**Optimal**", "**7**", "—"],
            ],
          },
        },
        {
          note: "Optimal is unimplementable — it requires knowing the future. Its value is as a **yardstick**: LRU is within 2 faults of perfect here, which tells you the remaining headroom is small and a cleverer algorithm is not where the wins are.",
        },
      ],
      tags: ["optimal", "page replacement", "numerical"],
    },
    {
      id: "os-vm-n4",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "Show Belady's anomaly: does adding a frame always help?",
      short: "No. FIFO gives 9 faults with 3 frames and 10 with 4.",
      given: {
        head: ["", "Value"],
        rows: [
          ["Reference string", "1 2 3 4 1 2 5 1 2 3 4 5"],
          ["Frames", "3, then 4"],
          ["Policy", "FIFO"],
        ],
      },
      find: ["Faults with 3 frames", "Faults with 4 frames", "What this proves"],
      solution: [
        {
          table: {
            head: ["Frames", "Page faults"],
            rows: [
              ["3", "9"],
              ["4", "**10**"],
            ],
          },
        },
        {
          p: "Giving the process **more** memory made it **worse**. This is **Belady's anomaly**, and it is not a rounding error or a quirk of this string — it is a real property of FIFO.",
        },
        {
          p: "Why it happens: FIFO's set of resident pages with n frames is not necessarily a subset of its set with n+1 frames. Adding a frame changes the eviction order entirely, and the new order can be worse.",
        },
        {
          note: "**Which algorithms are immune?** Stack algorithms — those whose n-frame page set is always a subset of their (n+1)-frame set. **LRU and Optimal are stack algorithms and cannot exhibit the anomaly. FIFO is not, and can.** That is the answer the question is really after.",
        },
        {
          note: "This example is reproduced exactly as your notes give it. Both counts check out.",
        },
      ],
      tip: "Knowing the term is table stakes. Knowing that LRU is immune *because it is a stack algorithm* is the answer that stands out.",
      tags: ["belady", "fifo", "numerical"],
    },
    {
      id: "os-vm-04",
      subtopic: "Thrashing",
      type: "conceptual",
      importance: "high",
      question: "What is thrashing, and how do you fix it?",
      short:
        "The system spends more time paging than executing. Caused by too little memory per process; cured by reducing multiprogramming or using the working set model.",
      answer: [
        {
          p: "**Thrashing** is when a system spends most of its time swapping pages in and out and almost none actually executing. Every process is constantly faulting, so every process is constantly blocked on disk.",
        },
        { p: "**The vicious circle**, which is the part worth being able to describe:" },
        {
          ol: [
            "Processes do not have enough frames, so the page fault rate rises.",
            "Processes block on disk, so **CPU utilisation falls**.",
            "The long-term scheduler sees an idle CPU and admits **more** processes to use it.",
            "There are now even fewer frames each, so faults rise further. Go to step 2.",
          ],
        },
        {
          note: "The killer detail is step 3: the OS's own attempt to fix low CPU utilisation is what makes it worse. The symptom — high paging activity with low throughput and an unresponsive machine — is produced by the cure.",
        },
        { p: "**Fixes:**" },
        {
          ul: [
            "**Reduce the degree of multiprogramming** — suspend some processes entirely so the rest get enough frames.",
            "**Working set model** — track the set of pages each process has used recently and only admit a process if its working set fits.",
            "**Page fault frequency** — measure each process's fault rate directly and give frames to those above a threshold, take them from those below.",
            "Failing all that, buy more RAM.",
          ],
        },
        { diagram: "page-fault-curve" },
      ],
      tip: "Describing the feedback loop is what separates a good answer here. Anyone can say 'too much paging'.",
      followUps: [
        {
          q: "What is the working set?",
          a: "The set of pages a process has referenced in the last Δ references. It approximates the pages it is actively using, so if the sum of all working sets exceeds available frames, thrashing is about to start — which makes it a predictor rather than just a diagnosis.",
        },
      ],
      tags: ["thrashing", "working set", "page fault rate"],
    },
    {
      id: "os-vm-05",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "A server shows 100% CPU utilisation but almost no work completed, and the disk light is solid. What is happening?",
      short: "Thrashing — though 'high CPU' needs unpacking, because the CPU is mostly in the kernel handling faults.",
      answer: [
        {
          p: "This is **thrashing**. The CPU looks busy because it is constantly running the page-fault handler, updating page tables and issuing disk reads. Almost none of that is the user's work.",
        },
        {
          p: "The tell is the combination: high CPU **and** saturated disk **and** low throughput. Genuine CPU-bound load would leave the disk idle; genuine I/O-bound load would leave the CPU idle.",
        },
        {
          p: "What to check: page fault rate, swap usage, and how much memory the resident processes want compared with what exists. The immediate fix is to reduce the number of concurrent processes; the real fix is more memory or smaller working sets.",
        },
      ],
      tags: ["scenario", "thrashing"],
    },
    {
      id: "os-vm-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which algorithm can exhibit Belady's anomaly?",
      options: ["LRU", "Optimal", "FIFO", "All of them"],
      correct: 2,
      answer: [
        {
          p: "FIFO. LRU and Optimal are stack algorithms — their resident set with n frames is always a subset of the set with n+1 — so more frames can never mean more faults for them.",
        },
      ],
      tags: ["mcq", "belady"],
    },
    {
      id: "os-vm-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A page fault occurs when:",
      options: [
        "A page is corrupted",
        "A referenced page is not in physical memory",
        "The page table is full",
        "A process exceeds its memory limit",
      ],
      correct: 1,
      answer: [
        {
          p: "When the referenced page is not resident. It is a normal event handled transparently, not an error.",
        },
      ],
      tags: ["mcq", "page fault"],
    },
    {
      id: "os-vm-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "The Optimal page replacement algorithm is mainly used for:",
      options: [
        "Production operating systems",
        "Real-time systems",
        "Benchmarking other algorithms",
        "Embedded devices",
      ],
      correct: 2,
      answer: [
        {
          p: "Benchmarking. It needs the future reference string, so it can only be run on a trace after the fact — which is exactly what makes it a useful lower bound.",
        },
      ],
      tags: ["mcq", "optimal"],
    },
  ],
};
