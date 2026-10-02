import { Box, Arrow, Caption } from "./primitives.jsx";

/*
 * Computer Networks diagrams.
 *
 * Drawn with the shared primitives so every diagram in the app is on one
 * 320-wide grid at one stroke weight. See primitives.jsx for the house style.
 */

const DIAGRAMS = {
  "osi-tcpip": {
    title: "The OSI model against the TCP/IP model, layer for layer",
    height: 152,
    draw: () => (
      <>
        <Caption x={76} y={11} bold>
          OSI — 7 layers
        </Caption>
        <Caption x={238} y={11} bold>
          TCP/IP — 4 layers
        </Caption>
        {[
          ["7 Application", "deep"],
          ["6 Presentation", "deep"],
          ["5 Session", "deep"],
          ["4 Transport", "brand"],
          ["3 Network", "brand"],
          ["2 Data Link", "plain"],
          ["1 Physical", "plain"],
        ].map(([l, tone], i) => (
          <Box key={l} x={12} y={17 + i * 18} w={128} h={15} label={l} tone={tone} rx={3} />
        ))}
        {[
          ["Application", 17, 54, "deep"],
          ["Transport", 71, 18, "brand"],
          ["Internet", 89, 18, "brand"],
          ["Network Access", 107, 36, "plain"],
        ].map(([l, y, h, tone]) => (
          <Box key={l} x={178} y={y} w={130} h={h} label={l} tone={tone} rx={3} />
        ))}
        <Arrow d="M146 32 L 172 40" />
        <Arrow d="M146 78 L 172 78" />
        <Arrow d="M146 96 L 172 96" />
        <Arrow d="M146 130 L 172 122" />
        <Caption x={160} y={148}>
          TCP/IP folds OSI&apos;s top three into one and its bottom two into one
        </Caption>
      </>
    ),
  },

  "layer-encapsulation": {
    title: "Encapsulation: each layer wraps the one above and renames the unit",
    height: 136,
    draw: () => (
      <>
        {[
          ["Application", "Data", 10, 0],
          ["Transport", "Segment", 34, 22],
          ["Network", "Packet", 58, 44],
          ["Data Link", "Frame", 82, 66],
          ["Physical", "Bits", 106, 88],
        ].map(([layer, unit, y, inset]) => (
          <g key={layer}>
            <Caption x={8} y={y + 12} anchor="start" bold>
              {layer}
            </Caption>
            {inset > 0 && (
              <Box x={74} y={y} w={inset} h={16} label="hdr" tone="brand" rx={2} />
            )}
            <Box x={74 + inset} y={y} w={232 - inset} h={16} label={unit} tone="deep" rx={2} />
          </g>
        ))}
        <Arrow d="M40 122 L 40 26" label="sender adds" lx={40} ly={132} />
        <Caption x={230} y={132}>
          the receiver strips them off in reverse
        </Caption>
      </>
    ),
  },

  "three-way-handshake": {
    title: "The TCP three-way handshake, and the four-way close",
    height: 156,
    draw: () => (
      <>
        <Caption x={40} y={12} bold>
          Client
        </Caption>
        <Caption x={280} y={12} bold>
          Server
        </Caption>
        <line x1="40" y1="16" x2="40" y2="148" className="stroke-brand-400" strokeWidth="1.1" strokeDasharray="3 2" />
        <line x1="280" y1="16" x2="280" y2="148" className="stroke-brand-400" strokeWidth="1.1" strokeDasharray="3 2" />

        <Caption x={160} y={28} bold>
          Open
        </Caption>
        <Arrow d="M44 38 L 274 38" label="SYN  seq=x" lx={160} ly={34} />
        <Arrow d="M276 54 L 46 54" label="SYN-ACK  seq=y, ack=x+1" lx={160} ly={50} />
        <Arrow d="M44 70 L 274 70" label="ACK  ack=y+1" lx={160} ly={66} />

        <Caption x={160} y={90} bold>
          Close
        </Caption>
        <Arrow d="M44 100 L 274 100" label="FIN" lx={160} ly={96} />
        <Arrow d="M276 114 L 46 114" label="ACK" lx={160} ly={110} />
        <Arrow d="M276 128 L 46 128" label="FIN" lx={160} ly={124} />
        <Arrow d="M44 142 L 274 142" label="ACK" lx={160} ly={138} />
        <Caption x={160} y={153}>
          closing takes four because each side ends its own direction
        </Caption>
      </>
    ),
  },

  "ip-classes": {
    title: "IPv4 address classes by first octet",
    height: 132,
    draw: () => (
      <>
        {[
          ["A", "1 – 126", "/8", "16,777,214 hosts", 10, "deep"],
          ["B", "128 – 191", "/16", "65,534 hosts", 34, "brand"],
          ["C", "192 – 223", "/24", "254 hosts", 58, "brand"],
          ["D", "224 – 239", "—", "multicast", 82, "plain"],
          ["E", "240 – 255", "—", "experimental", 106, "plain"],
        ].map(([cls, range, mask, hosts, y, tone]) => (
          <g key={cls}>
            <Box x={8} y={y} w={30} h={19} label={cls} tone={tone} rx={3} />
            <Caption x={48} y={y + 13} anchor="start">
              {range}
            </Caption>
            <Caption x={116} y={y + 13} anchor="start" bold>
              {mask}
            </Caption>
            <Caption x={160} y={y + 13} anchor="start">
              {hosts}
            </Caption>
          </g>
        ))}
        <Caption x={160} y={128}>
          127.x.x.x is loopback and belongs to no usable class
        </Caption>
      </>
    ),
  },

  "subnet-borrow": {
    title: "Subnetting borrows bits from the host part to make more networks",
    height: 130,
    draw: () => (
      <>
        <Caption x={160} y={12} bold>
          192.168.1.0 /24 → /26 (borrow 2)
        </Caption>
        <Box x={12} y={18} w={186} h={20} label="Network — 24 bits" tone="deep" rx={3} />
        <Box x={198} y={18} w={110} h={20} label="Host — 8 bits" rx={3} />

        <Arrow d="M226 42 L 226 52" />
        <Box x={12} y={56} w={186} h={20} label="Network — 24 bits" tone="deep" rx={3} />
        <Box x={198} y={56} w={56} h={20} label="borrowed 2" tone="warn" rx={3} />
        <Box x={254} y={56} w={54} h={20} label="host 6" rx={3} />

        <Caption x={160} y={92} bold>
          2² = 4 subnets · 2⁶ − 2 = 62 hosts each
        </Caption>
        {[
          ["192.168.1.0/26", ".1 – .62"],
          ["192.168.1.64/26", ".65 – .126"],
          ["192.168.1.128/26", ".129 – .190"],
          ["192.168.1.192/26", ".193 – .254"],
        ].map(([net, range], i) => (
          <g key={net}>
            <Caption x={10 + (i % 2) * 160} y={106 + Math.floor(i / 2) * 12} anchor="start" bold>
              {net}
            </Caption>
            <Caption x={130 + (i % 2) * 160} y={106 + Math.floor(i / 2) * 12} anchor="end">
              {range}
            </Caption>
          </g>
        ))}
      </>
    ),
  },

  switching: {
    title: "Circuit switching reserves a path; packet switching does not",
    height: 132,
    draw: () => (
      <>
        <Caption x={78} y={12} bold>
          Circuit switching
        </Caption>
        <Box x={4} y={30} w={40} h={20} label="A" rx={4} />
        <Box x={112} y={30} w={40} h={20} label="B" rx={4} />
        {[60, 82].map((y, i) => (
          <g key={y}>
            <circle cx={64 + i * 0} cy={y - 20} r="0" />
          </g>
        ))}
        <line x1="46" y1="40" x2="110" y2="40" className="stroke-brand-600" strokeWidth="3" />
        <Caption x={78} y={58}>
          one path, reserved for the call
        </Caption>
        <Caption x={78} y={72}>
          dedicated · constant delay
        </Caption>
        <Caption x={78} y={86}>
          wasted when idle
        </Caption>

        <line x1="160" y1="8" x2="160" y2="124" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />

        <Caption x={244} y={12} bold>
          Packet switching
        </Caption>
        <Box x={172} y={30} w={40} h={20} label="A" rx={4} />
        <Box x={278} y={30} w={40} h={20} label="B" rx={4} />
        <path d="M214 38 C 240 24, 258 24, 276 36" className="fill-none stroke-brand-600" strokeWidth="1.4" markerEnd="url(#corecs-arrow)" />
        <path d="M214 42 C 240 56, 258 56, 276 44" className="fill-none stroke-brand-600" strokeWidth="1.4" strokeDasharray="3 2" markerEnd="url(#corecs-arrow)" />
        <Caption x={244} y={72}>
          each packet routed independently
        </Caption>
        <Caption x={244} y={86}>
          shared · variable delay
        </Caption>
        <Caption x={244} y={100}>
          efficient, may reorder
        </Caption>
      </>
    ),
  },

  "network-delays": {
    title: "The four delays a packet meets at every hop",
    height: 126,
    draw: () => (
      <>
        <Box x={6} y={34} w={54} h={26} label="Sender" tone="brand" />
        <Box x={132} y={34} w={56} h={26} label="Router" tone="deep" />
        <Box x={260} y={34} w={54} h={26} label="Receiver" tone="brand" />
        <line x1="60" y1="47" x2="132" y2="47" className="stroke-brand-600" strokeWidth="1.4" />
        <line x1="188" y1="47" x2="260" y2="47" className="stroke-brand-600" strokeWidth="1.4" />

        <Caption x={96} y={26} bold>
          Tt — transmission
        </Caption>
        <Caption x={96} y={72}>
          L / B — pushing bits out
        </Caption>
        <Caption x={224} y={26} bold>
          Tp — propagation
        </Caption>
        <Caption x={224} y={72}>
          d / v — travelling
        </Caption>
        <Caption x={160} y={92} bold>
          At the router: Tq queueing + Tpro processing
        </Caption>
        <Caption x={160} y={112}>
          Total = Tt + Tp + Tq + Tpro   ·   ideal case = Tt + Tp
        </Caption>
      </>
    ),
  },

  "sliding-window": {
    title: "Stop-and-wait sends one frame per round trip; a sliding window keeps the link full",
    height: 126,
    draw: () => (
      <>
        <Caption x={78} y={12} bold>
          Stop-and-wait
        </Caption>
        <Box x={12} y={20} w={30} h={16} label="1" tone="deep" rx={2} />
        <Caption x={78} y={32} anchor="start">
          then wait…
        </Caption>
        <Box x={12} y={46} w={30} h={16} label="2" tone="deep" rx={2} />
        <Caption x={78} y={58} anchor="start">
          then wait…
        </Caption>
        <Caption x={78} y={84}>
          efficiency = Tt / (Tt + 2Tp)
        </Caption>
        <Caption x={78} y={98}>
          idle whenever 2Tp &gt; Tt
        </Caption>

        <line x1="160" y1="8" x2="160" y2="118" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />

        <Caption x={244} y={12} bold>
          Sliding window, N = 5
        </Caption>
        {[1, 2, 3, 4, 5].map((n, i) => (
          <Box key={n} x={176 + i * 28} y={20} w={25} h={16} label={String(n)} tone="deep" rx={2} />
        ))}
        <Caption x={244} y={50}>
          all five in flight before any ACK
        </Caption>
        <Caption x={244} y={84}>
          efficiency = N / (1 + 2a),  a = Tp / Tt
        </Caption>
        <Caption x={244} y={98}>
          N ≥ 1 + 2a gives 100%
        </Caption>
      </>
    ),
  },

  "dns-resolution": {
    title: "How a name is resolved when nothing is cached",
    height: 134,
    draw: () => (
      <>
        <Box x={4} y={54} w={58} h={26} label="Browser" tone="brand" />
        <Box x={86} y={54} w={68} h={26} label="Resolver" sub="your ISP" tone="deep" />
        <Box x={186} y={10} w={128} h={22} label="Root  ·  “try .com”" rx={4} />
        <Box x={186} y={44} w={128} h={22} label="TLD .com  ·  “try Google”" rx={4} />
        <Box x={186} y={78} w={128} h={22} label="Authoritative  ·  the IP" tone="brand" rx={4} />

        <Arrow d="M64 67 L 82 67" label="google.com?" lx={70} ly={100} />
        <Arrow d="M158 58 L 182 26" />
        <Arrow d="M158 65 L 182 56" />
        <Arrow d="M158 74 L 182 88" />
        <Arrow d="M82 76 L 62 76" />
        <Caption x={160} y={118}>
          the browser asks once; the resolver does the walking, then caches by TTL
        </Caption>
      </>
    ),
  },

  "google-flow": {
    title: "What happens when you type google.com and press Enter",
    height: 140,
    draw: () => (
      <>
        {[
          ["1  Browser cache / OS / hosts", "deep"],
          ["2  DNS resolution → IP", "brand"],
          ["3  ARP → MAC of the gateway", "brand"],
          ["4  TCP three-way handshake", "brand"],
          ["5  TLS handshake (HTTPS)", "brand"],
          ["6  HTTP GET → response", "brand"],
          ["7  Render, then fetch assets", "deep"],
        ].map(([step, tone], i) => (
          <Box key={step} x={40} y={8 + i * 18} w={240} h={15} label={step} tone={tone} rx={3} />
        ))}
        <Caption x={160} y={138}>
          DNS is UDP 53 · HTTP is TCP 80 · HTTPS is TCP 443
        </Caption>
      </>
    ),
  },
};

export default DIAGRAMS;
