import { useCallback, useEffect, useRef, useState } from "react";

/*
 * The two columns of the problem page, with a divider you can drag.
 *
 * The statement and the work area rarely want the same share of the screen: a
 * long statement wants room, a long solution wants the editor wide. A fixed
 * half and half serves neither, and was what left a tall blank area beside the
 * shorter column.
 *
 * Below the large breakpoint the columns stack and the divider disappears,
 * because there is no width to divide.
 */

const STORAGE_KEY = "oj_split_percent";
const MIN_PERCENT = 24;
const MAX_PERCENT = 72;
const DEFAULT_PERCENT = 46;

function readStored() {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(saved) && saved >= MIN_PERCENT && saved <= MAX_PERCENT) return saved;
  } catch (err) {
    // Private browsing and blocked site data both throw. The default is fine.
  }
  return DEFAULT_PERCENT;
}

export default function SplitLayout({ left, right }) {
  const [percent, setPercent] = useState(readStored);
  const [wide, setWide] = useState(false);
  const [dragging, setDragging] = useState(false);
  const gridRef = useRef(null);

  // The divider only exists where there are two columns to divide.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const moveTo = useCallback((clientX) => {
    const box = gridRef.current?.getBoundingClientRect();
    if (!box) return;
    const next = ((clientX - box.left) / box.width) * 100;
    setPercent(Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, next)));
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event) => moveTo(event.clientX ?? event.touches?.[0]?.clientX);
    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    // While dragging, stop the page selecting text under the cursor.
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [dragging, moveTo]);

  // Written on release rather than on every mouse move.
  useEffect(() => {
    if (dragging) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(Math.round(percent)));
    } catch (err) {
      // Nothing to do if storage is unavailable.
    }
  }, [dragging, percent]);

  return (
    <div
      ref={gridRef}
      className="mt-6 grid gap-6 lg:gap-0"
      style={wide ? { gridTemplateColumns: `${percent}% 20px 1fr` } : undefined}
    >
      <div className="min-w-0">{left}</div>

      {wide && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Drag to resize the columns"
          tabIndex={0}
          onMouseDown={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onTouchStart={() => setDragging(true)}
          // Keyboard nudging, so the divider is not mouse-only.
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") setPercent((p) => Math.max(MIN_PERCENT, p - 2));
            if (event.key === "ArrowRight") setPercent((p) => Math.min(MAX_PERCENT, p + 2));
          }}
          onDoubleClick={() => setPercent(DEFAULT_PERCENT)}
          title="Drag to resize. Double click to reset."
          className={`group flex cursor-col-resize items-center justify-center focus:outline-none ${
            dragging ? "bg-brand-200/60" : "hover:bg-brand-200/40"
          }`}
        >
          <span
            className={`h-16 w-1 rounded-full transition ${
              dragging ? "bg-brand-500" : "bg-brand-300 group-hover:bg-brand-400"
            }`}
          />
        </div>
      )}

      <div className="min-w-0">{right}</div>
    </div>
  );
}
