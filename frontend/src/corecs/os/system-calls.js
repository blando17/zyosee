import { UNANSWERED } from "../schema.js";

/*
 * System Calls and Linux.
 *
 * Source: "Operating System Notes.pdf" pp.5-6, "Os.pdf" pp.19-20,
 * "Operating Systems Overview" pp.3-5.
 *
 * This topic also absorbs the IPC mechanisms you actually invoke — pipes,
 * sockets, signals and message queues — because that is where they get asked.
 *
 * SEVERAL QUESTIONS HERE HAVE NO ANSWER IN THE NOTES.
 *
 * `Os.pdf` p20 lists twenty advanced interview questions and answers none of
 * them, and six Linux topics on the priority list are named nowhere in any of
 * the four documents. Rather than drop real interview questions or invent
 * answers for them, they ship marked `UNANSWERED` and the card says so.
 */

export default {
  id: "system-calls",
  name: "System Calls & Linux",
  importance: "high",
  icon: "door",
  blurb:
    "The only door from a user program into the kernel — and the Linux commands and calls that walk through it.",
  source: "Operating System Notes pp.5-6 · Os.pdf pp.19-20 · Overview pp.3-5",

  questions: [
    {
      id: "os-sys-01",
      subtopic: "System calls",
      type: "definition",
      importance: "high",
      question: "What is a system call?",
      short:
        "A controlled way for a user program to ask the kernel to do something it has no privilege to do itself.",
      answer: [
        {
          p: "User programs cannot touch I/O devices, allocate physical memory or create processes — those are privileged operations. A **system call** is the mechanism by which a program requests one of them from the kernel.",
        },
        {
          p: "Making one triggers a **trap**: a deliberate software interrupt that switches the CPU from user mode to kernel mode, runs the handler, and switches back with the result.",
        },
        { diagram: "syscall-flow" },
        {
          p: "Examples: `fork`, `exec`, `exit`, `wait`, `open`, `read`, `write`, `getpid`.",
        },
      ],
      tip: "Say 'trap' and 'mode switch'. A system call is not a function call — the whole point is the privilege transition.",
      followUps: [
        {
          q: "Is printf() a system call?",
          a: "No. `printf` is a C library function that formats the string and then calls `write`, which is the system call. Library functions are ordinary user-mode code; only the thing that traps into the kernel is a system call.",
        },
      ],
      tags: ["system call", "trap", "mode switch"],
    },
    {
      id: "os-sys-02",
      subtopic: "System calls",
      type: "conceptual",
      importance: "high",
      question: "What are the categories of system call?",
      short:
        "Process control, file management, device management, information maintenance, communication and protection.",
      answer: [
        {
          table: {
            head: ["Category", "What it does", "Linux", "Windows"],
            rows: [
              ["Process control", "Create, run and end processes", "`fork()`, `execve()`, `exit()`, `wait()`", "`CreateProcess()`, `ExitProcess()`"],
              ["File management", "Open, read, write, close files", "`open()`, `read()`, `write()`, `close()`", "`CreateFile()`, `ReadFile()`"],
              ["Device management", "Control hardware devices", "`ioctl()`, `read()`, `write()`", "`SetConsoleMode()`, `ReadConsole()`"],
              ["Information maintenance", "Get or set system and process data", "`getpid()`, `uname()`, `time()`", "`GetProcessId()`, `GetSystemInfo()`"],
              ["Communication", "Inter-process communication", "`pipe()`, `shmget()`, `socket()`", "`CreatePipe()`, `CreateNamedPipe()`"],
              ["Protection", "Permissions and ownership", "`chmod()`, `umask()`, `chown()`", "—"],
            ],
          },
        },
        {
          note: "Learn the **six categories** and two or three examples each. Nobody is asked to list every call, and reciting them reads worse than knowing the shape.",
        },
      ],
      tags: ["system call", "categories"],
    },
    {
      id: "os-sys-03",
      subtopic: "Process calls",
      type: "how",
      importance: "high",
      question: "How does fork() work, and why does it return twice?",
      short:
        "It duplicates the calling process. The child gets 0, the parent gets the child's PID, −1 on failure.",
      answer: [
        {
          p: "`fork()` creates a new process by **duplicating the caller**. Both continue from the same line — which is why one call appears to return twice.",
        },
        {
          table: {
            head: ["Return value", "Means"],
            rows: [
              ["`0`", "You are the child"],
              ["`> 0`", "You are the parent; the value is the child's PID"],
              ["`< 0`", "The fork failed"],
            ],
          },
        },
        {
          code: `pid_t pid = fork();

if (pid == 0) {
    printf("Child process\\n");
} else if (pid > 0) {
    printf("Parent process, child is %d\\n", pid);
} else {
    perror("fork failed");
}`,
          lang: "c",
        },
        { diagram: "fork-tree" },
        {
          p: "The child is a copy, not a share: it gets its own address space. Modern kernels make that cheap with **copy-on-write** — the pages are shared read-only until one side writes to them.",
        },
      ],
      tip: "The classic trick question: how many processes does `fork(); fork();` produce? Four — each fork doubles the count, so n forks give 2ⁿ.",
      followUps: [
        {
          q: "What is the difference between fork() and exec()?",
          a: "`fork()` creates a new process and returns twice. `exec()` replaces the current process image with a new program — same PID, different program — and does not return at all unless it fails. The shell uses both: fork to make a process, exec to turn it into the command you typed.",
        },
      ],
      tags: ["fork", "exec", "process"],
    },
    {
      id: "os-sys-04",
      subtopic: "Process calls",
      type: "conceptual",
      importance: "high",
      question: "What do exec() and wait() do?",
      short:
        "exec() replaces the running program with a different one; wait() blocks a parent until a child finishes and collects its exit status.",
      answer: [
        {
          p: "**`exec()`** overlays the current process with a new program. The PID does not change, the program does. It only returns if it *failed* — a successful `exec` never comes back, because there is nothing left to come back to.",
        },
        {
          code: `printf("Before exec\\n");
execlp("/bin/ls", "ls", "-l", NULL);
printf("After exec\\n");   /* never printed on success */`,
          lang: "c",
        },
        {
          p: "**`wait()`** blocks the parent until a child terminates and collects the child's exit status. That collection is the whole point — without it the child becomes a zombie.",
        },
        {
          code: `int status;
pid_t pid = wait(&status);
printf("Child %d exited with %d\\n", pid, WEXITSTATUS(status));`,
          lang: "c",
        },
      ],
      tags: ["exec", "wait", "process"],
    },
    {
      id: "os-sys-05",
      subtopic: "IPC",
      type: "comparison",
      importance: "high",
      question: "Compare the ways two processes can communicate.",
      short:
        "Shared memory is fastest but needs synchronisation; message passing is safer; pipes, sockets, signals and message queues each fit a different shape of problem.",
      answer: [
        {
          table: {
            head: ["Mechanism", "Direction", "Speed", "Across machines?", "Typical use"],
            rows: [
              ["Shared memory", "Both ways", "Fastest — no copying", "No", "High-throughput local work"],
              ["Message passing", "Both ways", "Slower — kernel copies", "Yes", "Client-server, distributed systems"],
              ["Pipe", "One way", "Moderate", "No", "`ls | grep txt`"],
              ["Named pipe (FIFO)", "One way", "Moderate", "No", "Unrelated processes on one machine"],
              ["Socket", "Full duplex", "Moderate", "Yes", "Web servers, chat, multiplayer games"],
              ["Signal", "One way, no data", "Fast", "No", "Shutdown, alarms, `SIGKILL`"],
              ["Message queue", "Both ways", "Moderate", "No", "Task queues, print spoolers"],
            ],
          },
        },
        {
          note: "**Shared memory is fast precisely because the kernel is not involved in each transfer** — which is also why it is the only one on this list that needs its own synchronisation. Everything else is serialised by the kernel for you.",
        },
      ],
      followUps: [
        {
          q: "Which signal cannot be caught or ignored?",
          a: "`SIGKILL` (9), and also `SIGSTOP`. Every other signal can have a handler installed or be ignored — which is why `kill -9` works when a graceful `kill` does not.",
        },
      ],
      tags: ["ipc", "shared memory", "pipe", "socket", "signal"],
    },
    {
      id: "os-sys-06",
      subtopic: "Linux",
      type: "conceptual",
      importance: "med",
      question: "What are the essential Linux shell and process commands?",
      short:
        "ls, pwd, cd, mkdir, rm, cp, mv, cat for files; ps, top, kill, jobs, bg, fg, nice for processes.",
      answer: [
        {
          table: {
            head: ["Command", "Does"],
            rows: [
              ["`ls` / `ls -l`", "List files / with permissions, owner, size"],
              ["`pwd`", "Print working directory"],
              ["`cd <dir>`", "Change directory"],
              ["`mkdir` / `rmdir`", "Create / remove a directory"],
              ["`cp` / `mv` / `rm`", "Copy, move or rename, remove"],
              ["`cat` / `less` / `head` / `tail`", "Show file contents"],
              ["`ps aux`", "Every running process, in detail"],
              ["`top` / `htop`", "Live process monitor"],
              ["`kill <PID>` / `kill -9 <PID>`", "Ask a process to stop / force it"],
              ["`jobs` / `bg` / `fg`", "Background and foreground job control"],
              ["`nice` / `renice`", "Start or change a process's priority"],
              ["`chmod` / `chown`", "Change permissions / ownership"],
            ],
          },
        },
        {
          p: "Two facts worth carrying: **everything in Linux is a file**, and **every process has a PID**, with `init` (or `systemd`) as PID 1.",
        },
      ],
      tags: ["linux", "shell", "commands"],
    },
    {
      id: "os-sys-07",
      subtopic: "Linux",
      type: "how",
      importance: "med",
      question: "How do Linux file permissions work?",
      short:
        "Three triples — user, group, others — each of read (4), write (2), execute (1). chmod 755 is rwxr-xr-x.",
      answer: [
        {
          p: "Every file carries nine permission bits, read as three groups of three: **user**, **group**, **others**. Each group is read (`r` = 4), write (`w` = 2), execute (`x` = 1), summed into one octal digit.",
        },
        {
          table: {
            head: ["Octal", "Symbolic", "Means"],
            rows: [
              ["`755`", "`rwxr-xr-x`", "Owner can do anything; everyone else can read and run"],
              ["`644`", "`rw-r--r--`", "Owner can read and write; everyone else can read"],
              ["`600`", "`rw-------`", "Only the owner, at all"],
              ["`777`", "`rwxrwxrwx`", "Everyone can do everything — almost always wrong"],
            ],
          },
        },
        {
          code: `chmod 755 script.sh      # set the bits directly
chmod u+x script.sh      # add execute for the owner only
ls -l script.sh          # read the bits back`,
          lang: "bash",
        },
        {
          note: "On a **directory**, the bits mean something different: `r` lists it, `w` creates and deletes entries in it, and `x` lets you enter it and reach things inside. A directory with `r` but no `x` lets you see the names and touch nothing.",
        },
      ],
      tip: "That directory distinction is the follow-up. Most candidates only know the file meaning.",
      tags: ["linux", "permissions", "chmod"],
    },

    /* ------------------- questions the notes never answer ------------------- */
    {
      id: "os-sys-u1",
      subtopic: "Advanced",
      type: "conceptual",
      importance: "high",
      question: "What is a zombie process, and what is an orphan process?",
      answer: UNANSWERED,
      short: "Listed in your notes as an interview question, with no answer given.",
      tags: ["linux", "process", "unanswered"],
    },
    {
      id: "os-sys-u2",
      subtopic: "Advanced",
      type: "comparison",
      importance: "med",
      question: "What is the difference between a soft link and a hard link?",
      answer: UNANSWERED,
      short: "Listed in your notes as an interview question, with no answer given.",
      tags: ["linux", "file system", "unanswered"],
    },
    {
      id: "os-sys-u3",
      subtopic: "Advanced",
      type: "conceptual",
      importance: "med",
      question: "What is the purpose of /etc/passwd?",
      answer: UNANSWERED,
      short: "Listed in your notes as an interview question, with no answer given.",
      tags: ["linux", "unanswered"],
    },
    {
      id: "os-sys-u4",
      subtopic: "Advanced",
      type: "conceptual",
      importance: "med",
      question: "What is the nice value in Linux, and what range does it take?",
      answer: UNANSWERED,
      short: "Listed in your notes as an interview question, with no answer given.",
      tags: ["linux", "scheduling", "unanswered"],
    },
    {
      id: "os-sys-u5",
      subtopic: "Advanced",
      type: "how",
      importance: "high",
      question: "How does the shell interpret and run a command you type?",
      answer: UNANSWERED,
      short: "Listed in your notes as an interview question, with no answer given.",
      tags: ["linux", "shell", "unanswered"],
    },
    {
      id: "os-sys-u6",
      subtopic: "Gaps",
      type: "how",
      importance: "high",
      question: "How is a C program compiled and run — preprocessing to execution?",
      answer: UNANSWERED,
      short: "On your priority list, but not covered anywhere in the four OS documents.",
      tags: ["compilation", "gap", "unanswered"],
    },
    {
      id: "os-sys-u7",
      subtopic: "Gaps",
      type: "comparison",
      importance: "high",
      question: "Compile-time, load-time and run-time address binding — what is the difference?",
      answer: UNANSWERED,
      short: "On your priority list, but not covered anywhere in the four OS documents.",
      tags: ["address binding", "gap", "unanswered"],
    },
    {
      id: "os-sys-u8",
      subtopic: "Gaps",
      type: "how",
      importance: "med",
      question: "How does `ls` work — what does it actually do underneath?",
      answer: UNANSWERED,
      short: "On your priority list, but not covered anywhere in the four OS documents.",
      tags: ["linux", "gap", "unanswered"],
    },
    {
      id: "os-sys-u9",
      subtopic: "Gaps",
      type: "how",
      importance: "med",
      question: "How would you trace the system calls a program makes?",
      answer: UNANSWERED,
      short: "On your priority list, but not covered anywhere in the four OS documents.",
      tags: ["strace", "gap", "unanswered"],
    },
    {
      id: "os-sys-u10",
      subtopic: "Gaps",
      type: "scenario",
      importance: "med",
      question: "A Linux server is running slowly. How do you diagnose it?",
      answer: UNANSWERED,
      short: "On your priority list, but not covered anywhere in the four OS documents.",
      tags: ["linux", "troubleshooting", "gap", "unanswered"],
    },

    {
      id: "os-sys-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which of these is NOT a process control system call?",
      options: ["`fork()`", "`exec()`", "`open()`", "`wait()`"],
      correct: 2,
      answer: [{ p: "`open()` is file management. The other three create, replace and wait on processes." }],
      tags: ["mcq", "system call"],
    },
    {
      id: "os-sys-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A successful call to exec():",
      options: [
        "Returns 0",
        "Returns the new process's PID",
        "Never returns",
        "Returns −1",
      ],
      correct: 2,
      answer: [
        {
          p: "Never returns — the calling program has been replaced, so there is no code left to return to. It only returns on failure.",
        },
      ],
      tags: ["mcq", "exec"],
    },
  ],
};
