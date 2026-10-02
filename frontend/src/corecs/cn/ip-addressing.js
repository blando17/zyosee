/*
 * IP Addressing.
 *
 * Source: "Cn.pdf" p10, "Computer Networks Notes.pdf" pp.28-37.
 *
 * The class table on Cn.pdf p10 was checked: 2^24-2 = 16,777,214 for class A,
 * 2^16-2 = 65,534 for B, 2^8-2 = 254 for C, and the network counts (126,
 * 16,384, 2,097,152) all hold. Nothing needed correcting.
 */

export default {
  id: "ip-addressing",
  name: "IP Addressing",
  importance: "high",
  icon: "target",
  blurb:
    "How a machine is named on the internet — classes, private ranges, and why IPv6 exists.",
  source: "Cn.pdf p10 · Computer Networks Notes pp.28-37",

  questions: [
    {
      id: "cn-ip-01",
      subtopic: "Classes",
      type: "conceptual",
      importance: "high",
      question: "What are the IPv4 address classes?",
      short:
        "A, B, C for hosts; D for multicast; E reserved. The class is decided by the first octet.",
      answer: [
        { diagram: "ip-classes" },
        {
          table: {
            head: ["Class", "First octet", "Default mask", "Networks", "Hosts per network"],
            rows: [
              ["**A**", "1 – 126", "255.0.0.0 (**/8**)", "126", "**16,777,214**"],
              ["**B**", "128 – 191", "255.255.0.0 (**/16**)", "16,384", "**65,534**"],
              ["**C**", "192 – 223", "255.255.255.0 (**/24**)", "2,097,152", "**254**"],
              ["D", "224 – 239", "—", "—", "Multicast"],
              ["E", "240 – 255", "—", "—", "Experimental"],
            ],
          },
        },
        {
          p: "The host counts are 2ʰ − 2 — the all-zeros address is the network ID and the all-ones is the broadcast, so neither is assignable.",
        },
        {
          note: "**127 is missing from class A on purpose.** 127.0.0.0/8 is loopback — 127.0.0.1 is your own machine — which is why class A stops at 126 rather than 127.",
        },
        {
          p: "Classful addressing is obsolete in practice. **CIDR** replaced it in 1993 because the classes wasted enormous amounts of space: an organisation needing 300 addresses had to take a whole class B of 65,534.",
        },
      ],
      tip: "Know the first-octet ranges by sight. Most classful questions start by asking you to identify the class.",
      tags: ["ipv4", "classes", "classful"],
    },
    {
      id: "cn-ip-02",
      subtopic: "Private addresses",
      type: "conceptual",
      importance: "high",
      question: "What are private IP addresses, and what is NAT?",
      short:
        "Three ranges reserved for internal networks, not routable on the internet. NAT translates them to a public address.",
      answer: [
        {
          table: {
            head: ["Range", "CIDR", "Class"],
            rows: [
              ["10.0.0.0 – 10.255.255.255", "**10.0.0.0/8**", "A"],
              ["172.16.0.0 – 172.31.255.255", "**172.16.0.0/12**", "B"],
              ["192.168.0.0 – 192.168.255.255", "**192.168.0.0/16**", "C"],
            ],
          },
        },
        {
          p: "These are defined by RFC 1918. Routers on the public internet drop them, so they can be reused inside every home and office simultaneously — which is exactly why they exist.",
        },
        {
          p: "**NAT — Network Address Translation** — lets a whole private network share one public address. The router rewrites the source address and port on the way out and reverses it on the way back, keeping a table of which internal socket each translated port belongs to.",
        },
        {
          note: "NAT is why IPv4 has lasted decades past the point its address space ran out. It also broke the internet's original end-to-end model: a machine behind NAT cannot be connected *to* without port forwarding, which is why peer-to-peer software needs hole-punching and relays.",
        },
      ],
      tags: ["private ip", "nat", "rfc 1918"],
    },
    {
      id: "cn-ip-03",
      subtopic: "IPv6",
      type: "comparison",
      importance: "high",
      question: "What is the difference between IPv4 and IPv6?",
      short:
        "32 bits against 128, written in hex, with no broadcast and no need for NAT.",
      answer: [
        {
          table: {
            head: ["", "IPv4", "IPv6"],
            rows: [
              ["Address size", "**32 bits**", "**128 bits**"],
              ["Total addresses", "~4.3 billion", "~3.4 × 10³⁸"],
              ["Notation", "Dotted decimal — 192.168.1.1", "Hex, colon-separated — 2001:db8::1"],
              ["Header", "20–60 bytes, variable", "**40 bytes, fixed**"],
              ["Checksum in header", "Yes", "**No** — left to other layers"],
              ["Broadcast", "Yes", "**No** — multicast and anycast instead"],
              ["Address configuration", "Manual or DHCP", "Also **stateless autoconfiguration**"],
              ["NAT", "Needed", "Unnecessary"],
              ["Fragmentation", "By routers and the sender", "**Sender only**"],
            ],
          },
        },
        {
          note: "**The fixed 40-byte header is the underrated change.** IPv4's variable header with options has to be parsed before a router knows where the payload starts; IPv6's is a fixed size with extension headers chained after it, which makes forwarding simpler and faster in hardware.",
        },
        {
          p: "`::` is shorthand for the longest run of zero groups, and may appear only once in an address — otherwise the expansion would be ambiguous.",
        },
      ],
      tags: ["ipv4", "ipv6", "comparison"],
    },
    {
      id: "cn-ip-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "172.16.5.1 belongs to which category?",
      options: ["Public class B", "Private class B", "Multicast", "Loopback"],
      correct: 1,
      answer: [
        {
          p: "Private — 172.16.0.0/12 covers 172.16 through 172.31 and is reserved by RFC 1918.",
        },
      ],
      tags: ["mcq", "private ip"],
    },
    {
      id: "cn-ip-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "An IPv6 address is how many bits?",
      options: ["32", "64", "128", "256"],
      correct: 2,
      answer: [{ p: "128 bits, written as eight groups of four hex digits." }],
      tags: ["mcq", "ipv6"],
    },
  ],
};
