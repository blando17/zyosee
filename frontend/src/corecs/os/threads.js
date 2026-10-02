/*
 * Threads and Multithreading.
 *
 * Source: "Operating System Notes.pdf" pp.10-14, "Os.pdf" p4,
 * "CORE CS triky question.pdf".
 */

export default {
  id: "threads",
  name: "Threads & Multithreading",
  importance: "high",
  icon: "pair",
  blurb:
    "Several lines of execution inside one process — what they share, what they do not, and why that is both the point and the danger.",
  source: "Operating System Notes pp.10-14 · Os.pdf p4",

  questions: [
    {
      id: "os-thr-01",
      subtopic: "Threads",
      type: "definition",
      importance: "high",
      question: "What is a thread?",
      short:
        "The smallest unit of CPU execution — a line of execution inside a process, sharing that process's memory.",
      answer: [
        {
          p: "A thread is a lightweight unit of execution within a process. It has its own program counter, registers and stack, but shares the process's code, data, heap and open files.",
        },
        {
          note: "The analogy: the process is a team working on one project. They share the whiteboard, the tools and the room (code, data, files), but each person has their own notebook and their own place in the work (stack, registers, PC).",
        },
        {
          p: "Threads have states of their own — ready, running, waiting — just as processes do.",
        },
      ],
      tags: ["thread", "definition"],
    },
    {
      id: "os-thr-02",
      subtopic: "Threads",
      type: "conceptual",
      importance: "high",
      question: "What do threads share, and what is private to each?",
      short:
        "Shared: code, data, heap, open files, signals. Private: thread ID, program counter, registers, stack.",
      answer: [
        {
          table: {
            head: ["Shared by all threads in a process", "Private to each thread"],
            rows: [
              ["Code (text) section", "Thread ID"],
              ["Data section — globals and statics", "Program counter"],
              ["Heap — everything from malloc", "Register set"],
              ["Open files and file descriptors", "Stack — locals, parameters, return addresses"],
              ["Signals and signal handlers", "Thread Control Block (TCB)"],
            ],
          },
        },
        {
          p: "This split is the whole of thread programming. Shared heap is why threads communicate without IPC; private stacks are why each can be somewhere different in the code; shared everything-else is why one thread can corrupt another's data and no page table stops it.",
        },
      ],
      tip: "If you can only remember one thing: **the stack is private, the heap is shared.** Almost every threading question reduces to that.",
      tags: ["thread", "shared memory", "stack"],
    },
    {
      id: "os-thr-03",
      subtopic: "Process vs thread",
      type: "comparison",
      importance: "high",
      question: "What is the difference between a process and a thread?",
      short:
        "A process has its own address space; threads share one. Threads are cheaper to create and switch, and far less isolated.",
      answer: [
        {
          table: {
            head: ["", "Process", "Thread"],
            rows: [
              ["Definition", "An independent executing program", "A unit of execution inside a process"],
              ["Address space", "Its own", "Shared with sibling threads"],
              ["Communication", "IPC — complex and slower", "Shared memory — direct and fast"],
              ["Creation cost", "High", "Low"],
              ["Context switch", "Slow — the address space changes, so the TLB is flushed", "Fast — same address space"],
              ["Crash impact", "Contained to that process", "Can bring down the whole process"],
              ["Control block", "PCB", "TCB"],
            ],
          },
        },
        {
          note: "Why a thread switch is cheaper is worth saying out loud: the **address space does not change**, so the page tables stay valid and the TLB is not flushed. That, not the smaller register set, is where the saving comes from.",
        },
      ],
      tip: "This is the single most asked OS question. Have the table, and have the TLB reason ready for the follow-up.",
      followUps: [
        {
          q: "When would you use processes rather than threads?",
          a: "When isolation matters more than speed. A crashed thread takes the whole process down and any thread can corrupt any other's data, so anything running untrusted or independently-failing work — a browser tab, a worker handling untrusted input — is better as a process.",
        },
      ],
      tags: ["process", "thread", "comparison"],
    },
    {
      id: "os-thr-04",
      subtopic: "ULT and KLT",
      type: "comparison",
      importance: "high",
      question: "User-level threads vs kernel-level threads?",
      short:
        "ULTs are managed by a library and are fast but block the whole process; KLTs are managed by the kernel, cost more, and block individually.",
      answer: [
        {
          table: {
            head: ["", "User-level (ULT)", "Kernel-level (KLT)"],
            rows: [
              ["Managed by", "A user-space thread library", "The kernel"],
              ["Kernel knows about them", "No", "Yes"],
              ["Context switch", "Fast — no system call", "Slower — a system call each time"],
              ["If one thread blocks", "**The whole process blocks**", "Only that thread blocks"],
              ["True parallelism on multicore", "No", "Yes"],
              ["Creation cost", "Very low", "Higher"],
              ["Example", "Java green threads, POSIX user threads", "Windows threads, Linux threads"],
            ],
          },
        },
        {
          note: "The blocking row is the whole argument. The kernel only sees one schedulable entity for a ULT process, so when any ULT makes a blocking system call the kernel blocks the process — and every other thread in it, which were all runnable.",
        },
      ],
      tags: ["ult", "klt", "threads"],
    },
    {
      id: "os-thr-05",
      subtopic: "Threading models",
      type: "comparison",
      importance: "med",
      question: "What are the multithreading models?",
      short:
        "Many-to-one, one-to-one, many-to-many and two-level — how user threads map onto kernel threads.",
      answer: [
        { diagram: "thread-models" },
        {
          table: {
            head: ["Model", "Mapping", "Strength", "Weakness"],
            rows: [
              ["Many-to-one", "Many user threads → 1 kernel thread", "Very cheap to switch", "One block stops everything; no parallelism"],
              ["One-to-one", "Each user thread → its own kernel thread", "True parallelism; independent blocking", "Kernel threads are expensive, so the count is capped"],
              ["Many-to-many", "Many user threads → a smaller pool of kernel threads", "Parallelism without one kernel thread each", "Complex to implement"],
              ["Two-level", "Many-to-many, plus some threads bound one-to-one", "Lets latency-sensitive threads be pinned", "Most complex of the four"],
            ],
          },
        },
        {
          p: "Linux and Windows both use **one-to-one** today. Kernel threads got cheap enough that the complexity of many-to-many stopped paying for itself.",
        },
      ],
      tags: ["threading models"],
    },
    {
      id: "os-thr-06",
      subtopic: "Multithreading",
      type: "why",
      importance: "high",
      question: "Why use multithreading?",
      short:
        "Responsiveness, cheap sharing, cheap creation, and real parallelism on multiple cores.",
      answer: [
        {
          ul: [
            "**Responsiveness** — one thread can keep the interface alive while another does slow work. A word processor spell-checks and auto-saves without the cursor stuttering.",
            "**Resource sharing** — threads share memory by default, so no IPC is needed to pass data between them.",
            "**Economy** — creating and switching a thread is far cheaper than a process.",
            "**Scalability** — on a multicore CPU, threads genuinely run at the same time.",
          ],
        },
        {
          note: "On a **single core**, multithreading still buys responsiveness through concurrency — the CPU interleaves threads so a blocked one does not freeze the rest. On **multiple cores** it additionally buys parallelism. Concurrency and parallelism are not the same thing, and that distinction is often the follow-up.",
        },
      ],
      followUps: [
        {
          q: "Why is multithreading faster than multiprocessing?",
          a: "Threads share an address space, so communication is a memory write rather than a kernel-mediated copy, and switching between them does not flush the TLB. Creation is cheaper too. The price is that there is no isolation left.",
        },
      ],
      tags: ["multithreading", "concurrency", "parallelism"],
    },
    {
      id: "os-thr-07",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "med",
      question:
        "A web server handles each request in its own thread. One request crashes with a segfault. What happens to the others?",
      short: "All of them die. A segfault kills the process, and every thread lives inside it.",
      answer: [
        {
          p: "An unhandled segmentation fault terminates the **process**, and every thread in that process goes with it — including the hundreds of requests that were perfectly fine.",
        },
        {
          p: "This is the isolation trade in one sentence. It is also why browsers moved from one process with many tab-threads to a process per tab: a crash should cost one tab, not the browser.",
        },
        {
          p: "Mitigations: validate inputs, use a memory-safe language, or isolate risky work in a separate process and talk to it over IPC.",
        },
      ],
      tags: ["scenario", "threads", "isolation"],
    },
    {
      id: "os-thr-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which of these is private to each thread?",
      options: ["The heap", "The code section", "The stack", "Open file descriptors"],
      correct: 2,
      answer: [
        { p: "The stack. Code, data, heap and file descriptors are all shared across the process's threads." },
      ],
      tags: ["mcq", "threads"],
    },
    {
      id: "os-thr-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In the many-to-one model, one thread making a blocking system call:",
      options: [
        "Blocks only itself",
        "Blocks the entire process",
        "Is automatically migrated to another kernel thread",
        "Causes a segmentation fault",
      ],
      correct: 1,
      answer: [
        {
          p: "Blocks the entire process. The kernel only sees one schedulable entity, so it blocks that — and every user thread mapped onto it.",
        },
      ],
      tags: ["mcq", "threading models"],
    },
  ],
};
