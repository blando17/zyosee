/*
 * The brain, drawn rather than borrowed.
 *
 * An emoji would have been one character, and it would have rendered as a
 * different picture on every operating system — grey and flat on some of them.
 * This is a few dozen bytes of SVG that looks the same everywhere, scales to
 * any size, and is drawn in the palette the rest of the page uses.
 *
 * Purely decorative, so it is hidden from screen readers: the heading beside it
 * already says what this page is for.
 */
export default function ThinkMark({ className = "" }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      {/* The sparks, which do most of the work of making it look like an idea */}
      <g stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round">
        <path d="M22 16 L16 9" />
        <path d="M40 9 L38 2" />
        <path d="M10 33 L2 32" />
        <path d="M84 24 L91 18" />
        <path d="M90 42 L97 41" />
      </g>

      <g transform="translate(50 50)">
        {/* Two halves of one shape, the right being the left flipped, so the
            brain is symmetrical without the path being written twice. */}
        {[1, -1].map((side) => (
          <g key={side} transform={`scale(${side} 1)`}>
            <path
              d="M0 -34 C-13 -34 -22 -26 -23 -17 C-32 -14 -36 -5 -31 3
                 C-36 10 -32 20 -23 22 C-20 30 -10 34 -2 30 L0 32 Z"
              fill="#f9c5d7"
              stroke="#7c3d10"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* The folds. Without them it is a blob. */}
            <g fill="none" stroke="#7c3d10" strokeWidth="3" strokeLinecap="round" opacity="0.75">
              <path d="M-4 -26 C-13 -22 -13 -12 -5 -8" />
              <path d="M-16 -8 C-24 -4 -24 5 -16 9" />
              <path d="M-6 6 C-13 10 -12 19 -5 22" />
            </g>
          </g>
        ))}
        {/* The seam down the middle */}
        <path d="M0 -34 L0 32" stroke="#7c3d10" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
