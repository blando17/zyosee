/*
 * CPU Scheduling.
 *
 * Source: "Operating System Notes.pdf" pp.15-22 and "Os.pdf" pp.5, 20.
 *
 * EVERY NUMERICAL HERE WAS RECOMPUTED, NOT COPIED.
 *
 * Ten of the printed scheduling answers across the two source documents are
 * wrong, and two of them contradict a Gantt chart drawn directly above them.
 * A wrong answer in a numerical is worse than a wrong answer anywhere else,
 * because the numerical is the one kind of question where somebody checks
 * their own working against the key — so a wrong key teaches a wrong method.
 *
 * The six numericals reproduced below each carry a `note` block saying what
 * the source prints and why it does not hold up.
 *
 * Each corrected numerical carries a `note` block saying what the source
 * prints and why it is wrong. That is deliberate: revising from both the app
 * and the PDFs, which is what will happen, is confusing if they disagree and
 * nothing explains it.
 *
 * ROUND ROBIN NEEDS A STATED CONVENTION.
 *
 * When a process arrives at the exact instant another is preempted, the answer
 * depends on which of the two joins the ready queue first, and neither source
 * says. This module uses ARRIVING PROCESS FIRST throughout, the common
 * textbook convention, and says so on the question — because an interviewer
 * who uses the other one wants to hear that you know the choice exists.
 */

const SET_A = {
  head: ["Process", "Arrival (AT)", "Burst (BT)"],
  rows: [
    ["P1", "0", "8"],
    ["P2", "1", "4"],
    ["P3", "2", "2"],
    ["P4", "3", "1"],
  ],
};

