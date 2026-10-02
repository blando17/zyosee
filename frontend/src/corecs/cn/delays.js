/*
 * Delays and Performance.
 *
 * Source: "Computer Networks Notes.pdf" pp.52-53, "Cn.pdf" p7.
 *
 * LIST.pdf stars propagation delay numericals and RTT/timeout/TTL numericals.
 * The notes give the formulas but only a trivial worked example (B = 1 bps,
 * L = 20 bits), so the numericals below are built on realistic figures and
 * the working is shown in full.
 */

export default {
  id: "delays",
  name: "Delays & Performance",
  importance: "high",
  icon: "timer",
  blurb:
    "The four delays, the two formulas worth memorising, and the numericals that come with them.",
  source: "Computer Networks Notes pp.52-53 · Cn.pdf p7",

  questions: [
    {
      id: "cn-del-01",
      subtopic: "The four delays",
      type: "conceptual",
      importance: "high",
      question: "What are the four types of network delay?",
      short:
        "Transmission (L/B), propagation (d/v), queueing and processing.",
      answer: [
        { diagram: "network-delays" },
        {
          table: {
            head: ["Delay", "Is", "Formula", "Depends on"],
            rows: [
              ["**Transmission (Tt)**", "Pushing every bit of the packet onto the link", "**L / B**", "Packet size and bandwidth"],
              ["**Propagation (Tp)**", "The last bit travelling to the other end", "**d / v**", "Distance and medium — **not** bandwidth"],
              ["**Queueing (Tq)**", "Waiting in a router's buffer", "No formula", "Traffic, burstiness"],
              ["**Processing (Tpro)**", "The router examining headers, updating TTL", "No formula", "CPU, load"],
            ],
          },
        },
        {
          formula: [
            { name: "Transmission delay", expr: "Tt = L / B", note: "L in bits, B in bits per second" },
            { name: "Propagation delay", expr: "Tp = d / v", note: "v ≈ 2 × 10⁸ m/s in copper or fibre" },
            { name: "Total", expr: "Ttotal = Tt + Tp + Tq + Tpro" },
            { name: "Ideal case", expr: "Ttotal = Tt + Tp", note: "queueing and processing taken as negligible" },
          ],
        },
        {
          note: "**Propagation delay does not depend on bandwidth, and transmission delay does not depend on distance.** Upgrading a link from 1 Mbps to 1 Gbps cuts Tt by a thousand and leaves Tp exactly where it was — which is why a satellite link stays slow to respond however fast it is.",
        },
      ],
      tip: "That independence is the conceptual question hiding behind the numericals. Say it unprompted.",
      tags: ["delay", "transmission", "propagation", "queueing"],
    },
    {
      id: "cn-del-n1",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question: "Find the transmission, propagation and total delay for this link.",
      short: "Tt = 8 ms, Tp = 12.5 ms, total = 20.5 ms.",
      given: {
        head: ["", "Value"],
        rows: [
          ["Packet size (L)", "1000 bytes"],
          ["Bandwidth (B)", "1 Mbps"],
          ["Distance (d)", "2500 km"],
          ["Propagation speed (v)", "2 × 10⁸ m/s"],
        ],
      },
      find: ["Transmission delay", "Propagation delay", "Total delay (ideal)"],
      solution: [
        { p: "**Step 1 — put everything in base units.** This is where most marks are lost." },
        {
          ul: [
            "L = 1000 bytes = 1000 × 8 = **8000 bits**",
            "B = 1 Mbps = **10⁶ bits/s**",
            "d = 2500 km = **2.5 × 10⁶ m**",
          ],
        },
        { p: "**Step 2 — transmission delay.**" },
        {
          formula: [
            { name: "Tt = L / B", expr: "8000 / 10⁶ = 8 × 10⁻³ s = 8 ms" },
          ],
        },
        { p: "**Step 3 — propagation delay.**" },
        {
          formula: [
            { name: "Tp = d / v", expr: "2.5 × 10⁶ / 2 × 10⁸ = 1.25 × 10⁻² s = 12.5 ms" },
          ],
        },
        { p: "**Step 4 — total**, taking queueing and processing as negligible:" },
        {
          formula: [{ name: "Ttotal", expr: "8 + 12.5 = 20.5 ms" }],
        },
        {
          note: "Note which term dominates. Propagation is larger here, so buying more bandwidth would barely help — the packet spends most of its life in transit, not being pushed onto the wire.",
        },
      ],
      tip: "Convert units first and write them down. Bytes-to-bits and km-to-metres are where almost every wrong answer starts.",
      tags: ["numerical", "transmission delay", "propagation delay"],
    },
    {
      id: "cn-del-n2",
      subtopic: "Numericals",
      type: "numerical",
      importance: "high",
      question:
        "For the same link, find the stop-and-wait efficiency and the window size needed for 100%.",
      short: "Efficiency 24.2%; a window of 5 frames fills the link.",
      given: {
        head: ["", "Value"],
        rows: [["Tt", "8 ms"], ["Tp", "12.5 ms"], ["Protocol", "Stop-and-wait, then sliding window"]],
      },
      find: ["Stop-and-wait efficiency", "The ratio a", "Minimum window size for 100% efficiency"],
      solution: [
        { diagram: "sliding-window" },
        { p: "**Step 1 — stop-and-wait efficiency.** The sender transmits for Tt, then waits a full round trip before it may send again." },
        {
          formula: [
            { name: "Efficiency", expr: "Tt / (Tt + 2Tp)" },
            { name: "Here", expr: "8 / (8 + 25) = 8 / 33 = 0.2424 → 24.2%" },
          ],
        },
        { p: "So the link sits idle roughly three-quarters of the time." },
        { p: "**Step 2 — the ratio a**, which is how these questions are normally parameterised:" },
        {
          formula: [
            { name: "a = Tp / Tt", expr: "12.5 / 8 = 1.5625" },
            { name: "Efficiency", expr: "1 / (1 + 2a) = 1 / 4.125 = 24.2% ✓" },
          ],
        },
        { p: "**Step 3 — window size for 100% efficiency.** The window must be large enough to keep sending for a whole round trip:" },
        {
          formula: [
            { name: "N ≥ 1 + 2a", expr: "1 + 2(1.5625) = 4.125" },
            { name: "So", expr: "N = 5 frames (round up)" },
          ],
        },
        {
          note: "**Always round up.** N = 4 leaves the sender briefly idle; N = 5 means the first acknowledgement arrives before the window is exhausted, so the link never stops. Rounding down is the commonest error on this question.",
        },
        {
          p: "Related: the **bandwidth-delay product** is how many bits fit in the link at once — B × Tp = 10⁶ × 12.5 × 10⁻³ = **12,500 bits**, about 1.5 KB in flight.",
        },
      ],
      tags: ["numerical", "stop-and-wait", "sliding window", "efficiency"],
    },
    {
      id: "cn-del-02",
      subtopic: "RTT and TTL",
      type: "definition",
      importance: "high",
      question: "What are RTT, timeout and TTL?",
      short:
        "RTT is the round trip time; timeout is how long you wait before retransmitting; TTL is a hop counter that stops packets looping.",
      answer: [
        {
          table: {
            head: ["Term", "Is", "Measured in"],
            rows: [
              ["**RTT**", "Time for a packet to reach the destination **and the reply to return**", "Milliseconds"],
              ["**RTO / timeout**", "How long the sender waits for an ACK before retransmitting", "Milliseconds, derived from RTT"],
              ["**TTL**", "A counter in the IP header, decremented by **each router**; the packet is dropped at zero", "**Hops**, not time"],
            ],
          },
        },
        {
          p: "In the ideal case **RTT = 2 × Tp**, ignoring processing and queueing at each end. TCP estimates RTT continuously with a smoothed average and sets the timeout above it — too short and it retransmits packets that were merely slow, too long and it is sluggish to recover from a real loss.",
        },
        {
          note: "**TTL counts hops, despite the name.** It was intended as seconds but every router simply decrements it by one, so in practice it is a hop limit — and IPv6 renamed the field `Hop Limit` to say so. Its purpose is to stop a packet circling forever when a routing loop exists.",
        },
        {
          p: "`traceroute` works by exploiting it: send a packet with TTL 1 and the first router replies with an ICMP *time exceeded*; TTL 2 reveals the second; and so on down the path.",
        },
      ],
      tip: "The traceroute explanation is a strong answer to 'what is TTL for'. It shows the mechanism rather than the definition.",
      tags: ["rtt", "ttl", "timeout", "traceroute"],
    },
    {
      id: "cn-del-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Propagation delay depends on:",
      options: ["Bandwidth", "Packet size", "Distance and medium", "Router CPU"],
      correct: 2,
      answer: [
        {
          p: "Distance and the medium's propagation speed. Bandwidth and packet size determine **transmission** delay instead.",
        },
      ],
      tags: ["mcq", "propagation delay"],
    },
    {
      id: "cn-del-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "TTL in an IP header is decremented by:",
      options: ["Each second elapsed", "Each router the packet passes", "The sender only", "The destination"],
      correct: 1,
      answer: [
        {
          p: "Each router. Despite the name it is a hop count — IPv6 renamed the field `Hop Limit` to make that explicit.",
        },
      ],
      tags: ["mcq", "ttl"],
    },
  ],
};
