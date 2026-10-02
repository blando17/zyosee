import { Box, Oval, Arrow, Caption } from "./primitives.jsx";

/*
 * Object-Oriented Programming diagrams.
 *
 * Drawn with the shared primitives so every diagram in the app is on one
 * 320-wide grid at one stroke weight. See primitives.jsx for the house
 * style and for why these are SVG rather than cropped images.
 */

const DIAGRAMS = {

  "four-pillars": {
    title: "The four pillars of object-oriented programming",
    height: 128,
    draw: () => (
      <>
        <Box x={112} y={52} w={96} h={26} label="OOP" tone="deep" />
        {[
          ["Encapsulation", "bundle + hide", 4, 10],
          ["Abstraction", "show only what matters", 170, 10],
          ["Inheritance", "reuse by IS-A", 4, 96],
          ["Polymorphism", "one name, many forms", 170, 96],
        ].map(([label, sub, x, y]) => (
          <Box key={label} x={x} y={y} w={146} h={24} label={label} sub={sub} tone="brand" />
        ))}
        <Arrow d="M130 50 L 100 36" />
        <Arrow d="M190 50 L 218 36" />
        <Arrow d="M130 80 L 100 94" />
        <Arrow d="M190 80 L 218 94" />
      </>
    ),
  },

  "class-object": {
    title: "A class is the blueprint; objects are the instances made from it",
    height: 116,
    draw: () => (
      <>
        <Box x={6} y={40} w={104} h={40} label="class Car" sub="brand · speed · drive()" tone="deep" />
        <Caption x={58} y={34} bold>
          Blueprint — no memory
        </Caption>
        {[14, 52, 90].map((y, i) => (
          <Box
            key={i}
            x={186}
            y={y}
            w={124}
            h={22}
            label={`car${i + 1}`}
            sub={["Honda", "Swift", "BMW"][i]}
            tone="brand"
          />
        ))}
        <Caption x={248} y={8} bold>
          Objects — each has memory
        </Caption>
        <Arrow d="M114 52 C 150 40, 160 30, 182 26" />
        <Arrow d="M114 60 L 182 62" />
        <Arrow d="M114 70 C 150 82, 160 92, 182 98" />
      </>
    ),
  },

  encapsulation: {
    title: "Encapsulation: private data reached only through public methods",
    height: 120,
    draw: () => (
      <>
        <rect x="70" y="10" width="180" height="100" rx="10" className="fill-brand-50 stroke-brand-500" strokeWidth="1.4" />
        <Caption x={160} y={24} bold>
          class BankAccount
        </Caption>
        <Box x={100} y={30} w={120} h={26} label="private balance" sub="unreachable from outside" tone="warn" />
        <Box x={84} y={64} w={70} h={22} label="setBalance()" tone="brand" rx={4} />
        <Box x={166} y={64} w={70} h={22} label="getBalance()" tone="brand" rx={4} />
        <Arrow d="M120 62 L 132 58" />
        <Arrow d="M196 62 L 186 58" />
        <Box x={4} y={64} w={58} h={22} label="Outside" />
        <Arrow d="M64 74 L 80 74" />
        <Arrow d="M256 74 L 240 74" />
        <Box x={258} y={64} w={58} h={22} label="Outside" />
        <Caption x={160} y={104}>
          the only doors in are the ones the class chooses to provide
        </Caption>
      </>
    ),
  },

  "access-modifiers": {
    title: "How far each access modifier reaches",
    height: 128,
    draw: () => (
      <>
        {[
          ["world", 150, "public", 0],
          ["subclass", 114, "protected", 1],
          ["package", 78, "default", 2],
          ["class", 42, "private", 3],
        ].map(([scope, w, mod, i]) => (
          <g key={mod}>
            <rect
              x={160 - w / 2}
              y={8 + i * 14}
              width={w}
              height={112 - i * 28}
              rx="8"
              className={i === 3 ? "fill-brand-300 stroke-brand-600" : "fill-brand-100 stroke-brand-400"}
              strokeWidth="1.1"
              opacity={i === 3 ? 1 : 0.55}
            />
            <text x={160} y={20 + i * 14} textAnchor="middle" className="fill-ink-900 text-[7px] font-bold">
              {mod}
            </text>
          </g>
        ))}
        <Caption x={160} y={126}>
          private is the innermost ring; public is everything
        </Caption>
      </>
    ),
  },

  "inheritance-types": {
    title: "The five types of inheritance",
    height: 136,
    draw: () => {
      const node = (x, y, label, key) => (
        <g key={key}>
          <circle cx={x} cy={y} r="9" className="fill-brand-200 stroke-brand-600" strokeWidth="1.1" />
          <text x={x} y={y + 3} textAnchor="middle" className="fill-ink-900 text-[7px] font-bold">
            {label}
          </text>
        </g>
      );
      const link = (x1, y1, x2, y2, key) => (
        <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-brand-500" strokeWidth="1" />
      );
      return (
        <>
          {[
            ["Single", 32],
            ["Multilevel", 96],
            ["Hierarchical", 160],
            ["Multiple", 224],
            ["Hybrid", 288],
          ].map(([label, x]) => (
            <Caption key={label} x={x} y={12} bold>
              {label}
            </Caption>
          ))}
          {link(32, 31, 32, 53, "s")}
          {node(32, 22, "A", "sa")}
          {node(32, 62, "B", "sb")}

          {link(96, 31, 96, 53, "m1")}
          {link(96, 71, 96, 93, "m2")}
          {node(96, 22, "A", "ma")}
          {node(96, 62, "B", "mb")}
          {node(96, 102, "C", "mc")}

          {link(160, 31, 142, 53, "h1")}
          {link(160, 31, 178, 53, "h2")}
          {node(160, 22, "A", "ha")}
          {node(142, 62, "B", "hb")}
          {node(178, 62, "C", "hc")}

          {link(206, 31, 224, 53, "u1")}
          {link(242, 31, 224, 53, "u2")}
          {node(206, 22, "A", "ua")}
          {node(242, 22, "B", "ub")}
          {node(224, 62, "C", "uc")}

          {link(288, 31, 270, 53, "y1")}
          {link(288, 31, 306, 53, "y2")}
          {link(270, 71, 288, 93, "y3")}
          {link(306, 71, 288, 93, "y4")}
          {node(288, 22, "A", "ya")}
          {node(270, 62, "B", "yb")}
          {node(306, 62, "C", "yc")}
          {node(288, 102, "D", "yd")}
          <Caption x={160} y={130}>
            Java supports every shape except Multiple and Hybrid with classes
          </Caption>
        </>
      );
    },
  },

  "diamond-problem": {
    title: "The diamond problem, and virtual inheritance as the fix",
    height: 132,
    draw: () => (
      <>
        <Caption x={80} y={12} bold>
          Two copies of A
        </Caption>
        <Box x={56} y={18} w={48} h={20} label="A" tone="warn" rx={4} />
        <Box x={14} y={56} w={48} h={20} label="B" rx={4} />
        <Box x={98} y={56} w={48} h={20} label="C" rx={4} />
        <Box x={56} y={94} w={48} h={20} label="D" tone="deep" rx={4} />
        <Arrow d="M62 54 L 72 40" />
        <Arrow d="M98 54 L 88 40" />
        <Arrow d="M72 92 L 62 78" />
        <Arrow d="M88 92 L 98 78" />
        <Caption x={80} y={126}>
          d.show() — from B or from C?
        </Caption>

        <line x1="160" y1="8" x2="160" y2="124" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />

        <Caption x={244} y={12} bold>
          virtual — one copy
        </Caption>
        <Box x={220} y={18} w={48} h={20} label="A" tone="deep" rx={4} />
        <Box x={178} y={56} w={48} h={20} label="B" rx={4} />
        <Box x={262} y={56} w={48} h={20} label="C" rx={4} />
        <Box x={220} y={94} w={48} h={20} label="D" tone="deep" rx={4} />
        <Arrow d="M226 54 L 236 40" dashed />
        <Arrow d="M262 54 L 252 40" dashed />
        <Arrow d="M236 92 L 226 78" />
        <Arrow d="M252 92 L 262 78" />
        <Caption x={244} y={126}>
          class B : virtual public A
        </Caption>
      </>
    ),
  },

  vtable: {
    title: "How a virtual call is resolved: object to vptr to v-table to function",
    height: 130,
    draw: () => (
      <>
        <Caption x={54} y={12} bold>
          Derived object
        </Caption>
        <rect x="10" y="18" width="88" height="80" rx="6" className="fill-surface stroke-brand-400" strokeWidth="1.2" />
        <Box x={18} y={26} w={72} h={18} label="data" rx={3} />
        <Box x={18} y={48} w={72} h={18} label="data" rx={3} />
        <Box x={18} y={72} w={72} h={18} label="vptr" tone="deep" rx={3} />

        <Caption x={200} y={12} bold>
          V-table of Derived
        </Caption>
        <rect x="132" y="18" width="136" height="80" rx="6" className="fill-brand-50 stroke-brand-500" strokeWidth="1.2" />
        <Box x={140} y={26} w={120} h={18} label="&Derived::show()" tone="brand" rx={3} />
        <Box x={140} y={48} w={120} h={18} label="&Base::display()" rx={3} />
        <Box x={140} y={70} w={120} h={18} label="&Derived::~Derived()" tone="brand" rx={3} />

        <Arrow d="M92 80 C 112 78, 118 44, 136 36" />
        <Caption x={160} y={112}>
          one hidden pointer per object, one table per class
        </Caption>
        <Caption x={160} y={124}>
          which is why a virtual call costs one extra indirection
        </Caption>
      </>
    ),
  },

  "overload-vs-override": {
    title: "Overloading happens in one class at compile time; overriding spans two at runtime",
    height: 128,
    draw: () => (
      <>
        <Caption x={78} y={12} bold>
          Overloading — one class
        </Caption>
        <rect x="8" y="18" width="140" height="82" rx="8" className="fill-brand-50 stroke-brand-400" strokeWidth="1.2" />
        <Caption x={78} y={30} bold>
          class Calculator
        </Caption>
        <Box x={16} y={36} w={124} h={18} label="add(int, int)" tone="brand" rx={3} />
        <Box x={16} y={58} w={124} h={18} label="add(double, double)" tone="brand" rx={3} />
        <Box x={16} y={80} w={124} h={16} label="add(int, int, int)" tone="brand" rx={3} />
        <Caption x={78} y={112}>
          picked by the compiler
        </Caption>

        <line x1="160" y1="8" x2="160" y2="120" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />

        <Caption x={242} y={12} bold>
          Overriding — two classes
        </Caption>
        <Box x={180} y={22} w={124} h={24} label="class Animal" sub="speak()" />
        <Box x={180} y={64} w={124} h={24} label="class Dog" sub="speak() override" tone="deep" />
        <Arrow d="M242 62 L 242 48" />
        <Caption x={242} y={112}>
          picked at runtime by the object
        </Caption>
      </>
    ),
  },

  "abstract-interface": {
    title: "An abstract class can carry shared code; an interface only declares a contract",
    height: 128,
    draw: () => (
      <>
        <Caption x={78} y={12} bold>
          Abstract class
        </Caption>
        <rect x="8" y="18" width="140" height="66" rx="8" className="fill-brand-100 stroke-brand-500" strokeWidth="1.2" />
        <Caption x={78} y={30} bold>
          abstract class Shape
        </Caption>
        <Box x={16} y={36} w={124} h={18} label="area() = 0" sub="" tone="warn" rx={3} />
        <Box x={16} y={58} w={124} h={20} label="display()" sub="has a body" tone="brand" rx={3} />
        <Box x={8} y={96} w={140} h={22} label="class Circle : Shape" tone="deep" />
        <Arrow d="M78 94 L 78 86" />

        <line x1="160" y1="8" x2="160" y2="120" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />

        <Caption x={242} y={12} bold>
          Interface
        </Caption>
        <rect x="172" y="18" width="140" height="66" rx="8" className="fill-brand-50 stroke-brand-400" strokeWidth="1.2" strokeDasharray="4 2" />
        <Caption x={242} y={30} bold>
          interface Flyable
        </Caption>
        <Box x={180} y={36} w={124} h={18} label="fly()" sub="" rx={3} />
        <Box x={180} y={58} w={124} h={20} label="no fields, no ctor" rx={3} />
        <Box x={172} y={96} w={140} h={22} label="class Bird implements …" tone="deep" />
        <Arrow d="M242 94 L 242 86" dashed />
      </>
    ),
  },

  relationships: {
    title: "Association, aggregation, composition and inheritance in UML",
    height: 140,
    draw: () => (
      <>
        {[
          ["Association", "uses", 16, "line"],
          ["Aggregation", "HAS-A, weak", 52, "hollow"],
          ["Composition", "HAS-A, strong", 88, "filled"],
          ["Inheritance", "IS-A", 124, "arrow"],
        ].map(([label, sub, y, kind]) => (
          <g key={label}>
            <Box x={4} y={y - 9} w={74} h={20} label={label} rx={4} />
            <line x1="80" y1={y} x2="196" y2={y} className="stroke-brand-600" strokeWidth="1.2" />
            {kind === "hollow" && (
              <path d={`M84 ${y} l8 -5 l8 5 l-8 5 z`} className="fill-surface stroke-brand-600" strokeWidth="1.1" />
            )}
            {kind === "filled" && (
              <path d={`M84 ${y} l8 -5 l8 5 l-8 5 z`} className="fill-brand-600 stroke-brand-600" strokeWidth="1.1" />
            )}
            {kind === "arrow" && (
              <path d={`M196 ${y} l-10 -6 l0 12 z`} className="fill-surface stroke-brand-600" strokeWidth="1.1" />
            )}
            <Box x={198} y={y - 9} w={62} h={20} label="Part" rx={4} />
            <Caption x={290} y={y + 3}>
              {sub}
            </Caption>
          </g>
        ))}
      </>
    ),
  },

  "object-slicing": {
    title: "Object slicing: assigning a derived object to a base object throws the derived part away",
    height: 120,
    draw: () => (
      <>
        <Caption x={56} y={12} bold>
          Derived d
        </Caption>
        <rect x="14" y="18" width="84" height="66" rx="6" className="fill-surface stroke-brand-500" strokeWidth="1.2" />
        <Box x={22} y={26} w={68} h={22} label="int x = 10" sub="from Base" tone="brand" rx={3} />
        <Box x={22} y={54} w={68} h={22} label="int y = 20" sub="from Derived" tone="warn" rx={3} />

        <Arrow d="M104 50 L 172 50" label="Base b = d;" lx={138} ly={42} />

        <Caption x={244} y={12} bold>
          Base b
        </Caption>
        <rect x="200" y="18" width="84" height="66" rx="6" className="fill-surface stroke-brand-500" strokeWidth="1.2" />
        <Box x={208} y={26} w={68} h={22} label="int x = 10" sub="kept" tone="brand" rx={3} />
        <rect x="208" y="54" width="68" height="22" rx="3" className="fill-none stroke-brand-300" strokeWidth="1" strokeDasharray="3 2" />
        <text x="242" y="68" textAnchor="middle" className="fill-ink-500 text-[6.5px]">
          y is gone
        </text>
        <Caption x={160} y={104}>
          use a pointer or a reference if you want polymorphism
        </Caption>
      </>
    ),
  },

  "upcast-downcast": {
    title: "Upcasting is implicit and safe; downcasting is explicit and must be checked",
    height: 118,
    draw: () => (
      <>
        <Box x={100} y={16} w={120} h={26} label="Base" tone="deep" />
        <Box x={100} y={78} w={120} h={26} label="Derived" tone="brand" />
        <Arrow d="M96 76 C 60 62, 60 44, 96 32" label="upcast" lx={44} ly={58} />
        <Caption x={44} y={70}>
          implicit · safe
        </Caption>
        <Arrow d="M224 34 C 262 46, 262 64, 224 78" label="downcast" lx={288} ly={52} />
        <Caption x={288} y={64}>
          explicit · risky
        </Caption>
        <Caption x={160} y={114}>
          dynamic_cast returns nullptr when the object is not really a Derived
        </Caption>
      </>
    ),
  },

  "shallow-vs-deep": {
    title: "Shallow copy shares the pointed-to memory; deep copy allocates its own",
    height: 132,
    draw: () => (
      <>
        <Caption x={78} y={12} bold>
          Shallow copy
        </Caption>
        <Box x={8} y={20} w={58} h={22} label="s1" rx={4} />
        <Box x={90} y={20} w={58} h={22} label="s2" rx={4} />
        <Box x={40} y={74} w={78} h={24} label="marks = 90" tone="warn" />
        <Arrow d="M37 44 L 62 70" />
        <Arrow d="M119 44 L 96 70" />
        <Caption x={78} y={118}>
          one object; changing either changes both
        </Caption>

        <line x1="160" y1="8" x2="160" y2="124" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />

        <Caption x={242} y={12} bold>
          Deep copy
        </Caption>
        <Box x={172} y={20} w={58} h={22} label="s1" rx={4} />
        <Box x={254} y={20} w={58} h={22} label="s2" rx={4} />
        <Box x={168} y={74} w={66} h={24} label="marks = 90" tone="brand" />
        <Box x={250} y={74} w={66} h={24} label="marks = 50" tone="brand" />
        <Arrow d="M201 44 L 201 70" />
        <Arrow d="M283 44 L 283 70" />
        <Caption x={242} y={118}>
          two objects; fully independent
        </Caption>
      </>
    ),
  },

  "ctor-dtor-order": {
    title: "Construction runs base first; destruction runs derived first",
    height: 122,
    draw: () => (
      <>
        <Caption x={78} y={12} bold>
          Construction
        </Caption>
        <Box x={12} y={18} w={132} h={22} label="Base()" tone="deep" rx={4} />
        <Box x={12} y={50} w={132} h={22} label="Derived()" tone="brand" rx={4} />
        <Arrow d="M78 42 L 78 48" />
        <Caption x={78} y={86}>
          the base must exist before
        </Caption>
        <Caption x={78} y={98}>
          the derived part can be built
        </Caption>

        <line x1="160" y1="8" x2="160" y2="114" className="stroke-brand-300" strokeDasharray="3 3" strokeWidth="1" />

        <Caption x={242} y={12} bold>
          Destruction
        </Caption>
        <Box x={176} y={18} w={132} h={22} label="~Derived()" tone="brand" rx={4} />
        <Box x={176} y={50} w={132} h={22} label="~Base()" tone="deep" rx={4} />
        <Arrow d="M242 42 L 242 48" />
        <Caption x={242} y={86}>
          exactly the reverse —
        </Caption>
        <Caption x={242} y={98}>
          last built, first destroyed
        </Caption>
      </>
    ),
  },

  "friend-access": {
    title: "A friend reaches private members from outside the class",
    height: 116,
    draw: () => (
      <>
        <rect x="14" y="16" width="150" height="84" rx="8" className="fill-brand-50 stroke-brand-500" strokeWidth="1.3" />
        <Caption x={89} y={28} bold>
          class Car
        </Caption>
        <Box x={26} y={34} w={126} h={24} label="private engineNumber" tone="warn" rx={4} />
        <Box x={26} y={66} w={126} h={22} label="friend class Mechanic;" tone="brand" rx={4} />

        <Box x={210} y={30} w={96} h={26} label="class Mechanic" tone="deep" />
        <Box x={210} y={66} w={96} h={22} label="Everyone else" />

        <Arrow d="M206 44 L 156 44" label="allowed" lx={182} ly={38} />
        <line x1="206" y1="76" x2="170" y2="76" className="stroke-rose-500" strokeWidth="1.2" strokeDasharray="3 2" />
        <text x="188" y="88" textAnchor="middle" className="fill-rose-600 text-[6.5px] font-bold">
          blocked
        </text>
        <Caption x={160} y={110}>
          friendship is granted by the class, never taken
        </Caption>
      </>
    ),
  },
};

export default DIAGRAMS;
