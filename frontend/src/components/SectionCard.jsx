import Icon from "./Icon";

/*
 * The panel both social pages are built from.
 *
 * One shell — an icon tile, a title, an optional count and an optional action
 * on the right — so Pair Lab and Friends cannot drift into two slightly
 * different ideas of what a section looks like. The body is handed in whole,
 * because some sections want padding and some (a list that runs edge to edge)
 * very much do not.
 */

export function StepTile({ children, tone = "brand" }) {
  const tint = {
    brand: "from-brand-400 to-brand-300 text-ink-900",
    ink: "from-ink-800 to-ink-700 text-white",
  }[tone];

  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br
                  font-display text-xs font-extrabold shadow-sm ${tint}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export default function SectionCard({
  icon,
  step,
  title,
  subtitle,
  count,
  action,
  children,
  className = "",
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-brand-200/80 bg-surface/90 shadow-sm
                  backdrop-blur-sm transition hover:shadow-md ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2.5 border-b border-brand-100 px-4 py-3">
        {step ? (
          <StepTile>{step}</StepTile>
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}

        <div className="min-w-0">
          <h2 className="text-sm font-extrabold leading-tight text-ink-900">{title}</h2>
          {subtitle && <p className="text-[11px] leading-tight text-ink-500">{subtitle}</p>}
        </div>

        {count > 0 && (
          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-brand-800">
            {count}
          </span>
        )}

        {action && <div className="ml-auto flex items-center gap-2">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/*
 * An empty state: a picture, a heading and a sentence.
 *
 * The picture is decoration and is hidden from assistive technology, so the
 * heading and the line under it have to carry the whole meaning on their own.
 * That is why every use of this passes real words rather than relying on the
 * drawing to explain itself.
 */
export function EmptyState({ art, title, children, action }) {
  return (
    <div className="flex flex-col items-center px-5 py-7 text-center">
      {art}
      <p className="mt-2 font-display text-sm font-extrabold text-ink-900">{title}</p>
      <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-ink-500">{children}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
