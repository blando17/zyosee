/*
 * Process Synchronization.
 *
 * Source: "Operating System Notes.pdf" pp.23-28, "Os.pdf" pp.6-7,
 * "CORE CS triky question.pdf".
 *
 * THE CODE COMES FROM Os.pdf p7, NOT FROM THE 58-PAGE NOTES.
 *
 * The 58-page document hands the three classical problems off to three
 * codeshare.io links, which are pastebins that will expire. The cheat-sheets
 * print the full semaphore pseudocode for all three, so that is what is used
 * here and the dead links are dropped.
 */

export default {
  id: "synchronization",
  name: "Process Synchronization",
  importance: "high",
  icon: "lock",
  blurb:
    "Stopping two processes from trampling the same data — critical sections, locks, semaphores, monitors, and the three classical problems.",
  source: "Operating System Notes pp.23-28 · Os.pdf pp.6-7",

  questions: [
    {
      id: "os-sync-01",
      subtopic: "Race conditions",
      type: "definition",
      importance: "high",
      question: "What is a race condition?",
      short:
        "Two processes touch shared data at once and the result depends on which order they happen to run in.",
      answer: [
        {
          p: "A race condition occurs when several processes access and modify shared data concurrently, and the final value depends on the **interleaving** — which is not under anybody's control.",
        },
        {
          p: "The canonical example. Two processes each increment a shared `count`, starting at 5:",
        },
        {
          table: {
            head: ["", "Process P1", "Process P2"],
            rows: [
              ["1", "read count → 5", ""],
              ["2", "", "read count → 5"],
              ["3", "count++ → 6", ""],
              ["4", "", "count++ → 6"],
              ["5", "write count = 6", ""],
              ["6", "", "write count = 6"],
            ],
          },
        },
        {
          note: "Two increments happened and the value went from 5 to **6**, not 7. Nothing crashed, nothing logged an error, and the bug appears perhaps one run in ten thousand — which is exactly what makes race conditions so expensive to find.",
        },
        {
          p: "The root cause is that `count++` is not one instruction. It is read, add, write — and a context switch can land between any two of them.",
        },
      ],
      tip: "Say why `count++` is not atomic. That is the insight; the rest is the story around it.",
      tags: ["race condition", "atomicity"],
    },
    {
      id: "os-sync-02",
      subtopic: "Critical section",
      type: "definition",
      importance: "high",
      question: "What is the critical section problem, and what must a solution guarantee?",
      short:
        "The critical section is the code touching shared data. A solution needs mutual exclusion, progress and bounded wait.",
      answer: [
        {
          p: "The **critical section** is the part of a process's code that accesses shared resources. At most one process may be inside its critical section at a time.",
        },
        { diagram: "critical-section" },
        {
          p: "Any correct solution must satisfy three conditions:",
        },
        {
          ol: [
            "**Mutual exclusion** — no two processes inside their critical sections at once.",
            "**Progress** — if no process is inside and some want in, the choice of who enters cannot be postponed indefinitely, and processes not interested must not take part in the decision.",
            "**Bounded wait** — there is a limit on how many times others may enter before a waiting process gets its turn. This is what rules out starvation.",
          ],
        },
        {
          note: "A fourth, **no busy waiting**, is desirable rather than required — a spinlock satisfies all three conditions above and still burns CPU while it waits.",
        },
      ],
      tip: "Name all three and say what each one rules out: mutual exclusion rules out corruption, progress rules out deadlock, bounded wait rules out starvation.",
      tags: ["critical section", "mutual exclusion"],
    },
    {
      id: "os-sync-03",
      subtopic: "Software solutions",
      type: "algorithm",
      importance: "med",
      question: "How does Peterson's solution work?",
      short:
        "Two flags and a turn variable. Each process signals intent, then politely hands the turn to the other.",
      answer: [
        {
          p: "A software-only solution for **exactly two** processes. It uses a shared `flag[2]` — do I want in? — and a shared `turn` — whose go is it?",
        },
        {
          code: `boolean flag[2] = {false, false};
int turn = 0;

/* Process 0 */                 /* Process 1 */
do {                            do {
  flag[0] = true;                 flag[1] = true;
  turn = 1;                       turn = 0;
  while (flag[1] && turn == 1);   while (flag[0] && turn == 0);

  /* critical section */          /* critical section */

  flag[0] = false;                flag[1] = false;
  /* remainder */                 /* remainder */
} while (true);                 } while (true);`,
          lang: "c",
        },
        {
          p: "The trick is `turn = 1`: each process gives the turn **away** after raising its flag. If both raise their flags at once, the second write to `turn` wins, and exactly one process is let through.",
        },
        {
          ul: [
            "Satisfies mutual exclusion, progress and bounded wait.",
            "Works for two processes only — the **Bakery algorithm** generalises it to n, by having each process take a number and letting the lowest go first.",
            "Assumes atomic memory access and no instruction reordering, which modern CPUs do not give you for free.",
          ],
        },
      ],
      tags: ["peterson", "bakery", "algorithm"],
    },
    {
      id: "os-sync-04",
      subtopic: "Semaphores",
      type: "definition",
      importance: "high",
      question: "What is a semaphore, and what are wait() and signal()?",
      short:
        "An integer with two atomic operations: wait() decrements and blocks at zero, signal() increments and wakes a waiter.",
      answer: [
        {
          p: "A semaphore is an integer variable accessed only through two **atomic** operations:",
        },
        {
          code: `wait(S)   /* also P() or down() */
{
    while (S <= 0);   /* wait */
    S = S - 1;
}

signal(S)  /* also V() or up() */
{
    S = S + 1;
}`,
          lang: "c",
        },
        {
          note: "That `while (S <= 0);` is **busy waiting**, and it is shown for the concept only. A real semaphore puts the process on a wait queue and blocks it, so it consumes no CPU — `signal` then wakes one waiter rather than letting it spin.",
        },
        {
          table: {
            head: ["Type", "Range", "Used for"],
            rows: [
              ["Binary semaphore", "0 or 1", "Mutual exclusion — behaves like a lock"],
              ["Counting semaphore", "0 to n", "A pool of n identical resources, e.g. 5 printers"],
            ],
          },
        },
      ],
      tip: "Both operations must be atomic. If `wait` itself can be interrupted between the test and the decrement, the semaphore has the very race it exists to prevent.",
      tags: ["semaphore", "wait", "signal"],
    },
    {
      id: "os-sync-05",
      subtopic: "Semaphores",
      type: "comparison",
      importance: "high",
      question: "Semaphore vs mutex?",
      short:
        "A mutex is owned — only the locker may unlock it. A semaphore is a counter and anybody may signal it.",
      answer: [
        {
          table: {
            head: ["", "Mutex", "Semaphore"],
            rows: [
              ["Value", "Locked or unlocked", "0 to n (binary: 0 or 1)"],
              ["**Ownership**", "**Yes — only the thread that locked it may unlock it**", "No — any process may signal it"],
              ["Purpose", "Mutual exclusion", "Mutual exclusion *and* resource counting, *and* signalling between processes"],
              ["Priority inheritance", "Usually supported", "Not applicable"],
              ["Use", "Protecting one critical section", "A pool of resources, or producer-consumer signalling"],
            ],
          },
        },
        {
          note: "**Ownership is the real answer.** A binary semaphore and a mutex look identical until you ask who is allowed to release it. Because a mutex has an owner, the OS knows which thread holds it and can apply priority inheritance — a semaphore has no owner, so it cannot.",
        },
        {
          p: "That also makes them suited to different jobs: a mutex is a lock, a semaphore is a way for one process to tell another that something happened.",
        },
      ],
      tip: "Extremely common question. Lead with ownership, then mention counting — starting with 'a semaphore can count' is the weaker answer.",
      followUps: [
        {
          q: "Binary semaphore vs counting semaphore?",
          a: "A binary semaphore takes only 0 or 1 and acts as a lock. A counting semaphore takes any non-negative value and tracks how many instances of a resource are free — initialise it to 5 and five processes can proceed before the sixth blocks.",
        },
      ],
      tags: ["semaphore", "mutex", "comparison"],
    },
    {
      id: "os-sync-06",
      subtopic: "Hardware",
      type: "how",
      importance: "med",
      question: "What hardware support exists for synchronisation?",
      short:
        "Disabling interrupts, test-and-set, and compare-and-swap — all atomic in hardware, all forms of busy waiting.",
      answer: [
        {
          ul: [
            "**Disable interrupts** — no interrupt means no context switch, so the critical section cannot be interrupted. Works on a single CPU only, and holding interrupts off for long makes the whole system unresponsive.",
            "**Test-and-Set** — atomically reads a lock variable and sets it to true, returning the old value. If it was already true, spin. Simple and correct; wastes CPU while spinning.",
            "**Compare-and-Swap (CAS)** — atomically compares a memory location to an expected value and swaps in a new one only if they match. The foundation of lock-free programming.",
          ],
        },
        {
          note: "On a **multi-core** machine, disabling interrupts on one core does nothing about the others, so it stops being a solution entirely. Test-and-set and CAS work because the atomicity is enforced by the memory bus, not by the scheduler.",
        },
        {
          p: "All three still busy-wait, and CAS in particular can livelock — processes making progress in the sense that instructions execute, while nothing actually gets done.",
        },
      ],
      tags: ["test and set", "cas", "spinlock", "hardware"],
    },
    {
      id: "os-sync-07",
      subtopic: "Monitors",
      type: "definition",
      importance: "med",
      question: "What is a monitor, and what is a condition variable?",
      short:
        "A monitor is a construct where only one thread runs inside at a time, with condition variables for waiting on events.",
      answer: [
        {
          p: "A **monitor** bundles shared data with the procedures that operate on it, and guarantees that **only one thread executes inside it at a time**. The mutual exclusion is provided by the construct, not written by you.",
        },
        {
          p: "A **condition variable** lives inside a monitor and handles the other half — waiting for something to become true:",
        },
        {
          ul: [
            "`wait()` — release the monitor and sleep until signalled.",
            "`signal()` — wake one waiting thread.",
          ],
        },
        {
          note: "Why the wait must release the monitor: if a sleeping thread kept the lock, nobody could get in to change the condition it is waiting for, and the program would deadlock on its own correctness mechanism.",
        },
        {
          p: "Monitors are what Java's `synchronized` blocks with `wait()` and `notify()` are. Safer than raw semaphores, because you cannot forget to release the lock.",
        },
      ],
      tags: ["monitor", "condition variable"],
    },
    {
      id: "os-sync-08",
      subtopic: "Classical problems",
      type: "algorithm",
      importance: "high",
      question: "Explain the producer-consumer problem and its semaphore solution.",
      short:
        "A bounded buffer, three semaphores: mutex = 1 for the buffer, empty = N for free slots, full = 0 for filled slots.",
      answer: [
        {
          p: "A producer adds items to a fixed-size buffer; a consumer removes them. The producer must wait when the buffer is full, and the consumer when it is empty.",
        },
        { diagram: "producer-consumer" },
        {
          code: `semaphore mutex = 1;   /* protects the buffer */
semaphore empty = N;   /* free slots */
semaphore full  = 0;   /* filled slots */

/* Producer */              /* Consumer */
do {                        do {
  item = produce();           wait(full);
  wait(empty);                wait(mutex);
  wait(mutex);                item = remove();
  insert(item);               signal(mutex);
  signal(mutex);              signal(empty);
  signal(full);               consume(item);
} while (true);             } while (true);`,
          lang: "c",
        },
        {
          note: "**The order of the two waits matters and is the classic exam trap.** If the producer did `wait(mutex)` before `wait(empty)`, it would hold the buffer lock while sleeping on a full buffer — and the consumer, needing that same lock to make room, could never run. Deadlock. Always take the counting semaphore first and the mutex second.",
        },
      ],
      tip: "If you only remember one thing here, remember that the mutex is acquired *last* and released *first*.",
      tags: ["producer consumer", "semaphore", "deadlock"],
    },
    {
      id: "os-sync-09",
      subtopic: "Classical problems",
      type: "algorithm",
      importance: "med",
      question: "Explain the readers-writers problem.",
      short:
        "Many readers may read at once; a writer needs exclusive access. Reader priority starves writers, writer priority is the usual fix.",
      answer: [
        {
          p: "Multiple readers can safely read shared data simultaneously. A writer needs it alone — no other writer, and no readers.",
        },
        {
          code: `semaphore rw_mutex = 1;   /* controls access to the data */
semaphore mutex    = 1;   /* protects read_count */
int read_count = 0;

/* Reader */                       /* Writer */
wait(mutex);                       wait(rw_mutex);
read_count++;
if (read_count == 1)                 /* write the data */
    wait(rw_mutex);   /* first reader locks out writers */
signal(mutex);                     signal(rw_mutex);

/* read the data */

wait(mutex);
read_count--;
if (read_count == 0)
    signal(rw_mutex); /* last reader lets writers in */
signal(mutex);`,
          lang: "c",
        },
        {
          p: "Only the **first** reader locks against writers and only the **last** releases — which is what lets any number of readers in at once.",
        },
        {
          note: "This version gives readers priority, so a steady stream of readers can starve a writer indefinitely. The writer-priority variant blocks new readers once a writer is waiting; it fixes the starvation and can starve readers instead. There is no version that favours nobody.",
        },
      ],
      tags: ["readers writers", "semaphore", "starvation"],
    },
    {
      id: "os-sync-10",
      subtopic: "Classical problems",
      type: "algorithm",
      importance: "high",
      question: "Explain the dining philosophers problem.",
      short:
        "Five philosophers, five forks, each needs two. If all pick up their left fork at once, nobody can eat — deadlock.",
      answer: [
        {
          p: "Five philosophers sit around a table alternating between thinking and eating. There is one fork between each pair, and a philosopher needs **both** neighbouring forks to eat.",
        },
        { diagram: "dining-philosophers" },
        {
          p: "**The deadlock:** every philosopher picks up their left fork simultaneously. Each now holds one fork and waits forever for their right, which their neighbour is holding. All four Coffman conditions hold at once.",
        },
        { p: "The standard fixes:" },
        {
          ul: [
            "**Allow at most four** philosophers at the table — with five forks and four diners, someone can always get both.",
            "**Asymmetry** — odd-numbered philosophers take their left fork first, even-numbered their right. This breaks circular wait.",
            "**Pick up both or neither** — test that both forks are free inside a critical section before taking either. This breaks hold-and-wait.",
          ],
        },
        {
          code: `int state[5];             /* THINKING, HUNGRY or EATING */
semaphore mutex = 1;
semaphore s[5]  = {0};

void test(int i) {
    if (state[i] == HUNGRY &&
        state[(i + 4) % 5] != EATING &&
        state[(i + 1) % 5] != EATING) {
        state[i] = EATING;
        signal(s[i]);
    }
}`,
          lang: "c",
        },
        {
          note: "This is not really a dining problem. It is the standard illustration that **deadlock and starvation are different failures** — the asymmetry fix removes deadlock but a philosopher can still be starved by two greedy neighbours.",
        },
      ],
      tip: "Interviewers want the deadlock explained *and* at least two distinct fixes, each named with the Coffman condition it breaks.",
      tags: ["dining philosophers", "deadlock", "starvation"],
    },
    {
      id: "os-sync-11",
      subtopic: "Why",
      type: "why",
      importance: "med",
      question: "Why is a semaphore better than busy waiting?",
      short:
        "A blocked process consumes no CPU. A spinning one burns a whole core doing nothing, and can even prevent the lock being released.",
      answer: [
        {
          p: "Busy waiting — spinning on `while (locked);` — keeps the process in the running state, consuming a full CPU slice to discover nothing has changed.",
        },
        {
          p: "A real semaphore moves the process to a wait queue and blocks it. It uses no CPU until `signal()` wakes it.",
        },
        {
          note: "On a **single-core** machine busy waiting is not merely wasteful, it can be fatal: the spinning process holds the only CPU, so the process that would release the lock cannot run at all. That is a livelock created purely by the waiting strategy.",
        },
        {
          p: "Spinlocks are still the right answer when the wait is genuinely shorter than a context switch, and the waiter is on a different core from the holder. Inside a kernel, that is often true.",
        },
      ],
      tags: ["semaphore", "busy waiting", "spinlock", "why"],
    },
    {
      id: "os-sync-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which is NOT one of the three requirements for a critical section solution?",
      options: ["Mutual exclusion", "Progress", "Bounded wait", "No busy waiting"],
      correct: 3,
      answer: [
        {
          p: "No busy waiting is desirable, not required. A spinlock meets all three requirements and still busy-waits.",
        },
      ],
      tags: ["mcq", "critical section"],
    },
    {
      id: "os-sync-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A counting semaphore initialised to 3 means:",
      options: [
        "Three processes may be in the critical section at once",
        "Only one process may enter, three times",
        "The semaphore may go negative by three",
        "Three processes are already blocked",
      ],
      correct: 0,
      answer: [
        {
          p: "Three — the value counts free instances of the resource, so the fourth caller blocks until one is signalled back.",
        },
      ],
      tags: ["mcq", "semaphore"],
    },
    {
      id: "os-sync-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In the producer-consumer solution, which semaphore must be acquired last?",
      options: ["`empty`", "`full`", "`mutex`", "It does not matter"],
      correct: 2,
      answer: [
        {
          p: "`mutex`. Taking it before the counting semaphore means sleeping while holding the buffer lock, which deadlocks the pair.",
        },
      ],
      tags: ["mcq", "producer consumer"],
    },
  ],
};
