/*
 * Data Link Layer.
 *
 * Source: "Computer Networks Notes.pdf" pp.17-27, "Cn.pdf" pp.6-8.
 */
export default {
  id: "data-link",
  name: "Data Link Layer",
  importance: "med",
  icon: "repeat",
  blurb: "Framing, MAC addresses, and catching the errors the physical layer introduces.",
  source: "Computer Networks Notes pp.17-27 · Cn.pdf pp.6-8",
  questions: [
    {
      id: "cn-dl-01",
      subtopic: "Addressing",
      type: "comparison",
      importance: "high",
      question: "What is the difference between a MAC address and an IP address?",
      short:
        "MAC is a permanent physical address used within one network; IP is a logical address used to route between networks.",
      answer: [
        {
          table: {
            head: ["", "MAC address", "IP address"],
            rows: [
              ["Layer", "**2 — Data Link**", "**3 — Network**"],
              ["Size", "48 bits, hex", "32 bits (IPv4) / 128 (IPv6)"],
              ["Assigned by", "The manufacturer, burned in", "The network — DHCP or manually"],
              ["Changes", "Essentially never", "Whenever you join a different network"],
              ["Scope", "**One local network only**", "**End to end, across the internet**"],
              ["Found with", "**ARP**, from an IP", "**DNS**, from a name"],
            ],
          },
        },
        {
          note: "**Both are needed, and the reason is the reason routing works.** The IP address stays the same for the whole journey — it names the destination. The MAC address is rewritten at **every hop**, because each one only has to reach the next router. Your packet to Google carries Google's IP and your own gateway's MAC.",
        },
      ],
      tip: "That rewriting-per-hop point is the answer to 'why do we need both'. It is the most common follow-up.",
      tags: ["mac address", "ip address", "arp"],
    },
    {
      id: "cn-dl-02",
      subtopic: "Error detection",
      type: "comparison",
      importance: "high",
      question: "How are transmission errors detected?",
      short: "Parity, checksum and CRC — in increasing order of strength.",
      answer: [
        {
          table: {
            head: ["Method", "How", "Catches", "Used by"],
            rows: [
              ["**Parity bit**", "One bit making the count of 1s even or odd", "Any **odd** number of bit errors — misses every even one", "Simple serial links"],
              ["**Checksum**", "Sum the words, send the complement", "Most errors; can miss reordering and some cancelling changes", "**IP, TCP, UDP** headers"],
              ["**CRC**", "Treat the data as a polynomial, send the remainder", "**All burst errors up to the polynomial's degree**", "**Ethernet**, Wi-Fi, disk storage"],
            ],
          },
        },
        {
          note: "**CRC is the strong one and it is not much more expensive** — it is a shift-and-XOR loop implementable in hardware. That is why every frame on a wire is CRC-protected while the higher layers make do with a checksum: the data link layer is where bit errors actually happen.",
        },
        {
          p: "Detection is not correction. Ethernet **discards** a bad frame and says nothing — recovering it is TCP's job, higher up. **Hamming codes** can correct as well as detect, at the cost of more redundant bits, and are used where retransmission is impossible.",
        },
      ],
      tags: ["parity", "checksum", "crc", "error detection"],
    },
    {
      id: "cn-dl-03",
      subtopic: "Flow control",
      type: "comparison",
      importance: "high",
      question: "What are Go-Back-N and Selective Repeat?",
      short:
        "Both are sliding-window protocols. Go-Back-N retransmits everything after a loss; Selective Repeat retransmits only what was lost.",
      answer: [
        {
          table: {
            head: ["", "Stop-and-wait", "Go-Back-N", "Selective Repeat"],
            rows: [
              ["Sender window", "1", "**N**", "**N**"],
              ["Receiver window", "1", "**1**", "**N**"],
              ["On a loss", "Resend that frame", "**Resend it and everything after**", "**Resend only that frame**"],
              ["Receiver buffers out-of-order frames", "No", "**No** — discards them", "**Yes**"],
              ["Bandwidth on error", "Fine", "Wasteful", "**Efficient**"],
              ["Complexity", "Trivial", "Moderate", "**Highest**"],
            ],
          },
        },
        {
          note: "**Go-Back-N's receiver is the simple part and the expensive part at once.** Because it buffers nothing, it can accept frames only in order — so one lost frame invalidates every frame already in flight behind it. Selective Repeat pays for buffers and gets to keep them.",
        },
        {
          formula: [
            { name: "Go-Back-N window", expr: "N ≤ 2ᵏ − 1", note: "k = bits in the sequence number" },
            { name: "Selective Repeat window", expr: "N ≤ 2ᵏ⁻¹", note: "half the space, to avoid ambiguity" },
          ],
        },
      ],
      tags: ["go-back-n", "selective repeat", "sliding window", "arq"],
    },
    {
      id: "cn-dl-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A single parity bit fails to detect:",
      options: ["Any single-bit error", "An even number of bit errors", "Burst errors only", "Nothing — it catches everything"],
      correct: 1,
      answer: [
        { p: "An even number of errors — two flipped bits leave the parity unchanged, so the frame passes as good." },
      ],
      tags: ["mcq", "parity"],
    },
    {
      id: "cn-dl-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "In Go-Back-N, the receiver window size is:",
      options: ["1", "N", "2N", "Unlimited"],
      correct: 0,
      answer: [
        { p: "1. It buffers nothing, so frames must arrive in order — which is why one loss forces everything after it to be resent." },
      ],
      tags: ["mcq", "go-back-n"],
    },
  ],
};
