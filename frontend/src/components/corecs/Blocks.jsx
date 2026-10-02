import Icon from "../Icon";
import Diagram from "./Diagram";

/*
 * Turns a content block array into a rendered answer.
 *
 * This is the only file that knows what a question's answer looks like on
 * screen. The content modules know nothing about React, and this knows nothing
 * about operating systems — which is the split that lets OOPS, DBMS, SQL and
 * CN reuse all of it without a line changing here.
 *
 * WHY NOT MARKDOWN
 *
 * Half the answers in this subject are not prose. A scheduling answer is a
 * Gantt chart, a page-replacement answer is a frame table, a disk answer is a
 * seek path. Markdown can only carry those as text, so the app would be
 * parsing its own content back out again to draw them. Blocks say what they
 * are, and each one draws itself.
 */

/* ---------------------------------------------------------------- inline -- */

/*
 * The entire inline vocabulary: **bold** and `code`.
 *
 * Deliberately two things. An answer needing richer formatting than this is an
 * answer too long to revise from, so the limit is a content constraint wearing
 * a technical disguise.
 *
 * Split on both markers at once rather than running two passes, so a `code`
 * span inside **bold** cannot produce half-parsed output.
 */
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`)/g;

export function Text({ children }) {
  if (typeof children !== "string") return children || null;

  const parts = children.split(INLINE);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          /*
           * Weight only — no colour.
           *
           * This used to force `text-ink-900`, which reads well in body text
           * and is invisible inside a callout: the errata notes sit on a
           * FIXED cream `bg-amber-50` in both themes, while `ink-900` flips to
           * near-white in dark mode. Every bold phrase inside a warning turned
           * white on cream.
           *
           * Inheriting is also just better typography — emphasis is the
           * weight, and the colour belongs to whatever the text is sitting in.
           */
          return (
            <strong key={i} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="rounded bg-brand-100 px-1 py-0.5 font-mono text-[0.85em] text-brand-800"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </>
  );
}

/* ----------------------------------------------------------------- gantt -- */

/*
 * A CPU scheduling Gantt chart.
 *
 * Widths are proportional to each slice's duration and the whole row is a
 * flexbox, so the chart fills whatever width it is given rather than needing a
 * fixed pixel scale. That is what makes it survive a 375px phone without
 * horizontal scroll.
 *
 * The time marks sit under the boundaries rather than under the blocks,
 * because a Gantt chart's numbers are instants, not durations — the whole
 * point is reading "P2 finished at 12" off the chart.
 */
function Gantt({ slices, note }) {
  const start = slices[0].from;
  const end = slices[slices.length - 1].to;
  const span = end - start || 1;

  // Every boundary in the chart, de-duplicated: the start, plus each slice's
  // end. Back-to-back slices share a boundary and must not print it twice.
  const marks = [start, ...slices.map((s) => s.to)].filter(
    (value, i, all) => all.indexOf(value) === i
  );

  return (
    <figure className="my-3">
      <div className="flex overflow-hidden rounded-lg border border-brand-300">
        {slices.map((slice, i) => (
          <div
            key={i}
            style={{ width: `${((slice.to - slice.from) / span) * 100}%` }}
            className={`flex min-w-0 items-center justify-center border-brand-300 py-2
                        text-[11px] font-bold tabular-nums text-ink-900 sm:text-xs
                        ${i ? "border-l" : ""} ${i % 2 ? "bg-brand-200" : "bg-brand-100"}`}
            title={`${slice.p}: ${slice.from} to ${slice.to}`}
          >
            <span className="truncate px-0.5">{slice.p}</span>
          </div>
        ))}
      </div>

      {/*
        The axis is a second flex row whose cells line up with the blocks
        above, each printing the instant at its LEFT edge. A final absolutely
        placed label carries the last boundary, which has no block after it.
      */}
      <div className="relative mt-1 flex text-[10px] tabular-nums text-ink-500">
        {slices.map((slice, i) => (
          <div key={i} style={{ width: `${((slice.to - slice.from) / span) * 100}%` }}>
            {marks.includes(slice.from) ? slice.from : ""}
          </div>
        ))}
        <span className="absolute right-0 top-0">{end}</span>
      </div>

      {note && (
        <figcaption className="mt-2 text-xs leading-relaxed text-ink-500">
          <Text>{note}</Text>
        </figcaption>
      )}
    </figure>
  );
}

/* ---------------------------------------------------------------- frames -- */

/*
 * A page-replacement trace: the reference string across the top, one row per
 * frame, and a fault marker underneath.
 *
 * Scrolls horizontally rather than shrinking, because a reference string of
 * thirteen columns squeezed onto a phone is unreadable at any font size. The
 * sticky first column keeps the frame labels visible while it scrolls.
 */
function Frames({ refs, rows, faults, total }) {
  /*
   * The field is `refs`, not `ref`, and that is not a style choice.
   *
   * These blocks are spread onto the component as props. `ref` is one of the
   * two names React reserves (`key` is the other): it is intercepted and never
   * reaches the function, so the parameter arrived as `undefined` and the
   * `.map` below threw — blanking the entire topic page, because one bad block
   * takes its whole React subtree with it.
   *
   * The guard below is the second half of that lesson. A content typo should
   * cost a figure, not a page, which is the same reason Diagram renders
   * nothing for a name it does not know.
   */
  if (!refs?.length || !rows?.length) return null;

  return (
    <figure className="my-3">
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="min-w-full border-collapse text-center text-[11px] tabular-nums">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface px-2 py-1 text-left font-bold text-ink-500">
                Ref
              </th>
              {refs.map((page, i) => (
                <th key={i} className="border border-brand-200 bg-brand-100 px-2 py-1 font-bold text-ink-900">
                  {page}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                <th className="sticky left-0 z-10 bg-surface px-2 py-1 text-left font-bold text-ink-500">
                  F{r + 1}
                </th>
                {row.map((cell, c) => (
                  <td key={c} className="border border-brand-200 px-2 py-1 text-ink-800">
                    {cell === null || cell === undefined ? "" : cell}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th className="sticky left-0 z-10 bg-surface px-2 py-1 text-left font-bold text-ink-500">
                Fault
              </th>
              {(faults || []).map((isFault, i) => (
                <td
                  key={i}
                  className={`border border-brand-200 px-2 py-1 font-bold ${
                    isFault ? "text-rose-600" : "text-ink-500"
                  }`}
                >
                  {isFault ? "F" : "·"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 text-xs font-bold text-ink-800">
        Total page faults: <span className="tabular-nums">{total}</span>
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ seek -- */

/*
 * A disk head's path across the cylinders.
 *
 * Drawn as an SVG rather than a list of arrows because the shape IS the
 * answer: SSTF zig-zags near the start, SCAN sweeps to one end and back,
 * C-SCAN jumps. Seeing the path is what makes the difference between the six
 * algorithms obvious rather than memorised.
 */
function Seek({ head, order, total, low = 0, high = 199 }) {
  const path = [head, ...order];
  const span = high - low || 1;
  const width = 300;
  const stepY = 20;
  const height = path.length * stepY + 24;
  const x = (cyl) => 8 + ((cyl - low) / span) * (width - 16);

  return (
    <figure className="my-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`Head movement from ${head} through ${order.join(", ")}, total ${total}`}
      >
        {/* The cylinder axis along the top. */}
        <line x1="8" y1="14" x2={width - 8} y2="14" className="stroke-brand-300" strokeWidth="1" />
        {path.map((cyl, i) =>
          path.indexOf(cyl) === i ? (
            <text
              key={`t${cyl}`}
              x={x(cyl)}
              y="9"
              textAnchor="middle"
              className="fill-ink-500 text-[7px] tabular-nums"
            >
              {cyl}
            </text>
          ) : null
        )}

        {path.map((cyl, i) => (
          <g key={i}>
            {i > 0 && (
              <line
                x1={x(path[i - 1])}
                y1={14 + (i - 1) * stepY}
                x2={x(cyl)}
                y2={14 + i * stepY}
                className="stroke-brand-600"
                strokeWidth="1.5"
              />
            )}
            <circle cx={x(cyl)} cy={14 + i * stepY} r="2.6" className="fill-brand-600" />
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 text-xs font-bold text-ink-800">
        Total head movement: <span className="tabular-nums">{total}</span>
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------- codePair -- */

/*
 * The same idea in two languages, side by side.
 *
 * OOPS material is written this way throughout — "here is a copy constructor
 * in C++, here it is in Java" — and neither a table nor two separate code
 * blocks carries it. A table mangles indentation; two stacked blocks make you
 * scroll between the halves you are trying to compare.
 *
 * Side by side from `sm` up, stacked below it. On a phone the columns would be
 * about twenty characters wide, which is narrower than the code, so comparing
 * them would mean two horizontal scrolls instead of one vertical one.
 */
function CodePair({ left, right }) {
  if (!left?.code || !right?.code) return null;

  return (
    <div className="my-3 grid gap-2 sm:grid-cols-2">
      {[left, right].map((side, i) => (
        <figure key={i} className="min-w-0">
          <figcaption className="mb-1 text-[10px] font-bold uppercase tracking-wide text-ink-500">
            {side.label}
          </figcaption>
          <pre
            className="overflow-x-auto rounded-xl border border-brand-200 bg-code px-3 py-2.5
                       font-mono text-[11px] leading-relaxed text-amber-100"
          >
            <code>{side.code}</code>
          </pre>
        </figure>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- table -- */

function DataTable({ head, rows, caption }) {
  return (
    <figure className="my-3">
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="min-w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              {head.map((cell, i) => (
                <th
                  key={i}
                  className="border border-brand-200 bg-brand-100 px-2.5 py-2 font-bold text-ink-900"
                >
                  <Text>{cell}</Text>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className={r % 2 ? "bg-brand-50/40" : ""}>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className={`border border-brand-200 px-2.5 py-2 align-top leading-relaxed
                                ${c === 0 ? "font-bold text-ink-900" : "text-ink-700"}`}
                  >
                    <Text>{cell}</Text>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <figcaption className="mt-1.5 text-xs text-ink-500">{caption}</figcaption>}
    </figure>
  );
}

/* --------------------------------------------------------------- formula -- */

/*
 * Formulas get their own card rather than sitting in a paragraph.
 *
 * The night before an interview, the formulas are what somebody scans for, and
 * a formula buried in a sentence is a formula they will not find. Monospace,
 * boxed, and always on its own line.
 */
function Formulas({ items }) {
  return (
    <div className="my-3 grid gap-2 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-brand-300 bg-brand-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-500">{item.name}</p>
          <p className="mt-0.5 font-mono text-sm font-bold text-ink-900">{item.expr}</p>
          {item.note && <p className="mt-1 text-[11px] leading-snug text-ink-500">{item.note}</p>}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ note -- */

/*
 * A callout. Two tones:
 *
 *   default  an aside worth pausing on
 *   warn     the errata voice — "your notes print X, and here is why it is
 *            wrong". Amber rather than red, because this is not an error the
 *            reader made and it should not read like an alarm.
 */
function Note({ children, tone }) {
  const warn = tone === "warn";
  return (
    <div
      className={`my-3 flex gap-2.5 rounded-xl border px-3 py-2.5 ${
        warn ? "border-amber-400 bg-amber-50" : "border-brand-200 bg-brand-50"
      }`}
    >
      <span className={`mt-0.5 shrink-0 ${warn ? "text-amber-700" : "text-brand-700"}`}>
        <Icon name={warn ? "warning" : "bulb"} className="h-4 w-4" />
      </span>
      <p className={`text-xs leading-relaxed ${warn ? "text-amber-900" : "text-ink-700"}`}>
        <Text>{children}</Text>
      </p>
    </div>
  );
}

/* ----------------------------------------------------------------- entry -- */

export default function Blocks({ blocks }) {
  if (!blocks?.length) return null;

  return (
    <div className="text-sm leading-relaxed text-ink-700">
      {blocks.map((block, i) => {
        if (block.p) {
          return (
            <p key={i} className="my-2">
              <Text>{block.p}</Text>
            </p>
          );
        }

        if (block.ul) {
          return (
            <ul key={i} className="my-2 space-y-1.5">
              {block.ul.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-brand-500" />
                  <span>
                    <Text>{item}</Text>
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.ol) {
          return (
            <ol key={i} className="my-2 space-y-1.5">
              {block.ol.map((item, j) => (
                <li key={j} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-px flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center
                               rounded-md bg-brand-200 text-[10px] font-extrabold tabular-nums text-ink-900"
                  >
                    {j + 1}
                  </span>
                  <span>
                    <Text>{item}</Text>
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        if (block.codePair) return <CodePair key={i} {...block.codePair} />;
        if (block.table) return <DataTable key={i} {...block.table} />;
        if (block.formula) return <Formulas key={i} items={block.formula} />;
        if (block.gantt) return <Gantt key={i} {...block.gantt} />;
        if (block.frames) return <Frames key={i} {...block.frames} />;
        if (block.seek) return <Seek key={i} {...block.seek} />;
        if (block.diagram) return <Diagram key={i} name={block.diagram} />;
        if (block.note) {
          return (
            <Note key={i} tone={block.tone}>
              {block.note}
            </Note>
          );
        }

        if (block.code) {
          return (
            <pre
              key={i}
              /*
               * `bg-code` is near-black in BOTH themes, so the text has to be
               * a fixed light colour. A themed token here was the bug: in dark
               * mode `text-brand-100` is itself near-black, so the code block
               * rendered as a solid dark rectangle.
               */
              className="my-3 overflow-x-auto rounded-xl border border-brand-200 bg-code px-3 py-2.5
                         font-mono text-[11px] leading-relaxed text-amber-100"
            >
              <code>{block.code}</code>
            </pre>
          );
        }

        return null;
      })}
    </div>
  );
}
