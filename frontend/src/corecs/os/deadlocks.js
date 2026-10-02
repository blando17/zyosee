/*
 * Deadlocks.
 *
 * Source: "Operating System Notes.pdf" pp.29-33, "Os.pdf" pp.8, 20.
 *
 * THE BANKER'S EXAMPLE IN THE NOTES IS NOT SAFE.
 *
 * `Os.pdf` p20 gives three processes, Available (3,3,2), and concludes "safe
 * state, sequence P1 → P0 → P2". It is not. After P1 finishes, Work = (5,3,2),
 * and neither P0's need (7,4,3) nor P2's (6,0,0) fits. The system is stuck.
 *
 * The cause is interesting rather than careless: this is the standard
 * Silberschatz example with two of its five processes deleted, and the
 * resources those two would have released are exactly what made the original
 * safe. So the fix here is not to invent a new question — it is to restore
 * the two missing processes, which makes the notes' own answer correct again.
 * Both versions are included: the notes' as a worked counter-example, and the
 * complete one as the safe case.
 */

export default {
  id: "deadlocks",
  name: "Deadlocks",
  importance: "high",
  icon: "warning",
  blurb:
    "Four conditions, four ways to handle them, and one algorithm interviewers love to make you run by hand.",
  source: "Operating System Notes pp.29-33 · Os.pdf pp.8, 20",

  questions: [
    {
      id: "os-dead-01",
      subtopic: "Basics",
      type: "definition",
      importance: "high",
      question: "What is a deadlock?",
      short:
        "A set of processes each blocked forever, waiting for a resource another one in the set is holding.",
      answer: [
        {
          p: "Every process in the set is waiting for an event that only another process in the same set can cause. None of them can proceed, and the situation never resolves itself.",
        },
        {
          p: "The two-process version: P1 holds resource A and wants B; P2 holds B and wants A. Neither will release what it has until it gets what it wants.",
        },
        {
          note: "**Deadlock is not starvation.** In starvation the system is making progress — other processes are running fine, it is just never this one's turn, and it could resolve at any moment. In deadlock nobody in the set will ever proceed, no matter how long you wait.",
        },
      ],
      tip: "Volunteer the deadlock-vs-starvation distinction. It is the most common follow-up and answering it unprompted saves you the question.",
      tags: ["deadlock", "starvation"],
    },
    {
      id: "os-dead-02",
      subtopic: "Coffman conditions",
      type: "conceptual",
      importance: "high",
      question: "What are the four necessary conditions for deadlock?",
      short:
        "Mutual exclusion, hold and wait, no preemption, circular wait — all four must hold at once.",
      answer: [
        {
          ol: [
            "**Mutual exclusion** — at least one resource is non-shareable; only one process can use it at a time.",
            "**Hold and wait** — a process is holding at least one resource and waiting to acquire more.",
            "**No preemption** — a resource cannot be forcibly taken; it is released only voluntarily.",
            "**Circular wait** — there is a chain P₀ → P₁ → … → Pₙ → P₀ where each waits for a resource the next one holds.",
          ],
        },
        {
          note: "**All four simultaneously.** That is the whole basis of prevention: break any one of them and deadlock becomes impossible, not merely unlikely.",
        },
        {
          p: "They are called the **Coffman conditions**, after the 1971 paper. Naming them costs nothing and reads well.",
        },
      ],
      tip: "Memorise them as a sentence rather than four words: one resource can't be shared, someone holds it while waiting for more, nobody can take it back, and the waiting goes round in a circle.",
      tags: ["coffman", "deadlock conditions"],
    },
    {
      id: "os-dead-03",
      subtopic: "RAG",
      type: "conceptual",
      importance: "high",
      question: "What is a Resource Allocation Graph, and when does a cycle mean deadlock?",
      short:
        "A directed graph of processes and resources. With single-instance resources a cycle means deadlock; with multiple instances it may not.",
      answer: [
        {
          ul: [
            "**Process nodes** are circles, **resource nodes** are rectangles.",
            "A **request edge** P → R means P is asking for R.",
            "An **assignment edge** R → P means R is allocated to P.",
            "A resource with several instances is drawn with a dot per instance.",
          ],
        },
        { diagram: "deadlock-rag" },
        {
          table: {
            head: ["Resource type", "No cycle", "Cycle present"],
            rows: [
              ["Single instance", "No deadlock — guaranteed", "**Deadlock — guaranteed**"],
              ["Multiple instances", "No deadlock — guaranteed", "**Maybe** — a third holder may release and break it"],
            ],
          },
        },
        {
          note: "The asymmetry is the point: **no cycle always means no deadlock**, in both cases. A cycle is only conclusive when each resource has one instance.",
        },
      ],
      tags: ["rag", "cycle"],
    },
    {
      id: "os-dead-04",
      subtopic: "Handling",
      type: "comparison",
      importance: "high",
      question: "What are the four ways of handling deadlock?",
      short:
        "Prevention (break a condition), avoidance (Banker's), detection and recovery, or ignore it (ostrich).",
      answer: [
        {
          table: {
            head: ["Approach", "Idea", "Cost", "Used by"],
            rows: [
              ["Prevention", "Make sure one of the four conditions never holds", "Low resource utilisation, reduced concurrency", "Systems that must not deadlock"],
              ["Avoidance", "Grant a request only if the system stays in a safe state", "Needs maximum demands in advance; runtime checks", "Rare in practice"],
              ["Detection and recovery", "Let it happen, find it, then break it", "Detection overhead; rollback or killing processes", "Databases"],
              ["Ignore it (ostrich)", "Assume it will not happen", "None — until it does", "**Windows and Linux**"],
            ],
          },
        },
        {
          note: "The honest answer to \"what does a real OS do\" is **the ostrich algorithm**. Deadlocks are rare enough in general-purpose systems that the cost of preventing or detecting them exceeds the cost of the occasional reboot. Saying so is a better answer than reciting the other three.",
        },
      ],
      tip: "Name all four, then say which one your machine is actually running. That contrast is the memorable part.",
      tags: ["prevention", "avoidance", "detection", "ostrich"],
    },
    {
      id: "os-dead-05",
      subtopic: "Prevention",
      type: "how",
      importance: "high",
      question: "How do you prevent deadlock by breaking each condition?",
      short:
        "Share resources, demand everything up front, allow preemption, or impose a global ordering on resources.",
      answer: [
        {
          table: {
            head: ["Break", "How", "Problem"],
            rows: [
              ["Mutual exclusion", "Make resources shareable — e.g. read-only files", "Impossible for a printer or a write lock"],
              ["Hold and wait", "Request every resource at once, or release everything before asking for more", "Terrible utilisation — resources are held while unused"],
              ["No preemption", "Forcibly take resources from a waiting process and roll it back", "Only works where state can be saved and restored"],
              ["Circular wait", "Impose a total order R₁ < R₂ < … and only request in increasing order", "**The practical one** — needs discipline, costs nothing at runtime"],
            ],
          },
        },
        {
          note: "**Breaking circular wait by ordering is the technique real code uses.** Always lock account A before account B by account number, and two threads transferring money in opposite directions cannot deadlock. It is a convention rather than a mechanism, which is why it is cheap.",
        },
      ],
      tip: "If asked how you would stop a deadlock in your own multithreaded code, the answer is lock ordering — not Banker's.",
      tags: ["prevention", "lock ordering"],
    },
    {
      id: "os-dead-06",
      subtopic: "Banker's algorithm",
      type: "algorithm",
      importance: "high",
      question: "What is the Banker's algorithm, and what is a safe state?",
      short:
        "Grant a request only if some ordering exists in which every process can still finish. That ordering is the safe sequence.",
      answer: [
        {
          p: "A deadlock **avoidance** algorithm for resources with multiple instances. Each process declares its maximum demand up front; the system grants a request only if doing so leaves it in a **safe state**.",
        },
        {
          p: "**Safe state:** there exists an ordering of all processes such that each one, in turn, can get everything it still needs from what is currently available plus what the earlier ones release when they finish.",
        },
        {
          table: {
            head: ["Structure", "Meaning"],
            rows: [
              ["`Available[m]`", "Free instances of each resource type"],
              ["`Max[n][m]`", "Each process's maximum declared demand"],
              ["`Allocation[n][m]`", "What each process currently holds"],
              ["`Need[n][m]`", "`Max − Allocation` — what it might still ask for"],
            ],
          },
        },
        { p: "**The safety check:**" },
        {
          ol: [
            "`Work = Available`; `Finish[i] = false` for every process.",
            "Find a process i with `Finish[i] == false` and `Need[i] ≤ Work` (element-wise).",
            "If found: `Work = Work + Allocation[i]`, `Finish[i] = true`, and repeat step 2.",
            "If all Finish are true, the state is **safe** and the order you found them in is the safe sequence. If no such process exists and some remain, the state is **unsafe**.",
          ],
        },
        {
          note: "**Unsafe is not the same as deadlocked.** An unsafe state only means the system can no longer *guarantee* every process will finish. It might still work out, if processes ask for less than their declared maximum. Banker's refuses to gamble on that.",
        },
      ],
      tip: "Say why it is called Banker's: a banker never lends so much that they cannot satisfy every customer's credit limit eventually.",
      tags: ["bankers", "safe state", "avoidance"],
    },
    {
      id: "os-dead-n1",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "Run the safety check. Is this system in a safe state, and what is the safe sequence?",
      short: "Safe. Sequence ⟨P1, P3, P4, P2, P0⟩.",
      given: {
        head: ["Process", "Allocation (A B C)", "Max (A B C)", "Need = Max − Alloc"],
        rows: [
          ["P0", "0 1 0", "7 5 3", "7 4 3"],
          ["P1", "2 0 0", "3 2 2", "1 2 2"],
          ["P2", "3 0 2", "9 0 2", "6 0 0"],
          ["P3", "2 1 1", "2 2 2", "0 1 1"],
          ["P4", "0 0 2", "4 3 3", "4 3 1"],
        ],
      },
      find: ["Whether the state is safe", "A safe sequence"],
      solution: [
        { p: "Available = **(3, 3, 2)**. Start with `Work = (3, 3, 2)` and nobody finished." },
        {
          table: {
            head: ["Step", "Work before", "Process picked", "Need ≤ Work?", "Work after (+ its Allocation)"],
            rows: [
              ["1", "3 3 2", "P1", "(1,2,2) ≤ (3,3,2) ✓", "3+2, 3+0, 2+0 = **5 3 2**"],
              ["2", "5 3 2", "P3", "(0,1,1) ≤ (5,3,2) ✓", "5+2, 3+1, 2+1 = **7 4 3**"],
              ["3", "7 4 3", "P4", "(4,3,1) ≤ (7,4,3) ✓", "7+0, 4+0, 3+2 = **7 4 5**"],
              ["4", "7 4 5", "P2", "(6,0,0) ≤ (7,4,5) ✓", "7+3, 4+0, 5+2 = **10 4 7**"],
              ["5", "10 4 7", "P0", "(7,4,3) ≤ (10,4,7) ✓", "10+0, 4+1, 7+0 = **10 5 7**"],
            ],
          },
        },
        {
          p: "Every process finished, so the state is **safe** and ⟨P1, P3, P4, P2, P0⟩ is a safe sequence.",
        },
        {
          note: "Safe sequences are not unique — P0 also fits at step 3, giving ⟨P1, P3, P0, P4, P2⟩. You only need to find **one**; the state is safe if any exists.",
        },
        {
          note: "Your notes run this on a cut-down version of the same system with only P0, P1 and P2, and conclude \"safe, sequence ⟨P1, P0, P2⟩\". That state is actually **unsafe**: after P1 finishes, Work = (5,3,2), and P0 needs (7,4,3) while P2 needs (6,0,0) — neither fits. Deleting P3 and P4 also deleted the resources they release, which is what made the original safe.",
          tone: "warn",
        },
      ],
      tip: "Show the Work column at every step. Examiners give marks for the trace, not just the sequence.",
      tags: ["bankers", "numerical", "safe state"],
    },
    {
      id: "os-dead-n2",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question:
        "P1 now requests (1, 0, 2). Should the Banker's algorithm grant it?",
      short: "Yes — the resulting state is still safe, with sequence ⟨P1, P3, P4, P0, P2⟩.",
      given: {
        head: ["", "Value"],
        rows: [
          ["System", "The five-process system above"],
          ["Available", "3 3 2"],
          ["Request from P1", "1 0 2"],
          ["P1 Allocation / Need", "2 0 0 / 1 2 2"],
        ],
      },
      find: ["Whether the request is legal", "Whether the resulting state is safe", "Grant or make P1 wait"],
      solution: [
        { p: "The resource-request algorithm runs three checks before it runs the safety check." },
        {
          ol: [
            "**Request ≤ Need?** (1,0,2) ≤ (1,2,2) ✓ — P1 is not asking for more than it declared.",
            "**Request ≤ Available?** (1,0,2) ≤ (3,3,2) ✓ — the resources exist right now.",
            "**Pretend to allocate**, then run the safety check on the result.",
          ],
        },
        {
          table: {
            head: ["", "Before", "After pretending"],
            rows: [
              ["Available", "3 3 2", "**2 3 0**"],
              ["P1 Allocation", "2 0 0", "**3 0 2**"],
              ["P1 Need", "1 2 2", "**0 2 0**"],
            ],
          },
        },
        { p: "Now the safety check on `Work = (2, 3, 0)`:" },
        {
          table: {
            head: ["Step", "Process", "Need ≤ Work?", "Work after"],
            rows: [
              ["1", "P1", "(0,2,0) ≤ (2,3,0) ✓", "2+3, 3+0, 0+2 = **5 3 2**"],
              ["2", "P3", "(0,1,1) ≤ (5,3,2) ✓", "**7 4 3**"],
              ["3", "P4", "(4,3,1) ≤ (7,4,3) ✓", "**7 4 5**"],
              ["4", "P0", "(7,4,3) ≤ (7,4,5) ✓", "**7 5 5**"],
              ["5", "P2", "(6,0,0) ≤ (7,5,5) ✓", "**10 5 7**"],
            ],
          },
        },
        {
          p: "All five finish, so the state is safe and the request is **granted**. Safe sequence ⟨P1, P3, P4, P0, P2⟩.",
        },
        {
          note: "Had the check failed, the pretend allocation would be **rolled back** — Available, Allocation and Need restored — and P1 would wait. That rollback step is the one candidates forget.",
        },
      ],
      tags: ["bankers", "numerical", "resource request"],
    },
    {
      id: "os-dead-07",
      subtopic: "Detection",
      type: "how",
      importance: "med",
      question: "How is deadlock detected, and how do you recover?",
      short:
        "Single-instance: look for a cycle in the wait-for graph. Multiple instances: run a Banker's-style check. Recover by killing processes or preempting resources.",
      answer: [
        { p: "**Detection:**" },
        {
          ul: [
            "**Single instance per resource** — build the wait-for graph (the RAG with resource nodes collapsed) and look for a cycle. A cycle is a deadlock.",
            "**Multiple instances** — run a detection algorithm much like Banker's safety check, but using *current requests* rather than declared maximums.",
          ],
        },
        { p: "**Recovery:**" },
        {
          ul: [
            "**Process termination** — abort every deadlocked process, or abort them one at a time until the cycle breaks. Choosing the victim is the hard part: lowest priority, least CPU time used, fewest resources held, least work lost.",
            "**Resource preemption** — take a resource away and roll that process back to a safe checkpoint. Risks starving whichever process keeps being chosen.",
          ],
        },
        {
          note: "How often to run detection is a real trade: every request catches deadlock instantly and costs a lot, hourly is cheap and lets the system sit deadlocked for up to an hour.",
        },
      ],
      tags: ["detection", "recovery", "wait-for graph"],
    },
    {
      id: "os-dead-08",
      subtopic: "Scenarios",
      type: "scenario",
      importance: "high",
      question:
        "Two bank transfers run at once: one moves money A → B, the other B → A. Each locks the source account then the destination. What happens, and how do you fix it?",
      short:
        "Deadlock. Fix it by locking accounts in a fixed global order — lowest account number first.",
      answer: [
        {
          p: "Thread 1 locks A and waits for B. Thread 2 locks B and waits for A. All four Coffman conditions hold: locks are exclusive, each holds one while waiting for another, locks are not preemptible, and the wait is circular.",
        },
        {
          code: `/* Deadlocks */                  /* Safe */
lock(from);                      first  = min(from, to);
lock(to);                        second = max(from, to);
transfer();                      lock(first);
unlock(to);                      lock(second);
unlock(from);                    transfer();
                                 unlock(second);
                                 unlock(first);`,
          lang: "c",
        },
        {
          p: "Ordering the locks by account number breaks **circular wait**: whichever direction the transfer goes, both threads try for the lower-numbered account first, so one of them wins outright and the other waits for a lock that will actually be released.",
        },
        {
          note: "This is the deadlock question most likely to come up in a software interview rather than a theory one, and Banker's is the wrong answer to it. Lock ordering is.",
        },
      ],
      tip: "Write the fix out. Showing min/max on the two account ids is worth more than describing the idea.",
      tags: ["scenario", "lock ordering", "deadlock"],
    },
    {
      id: "os-dead-09",
      subtopic: "Why",
      type: "why",
      importance: "med",
      question: "Why is deadlock difficult to detect?",
      short:
        "It depends on the whole system's resource state at one instant, and checking for it costs real time.",
      answer: [
        {
          ul: [
            "Deadlock is a **global** property. No single process can tell it is deadlocked — it just looks like a slow wait from the inside.",
            "Detecting it means searching the entire resource allocation state for a cycle, which costs CPU time that produces no user work.",
            "It is **timing-dependent**: the same program can run correctly a thousand times and deadlock on the next, so it rarely shows up in testing.",
            "A deadlocked process is indistinguishable from one that is merely waiting a long time — until you look at everything it is waiting on.",
          ],
        },
        {
          p: "All of which is why general-purpose systems run the ostrich algorithm instead, and why databases — where a deadlock is common and a restart is unacceptable — are the systems that do bother to detect them.",
        },
      ],
      tags: ["detection", "why"],
    },
    {
      id: "os-dead-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "How many of the four necessary conditions must hold for deadlock?",
      options: ["Any one", "Any two", "Any three", "All four"],
      correct: 3,
      answer: [
        { p: "All four, at the same time. Breaking any single one makes deadlock impossible — which is exactly how prevention works." },
      ],
      tags: ["mcq", "coffman"],
    },
    {
      id: "os-dead-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In a resource allocation graph with multiple instances per resource, a cycle means:",
      options: [
        "Deadlock, definitely",
        "Deadlock may or may not exist",
        "No deadlock",
        "The graph is malformed",
      ],
      correct: 1,
      answer: [
        {
          p: "It may or may not. Another holder of one of those instances could release it and break the cycle. Only with single-instance resources is a cycle conclusive.",
        },
      ],
      tags: ["mcq", "rag"],
    },
    {
      id: "os-dead-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "An unsafe state means:",
      options: [
        "The system is deadlocked",
        "Deadlock is certain to follow",
        "The system can no longer guarantee every process will finish",
        "A process has exceeded its declared maximum",
      ],
      correct: 2,
      answer: [
        {
          p: "Only that the guarantee is gone. An unsafe state may never deadlock — processes often ask for less than their maximum — but Banker's refuses to take that chance.",
        },
      ],
      tags: ["mcq", "bankers"],
    },
  ],
};