export default {
  id: "cpu-scheduling",
  name: "CPU Scheduling",
  importance: "high",
  icon: "timer",
  blurb:
    "Which of the ready processes runs next, and what that choice costs in waiting time. The single most asked OS topic, and the one that comes with arithmetic.",
  source: "Operating System Notes pp.15-22 · Os.pdf pp.5, 20",

  questions: [
    /* ------------------------------ concepts ------------------------------ */
    {
      id: "os-sched-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is CPU scheduling?",
      short:
        "The OS deciding which process from the ready queue gets the CPU next.",
      answer: [
        {
          p: "There is usually one CPU and many processes that want it. CPU scheduling is how the OS picks which ready process runs next, using a **scheduler**.",
        },
        {
          p: "Only a process in the **ready** state is a candidate. A process blocked on I/O is not competing for the CPU, which is exactly why the OS can put somebody else on it while that one waits.",
        },
      ],
      tip: "Say 'ready queue', not 'all processes'. Interviewers listen for whether you know blocked processes are not scheduled.",
      followUps: [
        {
          q: "What are the goals of CPU scheduling?",
          a: "Maximise CPU utilisation and throughput; minimise turnaround, waiting and response time; and stay fair, so no process starves.",
        },
      ],
      tags: ["scheduler", "ready queue"],
    },
    {
      id: "os-sched-02",
      subtopic: "Basics",
      type: "comparison",
      importance: "high",
      question: "Preemptive vs non-preemptive scheduling?",
      short:
        "Non-preemptive: once a process has the CPU it keeps it until it finishes or blocks. Preemptive: the OS can take the CPU away.",
      answer: [
        {
          table: {
            head: ["", "Non-preemptive", "Preemptive"],
            rows: [
              ["CPU taken away?", "No — runs to completion or until it blocks on I/O", "Yes — a higher-priority or shorter job can take over"],
              ["Context switches", "Few", "Many"],
              ["Response time", "Poor — one long job blocks everyone", "Good"],
              ["Fairness", "Poor", "Good"],
              ["Complexity", "Simple", "Harder to implement"],
              ["Examples", "FCFS, SJF, non-preemptive Priority", "SRTF, Round Robin, preemptive Priority"],
            ],
          },
        },
        {
          p: "The trade is always the same one: preemption buys responsiveness and pays for it in context-switch overhead, which is work that produces nothing for the user.",
        },
      ],
      tip: "A batch system wants non-preemptive; anything a human is sitting in front of wants preemptive.",
      tags: ["preemption"],
    },
    {
      id: "os-sched-03",
      subtopic: "Queues and schedulers",
      type: "conceptual",
      importance: "med",
      question: "Which queues does a process pass through?",
      short: "Job queue → ready queue → running; and off to the waiting queue whenever it needs I/O.",
      answer: [
        {
          ul: [
            "**Job queue** (on disk) — every process submitted to the system. Some wait here before they are admitted into RAM at all.",
            "**Ready queue** (in main memory) — loaded, ready to run, waiting only for the CPU.",
            "**Waiting / blocked queue** — waiting on I/O. Returns to the ready queue when the I/O finishes.",
            "**Swapped-out queue** — moved to disk to free memory, swapped back in when there is room.",
          ],
        },
        { diagram: "sched-queues" },
      ],
      tags: ["ready queue", "job queue"],
    },
    {
      id: "os-sched-04",
      subtopic: "Queues and schedulers",
      type: "comparison",
      importance: "med",
      question: "Long-term, short-term and medium-term schedulers — what is the difference?",
      short:
        "Long-term admits jobs into memory, short-term picks who runs next, medium-term swaps processes out to disk and back.",
      answer: [
        {
          table: {
            head: ["Scheduler", "Moves a process", "How often it runs", "Controls"],
            rows: [
              ["Long-term (job)", "Job queue → ready queue", "Rarely", "Degree of multiprogramming, and the CPU-bound / I/O-bound mix"],
              ["Short-term (CPU)", "Ready queue → running", "Every few milliseconds", "Which process is on the CPU right now"],
              ["Medium-term", "Ready/waiting ↔ disk (swapping)", "When memory is tight", "Memory pressure"],
            ],
          },
        },
        {
          p: "The long-term scheduler is the one that keeps the mix balanced. Admit only CPU-bound processes and the I/O devices sit idle; admit only I/O-bound ones and the CPU does.",
        },
      ],
      followUps: [
        {
          q: "What is the dispatcher, and how is it different from the short-term scheduler?",
          a: "The scheduler decides; the dispatcher does it. It performs the context switch, switches from kernel mode to user mode, and jumps to the right instruction in the chosen process. The time that takes is dispatch latency.",
        },
      ],
      tags: ["dispatcher", "degree of multiprogramming"],
    },
    {
      id: "os-sched-05",
      subtopic: "Terminology",
      type: "definition",
      importance: "high",
      question: "Define arrival, burst, completion, turnaround, waiting and response time.",
      short:
        "TAT = CT − AT. WT = TAT − BT. RT = first time on the CPU − AT.",
      answer: [
        {
          ul: [
            "**Arrival time (AT)** — when the process enters the ready queue.",
            "**Burst time (BT)** — CPU time it needs to finish.",
            "**Completion time (CT)** — when it actually finishes.",
            "**Turnaround time (TAT)** — total time from arriving to finishing.",
            "**Waiting time (WT)** — time spent in the ready queue, not running.",
            "**Response time (RT)** — from arriving to the *first* moment it gets the CPU.",
          ],
        },
        {
          formula: [
            { name: "Turnaround time", expr: "TAT = CT − AT" },
            { name: "Waiting time", expr: "WT = TAT − BT" },
            { name: "Response time", expr: "RT = first CPU time − AT" },
            { name: "CPU utilisation", expr: "(busy time ÷ total time) × 100" },
            { name: "Throughput", expr: "processes completed ÷ total time" },
          ],
        },
        {
          note: "For any **non-preemptive** algorithm, RT and WT are equal — a process that is never interrupted waits exactly once, right at the start. They differ only under preemption.",
        },
      ],
      tip: "If you derive WT from TAT rather than counting gaps in the Gantt chart, you cannot get it wrong under preemption.",
      tags: ["formula", "turnaround", "waiting time"],
    },

    /* ----------------------------- algorithms ----------------------------- */
    {
      id: "os-sched-06",
      subtopic: "FCFS",
      type: "conceptual",
      importance: "high",
      question: "How does FCFS work, and what is the convoy effect?",
      short:
        "Processes run in arrival order. The convoy effect is short jobs stuck behind one long one, wrecking average waiting time.",
      answer: [
        { p: "First-Come First-Served runs processes in the order they reach the ready queue. Non-preemptive, and about as simple as scheduling gets." },
        {
          p: "**Convoy effect:** one long CPU-bound process arrives first, and every short process behind it waits for the whole of it. A 100 ms job in front of four 1 ms jobs makes all four wait 100 ms for 1 ms of work.",
        },
        {
          ul: [
            "Good — trivial to implement, no starvation, fair by arrival.",
            "Bad — high average waiting time, terrible for interactive systems.",
          ],
        },
      ],
      tip: "Name the convoy effect explicitly. It is the one term interviewers are listening for on this algorithm.",
      tags: ["fcfs", "convoy effect"],
    },
    {
      id: "os-sched-07",
      subtopic: "SJF and SRTF",
      type: "comparison",
      importance: "high",
      question: "SJF vs SRTF?",
      short:
        "SJF is non-preemptive shortest burst; SRTF is its preemptive form, comparing remaining time on every arrival.",
      answer: [
        {
          table: {
            head: ["", "SJF", "SRTF"],
            rows: [
              ["Preemptive", "No", "Yes"],
              ["Picks", "Smallest burst time among processes that have arrived", "Smallest *remaining* time, rechecked whenever a process arrives"],
              ["Optimal for", "Minimum average waiting time among non-preemptive algorithms", "Minimum average turnaround time overall"],
              ["Problem", "Needs burst times in advance; long jobs starve", "Same, plus frequent context switches"],
            ],
          },
        },
        {
          p: "Neither is implementable as stated, because burst time is not known in advance. Real systems estimate it from the process's own history using an exponential average — that is the honest answer to \"how would you actually build this\".",
        },
      ],
      followUps: [
        {
          q: "SJF gives the minimum average waiting time — so why does nobody use it?",
          a: "Because burst time is not knowable ahead of time, and because long processes starve indefinitely if short ones keep arriving. Aging fixes the starvation; nothing fixes the prediction.",
        },
      ],
      tags: ["sjf", "srtf", "starvation"],
    },
    {
      id: "os-sched-08",
      subtopic: "Round Robin",
      type: "conceptual",
      importance: "high",
      question: "How does Round Robin work, and how do you pick the time quantum?",
      short:
        "Each process gets a fixed quantum in cyclic order. The quantum must be large against the context-switch cost but small against a typical CPU burst.",
      answer: [
        { p: "Every ready process gets the CPU for at most one **time quantum**, then goes to the back of the queue. Preemptive, and the classic choice for time-sharing systems." },
        {
          p: "The quantum is the whole design decision:",
        },
        {
          ul: [
            "**Too small** — the CPU spends its time context switching instead of working. In the limit, all overhead and no progress.",
            "**Too large** — Round Robin degenerates into FCFS, convoy effect and all.",
            "**Rule of thumb** — around 80% of CPU bursts should finish inside one quantum.",
          ],
        },
        {
          note: "RR guarantees a bounded **response time** — with n processes and quantum q, nobody waits more than (n−1)q for their first turn. That is what makes a machine feel responsive, and it is why RR wins on RT while often losing on average WT.",
        },
      ],
      tip: "If asked 'which is best', the answer is never one algorithm. RR is best for response time, SRTF for turnaround, FCFS for simplicity.",
      tags: ["round robin", "time quantum"],
    },
    {
      id: "os-sched-09",
      subtopic: "Priority",
      type: "conceptual",
      importance: "high",
      question: "What is priority scheduling, and how do you stop low-priority processes starving?",
      short: "Highest priority runs first; **aging** raises the priority of anything that has waited too long.",
      answer: [
        { p: "Each process carries a priority number and the CPU goes to the highest. Can be preemptive or not. Note the convention trap: in most textbooks a **lower number means higher priority**." },
        {
          p: "**The problem:** a steady stream of high-priority work means a low-priority process may never run. The classic story is an IBM 7094 shut down in 1973 with a job from 1967 still waiting.",
        },
        {
          p: "**The fix — aging:** gradually increase the priority of any process that has been waiting. Given enough time, every process eventually becomes the highest-priority one, so starvation becomes impossible rather than merely unlikely.",
        },
      ],
      tip: "Never answer 'priority scheduling' without saying 'starvation' and 'aging' in the same breath — that pair is the whole question.",
      followUps: [
        {
          q: "What is priority inversion?",
          a: "A high-priority process blocked on a lock held by a low-priority one, which cannot run to release it because medium-priority work keeps preempting it. Fixed by priority inheritance — the lock holder temporarily inherits the waiter's priority.",
        },
      ],
      tags: ["priority", "aging", "starvation"],
    },
    {
      id: "os-sched-10",
      subtopic: "Multilevel queues",
      type: "comparison",
      importance: "med",
      question: "Multilevel Queue vs Multilevel Feedback Queue?",
      short:
        "MLQ fixes a process to one queue forever; MLFQ lets it move between queues based on how it behaves.",
      answer: [
        {
          p: "**Multilevel Queue (MLQ)** splits the ready queue into several queues — system, interactive, batch — each with its own algorithm and a fixed priority between them. A process is assigned to one queue permanently.",
        },
        {
          p: "**Multilevel Feedback Queue (MLFQ)** is the same idea with movement. A process that uses its whole quantum is demoted to a lower-priority queue with a longer quantum; one that blocks early stays high. Aging promotes anything that has waited too long.",
        },
        {
          table: {
            head: ["", "MLQ", "MLFQ"],
            rows: [
              ["Can a process change queue?", "No — rigid", "Yes, based on behaviour"],
              ["Starvation", "Low queues can starve", "Prevented by aging"],
              ["Adapts to the workload", "No", "Yes"],
              ["Complexity", "Moderate", "High — many parameters to tune"],
            ],
          },
        },
        {
          note: "MLFQ is the interesting answer: it separates interactive from CPU-bound work **without being told which is which**, purely by watching who gives the CPU back early. That is why general-purpose systems use it.",
        },
        { diagram: "sched-mlfq" },
      ],
      tags: ["mlq", "mlfq", "aging"],
    },

    /* ----------------------------- numericals ----------------------------- */
    {
      id: "os-sched-n1",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "FCFS — find CT, TAT, WT and RT for each process, and the averages.",
      short: "avg TAT 10.75 · avg WT 7.00 · avg RT 7.00",
      given: SET_A,
      find: ["Completion time", "Turnaround time", "Waiting time", "Response time", "Averages"],
      solution: [
        { p: "FCFS is non-preemptive and runs in arrival order, so the Gantt chart is simply P1, P2, P3, P4." },
        {
          gantt: {
            slices: [
              { p: "P1", from: 0, to: 8 },
              { p: "P2", from: 8, to: 12 },
              { p: "P3", from: 12, to: 14 },
              { p: "P4", from: 14, to: 15 },
            ],
          },
        },
        { p: "Now read CT off the chart and apply the two formulas." },
        {
          formula: [
            { name: "Turnaround", expr: "TAT = CT − AT" },
            { name: "Waiting", expr: "WT = TAT − BT" },
          ],
        },
        {
          table: {
            head: ["Process", "AT", "BT", "CT", "TAT", "WT", "RT"],
            rows: [
              ["P1", "0", "8", "8", "8", "0", "0"],
              ["P2", "1", "4", "12", "11", "7", "7"],
              ["P3", "2", "2", "14", "12", "10", "10"],
              ["P4", "3", "1", "15", "12", "11", "11"],
            ],
          },
        },
        {
          p: "**Averages** — TAT (8+11+12+12)/4 = **10.75**, WT (0+7+10+11)/4 = **7.00**, RT = **7.00**.",
        },
        {
          note: "Your notes print **avg RT 8.5** and an RT column of 0, 0, 0, 1. Both are wrong. Under FCFS nothing is ever preempted, so each process starts exactly once and RT equals WT — 0, 7, 10, 11, averaging 7.00.",
          tone: "warn",
        },
      ],
      tip: "P3 waits 10 units to do 2 units of work. That ratio is the convoy effect in one number — quote it.",
      tags: ["fcfs", "numerical"],
    },
    {
      id: "os-sched-n2",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "SJF (non-preemptive) — same process set. Find the averages.",
      short: "avg TAT 9.25 · avg WT 5.50 · avg RT 5.50",
      given: SET_A,
      find: ["Gantt chart", "Turnaround time", "Waiting time", "Averages"],
      solution: [
        {
          p: "SJF only chooses among processes that **have already arrived**. At t = 0 only P1 exists, so P1 runs — for its full 8 units, because SJF is non-preemptive.",
        },
        {
          ol: [
            "t = 0 — only P1 has arrived. Run P1 to completion, 0 → 8.",
            "t = 8 — P2 (BT 4), P3 (BT 2) and P4 (BT 1) are all waiting. Smallest is P4. Run 8 → 9.",
            "t = 9 — P3 (BT 2) is now smallest. Run 9 → 11.",
            "t = 11 — only P2 left. Run 11 → 15.",
          ],
        },
        {
          gantt: {
            slices: [
              { p: "P1", from: 0, to: 8 },
              { p: "P4", from: 8, to: 9 },
              { p: "P3", from: 9, to: 11 },
              { p: "P2", from: 11, to: 15 },
            ],
          },
        },
        {
          table: {
            head: ["Process", "AT", "BT", "CT", "TAT", "WT", "RT"],
            rows: [
              ["P1", "0", "8", "8", "8", "0", "0"],
              ["P2", "1", "4", "15", "14", "10", "10"],
              ["P3", "2", "2", "11", "9", "7", "7"],
              ["P4", "3", "1", "9", "6", "5", "5"],
            ],
          },
        },
        {
          p: "**Averages** — TAT (8+14+9+6)/4 = **9.25**, WT (0+10+7+5)/4 = **5.50**, RT = **5.50**.",
        },
        {
          note: "Your notes print **avg RT 7** with an RT column of 0, 0, 0, 1. Wrong for the same reason as the FCFS question: non-preemptive scheduling means RT = WT, so the column is 0, 10, 7, 5 and the average is 5.50. The CT, TAT and WT figures in the notes are correct.",
          tone: "warn",
        },
      ],
      tip: "Watch the trap: SJF at t = 0 cannot pick P4 even though it is the shortest — P4 has not arrived yet.",
      tags: ["sjf", "numerical"],
    },
    {
      id: "os-sched-n3",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "SRTF (preemptive SJF) — same process set. Find the averages.",
      short: "avg TAT 6.50 · avg WT 2.75 · avg RT 0.25",
      given: SET_A,
      find: ["Gantt chart", "Turnaround time", "Waiting time", "Response time"],
      solution: [
        {
          p: "Recheck at every arrival, comparing **remaining** times.",
        },
        {
          ol: [
            "t = 0 — only P1 (rem 8). Run P1.",
            "t = 1 — P2 arrives with 4 < P1's remaining 7. Preempt. Run P2.",
            "t = 2 — P3 arrives with 2 < P2's remaining 3. Preempt. Run P3.",
            "t = 3 — P4 arrives with 1 < P3's remaining 1? No — 1 is not less than 1, so P3 keeps the CPU and finishes at t = 4.",
            "t = 4 — remaining: P1 7, P2 3, P4 1. Run P4, finishes at 5.",
            "t = 5 — P2 (3) beats P1 (7). Run P2, finishes at 8.",
            "t = 8 — only P1. Run 8 → 15.",
          ],
        },
        {
          gantt: {
            slices: [
              { p: "P1", from: 0, to: 1 },
              { p: "P2", from: 1, to: 2 },
              { p: "P3", from: 2, to: 4 },
              { p: "P4", from: 4, to: 5 },
              { p: "P2", from: 5, to: 8 },
              { p: "P1", from: 8, to: 15 },
            ],
          },
        },
        {
          table: {
            head: ["Process", "AT", "BT", "CT", "TAT", "WT", "RT"],
            rows: [
              ["P1", "0", "8", "15", "15", "7", "0"],
              ["P2", "1", "4", "8", "7", "3", "0"],
              ["P3", "2", "2", "4", "2", "0", "0"],
              ["P4", "3", "1", "5", "2", "1", "1"],
            ],
          },
        },
        {
          p: "**Averages** — TAT (15+7+2+2)/4 = **6.50**, WT (7+3+0+1)/4 = **2.75**, RT (0+0+0+1)/4 = **0.25**.",
        },
        {
          note: "Your notes print **avg RT 1.75**. The RT column itself (0, 0, 0, 1) is right — only the average is wrong; those four numbers give 0.25. CT, TAT and WT are all correct in the notes.",
          tone: "warn",
        },
        {
          p: "Compare with FCFS on the identical input: average waiting time falls from 7.00 to 2.75. That is the number to quote when asked why preemption is worth its overhead.",
        },
      ],
      tags: ["srtf", "numerical", "preemption"],
    },
    {
      id: "os-sched-n4",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "Round Robin with quantum = 2 — same process set. Find the averages.",
      short: "avg TAT 8.75 · avg WT 5.00 · avg RT 2.00",
      given: SET_A,
      find: ["Gantt chart", "Turnaround time", "Waiting time", "Response time"],
      solution: [
        {
          note: "**State your convention.** When a process arrives at the same instant another is preempted, this solution puts the **arriving process into the queue first**. Both sources leave this unstated, and the answer changes if you choose the other order — saying which one you are using is part of a good answer.",
        },
        {
          ol: [
            "0 → 2 — P1 runs a full quantum (rem 6). P2 arrived at 1, P3 at 2. Queue: P2, P3, P1.",
            "2 → 4 — P2 runs (rem 2). P4 arrived at 3. Queue: P3, P1, P4, P2.",
            "4 → 6 — P3 runs its last 2 units and **finishes at 6**.",
            "6 → 8 — P1 runs (rem 4). Queue: P4, P2, P1.",
            "8 → 9 — P4 needs only 1 unit. **Finishes at 9.**",
            "9 → 11 — P2 runs its last 2. **Finishes at 11.**",
            "11 → 15 — only P1 left; it runs its remaining 4 (two quanta back to back). **Finishes at 15.**",
          ],
        },
        {
          gantt: {
            slices: [
              { p: "P1", from: 0, to: 2 },
              { p: "P2", from: 2, to: 4 },
              { p: "P3", from: 4, to: 6 },
              { p: "P1", from: 6, to: 8 },
              { p: "P4", from: 8, to: 9 },
              { p: "P2", from: 9, to: 11 },
              { p: "P1", from: 11, to: 15 },
            ],
            note: "The final P1 block is two quanta merged — it is the only process left, so it is handed the CPU straight back.",
          },
        },
        {
          table: {
            head: ["Process", "AT", "BT", "CT", "TAT", "WT", "RT"],
            rows: [
              ["P1", "0", "8", "15", "15", "7", "0"],
              ["P2", "1", "4", "11", "10", "6", "1"],
              ["P3", "2", "2", "6", "4", "2", "2"],
              ["P4", "3", "1", "9", "6", "5", "5"],
            ],
          },
        },
        {
          p: "**Averages** — TAT (15+10+4+6)/4 = **8.75**, WT (7+6+2+5)/4 = **5.00**, RT (0+1+2+5)/4 = **2.00**.",
        },
        {
          note: "Your notes give P3 a completion time of 14 while the Gantt chart printed directly above shows P3 running 4 → 6. The table and the chart contradict each other, and the chart order in the notes (P4 before P1) matches neither standard queue convention. The figures above are recomputed from scratch.",
          tone: "warn",
        },
      ],
      tip: "RR's response time (2.00) beats SRTF's waiting time story in a different way — quote RT when the question is about interactivity, WT when it is about throughput.",
      tags: ["round robin", "numerical"],
    },
    {
      id: "os-sched-n5",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "Priority scheduling (non-preemptive, lower number = higher priority) — find the averages.",
      short: "avg TAT 9.50 · avg WT 5.50",
      given: {
        head: ["Process", "AT", "BT", "Priority"],
        rows: [
          ["P1", "0", "7", "3"],
          ["P2", "2", "4", "1"],
          ["P3", "4", "1", "4"],
          ["P4", "5", "4", "2"],
        ],
      },
      find: ["Gantt chart", "Turnaround time", "Waiting time", "Averages"],
      solution: [
        {
          ol: [
            "t = 0 — only P1 has arrived, so it runs regardless of priority. Non-preemptive, so it runs all 7 units: 0 → 7.",
            "t = 7 — P2 (pri 1), P3 (pri 4) and P4 (pri 2) are all waiting. Lowest number wins: P2. Run 7 → 11.",
            "t = 11 — P4 (pri 2) beats P3 (pri 4). Run 11 → 15.",
            "t = 15 — P3 last. Run 15 → 16.",
          ],
        },
        {
          gantt: {
            slices: [
              { p: "P1", from: 0, to: 7 },
              { p: "P2", from: 7, to: 11 },
              { p: "P4", from: 11, to: 15 },
              { p: "P3", from: 15, to: 16 },
            ],
          },
        },
        {
          table: {
            head: ["Process", "AT", "BT", "Pri", "CT", "TAT", "WT"],
            rows: [
              ["P1", "0", "7", "3", "7", "7", "0"],
              ["P2", "2", "4", "1", "11", "9", "5"],
              ["P3", "4", "1", "4", "16", "12", "11"],
              ["P4", "5", "4", "2", "15", "10", "6"],
            ],
          },
        },
        {
          p: "**Averages** — TAT (7+9+12+10)/4 = **9.50**, WT (0+5+11+6)/4 = **5.50**.",
        },
        {
          note: "Your notes print avg WT 4.00 and avg TAT 8.50 for this set. Recomputing from their own Gantt chart gives 5.50 and 9.50. Note P3: it needs 1 unit of CPU and waits 11 for it — a one-process illustration of why low priority means starvation risk.",
          tone: "warn",
        },
      ],
      tags: ["priority", "numerical"],
    },
    {
      id: "os-sched-n6",
      subtopic: "Numericals",
      type: "numerical",
      importance: "med",
      question: "SJF on the same four processes as the priority question — how much does it improve on FCFS?",
      short: "SJF: avg TAT 8.00, avg WT 4.00. FCFS on the same input: 8.75 and 4.75.",
      given: {
        head: ["Process", "AT", "BT"],
        rows: [
          ["P1", "0", "7"],
          ["P2", "2", "4"],
          ["P3", "4", "1"],
          ["P4", "5", "4"],
        ],
      },
      find: ["SJF averages", "FCFS averages", "The difference"],
      solution: [
        { p: "**FCFS** runs them in arrival order — P1, P2, P3, P4." },
        {
          gantt: {
            slices: [
              { p: "P1", from: 0, to: 7 },
              { p: "P2", from: 7, to: 11 },
              { p: "P3", from: 11, to: 12 },
              { p: "P4", from: 12, to: 16 },
            ],
          },
        },
        { p: "CT 7, 11, 12, 16 → TAT 7, 9, 8, 11 → **avg TAT 8.75**; WT 0, 5, 7, 7 → **avg WT 4.75**." },
        {
          p: "**SJF** — at t = 7, P2 (4), P3 (1) and P4 (4) are all waiting. P3 is shortest and goes first. P2 and P4 tie at 4, broken by arrival order.",
        },
        {
          gantt: {
            slices: [
              { p: "P1", from: 0, to: 7 },
              { p: "P3", from: 7, to: 8 },
              { p: "P2", from: 8, to: 12 },
              { p: "P4", from: 12, to: 16 },
            ],
          },
        },
        {
          table: {
            head: ["Process", "AT", "BT", "CT", "TAT", "WT"],
            rows: [
              ["P1", "0", "7", "7", "7", "0"],
              ["P2", "2", "4", "12", "10", "6"],
              ["P3", "4", "1", "8", "4", "3"],
              ["P4", "5", "4", "16", "11", "7"],
            ],
          },
        },
        { p: "**SJF averages** — TAT (7+10+4+11)/4 = **8.00**, WT (0+6+3+7)/4 = **4.00**." },
        {
          p: "Moving one 1-unit job ahead of a 4-unit job takes 0.75 off both averages. That is the entire intuition behind SJF: **short jobs first, because a short job delayed costs the same as a long job delayed but there is more of it to delay**.",
        },
        {
          note: "Your notes print avg WT 3.75 and avg TAT 7.75 for SJF here. The Gantt chart in the notes is right; the two averages are each 0.25 low.",
          tone: "warn",
        },
      ],
      tags: ["sjf", "fcfs", "numerical"],
    },

    /* ---------------------------- comparison ---------------------------- */
    {
      id: "os-sched-11",
      subtopic: "Comparison",
      type: "comparison",
      importance: "high",
      question: "Compare all seven CPU scheduling algorithms.",
      short: "FCFS simple, SJF/SRTF optimal but unknowable, RR responsive, Priority needs aging, MLFQ adaptive.",
      answer: [
        {
          table: {
            head: ["Algorithm", "Preemptive", "Picks by", "Strength", "Weakness", "Best for"],
            rows: [
              ["FCFS", "No", "Arrival time", "Simple, no starvation", "Convoy effect, high WT", "Batch systems"],
              ["SJF", "No", "Shortest burst", "Minimum average WT", "Needs burst time; starvation", "Batch systems"],
              ["SRTF", "Yes", "Shortest remaining", "Minimum average TAT", "Many context switches; starvation", "Interactive"],
              ["Priority", "Either", "Priority number", "Important work first", "Starvation without aging", "Real-time"],
              ["Round Robin", "Yes", "Time quantum", "Fair, bounded response time", "Context-switch overhead", "Time-sharing"],
              ["Multilevel Queue", "Either", "Fixed queue class", "Different algorithm per class", "Rigid; low queues starve", "Mixed workloads"],
              ["MLFQ", "Yes", "Behaviour + aging", "Adaptive, no starvation", "Hard to tune", "General-purpose OS"],
            ],
          },
        },
      ],
      tip: "There is no 'best' algorithm — the answer is always 'best for what metric'. Say which metric you are optimising and the question answers itself.",
      tags: ["comparison"],
    },
    {
      id: "os-sched-12",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "A process has been in the ready queue for minutes while others come and go. Which algorithm is running, and what fixes it?",
      short: "Starvation — SJF, SRTF or Priority. Aging fixes it.",
      answer: [
        {
          p: "This is **starvation**: a process that is always passed over because a steadier stream of more attractive processes keeps arriving.",
        },
        {
          ul: [
            "Under **SJF / SRTF** — a long job never becomes the shortest.",
            "Under **Priority** — a low-priority job never becomes the highest.",
            "Under **MLQ** — a low queue never runs while a higher one is non-empty.",
          ],
        },
        {
          p: "**Never under FCFS or Round Robin**, both of which guarantee everybody a turn. That is worth saying — it shows you know starvation is a property of the policy, not of bad luck.",
        },
        { p: "The fix is **aging**: raise a process's effective priority the longer it waits, so waiting itself eventually makes it the winner." },
      ],
      followUps: [
        {
          q: "Is starvation the same as deadlock?",
          a: "No. In deadlock nobody can proceed and the situation never resolves itself. In starvation the system is making progress — other processes are running fine — it is just not this one's turn, and it could resolve at any moment.",
        },
      ],
      tags: ["starvation", "aging", "scenario"],
    },
    {
      id: "os-sched-13",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "You see a Gantt chart where the arrival times run 0, 1, 2, 3 and the processes execute in exactly that order. Which algorithms could have produced it?",
      short:
        "FCFS always. Any other algorithm only if the burst times or priorities happen to agree with arrival order.",
      answer: [
        {
          p: "FCFS produces this by definition. But it is **not** proof of FCFS — every algorithm produces arrival order on the right input:",
        },
        {
          ul: [
            "**SJF** produces it if burst times are non-decreasing in arrival order.",
            "**Priority** produces it if priorities happen to follow arrival order.",
            "**Round Robin** produces it if every burst fits inside one quantum.",
          ],
        },
        {
          p: "The right answer to this question is therefore \"FCFS, most likely — but I would want the burst times before ruling the others out\". Interviewers ask this to see whether you check.",
        },
      ],
      tags: ["scenario", "gantt"],
    },
    {
      id: "os-sched-14",
      subtopic: "Basics",
      type: "why",
      importance: "med",
      question: "Why is context switching pure overhead, and what makes it expensive?",
      short:
        "No user work happens during it, and the real cost is the cache and TLB going cold, not the register copy.",
      answer: [
        {
          p: "During a context switch the CPU saves one process's registers and program counter into its PCB and loads another's. **No user work is done for that whole interval** — it is a tax paid for the illusion of concurrency.",
        },
        { p: "What it actually costs:" },
        {
          ul: [
            "Saving and restoring the register set — the visible, small part.",
            "**Cache pollution** — the new process's data evicts the old one's, so both run slowly afterwards.",
            "**TLB flush** — address translations cached for the old process are useless for the new one, so early memory accesses all miss.",
          ],
        },
        {
          note: "The register copy is microseconds. The cold cache and cold TLB are what really hurt, and that is the answer that separates a memorised reply from an understood one.",
        },
      ],
      tip: "This is the standard follow-up to any Round Robin question — 'so why not make the quantum tiny?' Have this answer ready.",
      tags: ["context switch", "cache", "tlb"],
    },

    /* -------------------------------- MCQs -------------------------------- */
    {
      id: "os-sched-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which scheduling algorithm can cause the convoy effect?",
      options: ["Round Robin", "SRTF", "FCFS", "MLFQ"],
      correct: 2,
      answer: [{ p: "FCFS. A long process at the head of the queue holds up every short process behind it." }],
      tags: ["fcfs", "mcq"],
    },
    {
      id: "os-sched-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Turnaround time is defined as:",
      options: [
        "Completion time − Arrival time",
        "Completion time − Burst time",
        "Burst time − Waiting time",
        "Arrival time + Burst time",
      ],
      correct: 0,
      answer: [{ p: "TAT = CT − AT. Waiting time then follows as WT = TAT − BT." }],
      tags: ["formula", "mcq"],
    },
    {
      id: "os-sched-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which scheduler controls the degree of multiprogramming?",
      options: ["Short-term", "Medium-term", "Long-term", "The dispatcher"],
      correct: 2,
      answer: [
        { p: "The long-term (job) scheduler, because it decides how many processes are admitted into main memory at all." },
      ],
      tags: ["scheduler", "mcq"],
    },
    {
      id: "os-sched-m4",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "If the Round Robin time quantum is made very large, RR behaves like:",
      options: ["SJF", "FCFS", "SRTF", "Priority scheduling"],
      correct: 1,
      answer: [
        {
          p: "FCFS. If the quantum exceeds every burst time, no process is ever preempted, so each runs to completion in arrival order.",
        },
      ],
      tags: ["round robin", "mcq"],
    },
    {
      id: "os-sched-m5",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which of these is NOT a job of the dispatcher?",
      options: [
        "Context switching",
        "Switching from kernel mode to user mode",
        "Deciding which process runs next",
        "Jumping to the right instruction in the chosen process",
      ],
      correct: 2,
      answer: [
        { p: "Deciding is the short-term scheduler's job. The dispatcher carries out the decision — it never makes one." },
      ],
      tags: ["dispatcher", "mcq"],
    },
  ],
};
