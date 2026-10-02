import { Component } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon";

/*
 * Catches a render error inside the Core CS section.
 *
 * WHY THIS EXISTS
 *
 * React's default behaviour when a component throws during render is to
 * unmount the entire tree. With no boundary anywhere above it, that means the
 * whole document — navigation included — is replaced by nothing, and the user
 * gets a black rectangle with no way out and no clue what happened.
 *
 * This section hit that twice. Once a block field was named `ref`, which React
 * reserves and silently drops, so a `.map` ran on undefined. Once the search
 * index walked a string as though it were an array. Both were one-line data
 * bugs; both took down a page holding a hundred and fifty questions.
 *
 * The content here is a few thousand lines of hand-authored data, and data
 * gets edited. A boundary does not make those bugs acceptable — the validator
 * in `scripts/check-corecs.mjs` is what stops them shipping — but it changes
 * the cost of one getting through from "the section is gone" to "this part did
 * not load", which is the difference between a broken app and a visible fault.
 *
 * A CLASS COMPONENT, BECAUSE THERE IS NO CHOICE
 *
 * `componentDidCatch` and `getDerivedStateFromError` have no hook equivalent.
 * This is the one place in the app that cannot be a function component.
 */
export default class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { failed: true, message: error?.message || "Something went wrong." };
  }

  componentDidCatch(error, info) {
    // Kept in the console rather than sent anywhere. This is a study tool on
    // somebody's own machine; the stack is for whoever is fixing it.
    console.error("Core CS failed to render:", error, info?.componentStack);
  }

  /*
   * Resets when the caller says the situation has changed.
   *
   * Without this, a boundary that has tripped stays tripped for the life of
   * the route — so navigating from a broken topic to a working one would show
   * the error screen for both. The parent passes the topic id as `resetKey`,
   * and a new key clears the failure.
   */
  componentDidUpdate(prevProps) {
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false, message: "" });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-accent-ink">
          <Icon name="warning" className="h-6 w-6" />
        </span>
        <h2 className="mt-3 font-display text-xl font-extrabold text-ink-900">
          This part did not load
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
          Something in this topic's content could not be rendered. The rest of the section still
          works — the details are in the browser console.
        </p>
        <p className="mt-2 break-words rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-left font-mono text-[11px] text-ink-700">
          {this.state.message}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link to="/corecs/os" className="btn-primary">
            Back to topics
          </Link>
          <button onClick={() => window.location.reload()} className="btn-ghost">
            Reload
          </button>
        </div>
      </div>
    );
  }
}
