/*
 * File Systems.
 *
 * Source: "Operating System Notes.pdf" pp.48-53, "Os.pdf" pp.14-15.
 *
 * Both sources agree throughout this topic and nothing needed correcting.
 * The only thing dropped is a free-space bitmap on Os.pdf p15 whose bits do
 * not match the free list printed beside it; since they appear under separate
 * headings they are probably two independent examples rather than one
 * inconsistent one, so the bitmap is re-derived here from a single example
 * instead of reproducing either.
 */

export default {
  id: "file-systems",
  name: "File Systems",
  importance: "med",
  icon: "books",
  blurb:
    "How bytes on a disk become named files in directories, and the three ways of deciding which blocks belong to which file.",
  source: "Operating System Notes pp.48-53 · Os.pdf pp.14-15",

  questions: [
    {
      id: "os-fs-01",
      subtopic: "Basics",
      type: "definition",
      importance: "med",
      question: "What is a file system, and what are file attributes?",
      short:
        "The layer that organises data into named files and directories on storage. Attributes are the metadata describing each file.",
      answer: [
        {
          p: "A file system decides how data is stored on and retrieved from a storage device: file creation and deletion, directory structure, space allocation and access control. Examples: **ext4** (Linux), **NTFS** (Windows), **FAT32**, **APFS**.",
        },
        {
          table: {
            head: ["Attribute", "Meaning"],
            rows: [
              ["Name", "The human-readable identifier"],
              ["Identifier", "A unique tag inside the file system — the inode number on UNIX"],
              ["Type", "Text, binary, executable"],
              ["Location", "A pointer to where the data lives on disk"],
              ["Size", "Current size in bytes"],
              ["Protection", "Read, write and execute permissions"],
              ["Owner", "The user who owns it"],
              ["Timestamps", "Created, last modified, last accessed"],
            ],
          },
        },
        {
          note: "The attributes live in a **File Control Block** — an **inode** on UNIX — not in the directory entry. The directory entry is little more than a name and a pointer to the inode, which is exactly what makes hard links possible: two names, one inode.",
        },
      ],
      tags: ["file system", "attributes", "inode"],
    },
    {
      id: "os-fs-02",
      subtopic: "Access methods",
      type: "comparison",
      importance: "med",
      question: "Compare sequential, direct and indexed file access.",
      short:
        "Sequential reads in order; direct jumps to any block; indexed uses an index to find the right block first.",
      answer: [
        {
          table: {
            head: ["", "Sequential", "Direct (random)", "Indexed"],
            rows: [
              ["Access order", "Start to end, in order", "Any block, immediately", "Look up the index, then jump"],
              ["File seen as", "A stream", "An array of fixed-size blocks", "Index plus data blocks"],
              ["Speed", "Fast for whole-file reads", "Fast for one record", "Moderate to fast"],
              ["Overhead", "Low", "Low", "Extra space for the index"],
              ["Example", "Log files, media streaming", "Databases", "Indexed databases, large files"],
            ],
          },
        },
        {
          p: "Sequential is not merely simple — it is **faster per byte** on a spinning disk, because the head does not move between consecutive blocks. Direct access trades that locality for the ability to jump.",
        },
      ],
      tags: ["access methods", "sequential", "direct"],
    },
    {
      id: "os-fs-03",
      subtopic: "Directories",
      type: "comparison",
      importance: "med",
      question: "What directory structures are there?",
      short:
        "Single-level, two-level, tree, acyclic graph and general graph — each solving a problem the previous one had.",
      answer: [
        { diagram: "directory-structures" },
        {
          table: {
            head: ["Structure", "Idea", "Problem it solves", "Problem it has"],
            rows: [
              ["Single-level", "One directory for everything", "Simplest possible", "Name clashes; unusable at scale"],
              ["Two-level", "One directory per user", "No clashes between users", "No sharing between users"],
              ["Tree", "Sub-directories to any depth", "Organised and scalable", "Still no sharing — one file, one path"],
              ["Acyclic graph", "Links let a file appear in two places", "Real sharing", "Deletion is hard — who holds the last reference?"],
              ["General graph", "Cycles allowed", "Maximum flexibility", "Traversal can loop; garbage collection needed"],
            ],
          },
        },
        {
          note: "The deletion problem in an acyclic graph is the interesting part. With several directory entries pointing at one file, deleting one entry must not free the data — which is why UNIX inodes carry a **link count** and the blocks are only released when it reaches zero.",
        },
      ],
      tags: ["directory", "tree", "acyclic graph"],
    },
    {
      id: "os-fs-04",
      subtopic: "Allocation",
      type: "comparison",
      importance: "high",
      question: "Compare contiguous, linked and indexed file allocation.",
      short:
        "Contiguous is fastest but fragments and cannot grow; linked grows freely but has no random access; indexed gives both at the cost of an index block.",
      answer: [
        { diagram: "file-allocation" },
        {
          table: {
            head: ["", "Contiguous", "Linked", "Indexed"],
            rows: [
              ["Directory holds", "Start block + length", "Start and end block", "The index block's address"],
              ["Sequential access", "Very fast", "Fast", "Fast"],
              ["Random access", "**Fast** — start + n", "**Slow** — must walk the chain", "**Fast** — index[n]"],
              ["External fragmentation", "**Yes**", "No", "No"],
              ["File growth", "Hard — may need moving the whole file", "Easy", "Easy, while index space lasts"],
              ["Space overhead", "None", "A pointer per block", "One index block per file"],
              ["Reliability", "Good", "**Poor — one lost pointer loses the rest of the file**", "Good"],
            ],
          },
        },
        {
          p: "**Why indexed usually wins.** Linked allocation's fatal flaw is not speed, it is that random access is O(n): reading byte 10,000,000 means following ten thousand pointers, each one a separate disk read. Indexed allocation puts all those addresses in one block, so one extra read buys direct access to anything.",
        },
        {
          note: "Real file systems use a hybrid. A UNIX inode holds a dozen **direct** block pointers — small files need no index at all — then single, double and triple **indirect** pointers for larger ones. Small files stay cheap and huge files stay possible.",
        },
      ],
      tip: "The inode hybrid is the answer that shows you know what actually ships, not just the three textbook options.",
      tags: ["file allocation", "inode", "indexed"],
    },
    {
      id: "os-fs-05",
      subtopic: "Free space",
      type: "how",
      importance: "med",
      question: "How does a file system track free space?",
      short: "Bit vector, free list, grouping or counting.",
      answer: [
        {
          ul: [
            "**Bit vector (bitmap)** — one bit per block, 0 for free and 1 for allocated. Simple, and finding a run of free blocks is a fast word-scan. The bitmap itself takes space and ideally stays in memory.",
            "**Free list** — the free blocks form a linked list. No extra space at all, since the pointers live in the free blocks. Finding a *contiguous* run is hopeless.",
            "**Grouping** — the first free block holds the addresses of the next n free blocks. Finds many free blocks in one read.",
            "**Counting** — store a starting address plus a run length. Compact when free space is clustered, which it usually is.",
          ],
        },
        {
          p: "Example bitmap for 12 blocks where 1, 2, 5, 6, 7 and 9 are free:",
        },
        {
          table: {
            head: ["Block", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
            rows: [["Bit", "1", "0", "0", "1", "1", "0", "0", "0", "1", "0", "1", "1"]],
          },
        },
        {
          note: "A 1 TB disk with 4 KB blocks needs a bitmap of about 32 MB. That is small enough to keep in RAM, which is exactly why bitmaps are the common choice.",
        },
      ],
      tags: ["free space", "bitmap", "free list"],
    },
    {
      id: "os-fs-06",
      subtopic: "UNIX",
      type: "conceptual",
      importance: "med",
      question: "How is a UNIX file system laid out?",
      short: "Boot block, superblock, inode table, data blocks.",
      answer: [
        {
          table: {
            head: ["Region", "Holds"],
            rows: [
              ["Boot block", "The bootloader"],
              ["Superblock", "Metadata about the file system itself — size, block size, free counts, inode table location"],
              ["Inode table", "One inode per file: permissions, owner, timestamps, size, block pointers"],
              ["Data blocks", "The actual file contents"],
            ],
          },
        },
        {
          note: "**An inode does not contain the file's name.** The name lives in the directory entry that points at the inode, and that separation is the whole design: several names can point at one inode (hard links), and renaming a file touches only the directory, never the file.",
        },
        {
          p: "**Mounting** attaches another file system at a directory — the mount point. The OS checks the type, then updates the mount table so that paths below that point resolve into the new file system.",
        },
      ],
      tags: ["unix", "inode", "superblock", "mounting"],
    },
    {
      id: "os-fs-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which allocation method suffers external fragmentation?",
      options: ["Contiguous", "Linked", "Indexed", "None of them"],
      correct: 0,
      answer: [
        {
          p: "Contiguous — a file needs one unbroken run of blocks, so freeing files leaves gaps too small for the next one.",
        },
      ],
      tags: ["mcq", "file allocation"],
    },
    {
      id: "os-fs-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In a UNIX file system, the file's name is stored in:",
      options: ["The inode", "The superblock", "The directory entry", "The boot block"],
      correct: 2,
      answer: [
        {
          p: "The directory entry. The inode holds everything else — which is precisely what allows two names to refer to the same file.",
        },
      ],
      tags: ["mcq", "inode"],
    },
  ],
};
