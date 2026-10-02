/*
 * A person, as a coloured disc with their initials.
 *
 * One component so the navigation bar and the friends list cannot drift into
 * showing the same person two different ways.
 */

/*
 * Colours are picked from the name rather than stored.
 *
 * That means the same person is always the same colour, on every screen and
 * after every reload, with nothing to migrate and no extra column. The palette
 * is small and all five are dark text on a light tint, so the initials stay
 * legible whichever one comes up.
 */
const TINTS = [
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-900",
  "bg-rose-100 text-rose-800",
];

/*
 * Up to two letters: the first of the first word and the first of the last.
 *
 * "bc de" gives BD, "Soumya" gives S. A single name takes one letter rather
 * than its first two, which is the convention everywhere else and avoids
 * inventing an initial the person does not have.
 *
 * Array.from, not charAt, so a name starting with an emoji or a character
 * outside the basic range is not sliced in half into a broken glyph.
 */
export function initialsOf(name) {
  const words = String(name || "")
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (!words.length) return "?";

  const first = Array.from(words[0])[0] || "";
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] || "" : "";
  return (first + last).toUpperCase();
}

function tintFor(name) {
  let sum = 0;
  for (const character of String(name || "?")) sum += character.codePointAt(0);
  return TINTS[sum % TINTS.length];
}

export default function Avatar({ name, size = "h-10 w-10", className = "" }) {
  return (
    <span
      className={`flex ${size} shrink-0 select-none items-center justify-center rounded-full
                  font-display font-extrabold leading-none tracking-tight ${tintFor(name)} ${className}`}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}
