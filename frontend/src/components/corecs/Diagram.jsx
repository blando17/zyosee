import OS_DIAGRAMS from "./diagrams/os.jsx";
import OOPS_DIAGRAMS from "./diagrams/oops.jsx";
import DBMS_DIAGRAMS from "./diagrams/dbms.jsx";
import SQL_DIAGRAMS from "./diagrams/sql.jsx";
import CN_DIAGRAMS from "./diagrams/cn.jsx";

/*
 * The diagram registry, and the component that draws one.
 *
 * ONE FILE PER SUBJECT
 *
 * This was a single file until it reached forty diagrams and a second subject,
 * at which point "add a diagram" meant scrolling a thousand lines to find the
 * right end of the right section. The definitions now live in
 * `diagrams/<subject>.jsx`, and the shared primitives — Box, Oval, Arrow,
 * Caption and the fill palette — in `diagrams/primitives.jsx`.
 *
 * The primitives stay shared deliberately. They are the reason every diagram
 * in the app sits on one 320-wide grid at one stroke weight and one type size,
 * so the set looks drawn by one hand rather than assembled from five. A
 * subject file that wanted its own box style would be the thing to argue
 * about; a file that is merely long is not.
 *
 * Names are flat across subjects — one namespace, so `vtable` and `btree`
 * cannot both be called `tree`. `scripts/check-corecs.mjs` reads every file in
 * the directory and fails on a duplicate, or on a content module naming a
 * diagram nothing defines.
 */

const DIAGRAMS = {
  ...OS_DIAGRAMS,
  ...OOPS_DIAGRAMS,
  ...DBMS_DIAGRAMS,
  ...SQL_DIAGRAMS,
  ...CN_DIAGRAMS,
};

export const DIAGRAM_NAMES = Object.keys(DIAGRAMS);

/*
 * Renders a diagram by name.
 *
 * A missing name draws nothing rather than throwing. Content modules and this
 * registry are edited separately, and a typo in a content file should cost a
 * picture, not the whole page it sits on.
 */
export default function Diagram({ name, className = "" }) {
  const diagram = DIAGRAMS[name];
  if (!diagram) return null;

  return (
    <figure className={`my-4 overflow-hidden rounded-xl border border-brand-200 bg-surface p-3 ${className}`}>
      <svg
        viewBox={`0 0 320 ${diagram.height}`}
        className="w-full"
        role="img"
        aria-label={diagram.title}
      >
        <defs>
          <marker
            id="corecs-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L8 4 L0 8 z" className="fill-brand-600" />
          </marker>
        </defs>
        {diagram.draw()}
      </svg>
      <figcaption className="mt-2 text-center text-xs leading-snug text-ink-500">
        {diagram.title}
      </figcaption>
    </figure>
  );
}
