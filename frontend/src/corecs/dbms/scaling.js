/*
 * Scaling, Recovery and Security.
 *
 * Source: "DBMS Notes.pdf" pp.30-31, 36-39.
 *
 * The recovery and security material in the notes is thorough; the scaling
 * material is thinner and is filled out here only with what the notes'
 * own sharding section states.
 */

export default {
  id: "scaling",
  name: "Scaling, Recovery & Security",
  importance: "med",
  icon: "signal",
  blurb:
    "What happens when one server is not enough, when it crashes, and when the data on it is sensitive.",
  source: "DBMS Notes pp.30-31, 36-39",

  questions: [
    {
      id: "dbms-scale-01",
      subtopic: "Scaling",
      type: "comparison",
      importance: "med",
      question: "Vertical vs horizontal scaling?",
      short:
        "Vertical: a bigger machine. Horizontal: more machines. Vertical is simpler; horizontal is the only one that keeps going.",
      answer: [
        {
          table: {
            head: ["", "Vertical (scale up)", "Horizontal (scale out)"],
            rows: [
              ["Means", "More RAM, faster disks, more CPU on one server", "More servers, data split or copied across them"],
              ["Complexity", "**None** — the application does not change", "High — routing, consistency, rebalancing"],
              ["Ceiling", "**Yes** — the biggest machine you can buy", "Effectively none"],
              ["Failure", "One machine is a single point of failure", "Survives losing a node"],
              ["Cost curve", "Steep at the top end", "Roughly linear"],
            ],
          },
        },
        {
          note: "The order worth stating: **scale up until it stops being cheap, then scale out.** Vertical scaling is free in engineering terms, and a surprising number of workloads never outgrow one large machine. Horizontal scaling buys capacity by spending complexity.",
        },
        {
          p: "**Read replicas** are the middle ground — copies serving reads only, with writes going to the primary. That handles a read-heavy load without any of the difficulty of splitting writes.",
        },
      ],
      tags: ["scaling", "replication", "read replica"],
    },
    {
      id: "dbms-scale-02",
      subtopic: "Sharding",
      type: "conceptual",
      importance: "high",
      question: "What is sharding, and how do you choose a shard key?",
      short:
        "Splitting a database across independent servers by some key. The key decides whether the load spreads evenly or all lands on one shard.",
      answer: [
        { diagram: "sharding" },
        {
          table: {
            head: ["Method", "How", "Trade"],
            rows: [
              ["**Range-based**", "Roll numbers 1-1000 → shard 1, and so on", "Simple; easily uneven"],
              ["**Hash-based**", "Hash the key to pick a shard", "Even spread; adding a shard means rehashing (consistent hashing reduces this)"],
              ["**Directory**", "A lookup table maps key → shard", "Flexible; the lookup table becomes critical"],
              ["**Geographic**", "Delhi students on the Delhi server", "Low latency; uneven if one region dominates"],
            ],
          },
        },
        { p: "**Choosing the key** — three properties, and getting them wrong is the usual failure:" },
        {
          ul: [
            "**High cardinality** — many distinct values, or you cannot make many shards.",
            "**Even frequency** — no single value should be far more common than the rest, or that shard becomes a hotspot.",
            "**Not monotonic** — a sequential timestamp or auto-increment id sends every new write to the newest shard, so writes never spread at all.",
          ],
        },
        {
          note: "The notes' own bad example is a good one: sharding student feedback by \"courses completed\", so 11+ courses lands on shard C. Every student eventually reaches 11 courses, so shard C fills up permanently while the others empty. **The key was correlated with time.**",
        },
        {
          p: "What sharding costs: cross-shard joins become expensive or impossible, transactions spanning shards need distributed commit, and rebalancing moves data around while the system is live.",
        },
      ],
      tip: "Answer the shard-key question with the three properties. Anyone can define sharding; the key choice is the engineering.",
      tags: ["sharding", "shard key", "hotspot", "scaling"],
    },
    {
      id: "dbms-scale-03",
      subtopic: "Recovery",
      type: "conceptual",
      importance: "high",
      question: "How does a database recover from a crash?",
      short:
        "From the log — redo committed transactions, undo uncommitted ones, starting from the last checkpoint.",
      answer: [
        {
          table: {
            head: ["Failure", "Means", "Recovery"],
            rows: [
              ["**Transaction failure**", "A logical error or constraint violation", "Roll that transaction back"],
              ["**System failure**", "The server crashes; memory is lost, disk survives", "Redo and undo from the log"],
              ["**Media failure**", "The disk itself is damaged", "Restore from backup, then roll forward from the log"],
              ["**Disaster**", "The site is gone", "Off-site backup, or a replica elsewhere"],
            ],
          },
        },
        { p: "**The techniques:**" },
        {
          ul: [
            "**Log-based recovery** — every change is logged with its old and new value. On restart, **redo** everything committed and **undo** everything that was not.",
            "**Checkpointing** — periodically flush dirty pages and record the point. Recovery starts there instead of at the beginning of the log.",
            "**Shadow paging** — keep the old page version until the new one is safely written, then switch atomically.",
            "**Backup and restore** — the only answer to media failure. Off-site, and tested.",
          ],
        },
        {
          note: "**Redo and undo are both needed, and the reason is the same fact.** Committed transactions may not have reached the data pages yet, so they must be redone. Uncommitted ones may already have reached them, because the database is free to flush a dirty page at any time — so they must be undone.",
        },
        {
          p: "The practice that matters more than any of it: **test the restore.** A backup nobody has restored is a hypothesis, not a backup.",
        },
      ],
      tags: ["recovery", "logging", "checkpoint", "redo", "undo", "backup"],
    },
    {
      id: "dbms-scale-04",
      subtopic: "Security",
      type: "conceptual",
      importance: "med",
      question: "How is data protected in a database?",
      short:
        "Role-based access control, encryption at rest and in transit, and masking in non-production copies.",
      answer: [
        {
          p: "**RBAC — role-based access control.** Attach permissions to roles rather than to people, then put people in roles.",
        },
        {
          code: `CREATE ROLE student;
GRANT SELECT ON marks TO student;

CREATE ROLE faculty;
GRANT SELECT, INSERT, UPDATE ON marks TO faculty;

GRANT student TO "22104567";   -- the person inherits the role's rights`,
          lang: "sql",
        },
        {
          table: {
            head: ["Layer", "Protects against", "Example"],
            rows: [
              ["**Encryption at rest**", "A stolen disk", "Files on disk are unreadable without the key"],
              ["**Encryption in transit**", "Network interception", "The portal uses HTTPS"],
              ["**Column-level encryption**", "Anyone with database access", "Bank account numbers stored encrypted"],
            ],
          },
        },
        {
          p: "**Data masking** protects non-production copies — a test database with real names and phone numbers in it is a breach waiting to happen. Static masking rewrites a copy permanently; dynamic masking hides values on read; format-preserving masking keeps the shape so the application still works.",
        },
        {
          note: "One masking rule worth knowing: **use deterministic masking for anything referenced by a foreign key.** If the same original value masks to a different value each time, the references no longer match and the test database is broken.",
        },
      ],
      tags: ["rbac", "encryption", "data masking", "security"],
    },
    {
      id: "dbms-scale-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which shard key is the worst choice?",
      options: ["A hash of the user id", "Geographic region", "An auto-incrementing timestamp", "A random UUID"],
      correct: 2,
      answer: [
        {
          p: "A monotonic timestamp. Every new write goes to whichever shard holds the newest range, so all write load lands on one shard.",
        },
      ],
      tags: ["mcq", "sharding"],
    },
    {
      id: "dbms-scale-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "After a crash, transactions that had committed but whose data pages were not yet written are:",
      options: ["Undone", "Redone from the log", "Lost", "Ignored"],
      correct: 1,
      answer: [
        {
          p: "Redone from the log. The commit was durable because the log reached disk; the data page can be reconstructed from it.",
        },
      ],
      tags: ["mcq", "recovery", "redo"],
    },
  ],
};
