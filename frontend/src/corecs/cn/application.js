/*
 * Application Layer.
 *
 * Source: "Computer Networks Notes.pdf" pp.47-51, "Cn.pdf" pp.15-16.
 *
 * DNS, DHCP and the google.com request flow are all starred on LIST.pdf.
 */

export default {
  id: "application",
  name: "Application Layer",
  importance: "high",
  icon: "door",
  blurb:
    "DNS, DHCP, HTTP — and the question that ties the whole subject together.",
  source: "Computer Networks Notes pp.47-51 · Cn.pdf pp.15-16",

  questions: [
    {
      id: "cn-app-01",
      subtopic: "DNS",
      type: "how",
      importance: "high",
      question: "How does DNS resolve a name?",
      short:
        "Caches first, then the resolver walks root → TLD → authoritative, and caches the answer for its TTL.",
      answer: [
        { diagram: "dns-resolution" },
        {
          ol: [
            "**Browser cache**, then the **OS cache**, then the **hosts file**. Most lookups stop here.",
            "The OS asks its configured **resolver** — usually the ISP's, or 8.8.8.8.",
            "If the resolver has no cached answer, it asks a **root** server, which replies \"ask the `.com` servers\".",
            "It asks the **TLD** server for `.com`, which replies \"ask Google's nameservers\".",
            "It asks the **authoritative** nameserver, which returns the actual IP.",
            "The resolver **caches** the answer for its **TTL** and returns it.",
          ],
        },
        {
          note: "**The recursive/iterative distinction** is the standard follow-up. The client's query is **recursive** — it asks once and expects a final answer. The resolver's queries are **iterative** — each server replies with a referral rather than doing the work. The recursion happens in one place, which is what makes caching effective.",
        },
        {
          table: {
            head: ["Record", "Maps"],
            rows: [
              ["**A**", "A name to an IPv4 address"],
              ["**AAAA**", "A name to an IPv6 address"],
              ["**CNAME**", "A name to another name"],
              ["**MX**", "A domain to its mail servers"],
              ["**NS**", "A domain to its nameservers"],
            ],
          },
        },
        { p: "DNS runs on **UDP port 53**, falling back to TCP when a response is too large for one datagram." },
      ],
      tip: "Say which step is recursive and which is iterative. It is the detail that distinguishes a real answer.",
      tags: ["dns", "resolution", "recursive", "ttl", "starred"],
    },
    {
      id: "cn-app-02",
      subtopic: "DHCP",
      type: "how",
      importance: "high",
      question: "How does DHCP work?",
      short:
        "DORA — Discover, Offer, Request, Acknowledge. The client broadcasts; the server leases an address.",
      answer: [
        {
          table: {
            head: ["Step", "From", "Sent as", "Carries"],
            rows: [
              ["**D**iscover", "Client", "**Broadcast**", "\"Is there a DHCP server?\" — the client has no address yet"],
              ["**O**ffer", "Server", "Broadcast or unicast", "A proposed address, mask, gateway, DNS"],
              ["**R**equest", "Client", "**Broadcast**", "\"I accept that one\" — broadcast so other servers know to withdraw"],
              ["**A**cknowledge", "Server", "Unicast", "Confirmed, with the lease duration"],
            ],
          },
        },
        {
          note: "**Discover has to be a broadcast** because the client has no IP address, so it cannot address anyone specifically. It sends from 0.0.0.0 to 255.255.255.255. That is also why **Request** is broadcast: if two servers made offers, the second needs to hear that its offer was declined so it can return the address to its pool.",
        },
        {
          p: "DHCP uses **UDP ports 67 (server) and 68 (client)**. Addresses are **leased**, not given — the client renews at half the lease time, and an address not renewed returns to the pool.",
        },
        {
          p: "A **DHCP relay agent** forwards these broadcasts across a router, which otherwise blocks them — that is how one server can serve several subnets.",
        },
      ],
      tip: "DORA is the mnemonic. Knowing why two of the four are broadcasts is the follow-up.",
      tags: ["dhcp", "dora", "broadcast", "lease", "starred"],
    },
    {
      id: "cn-app-03",
      subtopic: "The big question",
      type: "scenario",
      importance: "high",
      question: "What happens when you type google.com and press Enter?",
      short:
        "DNS → ARP → TCP handshake → TLS handshake → HTTP GET → render, with caches short-circuiting most of it.",
      answer: [
        { diagram: "google-flow" },
        {
          ol: [
            "**URL parsing.** The browser separates scheme, host and path, and normalises the name.",
            "**DNS resolution.** Browser cache, OS cache, hosts file, then the resolver walks root → TLD → authoritative. Result: an IP address.",
            "**Routing decision.** The OS compares the destination against its own subnet mask. Not local, so it goes to the **default gateway**.",
            "**ARP.** The machine needs the gateway's **MAC address** to build the frame, so it broadcasts an ARP request unless it is already cached.",
            "**TCP three-way handshake** with the server on port 443 — SYN, SYN-ACK, ACK.",
            "**TLS handshake.** Certificate presented and validated, keys agreed, the connection becomes encrypted.",
            "**HTTP GET** sent; the server responds with status, headers and HTML.",
            "**Render.** The browser parses the HTML, builds the DOM, and fetches CSS, JavaScript and images — often over the same connection.",
          ],
        },
        {
          note: "**This question exists to test breadth**, and the layer names are what earn the marks: DNS and HTTP at the **application** layer, TCP at **transport**, IP and the routing decision at **network**, ARP and Ethernet framing at **data link**. Naming the layer as you go turns a list into an argument.",
        },
        {
          p: "Worth adding if asked to go deeper: the response will usually be a redirect to a canonical host, HSTS may force HTTPS before any request is sent at all, and a CDN means the IP you reached is probably not Google's own data centre.",
        },
      ],
      tip: "Practise this one out loud. It is the most commonly asked networking question in software interviews, and it rewards structure over detail.",
      tags: ["google.com", "dns", "arp", "tcp", "tls", "http", "starred"],
    },
    {
      id: "cn-app-04",
      subtopic: "HTTP",
      type: "comparison",
      importance: "med",
      question: "What is the difference between HTTP and HTTPS, and between GET and POST?",
      short:
        "HTTPS is HTTP inside TLS. GET asks for a resource and is visible in the URL; POST sends data in the body.",
      answer: [
        {
          table: {
            head: ["", "HTTP", "HTTPS"],
            rows: [
              ["Port", "80", "**443**"],
              ["Encryption", "**None** — readable on the wire", "**TLS**"],
              ["Server identity", "Unverified", "Verified by certificate"],
              ["Overhead", "None", "One extra handshake, then negligible"],
            ],
          },
        },
        {
          table: {
            head: ["", "GET", "POST"],
            rows: [
              ["Data travels in", "The **URL**", "The **body**"],
              ["Visible in history and logs", "**Yes**", "No"],
              ["Length limit", "Practical URL limit", "Effectively none"],
              ["Idempotent", "**Yes** — repeating changes nothing", "**No**"],
              ["Cacheable", "Yes", "Not by default"],
              ["Use for", "Retrieving", "Submitting, creating"],
            ],
          },
        },
        {
          note: "**Idempotence is the real distinction**, not secrecy. A GET can safely be retried, prefetched or cached because it is supposed to change nothing; a POST cannot, which is why browsers warn before re-submitting a form. Putting a password in a GET is bad because URLs are logged — but a POST over plain HTTP is just as exposed. Only TLS makes it private.",
        },
      ],
      tags: ["http", "https", "get", "post", "idempotent"],
    },
    {
      id: "cn-app-m1",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "Which DHCP message is sent first?",
      options: ["Offer", "Discover", "Request", "Acknowledge"],
      correct: 1,
      answer: [
        {
          p: "Discover — broadcast by the client, which has no address yet and so cannot address a server directly.",
        },
      ],
      tags: ["mcq", "dhcp"],
    },
    {
      id: "cn-app-m2",
      subtopic: "Quick check",
      type: "mcq",
      importance: "med",
      question: "ARP is used to find:",
      options: [
        "An IP address from a domain name",
        "A MAC address from an IP address",
        "The best route to a network",
        "A free IP address",
      ],
      correct: 1,
      answer: [
        {
          p: "A MAC address from a known IP — needed to build the layer 2 frame. Finding an IP from a name is DNS; finding a free IP is DHCP.",
        },
      ],
      tags: ["mcq", "arp"],
    },
  ],
};
