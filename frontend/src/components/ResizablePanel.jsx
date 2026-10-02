/*
 * A panel you can drag taller or shorter.
 *
 * The native resize handle needs a scroll container to work on, so the content
 * scrolls inside once the panel is made smaller than it. That is the trade: you
 * choose how much of the page a panel takes, and anything past that scrolls
 * rather than pushing everything else down.
 *
 * `initialHeight` is a starting size only. Leave it out and the panel sizes to
 * its content until you drag it, which is what most of these want.
 */
export default function ResizablePanel({
  children,
  initialHeight,
  minHeight = 120,
  className = "",
}) {
  return (
    <div
      className={`resize-y overflow-auto ${className}`}
      style={{ height: initialHeight, minHeight }}
    >
      {children}
    </div>
  );
}
