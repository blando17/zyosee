/*
 * OSI and TCP/IP Models.
 *
 * Source: "Computer Networks Notes.pdf" pp.3-9, "Cn.pdf" p4.
 *
 * "TCP/IP Model vs OSI Model" is the first item on your CN priority list.
 */

export default {
  id: "models",
  name: "OSI & TCP/IP Models",
  importance: "high",
  icon: "books",
  blurb:
    "The seven-layer reference model, the four-layer one that was actually built, and what each layer adds.",
  source: "Computer Networks Notes pp.3-9 · Cn.pdf p4",

  questions: [
    {
      id: "cn-mod-01",
      subtopic: "OSI",
      type: "conceptual",
      importance: "high",
      question: "What are the seven layers of the OSI model?",
      short:
        "Physical, Data Link, Network, Transport, Session, Presentation, Application — bottom to top.",
      answer: [
        { diagram: "osi-tcpip" },
        {
          table: {
            head: ["#", "Layer", "Does", "Unit", "Examples"],
            rows: [
              ["7", "**Application**", "The interface programs use", "Data", "HTTP, FTP, SMTP, DNS"],
              ["6", "**Presentation**", "Encoding, encryption, compression", "Data", "TLS, JPEG, ASCII"],
              ["5", "**Session**", "Opens, manages and closes sessions", "Data", "NetBIOS, RPC"],
              ["4", "**Transport**", "End-to-end delivery, reliability, ports", "**Segment**", "TCP, UDP"],
              ["3", "**Network**", "Logical addressing and routing", "**Packet**", "IP, ICMP, routers"],
              ["2", "**Data Link**", "Framing, MAC addressing, error detection", "**Frame**", "Ethernet, ARP, switches"],
              ["1", "**Physical**", "Bits onto the medium", "**Bits**", "Cables, hubs, repeaters"],
            ],
          },
        },
        {
          note: "The unit column is the one that gets asked as a follow-up: **segment at transport, packet at network, frame at data link, bits at physical.** Using the right word for the layer signals you understand where you are in the stack.",
        },
        {
          p: "Mnemonic bottom-up: **P**lease **D**o **N**ot **T**hrow **S**ausage **P**izza **A**way.",
        },
      ],
      tip: "Learn it bottom-up. Every question that builds on it — encapsulation, which device works where — runs bottom-up too.",
      tags: ["osi", "layers", "pdu"],
    },
    {
      id: "cn-mod-02",
      subtopic: "Comparison",
      type: "comparison",
      importance: "high",
      question: "What is the difference between the OSI and TCP/IP models?",
      short:
        "OSI is a seven-layer reference model designed first; TCP/IP is a four-layer model derived from working protocols.",
      answer: [
        {
          table: {
            head: ["", "OSI", "TCP/IP"],
            rows: [
              ["Layers", "**7**", "**4** (some texts say 5)"],
              ["Came first", "The **model**, then protocols", "The **protocols**, then the model"],
              ["Used in practice", "As a teaching and reference model", "**The actual internet**"],
              ["Session + Presentation", "Separate layers", "Folded into Application"],
              ["Physical + Data Link", "Separate layers", "Folded into Network Access"],
              ["Layer coupling", "Strictly independent", "Looser"],
            ],
          },
        },
        {
          table: {
            head: ["OSI layers", "TCP/IP layer"],
            rows: [
              ["Application, Presentation, Session", "**Application**"],
              ["Transport", "**Transport**"],
              ["Network", "**Internet**"],
              ["Data Link, Physical", "**Network Access / Link**"],
            ],
          },
        },
        {
          note: "The honest summary: **OSI is the model everyone learns and nobody implements; TCP/IP is the one running the internet.** OSI still earns its place because its vocabulary — layer 3 problem, layer 7 load balancer — is how engineers talk about networks.",
        },
      ],
      tags: ["osi", "tcp/ip", "comparison"],
    },
    {
      id: "cn-mod-03",
      subtopic: "Encapsulation",
      type: "how",
      importance: "high",
      question: "What is encapsulation?",
      short:
        "Each layer wraps the data from the layer above in its own header, renaming the unit as it goes.",
      answer: [
        { diagram: "layer-encapsulation" },
        {
          ol: [
            "**Application** hands down **data**.",
            "**Transport** adds a header with ports and sequence numbers → a **segment**.",
            "**Network** adds source and destination IP → a **packet**.",
            "**Data Link** adds MAC addresses and a trailer checksum → a **frame**.",
            "**Physical** sends it as **bits**.",
          ],
        },
        {
          p: "The receiver does the reverse — **de-encapsulation** — each layer stripping its own header and passing the rest up.",
        },
        {
          note: "The consequence worth knowing: **headers are overhead.** A 20-byte TCP header plus a 20-byte IP header plus an Ethernet frame means a one-byte payload costs well over fifty bytes on the wire. That is why small packets are inefficient and why MTU matters.",
        },
      ],
      tags: ["encapsulation", "headers", "pdu"],
    },
    {
      id: "cn-mod-04",
      subtopic: "Devices",
      type: "comparison",
      importance: "med",
      question: "Which network devices operate at which layer?",
      short:
        "Hub at layer 1, switch and bridge at layer 2, router at layer 3, gateway across all of them.",
      answer: [
        {
          table: {
            head: ["Device", "Layer", "Decides using", "Collision / broadcast domains"],
            rows: [
              ["**Hub / repeater**", "1 — Physical", "Nothing — repeats to every port", "One collision domain, one broadcast domain"],
              ["**Switch / bridge**", "2 — Data Link", "**MAC address**", "One collision domain **per port**, one broadcast domain"],
              ["**Router**", "3 — Network", "**IP address**", "Separates **both** — it does not forward broadcasts"],
              ["**Gateway**", "All", "Protocol translation", "—"],
            ],
          },
        },
        {
          note: "**The difference that matters: a switch splits collision domains, a router splits broadcast domains.** A hub repeats every bit to every port, so two hosts transmitting at once collide. A switch gives each port its own segment. But a broadcast still reaches every port on a switch — only a router stops it, which is why broadcast traffic is what limits how large a flat network can grow.",
        },
      ],
      tags: ["hub", "switch", "router", "collision domain", "broadcast domain"],
    },
    {
      id: "cn-mod-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "A router operates at which OSI layer?",
      options: ["1 — Physical", "2 — Data Link", "3 — Network", "4 — Transport"],
      correct: 2,
      answer: [{ p: "Layer 3. It forwards on IP addresses; a switch is layer 2 and forwards on MAC addresses." }],
      tags: ["mcq", "router"],
    },
    {
      id: "cn-mod-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "The data unit at the Transport layer is called a:",
      options: ["Frame", "Packet", "Segment", "Bit"],
      correct: 2,
      answer: [{ p: "Segment. Packet is network layer, frame is data link, bits are physical." }],
      tags: ["mcq", "pdu"],
    },
  ],
};
