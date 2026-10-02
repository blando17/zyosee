/*
 * Congestion Control.
 *
 * Source: "Cn.pdf" p14, "Computer Networks Notes.pdf" pp.41-44.
 */
export default {
  id: "congestion",
  name: "Congestion Control",
  importance: "med",
  icon: "trendDown",
  blurb: "How TCP finds the speed the network can bear, without being told what it is.",
  source: "Cn.pdf p14 · Computer Networks Notes pp.41-44",
  questions: [
    {
      id: "cn-cong-01",
      subtopic: "Basics",
      type: "comparison",
      importance: "high",
      question: "What is the difference between flow control and congestion control?",
      short:
        "Flow control protects the receiver from being overrun. Congestion control protects the network from being overloaded.",
      answer: [
        {
          table: {
            head: ["", "Flow control", "Congestion control"],
            rows: [
              ["Protects", "**The receiver**", "**The network**"],
              ["Problem", "A fast sender overwhelming a slow receiver", "Too much traffic for the links and routers"],
              ["Scope", "End to end, two hosts", "The whole path"],
              ["Signal", "The receiver **advertises** a window", "**Inferred** from packet loss and delay"],
              ["Mechanism", "Receive window (rwnd)", "Congestion window (cwnd)"],
            ],
          },
        },
        {
          note: "**TCP runs both at once and sends at the minimum of the two windows.** The distinction matters because the signals are completely different in kind: the receiver *tells* you its window in every ACK, while the network never tells you anything — congestion has to be **guessed** from packets going missing.",
        },
      ],
      tip: "This pair is confused constantly. 'Receiver versus network' is the whole answer.",
      tags: ["flow control", "congestion control", "rwnd", "cwnd"],
    },
    {
      id: "cn-cong-02",
      subtopic: "TCP",
      type: "how",
      importance: "high",
      question: "How does TCP congestion control work?",
      short:
        "Slow start doubles the window until a threshold, then congestion avoidance adds one per RTT. Loss cuts it back.",
      answer: [
        {
          ol: [
            "**Slow start.** Begin with a congestion window of one segment and **double it every RTT** — exponential growth, despite the name — until it reaches the threshold `ssthresh`.",
            "**Congestion avoidance.** Past the threshold, grow by **one segment per RTT** — linear, because the sender is now near the limit and probing carefully.",
            "**Loss detected by triple duplicate ACK** — treated as mild congestion. Halve the window and continue linearly. This is **fast recovery**.",
            "**Loss detected by timeout** — treated as severe. Drop the window **back to one** and slow-start again.",
          ],
        },
        {
          note: "The pattern is **AIMD — additive increase, multiplicative decrease.** Growing slowly and backing off sharply is what makes TCP *fair*: several flows sharing a link converge on an even split, because the flow using most loses most when it cuts back.",
        },
        {
          p: "The two loss signals get different treatment for a good reason. **Duplicate ACKs prove packets are still arriving**, so the path works and one packet was unlucky. **A timeout means nothing came back at all**, which suggests something far worse — so TCP restarts from the bottom.",
        },
      ],
      tip: "Name AIMD and say why it produces fairness. That is the insight the question is looking for.",
      tags: ["slow start", "congestion avoidance", "aimd", "fast recovery"],
    },
    {
      id: "cn-cong-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "During TCP slow start, the congestion window grows:",
      options: ["Linearly", "Exponentially", "Not at all", "Randomly"],
      correct: 1,
      answer: [
        { p: "Exponentially — it doubles every RTT. The name refers to starting small, not to the growth rate." },
      ],
      tags: ["mcq", "slow start"],
    },
  ],
};
