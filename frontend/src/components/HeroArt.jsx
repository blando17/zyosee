/*
 * The illustration beside the hero: the loop on the left, a laptop showing
 * code in the middle, and three little cards on the right.
 *
 * Drawn in markup rather than shipped as an image, so it stays sharp at any
 * size, follows the theme colours, and costs nothing to download.
 *
 * Laid out with flex rather than absolute positions. The first attempt stacked
 * everything absolutely inside one box and the laptop sat on top of the words
 * beside it; a row of three columns cannot overlap itself.
 *
 * No base under the screen either. A thin bar below a dark panel with a shadow
 * on it read as a clipping mistake rather than as a laptop, and the window on
 * its own is cleaner.
 */

const LOOP = ["Code", "Practice", "Improve", "Repeat"];

const CARDS = [
  { label: "Think", glyph: "</>", tint: "bg-brand-200" },
  { label: "Code", glyph: "{ }", tint: "bg-brand-300" },
  { label: "Solve", glyph: "✓", tint: "bg-brand-400" },
];

export default function HeroArt() {
  return (
    <div className="relative" aria-hidden="true">
      {/* The soft disc everything sits on. */}
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-200/60 blur-3xl" />

      <div className="relative flex items-center justify-center gap-4 sm:gap-6">
        {/* The loop, written out. */}
        <div className="hidden shrink-0 sm:block">
          <ul className="space-y-1.5 text-sm italic text-brand-800 sm:text-base">
            {LOOP.map((word, index) => (
              <li key={word} style={{ paddingLeft: `${index * 6}px` }}>
                {word}
              </li>
            ))}
          </ul>
          <svg width="56" height="30" viewBox="0 0 56 30" fill="none" className="mt-1">
            <path d="M3 5c20 -4 40 3 46 16" stroke="#c2600a" strokeWidth="2" strokeLinecap="round" />
            <path d="M43 16l6 6 5 -7" stroke="#c2600a" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        {/* The laptop. */}
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-xl border-4 border-code bg-code shadow-xl">
            <div className="flex gap-1.5 bg-code-soft px-3 py-2">
              {["#ff5f57", "#febc2e", "#28c840"].map((colour) => (
                <span
                  key={colour}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colour }}
                />
              ))}
            </div>
            <pre className="overflow-x-auto px-5 py-4 font-mono text-xs leading-6 text-brand-100 sm:text-[13px] sm:leading-7">
              <code>
                <span className="text-brand-300">#include</span>{" "}
                <span className="text-green-300">&lt;iostream&gt;</span>
                {"\n"}
                <span className="text-brand-300">using namespace</span> std;
                {"\n\n"}
                <span className="text-brand-300">int</span>{" "}
                <span className="text-brand-200">main</span>() {"{"}
                {"\n    "}cout &lt;&lt;{" "}
                <span className="text-green-300">&quot;Hello, ZYOSEE!&quot;</span>;
                {"\n    "}
                <span className="text-brand-300">return</span> 0;
                {"\n"}
                {"}"}
              </code>
            </pre>
          </div>
        </div>

        {/* The three little cards. */}
        <div className="shrink-0 space-y-3">
          {CARDS.map((card, index) => (
            <div
              key={card.label}
              className={`w-20 rounded-xl ${card.tint} px-2 py-2.5 text-center shadow-sm sm:w-24`}
              style={{ transform: `rotate(${index % 2 ? 3 : -3}deg)` }}
            >
              <p className="text-xs font-bold text-ink-900">{card.label}</p>
              <p className="font-mono text-sm text-ink-800">{card.glyph}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
