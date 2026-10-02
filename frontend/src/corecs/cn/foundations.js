/*
 * Network Foundations.
 *
 * Source: "Computer Networks Notes.pdf" pp.3-9, "Cn.pdf" pp.1-3.
 */
export default {
  id: "foundations",
  name: "Network Foundations",
  importance: "med",
  icon: "friends",
  blurb: "What a network is, how big it gets, and the shapes it is wired in.",
  source: "Computer Networks Notes pp.3-9 · Cn.pdf pp.1-3",
  questions: [
    {
      id: "cn-found-01",
      subtopic: "Types",
      type: "comparison",
      importance: "high",
      question: "What are LAN, MAN and WAN?",
      short: "Networks by geographic scale — a building, a city, a country or larger.",
      answer: [
        {
          table: {
            head: ["", "LAN", "MAN", "WAN"],
            rows: [
              ["Covers", "A room, building or campus", "A city", "A country or the world"],
              ["Owned by", "One organisation", "One or several", "Usually several / a telco"],
              ["Speed", "**High** — 1–10 Gbps", "Moderate", "**Lower**"],
              ["Delay", "Very low", "Moderate", "**High**"],
              ["Example", "An office network", "A city cable network", "**The internet**"],
            ],
          },
        },
        {
          note: "The pattern is a trade you will see repeatedly: **as the area grows, speed falls and delay rises.** Propagation delay is distance divided by a fixed speed, so geography sets a floor no amount of bandwidth can lift.",
        },
        { p: "**PAN** (personal, e.g. Bluetooth) and **CAN** (campus) fill in the ends of the scale." },
      ],
      tags: ["lan", "man", "wan"],
    },
    {
      id: "cn-found-02",
      subtopic: "Topologies",
      type: "comparison",
      importance: "med",
      question: "What network topologies are there?",
      short: "Bus, star, ring, mesh, tree and hybrid — each trading cost against resilience.",
      answer: [
        {
          table: {
            head: ["Topology", "Shape", "Strength", "Weakness"],
            rows: [
              ["**Bus**", "One shared backbone", "Cheap, little cable", "**The backbone is a single point of failure**; collisions"],
              ["**Star**", "Every node to a central switch", "Easy to manage; one node failing affects nothing else", "**The centre is a single point of failure**"],
              ["**Ring**", "Each node to two neighbours", "No collisions with token passing", "One break can split the ring"],
              ["**Mesh**", "Every node to every other", "**Most resilient**", "n(n−1)/2 links — expensive"],
              ["**Tree**", "Hierarchy of stars", "Scales well", "The root matters"],
            ],
          },
        },
        {
          note: "**Star is what essentially every modern LAN uses**, because a switch at the centre gives each port its own collision domain. Full mesh is reserved for backbones where the link cost is worth the redundancy — n(n−1)/2 links means 10 nodes need 45 cables.",
        },
      ],
      tags: ["topology", "star", "mesh", "bus"],
    },
    {
      id: "cn-found-03",
      subtopic: "Switching",
      type: "comparison",
      importance: "high",
      question: "Circuit switching vs packet switching?",
      short:
        "Circuit reserves a dedicated path for the whole session; packet sends independently routed packets over shared links.",
      answer: [
        { diagram: "switching" },
        {
          table: {
            head: ["", "Circuit switching", "Packet switching"],
            rows: [
              ["Path", "**Reserved** before any data flows", "Chosen per packet"],
              ["Setup", "Required — a call setup phase", "None"],
              ["Bandwidth", "Dedicated, wasted when idle", "**Shared**, used when needed"],
              ["Delay", "Constant after setup", "**Variable** — queueing at each hop"],
              ["Order", "Guaranteed", "May arrive out of order"],
              ["Failure", "A broken link drops the call", "**Reroutes** around it"],
              ["Example", "The traditional telephone network", "**The internet**"],
            ],
          },
        },
        {
          note: "**Packet switching won because most traffic is bursty.** A phone call uses its circuit continuously, so reserving one is sensible. A web session is silent for most of its life, so a reserved path would sit idle — and statistical multiplexing lets many bursty users share one link far more efficiently than any of them could reserve it.",
        },
        { p: "**Message switching** is the third, historical option: store the whole message at each hop before forwarding. Packet switching is the same idea with the message cut into pieces, which is what allows pipelining." },
      ],
      tip: "Answer the 'why' with burstiness. It is the reason the internet is built the way it is.",
      tags: ["circuit switching", "packet switching", "multiplexing"],
    },
    {
      id: "cn-found-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A full mesh of 10 nodes needs how many links?",
      options: ["10", "20", "45", "90"],
      correct: 2,
      answer: [{ p: "45 — n(n−1)/2 = 10 × 9 / 2. That growth is why full mesh is rare." }],
      tags: ["mcq", "mesh"],
    },
    {
      id: "cn-found-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "The internet uses which switching method?",
      options: ["Circuit", "Message", "Packet", "Token"],
      correct: 2,
      answer: [{ p: "Packet switching — each packet routed independently over shared links." }],
      tags: ["mcq", "packet switching"],
    },
  ],
};
