/*
 * Routing.
 *
 * Source: "Computer Networks Notes.pdf" pp.28-37, "Cn.pdf" p11.
 */
export default {
  id: "routing",
  name: "Routing",
  importance: "med",
  icon: "arrowRight",
  blurb: "How a router decides where to send a packet next, and how it learns.",
  source: "Computer Networks Notes pp.28-37 · Cn.pdf p11",
  questions: [
    {
      id: "cn-rt-01",
      subtopic: "Algorithms",
      type: "comparison",
      importance: "high",
      question: "Distance vector vs link state routing?",
      short:
        "Distance vector shares its whole table with neighbours; link state floods link information and each router computes the map itself.",
      answer: [
        {
          table: {
            head: ["", "Distance vector", "Link state"],
            rows: [
              ["Each router knows", "Distance to every network, via its neighbours", "**The whole topology**"],
              ["Shares", "Its **entire table**, with **neighbours only**", "Its **link states**, with **everyone**"],
              ["Algorithm", "Bellman-Ford", "**Dijkstra**"],
              ["Convergence", "Slow", "**Fast**"],
              ["Loops", "Possible — count-to-infinity", "Much less likely"],
              ["Resources", "Low", "More CPU and memory"],
              ["Protocol", "**RIP**", "**OSPF**"],
            ],
          },
        },
        {
          note: "**Count-to-infinity** is the classic distance-vector failure: when a network goes down, routers learn the bad news from each other and slowly increment the cost towards infinity, believing a path exists via a neighbour who believes it exists via them. Split horizon and poison reverse limit it; link state avoids it by giving every router the full map.",
        },
        { p: "**BGP** is the third kind — a path vector protocol running between autonomous systems, where policy and business relationships matter more than hop count." },
      ],
      tags: ["distance vector", "link state", "rip", "ospf", "bgp"],
    },
    {
      id: "cn-rt-02",
      subtopic: "Forwarding",
      type: "how",
      importance: "med",
      question: "How does a router decide where to forward a packet?",
      short:
        "It matches the destination against its routing table and takes the longest prefix match.",
      answer: [
        {
          ol: [
            "Extract the **destination IP** from the packet header.",
            "Compare it against every route in the table.",
            "Choose the **longest prefix match** — the most specific route that fits.",
            "Decrement **TTL**; if it reaches zero, drop the packet and return ICMP *time exceeded*.",
            "Rewrite the layer 2 frame with the **next hop's MAC address** and send it.",
          ],
        },
        {
          note: "**Longest prefix match** is why a default route works. `0.0.0.0/0` matches every address with a prefix length of zero, so any more specific route beats it — which makes the default route the one used only when nothing else applies.",
        },
        { p: "Note what is **not** rewritten: the source and destination IP addresses stay the same the whole way. Only the MAC addresses change, at every hop." },
      ],
      tags: ["routing table", "longest prefix match", "default route", "ttl"],
    },
    {
      id: "cn-rt-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "OSPF is which kind of routing protocol?",
      options: ["Distance vector", "Link state", "Path vector", "Static"],
      correct: 1,
      answer: [{ p: "Link state, using Dijkstra. RIP is distance vector; BGP is path vector." }],
      tags: ["mcq", "ospf"],
    },
  ],
};
