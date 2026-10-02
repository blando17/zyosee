/*
 * Transport Layer — TCP and UDP.
 *
 * Source: "Computer Networks Notes.pdf" pp.38-44, "Cn.pdf" pp.12-14.
 *
 * "TCP vs UDP" is starred on LIST.pdf.
 */

export default {
  id: "transport",
  name: "TCP & UDP",
  importance: "high",
  icon: "signal",
  blurb:
    "End-to-end delivery — the reliable protocol, the fast one, and how to tell which a problem needs.",
  source: "Computer Networks Notes pp.38-44 · Cn.pdf pp.12-14",

  questions: [
    {
      id: "cn-tr-01",
      subtopic: "Comparison",
      type: "comparison",
      importance: "high",
      question: "What is the difference between TCP and UDP?",
      short:
        "TCP is connection-oriented and reliable; UDP is connectionless and fast. Everything else follows from that.",
      answer: [
        {
          table: {
            head: ["", "TCP", "UDP"],
            rows: [
              ["Connection", "**Connection-oriented** — handshake first", "**Connectionless** — just send"],
              ["Reliability", "**Guaranteed** — ACKs and retransmission", "**None** — fire and forget"],
              ["Ordering", "In order, guaranteed", "May arrive out of order"],
              ["Error handling", "Detects **and retransmits**", "Detects with a checksum, then discards"],
              ["Flow control", "Yes — sliding window", "No"],
              ["Congestion control", "Yes", "No"],
              ["Header size", "20–60 bytes", "**8 bytes**"],
              ["Speed", "Slower", "**Faster**"],
              ["Broadcast / multicast", "No", "**Yes**"],
              ["Used by", "HTTP, HTTPS, FTP, SMTP, SSH", "DNS, DHCP, VoIP, video streaming, online games"],
            ],
          },
        },
        {
          note: "**When UDP is the right answer** is the part that separates a good response. For live voice or video, a retransmitted packet arrives after the moment it was needed — it is worse than useless, because waiting for it stalls everything behind it. A dropped frame is a glitch; a stalled stream is a failure.",
        },
        {
          p: "**DNS uses UDP** for the same reason: a query and its answer fit in one small packet, so a three-way handshake would triple the cost of the exchange. It falls back to TCP when the response is too large.",
        },
      ],
      tip: "Do not just say 'TCP is reliable, UDP is fast'. Give a case where reliability is actively harmful — that is what is being tested.",
      tags: ["tcp", "udp", "comparison", "starred"],
    },
    {
      id: "cn-tr-02",
      subtopic: "TCP",
      type: "how",
      importance: "high",
      question: "Explain the TCP three-way handshake.",
      short:
        "SYN, SYN-ACK, ACK — each side sends its initial sequence number and has it acknowledged.",
      answer: [
        { diagram: "three-way-handshake" },
        {
          ol: [
            "**SYN** — the client sends a segment with the SYN flag and its initial sequence number **x**.",
            "**SYN-ACK** — the server replies with SYN, its own sequence number **y**, and `ack = x + 1`.",
            "**ACK** — the client replies with `ack = y + 1`. The connection is open.",
          ],
        },
        {
          note: "**Why three and not two.** The connection is bidirectional, so *both* sides need their initial sequence number acknowledged. The middle step does double duty — the server's SYN and its ACK of the client's — which is what collapses four messages into three.",
        },
        {
          p: "Closing takes **four**: each side sends its own FIN and receives an ACK, because either direction can finish sending while the other continues. That is why a half-closed connection is possible.",
        },
        {
          p: "A **SYN flood** attack sends the first message and never the third, leaving the server holding half-open connections until its table fills. SYN cookies are the defence.",
        },
      ],
      tip: "The 'why three' answer is the follow-up. 'Both directions need their sequence number acknowledged' is the whole of it.",
      tags: ["three-way handshake", "tcp", "syn", "syn flood"],
    },
    {
      id: "cn-tr-03",
      subtopic: "TCP",
      type: "conceptual",
      importance: "med",
      question: "How does TCP provide reliability?",
      short:
        "Sequence numbers, acknowledgements, retransmission on timeout, checksums and ordered delivery.",
      answer: [
        {
          ul: [
            "**Sequence numbers** — every byte is numbered, so the receiver can reassemble in order and spot a gap.",
            "**Acknowledgements** — the receiver reports the next byte it expects. TCP ACKs are *cumulative*: acknowledging 500 means everything below 500 arrived.",
            "**Retransmission timeout (RTO)** — no ACK in time means the segment is sent again.",
            "**Checksum** — a corrupted segment is discarded, so it is never acknowledged, so it is retransmitted.",
            "**Flow control** — the receiver advertises a window so a fast sender cannot overrun it.",
            "**Congestion control** — the sender backs off when the *network* is the bottleneck.",
          ],
        },
        {
          note: "**Flow control and congestion control solve different problems** and are often confused. Flow control protects the **receiver** from being overrun; congestion control protects the **network** from being overloaded. TCP does both, with separate windows, and sends at the minimum of the two.",
        },
      ],
      tags: ["tcp", "reliability", "flow control", "congestion control"],
    },
    {
      id: "cn-tr-04",
      subtopic: "Ports",
      type: "conceptual",
      importance: "med",
      question: "What are ports, and which ones should you know?",
      short:
        "A 16-bit number identifying a process on a host. The well-known range is 0–1023.",
      answer: [
        {
          p: "An IP address gets a packet to the right **machine**; a port gets it to the right **program** on that machine. The pair (IP, port) is a socket.",
        },
        {
          table: {
            head: ["Port", "Service", "Protocol"],
            rows: [
              ["20 / 21", "FTP — data / control", "TCP"],
              ["22", "SSH", "TCP"],
              ["25", "SMTP", "TCP"],
              ["**53**", "**DNS**", "**UDP** (TCP for large responses)"],
              ["**67 / 68**", "**DHCP** — server / client", "**UDP**"],
              ["**80**", "**HTTP**", "**TCP**"],
              ["110", "POP3", "TCP"],
              ["143", "IMAP", "TCP"],
              ["**443**", "**HTTPS**", "**TCP**"],
            ],
          },
        },
        {
          p: "Ranges: **0–1023** well-known, **1024–49151** registered, **49152–65535** ephemeral — the ones your own client picks at random for an outgoing connection.",
        },
      ],
      tags: ["ports", "sockets", "well-known ports"],
    },
    {
      id: "cn-tr-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "DNS primarily uses which transport protocol?",
      options: ["TCP", "UDP", "ICMP", "ARP"],
      correct: 1,
      answer: [
        {
          p: "UDP, on port 53 — a query and answer fit in one small packet, so a handshake would cost more than the exchange itself. It falls back to TCP for large responses.",
        },
      ],
      tags: ["mcq", "dns", "udp"],
    },
    {
      id: "cn-tr-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Closing a TCP connection takes how many messages?",
      options: ["Two", "Three", "Four", "One"],
      correct: 2,
      answer: [
        {
          p: "Four — FIN and ACK in each direction, because each side ends its own half independently. Opening takes three.",
        },
      ],
      tags: ["mcq", "tcp", "teardown"],
    },
  ],
};
