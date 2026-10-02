import { useEffect, useState } from "react";
import Icon from "./Icon";
import { Link } from "react-router-dom";
import { BoardPreview } from "./ThinkingBoard";
import { loadThink, planIsEmpty, reconcileThink } from "../thinkStore";

/*
 * The "think first" card on the problem page.
 *
 * It has two jobs, and which one it is doing depends entirely on whether there
 * is anything saved:
 *
 *   Nothing yet — an invitation. One line and one button, deliberately small.
 *                 It is an offer, not a gate: somebody who already knows how
 *                 they are going to solve this should be able to ignore it
 *                 without clicking anything.
 *
 *   Something —   the plan, beside the editor, which is where a plan is
 *                 actually worth having. Collapsed to its first line so it
 *                 never pushes the statement down the page, and expandable to
 *                 the whole thing plus the sketch.
 *
 * Reading happens on mount and again whenever the page is returned to, because
 * the usual path here is to write a plan, press Start coding, and land back on
 * this page a second later expecting to see it.
 */
export default function ThinkCard({ slug, userId, signedIn }) {
  const [state, setState] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let live = true;

    // Show the browser's copy at once, then reconcile with the account's, so a
    // plan written on another machine turns up here without the card sitting
    // blank while the network is asked about it.
    setState(loadThink(userId, slug));
    reconcileThink(userId, slug, { signedIn }).then((outcome) => {
      if (live) setState(outcome.state);
    });

    /*
     * Re-read when the tab is shown again. Coming back from the board through
     * the browser's back button can serve this page from memory, in which case
     * mounting never happens again and the card would show a stale plan.
     *
     * Local only: whatever the board just wrote is already here, and asking
     * the server every time the window regains focus would be a request per
     * alt-tab for nothing.
     */
    const onVisible = () => { if (!document.hidden && live) setState(loadThink(userId, slug)); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [userId, slug, signedIn]);

  if (!state) return null;

  const { items, plan } = state;
  const hasPlan = !planIsEmpty(plan);
  const hasSketch = items.length > 0;

  if (!hasPlan && !hasSketch) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-100/70 to-surface px-4 py-3">
        <Icon name="think" className="h-5 w-5 text-brand-700" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink-900">Think first</p>
          <p className="text-xs text-ink-800">
            Sketch the idea and write down your approach before you open the editor.
          </p>
        </div>
        <Link to={`/problems/${slug}/think`} className="btn-primary shrink-0 py-2 text-sm">
          Open thinking board
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    );
  }

  const chips = [plan.timeComplexity, plan.spaceComplexity].filter(Boolean);

  return (
    <div className="mt-4 rounded-xl border border-brand-200 bg-surface">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <Icon name="think" className="h-4 w-4 text-brand-700" />
        <p className="text-sm font-bold text-ink-900">Your plan</p>

        {chips.map((chip) => (
          <span key={chip} className="rounded-full bg-brand-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-brand-800">
            {chip}
          </span>
        ))}

        {!open && plan.approach && (
          <span className="min-w-0 flex-1 truncate text-xs text-ink-800">{plan.approach}</span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
          >
            {open ? "Hide" : "Show"}
          </button>
          <Link
            to={`/problems/${slug}/think`}
            className="rounded-lg border border-brand-300 px-2.5 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            Edit
          </Link>
        </div>
      </div>

      {open && (
        <div className="grid gap-4 border-t border-brand-100 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <dl className="space-y-3 text-sm">
            {[
              ["Approach", plan.approach],
              ["Key insight", plan.insights],
              ["Edge cases", plan.edgeCases],
            ]
              .filter(([, value]) => String(value || "").trim())
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-bold uppercase tracking-wide text-brand-700">{label}</dt>
                  <dd className="mt-0.5 whitespace-pre-line text-ink-900">{value}</dd>
                </div>
              ))}
            {!hasPlan && <p className="text-ink-800">You sketched this one out but did not write anything down.</p>}
          </dl>

          {hasSketch && <BoardPreview items={items} />}
        </div>
      )}
    </div>
  );
}
