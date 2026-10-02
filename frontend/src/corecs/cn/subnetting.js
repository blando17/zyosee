/*
 * Subnetting.
 *
 * Source: "Cn.pdf" p10 — the strongest single page in the CN sources.
 *
 * EVERY NUMERICAL ON THAT PAGE CHECKS OUT.
 *
 * The borrowing table (8 rows), all three worked examples and every network
 * ID, host range and broadcast address were recomputed. Unlike the OS
 * scheduling material, nothing here needed correcting — so the examples below
 * are reproduced as given, with the working shown.
 *
 * "Subnetting + Numericals" is starred on LIST.pdf.
 */

export default {
  id: "subnetting",
  name: "Subnetting",
  importance: "high",
  icon: "scales",
  blurb:
    "Borrowing host bits to make more networks — the calculation you will be asked to do on paper.",
  source: "Cn.pdf p10",

  questions: [
    {
      id: "cn-sub-01",
      subtopic: "Basics",
      type: "conceptual",
      importance: "high",
      question: "What is subnetting, and what is a subnet mask?",
      short:
        "Splitting a network into smaller ones by borrowing bits from the host part. The mask says which bits are network.",
      answer: [
        { diagram: "subnet-borrow" },
        {
          ul: [
            "A **subnet mask** is 32 bits. A **1** marks a network bit, a **0** marks a host bit.",
            "**CIDR notation** `a.b.c.d/n` says the first n bits are network.",
            "Borrowing **n** bits from the host part gives **2ⁿ subnets**.",
            "With **h** host bits left, each subnet has **2ʰ − 2** usable addresses.",
          ],
        },
        {
          formula: [
            { name: "Subnets", expr: "2ⁿ", note: "n = bits borrowed" },
            { name: "Usable hosts", expr: "2ʰ − 2", note: "h = host bits remaining" },
            { name: "Block size", expr: "256 − (last octet of mask)" },
          ],
        },
        {
          note: "**Why minus 2:** the all-zeros host address is the **network ID** and the all-ones is the **broadcast address**. Neither can be assigned to a machine. That is also why a /31 gives zero usable hosts under the classic rule.",
        },
        {
          p: "Subnetting reduces broadcast traffic, improves security by separating groups, and uses address space more efficiently than handing out a whole class.",
        },
      ],
      tip: "Memorise the block-size trick: 256 minus the interesting octet of the mask. It turns most of these questions into mental arithmetic.",
      tags: ["subnetting", "subnet mask", "cidr"],
    },
    {
      id: "cn-sub-02",
      subtopic: "Reference",
      type: "conceptual",
      importance: "high",
      question: "What does each prefix length give you, starting from a /24?",
      short:
        "/25 gives 2 subnets of 126 hosts, down to /30 giving 64 subnets of 2 hosts.",
      answer: [
        {
          table: {
            head: ["Borrowed", "Prefix", "Mask", "Subnets", "Host bits", "Usable hosts"],
            rows: [
              ["1", "/25", "255.255.255.128", "2", "7", "126"],
              ["2", "/26", "255.255.255.192", "4", "6", "62"],
              ["3", "/27", "255.255.255.224", "8", "5", "30"],
              ["4", "/28", "255.255.255.240", "16", "4", "14"],
              ["5", "/29", "255.255.255.248", "32", "3", "6"],
              ["6", "/30", "255.255.255.252", "64", "2", "**2**"],
              ["7", "/31", "255.255.255.254", "128", "1", "0"],
              ["8", "/32", "255.255.255.255", "256", "0", "0"],
            ],
          },
        },
        {
          note: "**/30 is the one used in practice** — two usable addresses is exactly a point-to-point link between two routers. /31 is defined by RFC 3021 as a special case for point-to-point links where the network and broadcast addresses are not needed, but the classic exam answer is that it gives zero hosts.",
        },
        {
          p: "The mask values 128, 192, 224, 240, 248, 252, 254, 255 are worth knowing by sight — they are the only octet values a valid mask can contain.",
        },
      ],
      tags: ["subnetting", "prefix", "mask", "reference"],
    },
    {
      id: "cn-sub-n1",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "Subnet 192.168.1.0/24 into 4 subnets. Give the mask, and each subnet's range.",
      short:
        "Borrow 2 bits → /26, mask 255.255.255.192, 62 hosts per subnet.",
      given: {
        head: ["", "Value"],
        rows: [
          ["Network", "192.168.1.0/24"],
          ["Subnets required", "4"],
        ],
      },
      find: ["Bits to borrow", "New prefix and mask", "Hosts per subnet", "Each subnet's network ID, host range and broadcast"],
      solution: [
        {
          ol: [
            "**Bits to borrow:** need 2ⁿ ≥ 4, so **n = 2**.",
            "**New prefix:** /24 + 2 = **/26**.",
            "**Mask:** 2 borrowed bits in the last octet = `11000000` = 192, so **255.255.255.192**.",
            "**Host bits left:** 8 − 2 = 6 → **2⁶ − 2 = 62** usable hosts each.",
            "**Block size:** 256 − 192 = **64**, so subnets start at 0, 64, 128, 192.",
          ],
        },
        {
          table: {
            head: ["#", "Network ID", "Usable host range", "Broadcast"],
            rows: [
              ["1", "192.168.1.0/26", "192.168.1.1 – 192.168.1.62", "192.168.1.63"],
              ["2", "192.168.1.64/26", "192.168.1.65 – 192.168.1.126", "192.168.1.127"],
              ["3", "192.168.1.128/26", "192.168.1.129 – 192.168.1.190", "192.168.1.191"],
              ["4", "192.168.1.192/26", "192.168.1.193 – 192.168.1.254", "192.168.1.255"],
            ],
          },
        },
        {
          note: "The block size is the whole method. Once you know it is 64, every network ID is a multiple of 64, every broadcast is the address before the next one, and the usable range is everything between.",
        },
      ],
      tip: "Write the block size down first. Every other number falls out of it.",
      tags: ["subnetting", "numerical"],
    },
    {
      id: "cn-sub-n2",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question:
        "A host has IP 192.168.1.130/26. Find its network ID, broadcast address and usable range.",
      short: "Network 192.168.1.128, broadcast 192.168.1.191, hosts .129 – .190.",
      given: {
        head: ["", "Value"],
        rows: [["Host address", "192.168.1.130"], ["Prefix", "/26"]],
      },
      find: ["Network ID", "Broadcast address", "Usable host range", "Hosts per subnet"],
      solution: [
        {
          ol: [
            "**Mask for /26** = 255.255.255.192. **Block size** = 256 − 192 = **64**.",
            "**Which block does 130 fall in?** The blocks start at 0, 64, 128, 192. 130 lies between 128 and 191, so the **network ID is 192.168.1.128**.",
            "**Broadcast** = the address before the next block starts = 192 − 1 = **192.168.1.191**.",
            "**Usable range** = everything between = **192.168.1.129 – 192.168.1.190**.",
            "**Count:** 2⁶ − 2 = **62 usable hosts**.",
          ],
        },
        {
          note: "You can check it in binary: 130 = `10000010`, mask = `11000000`, and AND-ing them gives `10000000` = 128. The block-size method is the same calculation done faster.",
        },
      ],
      tip: "This exact shape — given an IP and a prefix, find the network — is the most commonly set subnetting question. Practise it until the block size is instant.",
      tags: ["subnetting", "numerical", "network id", "broadcast"],
    },
    {
      id: "cn-sub-n3",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question:
        "Using VLSM on 172.16.0.0/24, allocate subnets for 50, 20 and 10 hosts.",
      short: "/26 for 50, /27 for 20, /28 for 10 — allocated largest first.",
      given: {
        head: ["Subnet", "Hosts needed"],
        rows: [["A", "50"], ["B", "20"], ["C", "10"]],
      },
      find: ["Prefix for each", "Network ID, range and broadcast for each"],
      solution: [
        {
          p: "**VLSM** — Variable Length Subnet Masking — uses a different mask per subnet, so each gets only what it needs instead of every subnet being the same size.",
        },
        {
          ol: [
            "**Sort largest first.** 50, 20, 10. Allocating small first fragments the space and can strand the large requirement.",
            "**50 hosts** → need 2ʰ − 2 ≥ 50 → h = 6 (62) → **/26**.",
            "**20 hosts** → need 2ʰ − 2 ≥ 20 → h = 5 (30) → **/27**.",
            "**10 hosts** → need 2ʰ − 2 ≥ 10 → h = 4 (14) → **/28**.",
          ],
        },
        {
          table: {
            head: ["Subnet", "Prefix", "Network ID", "Usable range", "Broadcast", "Capacity"],
            rows: [
              ["A (50)", "/26", "172.16.0.0", "172.16.0.1 – 172.16.0.62", "172.16.0.63", "62"],
              ["B (20)", "/27", "172.16.0.64", "172.16.0.65 – 172.16.0.94", "172.16.0.95", "30"],
              ["C (10)", "/28", "172.16.0.96", "172.16.0.97 – 172.16.0.110", "172.16.0.111", "14"],
            ],
          },
        },
        {
          p: "Everything from 172.16.0.112 onwards is left free for future use — which is the point of VLSM. Fixed-size subnetting at /26 would have used three-quarters of the space to serve 80 hosts.",
        },
        {
          note: "**Largest first is not a preference, it is the algorithm.** Place the /28 at the start and the remaining space no longer contains a correctly aligned /26 — a subnet must begin on a multiple of its own block size.",
        },
      ],
      tip: "State the sort order out loud before you allocate. That is the step being marked.",
      tags: ["vlsm", "subnetting", "numerical"],
    },
    {
      id: "cn-sub-n4",
      subtopic: "Numericals",
      type: "numerical",
      importance: "med",
      question: "How would you split 172.16.0.0/16 into at least 100 subnets?",
      short: "Borrow 7 bits → /23, mask 255.255.254.0, 510 hosts per subnet.",
      given: {
        head: ["", "Value"],
        rows: [["Network", "172.16.0.0/16"], ["Subnets required", "at least 100"]],
      },
      find: ["Bits to borrow", "Prefix and mask", "Actual subnets", "Hosts per subnet"],
      solution: [
        {
          ol: [
            "**Bits:** need 2ⁿ ≥ 100. 2⁶ = 64 is too few, **2⁷ = 128** works → borrow **7**.",
            "**Prefix:** /16 + 7 = **/23**.",
            "**Mask:** 7 bits spill into the third octet — `11111110` = 254 → **255.255.254.0**.",
            "**Host bits left:** 32 − 23 = 9 → **2⁹ − 2 = 510** usable hosts per subnet.",
            "**Subnets:** 2⁷ = **128**, of which you use 100 and keep 28 spare.",
          ],
        },
        {
          note: "The third-octet mask is where people slip. Seven borrowed bits do not fit in the second octet's remainder, so the boundary lands mid-octet: the mask is 255.255.**254**.0, and the block size in the third octet is 256 − 254 = **2**. Subnets are 172.16.0.0, 172.16.2.0, 172.16.4.0 and so on.",
        },
      ],
      tags: ["subnetting", "numerical", "class b"],
    },
    {
      id: "cn-sub-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "How many usable hosts does a /29 subnet have?",
      options: ["8", "6", "14", "30"],
      correct: 1,
      answer: [{ p: "6. Three host bits give 2³ = 8 addresses, minus the network ID and the broadcast." }],
      tags: ["mcq", "subnetting"],
    },
    {
      id: "cn-sub-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "The subnet mask 255.255.255.224 corresponds to:",
      options: ["/26", "/27", "/28", "/29"],
      correct: 1,
      answer: [{ p: "/27 — 224 is `11100000`, so three borrowed bits on top of /24." }],
      tags: ["mcq", "mask"],
    },
    {
      id: "cn-sub-m3",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In VLSM, subnets should be allocated:",
      options: ["Smallest first", "Largest first", "In any order", "Alphabetically"],
      correct: 1,
      answer: [
        {
          p: "Largest first. A subnet must start on a multiple of its own block size, so placing small ones first can leave no correctly aligned space for a large one.",
        },
      ],
      tags: ["mcq", "vlsm"],
    },
  ],
};
