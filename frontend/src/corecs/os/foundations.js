/*
 * OS Foundations.
 *
 * Source: "Operating System Notes.pdf" pp.3-7, "Os.pdf" pp.1-2,
 * "Operating Systems Overview" pp.1-3.
 *
 * The Overview document is the only source that frames an OS as abstractions,
 * mechanisms and policies, and that framing is worth keeping — it is the
 * difference between listing what an OS does and explaining how it is built.
 */

export default {
  id: "foundations",
  name: "OS Foundations",
  importance: "med",
  icon: "gear",
  blurb:
    "What an operating system is, what it is for, and how kernels are structured. Usually the opening question, rarely the deciding one.",
  source: "Operating System Notes pp.3-7 · Os.pdf pp.1-2 · Overview pp.1-3",

  questions: [
    {
      id: "os-found-01",
      subtopic: "What an OS is",
      type: "definition",
      importance: "high",
      question: "What is an operating system?",
      short:
        "System software sitting between applications and hardware, managing resources and enforcing isolation.",
      answer: [
        {
          p: "An operating system is a layer of system software that has **privileged access to the hardware**, hides its complexity from applications, and manages it on their behalf according to some policy.",
        },
        { p: "Three jobs, and it is worth naming all three:" },
        {
          ul: [
            "**Abstraction** — a file instead of disk sectors, a socket instead of a network card, a process instead of a CPU.",
            "**Resource management** — deciding who gets the CPU, the memory and the devices, and when.",
            "**Isolation and protection** — one program cannot read or overwrite another's memory, and a crashing program does not take the machine with it.",
          ],
        },
        { diagram: "user-kernel" },
      ],
      tip: "Do not stop at 'interface between user and hardware'. Adding isolation and resource arbitration is what turns a memorised line into an answer.",
      followUps: [
        {
          q: "What would go wrong without one?",
          a: "Every application would carry its own hardware driver code; any program could monopolise the CPU or memory; and nothing would stop one program overwriting another's memory. Larger programs, unfair sharing, and no protection.",
        },
      ],
      tags: ["definition", "kernel", "isolation"],
    },
    {
      id: "os-found-02",
      subtopic: "What an OS is",
      type: "conceptual",
      importance: "med",
      question: "Name the main functions of an operating system.",
      short:
        "Process, memory, file, device, storage and security management, plus scheduling and the user interface.",
      answer: [
        {
          ul: [
            "**Process management** — creating, scheduling and terminating processes.",
            "**Memory management** — allocating and reclaiming RAM, and keeping processes out of each other's memory.",
            "**File management** — organising, storing and retrieving data on disk.",
            "**Device management** — driving I/O hardware through device drivers.",
            "**Secondary storage management** — disk space allocation.",
            "**Security and protection** — controlling who may access what.",
            "**Error detection and handling** — noticing faults and responding to them.",
            "**User interface** — a shell, a GUI, or both.",
          ],
        },
      ],
      tags: ["functions"],
    },
    {
      id: "os-found-03",
      subtopic: "Design",
      type: "conceptual",
      importance: "med",
      question: "What are abstractions, mechanisms and policies in OS design?",
      short:
        "Abstraction = what you are given; mechanism = the operations on it; policy = how the mechanism is used.",
      answer: [
        {
          table: {
            head: ["", "Meaning", "Memory example"],
            rows: [
              ["Abstraction", "The thing applications are given instead of the hardware", "A memory page"],
              ["Mechanism", "The operations available on it", "Allocate, map to a process, evict"],
              ["Policy", "How the mechanism is used to decide", "Least Recently Used"],
            ],
          },
        },
        {
          p: "The design principle that falls out of this is **separation of mechanism from policy**: build flexible mechanisms that support many policies, so the same eviction machinery can run LRU, LFU or random without being rewritten.",
        },
        {
          note: "This is the framing that makes 'why is LRU a policy and not a feature' answerable, and it is the one thing the cheat-sheets leave out entirely.",
        },
      ],
      tip: "Worth volunteering unprompted. Very few candidates describe an OS in these terms, and it immediately reads as understanding rather than recall.",
      tags: ["design", "policy", "mechanism"],
    },
    {
      id: "os-found-04",
      subtopic: "Types of OS",
      type: "comparison",
      importance: "med",
      question: "What are the main types of operating system?",
      short:
        "Batch, multiprogramming, multitasking / time-sharing, real-time, distributed, network and embedded.",
      answer: [
        {
          table: {
            head: ["Type", "What it does", "Example"],
            rows: [
              ["Batch", "Runs jobs in batches with no user interaction", "IBM OS/360"],
              ["Multiprogramming", "Several programs in memory; the CPU switches when one blocks", "Early UNIX"],
              ["Multitasking / time-sharing", "Several programs share the CPU in small time slices", "UNIX, Linux"],
              ["Real-time", "Responds within a guaranteed deadline", "VxWorks, QNX"],
              ["Distributed", "Many machines presented as one system", "Amoeba, Plan 9"],
              ["Network", "Provides shared services over a network", "Windows Server"],
              ["Embedded", "Fixed purpose, limited resources", "Android, iOS, FreeRTOS"],
            ],
          },
        },
        {
          note: "**Multiprogramming vs multitasking** is the pair worth being precise about. Multiprogramming switches when a process *blocks*; multitasking switches on a *timer* as well, which is what makes it feel interactive.",
        },
      ],
      followUps: [
        {
          q: "Is a real-time OS just a fast OS?",
          a: "No — it is a predictable one. An RTOS guarantees a bounded worst-case response time; it may well be slower on average than a general-purpose OS. Hard real-time treats a missed deadline as a failure, soft real-time treats it as degraded quality.",
        },
      ],
      tags: ["types", "rtos"],
    },
    {
      id: "os-found-05",
      subtopic: "Kernel",
      type: "definition",
      importance: "high",
      question: "What is a kernel?",
      short:
        "The part of the OS that runs in privileged mode and talks to the hardware directly. Loaded first at boot.",
      answer: [
        {
          ul: [
            "The **core** of the OS, and the first program loaded at boot.",
            "Runs in **kernel mode** — full access to hardware, memory and I/O.",
            "Manages the CPU, memory, devices and processes.",
            "Provides system calls and handles interrupts.",
          ],
        },
        {
          p: "Everything else — the shell, the window manager, the compiler — is an ordinary program running in user mode that reaches the kernel through system calls.",
        },
      ],
      tip: "'The kernel is the heart of the OS' is a line, not an answer. Say what privilege it has and what that privilege buys.",
      tags: ["kernel"],
    },
    {
      id: "os-found-06",
      subtopic: "Kernel",
      type: "comparison",
      importance: "high",
      question: "Compare monolithic, microkernel, layered and modular kernel architectures.",
      short:
        "Monolithic: everything in kernel space, fast but fragile. Microkernel: minimal kernel, services in user space, safe but IPC-heavy. Layered: each layer uses the one below. Modular: loadable modules in kernel space.",
      answer: [
        {
          table: {
            head: ["", "Services run in", "Performance", "Reliability", "Example"],
            rows: [
              ["Monolithic", "Kernel space, one big program", "High — direct calls", "Low — one bug can take down the system", "Traditional UNIX, MS-DOS"],
              ["Microkernel", "User space, as separate servers", "Lower — message passing", "High — a crashed server restarts", "MINIX, QNX, Mach, L4"],
              ["Layered", "Layer by layer", "Moderate", "Moderate — easy to verify", "THE, Multics"],
              ["Modular", "Kernel space, as loadable modules", "High", "High", "Linux, Solaris, Windows NT"],
            ],
          },
        },
        { diagram: "os-architectures" },
        {
          note: "Linux is **monolithic and modular** at the same time, which sounds like a contradiction and is not: everything runs in one kernel address space (monolithic), but drivers can be loaded and unloaded at runtime as modules. That nuance is often the real question.",
        },
      ],
      followUps: [
        {
          q: "Microkernels are safer — so why is Linux monolithic?",
          a: "Message passing between user-space servers costs a mode switch each way, and that cost falls on every file read and every packet. The performance gap is why the design that wins on paper lost in practice; modular monolithic kernels got most of the flexibility without paying it.",
        },
      ],
      tags: ["kernel", "microkernel", "monolithic"],
    },
    {
      id: "os-found-07",
      subtopic: "Modes",
      type: "comparison",
      importance: "high",
      question: "User mode vs kernel mode?",
      short:
        "Kernel mode has full hardware access; user mode is restricted. The CPU enforces it, and a system call is the only legitimate way across.",
      answer: [
        {
          table: {
            head: ["", "User mode", "Kernel mode"],
            rows: [
              ["Privilege", "Restricted", "Full"],
              ["Can access hardware directly", "No", "Yes"],
              ["Who runs here", "Applications", "The OS kernel"],
              ["Effect of a crash", "That process dies", "The system may die"],
              ["Enters the other by", "A system call, or a trap / interrupt", "Returning to user mode"],
            ],
          },
        },
        {
          p: "This is enforced by a bit in a **hardware** register, not by the OS asking nicely. A user-mode instruction that tries a privileged operation traps into the kernel instead of executing.",
        },
      ],
      tip: "The key word is 'hardware-enforced'. If protection were software-enforced, any program could turn it off.",
      tags: ["user mode", "kernel mode", "protection"],
    },
    {
      id: "os-found-08",
      subtopic: "Why",
      type: "why",
      importance: "med",
      question: "Why is kernel mode risky?",
      short:
        "Nothing checks kernel code — a bug there corrupts memory, hardware state or the whole system, not just one process.",
      answer: [
        {
          p: "Code in kernel mode has full access to every byte of memory and every device. There is no higher authority to catch a mistake, so a null dereference that would kill one process in user mode instead panics the machine.",
        },
        {
          p: "That is exactly why OSes keep the privileged part as small as they can get away with, and why a badly written driver is one of the commonest causes of a kernel crash — a driver is third-party code running with full privilege.",
        },
      ],
      tags: ["kernel mode", "why"],
    },
    {
      id: "os-found-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which OS structure runs every service inside one large kernel?",
      options: ["Microkernel", "Modular", "Monolithic", "Layered"],
      correct: 2,
      answer: [{ p: "Monolithic — every service shares one kernel address space and calls into the others directly." }],
      tags: ["mcq", "kernel"],
    },
    {
      id: "os-found-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Multiprogramming means:",
      options: [
        "Running programs strictly in sequence",
        "Keeping several programs in memory so the CPU always has work",
        "Running only one program at a time",
        "Running programs on several machines",
      ],
      correct: 1,
      answer: [
        {
          p: "Keeping several programs resident so that when one blocks on I/O the CPU can switch to another rather than idling.",
        },
      ],
      tags: ["mcq", "multiprogramming"],
    },
    {
      id: "os-found-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which is the best fit for controlling an industrial robot?",
      options: ["Batch OS", "Time-sharing OS", "Real-time OS", "Distributed OS"],
      correct: 2,
      answer: [
        { p: "A real-time OS — the robot needs a guaranteed bounded response, not the best average throughput." },
      ],
      tags: ["mcq", "rtos"],
    },
  ],
};
