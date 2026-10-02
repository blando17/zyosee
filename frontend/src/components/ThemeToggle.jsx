import { useTheme } from "../context/ThemeContext";

/*
 * The light/dark switch.
 *
 * A single button rather than a three-way light/dark/system control. The
 * automatic case is already the default for anybody who has not pressed this,
 * so a "system" option would be a third state that most people never leave and
 * the rest would have to understand.
 *
 * It says what it will DO, not what it currently is — "Switch to dark mode" —
 * because a button labelled with its current state is ambiguous about which
 * way it goes. The icon shows the destination for the same reason.
 */
export default function ThemeToggle({ className = "" }) {
  const { isDark, toggle } = useTheme();
  const goingTo = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      title={`Switch to ${goingTo} mode`}
      aria-label={`Switch to ${goingTo} mode`}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-brand-300
                  text-brand-800 transition hover:bg-brand-100
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${className}`}
    >
      {/* Both glyphs are drawn; only one is shown, so the button never
          reflows as it changes and the swap reads as a flip rather than a
          replacement. */}
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
        {isDark ? (
          <g stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.6v2.2M12 19.2v2.2M4.2 12H2M22 12h-2.2M6.3 6.3 4.8 4.8M19.2 19.2l-1.5-1.5M17.7 6.3l1.5-1.5M4.8 19.2l1.5-1.5" />
          </g>
        ) : (
          <path
            d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5a8.5 8.5 0 1 0 10.8 10.8Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
