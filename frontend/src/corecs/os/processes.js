/*
 * Process Management.
 *
 * Source: "Operating System Notes.pdf" pp.8-14, "Os.pdf" p3,
 * "CORE CS triky question.pdf".
 *
 * Also carries the two IPC approaches that are about *design* rather than
 * about a call you make — shared memory and message passing. The mechanisms
 * you actually invoke live in System Calls & Linux.
 */

export default {
  id: "processes",
  name: "Process Management",
  importance: "high",
  icon: "problems",
  blurb:
    "What a process is, what the OS remembers about it, and what it costs to swap one for another.",
  source: "Operating System Notes pp.8-14 · Os.pdf p3",

  questions: [
    {
      id: "os-proc-01",
      subtopic: "Program vs process",
      type: "comparison",
      importance: "high",
      question: "What is the difference between a program and a process?",
      short:
        "A program is passive code on disk. A process is that code executing, with its own memory, registers and state.",
      answer: [
        {
          table: {
            head: ["", "Program", "Process"],
            rows: [
              ["Nature", "Passive — just instructions", "Active — an executing instance"],
              ["Lives in", "Disk (`.exe`, `.py`)", "Main memory"],
              ["Lifetime", "Until deleted", "Until it terminates"],
              ["Multiplicity", "One copy can be run many times", "Many processes can run the same program"],
              ["Has state?", "No", "Yes — PC, registers, memory, open files"],
            ],
          },
        },
        {
          note: "The analogy that lands: the movie is the program, a screening is the process. Two screens can show the same film, each with its own audience, projector and timing — just as two processes run the same program with their own memory, registers and state.",
        },
      ],
      tip: "'Passive' and 'active' are the words interviewers listen for.",
      tags: ["process", "program"],
    },
    {
      id: "os-proc-02",
      subtopic: "Process memory",
      type: "conceptual",
      importance: "high",
      question: "What does a process consist of in memory?",
      short: "Text, data, heap and stack — plus the PC and registers that say where it has got to.",
      answer: [
        {
          ul: [
            "**Text** — the program's compiled instructions. Read-only, fixed size.",
            "**Data** — global and static variables. Fixed size.",
            "**Heap** — memory from `malloc` / `new`. Grows upwards at runtime.",
            "**Stack** — local variables, parameters, return addresses. Grows downwards.",
          ],
        },
        { diagram: "process-memory" },
        {
          p: "Heap and stack grow towards each other into the same free space, which is exactly why a runaway recursion produces a **stack overflow** and a leak eventually exhausts the heap.",
        },
      ],
      followUps: [
        {
          q: "Which of these do two threads of one process share?",
          a: "Text, data and heap — all shared. Only the stack is private to each thread, along with its registers and program counter. That is the whole reason threads communicate without IPC and also why they corrupt each other so easily.",
        },
      ],
      tags: ["memory layout", "stack", "heap"],
    },
    {
      id: "os-proc-03",
      subtopic: "PCB",
      type: "definition",
      importance: "high",
      question: "What is a Process Control Block, and what does it hold?",
      short:
        "The OS's record of one process — everything needed to pause it and resume it exactly where it stopped.",
      answer: [
        {
          p: "The PCB is a kernel data structure created when a process is created and destroyed when it terminates. It holds everything the OS needs to know about that process.",
        },
        { diagram: "pcb" },
        {
          p: "It lives in **protected kernel memory**, unreachable from user mode — a process that could edit its own PCB could rewrite its own priority or memory limits.",
        },
        {
          note: "The **process table** is simply the array of every PCB in the system.",
        },
      ],
      tip: "The one-line version: the PCB is what makes context switching possible. Without it, a paused process could not be resumed.",
      tags: ["pcb", "process table"],
    },
    {
      id: "os-proc-04",
      subtopic: "Process states",
      type: "conceptual",
      importance: "high",
      question: "Describe the process states and the transitions between them.",
      short:
        "New → Ready → Running → Terminated, with Waiting for I/O and Suspended off to the side.",
      answer: [
        { diagram: "process-states" },
        {
          table: {
            head: ["State", "Meaning", "Leaves when"],
            rows: [
              ["New", "Being created; the OS is setting up memory and a PID", "Admitted to the ready queue"],
              ["Ready", "In memory, waiting only for the CPU", "The scheduler dispatches it"],
              ["Running", "Executing on the CPU right now", "It is preempted, blocks, or exits"],
              ["Waiting / blocked", "Waiting for I/O or an event", "The event completes → back to Ready"],
              ["Terminated", "Finished or killed; resources released", "—"],
              ["Suspended", "Swapped out to disk by the OS", "Swapped back in"],
            ],
          },
        },
        {
          note: "There is **no arrow from Waiting straight to Running**, and that trips people up. A process whose I/O has finished goes back to the *ready* queue and waits its turn with everybody else.",
        },
      ],
      tip: "Draw it. This is the single most commonly asked OS diagram, and drawing it while you talk is worth more than describing it.",
      tags: ["process states", "diagram"],
    },
    {
      id: "os-proc-05",
      subtopic: "Context switching",
      type: "definition",
      importance: "high",
      question: "What is context switching?",
      short:
        "Saving one process's state into its PCB and loading another's out of its own, so the CPU can change process.",
      answer: [
        { diagram: "context-switch" },
        { p: "Two halves, always:" },
        {
          ol: [
            "The CPU **saves** the current process's registers, program counter and stack pointer into its PCB.",
            "The kernel **loads** the next process's saved values out of its PCB and jumps to where it left off.",
          ],
        },
        { p: "It happens on a timer interrupt, on an I/O block, when a higher-priority process arrives, and on a system call." },
        {
          note: "It is **pure overhead** — no user work happens during a switch. That is why every scheduling design is partly an argument about how often to do it.",
        },
      ],
      tags: ["context switch"],
    },
    {
      id: "os-proc-06",
      subtopic: "Context switching",
      type: "why",
      importance: "high",
      question: "Why is context switching expensive?",
      short:
        "The register copy is the cheap part. The real cost is the cache and TLB going cold for both processes.",
      answer: [
        {
          ul: [
            "**Saving and restoring registers** — real, but measured in microseconds.",
            "**Cache pollution** — the incoming process's data evicts the outgoing one's, so both run slowly for a while afterwards.",
            "**TLB flush** — cached address translations belong to the old process's page table and are useless to the new one, so its first memory accesses all miss.",
            "**Pipeline flush** — speculative work in flight is discarded.",
          ],
        },
        {
          note: "The indirect costs dominate. Quoting them is what separates an understood answer from a memorised one, and it is the reason a tiny Round Robin quantum destroys performance rather than merely denting it.",
        },
      ],
      tip: "Expect this immediately after any Round Robin question.",
      tags: ["context switch", "cache", "tlb", "why"],
    },
    {
      id: "os-proc-07",
      subtopic: "Lifecycle",
      type: "how",
      importance: "med",
      question: "What happens when a process is created, and when it terminates?",
      short:
        "Creation: allocate a PID, build a PCB, allocate memory, mark it Ready. Termination: release resources, remove the PCB, notify the parent.",
      answer: [
        { p: "**Creation:**" },
        {
          ol: [
            "Allocate a unique PID.",
            "Create and initialise the PCB.",
            "Allocate memory for text, data, heap and stack.",
            "Initialise the program counter and registers.",
            "Set the state to New, then move it to Ready.",
            "Insert it into the ready queue.",
          ],
        },
        { p: "**Termination:**" },
        {
          ol: [
            "Collect the exit status.",
            "Release memory, open files and I/O devices.",
            "Update accounting information.",
            "Remove the PCB from the process table.",
            "Notify the parent process.",
          ],
        },
        {
          p: "Reasons a process ends: normal completion, an error exit, a fatal error such as dividing by zero, being killed by another process, or exceeding a time limit.",
        },
      ],
      tags: ["process creation", "termination"],
    },
    {
      id: "os-proc-08",
      subtopic: "Process behaviour",
      type: "comparison",
      importance: "med",
      question: "CPU-bound vs I/O-bound processes?",
      short:
        "CPU-bound: long bursts, few I/O calls. I/O-bound: short bursts, waits constantly. A good mix keeps both the CPU and the devices busy.",
      answer: [
        {
          table: {
            head: ["", "CPU-bound", "I/O-bound"],
            rows: [
              ["Spends its time", "Computing", "Waiting for I/O"],
              ["CPU bursts", "Long", "Short and frequent"],
              ["Example", "Video encoding, matrix maths", "A text editor, a database client"],
              ["Wants", "Long uninterrupted slices", "To be dispatched quickly, then get out of the way"],
            ],
          },
        },
        {
          p: "The long-term scheduler tries to keep a balance. All CPU-bound and the disks sit idle; all I/O-bound and the CPU does. This is also why MLFQ works: an I/O-bound process gives the CPU back early and stays in the high-priority queue without anyone having to classify it.",
        },
      ],
      tags: ["cpu bound", "io bound"],
    },
    {
      id: "os-proc-09",
      subtopic: "IPC",
      type: "comparison",
      importance: "med",
      question: "Shared memory vs message passing?",
      short:
        "Shared memory is fast and needs your own synchronisation; message passing is slower, safer, and works across machines.",
      answer: [
        {
          table: {
            head: ["", "Shared memory", "Message passing"],
            rows: [
              ["Kernel involved per transfer", "No — only to set it up", "Yes, every message"],
              ["Speed", "Fastest available", "Slower, kernel copies data"],
              ["Synchronisation", "Your problem", "Handled by the kernel"],
              ["Across machines", "No", "Yes"],
              ["Risk", "Race conditions, corruption", "Message loss, ordering"],
            ],
          },
        },
        {
          p: "Everything that makes shared memory fast is the same thing that makes it dangerous: the kernel is not in the loop, so nothing serialises two writers but the synchronisation you add yourself.",
        },
      ],
      tags: ["ipc", "shared memory", "message passing"],
    },
    {
      id: "os-proc-10",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "A process is shown in the Running state on one core and Ready on another at the same instant. What is wrong with that picture?",
      short: "A process has one state at a time. That would be two threads, not one process in two states.",
      answer: [
        {
          p: "A process is in **exactly one** state at any instant, because the state lives in a single field of a single PCB.",
        },
        {
          p: "What can genuinely happen is two **threads** of the same process running on two cores — that is true parallelism, and each thread has its own state in its own TCB. The process is not in two states; two of its threads are in one state each.",
        },
      ],
      tags: ["scenario", "process states", "threads"],
    },
    {
      id: "os-proc-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which of these is NOT stored in the PCB?",
      options: ["CPU registers", "Program counter", "Stack pointer", "The instruction set architecture"],
      correct: 3,
      answer: [
        {
          p: "The ISA is a property of the CPU, not of a process. The PCB holds per-process state only.",
        },
      ],
      tags: ["mcq", "pcb"],
    },
    {
      id: "os-proc-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "When a context switch happens, the PCB of the outgoing process is:",
      options: ["Deleted", "Updated and kept", "Moved to user space", "Flushed from memory"],
      correct: 1,
      answer: [
        {
          p: "Updated with its current registers and program counter, and kept — that saved state is exactly what lets it resume later.",
        },
      ],
      tags: ["mcq", "context switch"],
    },
    {
      id: "os-proc-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A process waiting for a disk read to finish is in which state?",
      options: ["Ready", "Running", "Waiting", "New"],
      correct: 2,
      answer: [
        {
          p: "Waiting (blocked). It is not competing for the CPU at all — when the read completes it returns to Ready, not straight to Running.",
        },
      ],
      tags: ["mcq", "process states"],
    },
  ],
};
