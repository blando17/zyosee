/*
 * A nudge from the friends page to the navigation bar.
 *
 * The badge counts requests waiting for you, and the page that makes that
 * number change is not an ancestor of the bar that draws it. Rather than lift
 * the whole friends list into a context for one integer, the page says "this
 * changed" and the bar re-reads it.
 *
 * A window event is the right size for this: no provider, no shared store, and
 * nothing to keep in sync — the server stays the single source of the count.
 */

const FRIENDS_CHANGED = "oj:friends-changed";

export function announceFriendsChanged() {
  window.dispatchEvent(new Event(FRIENDS_CHANGED));
}

export function onFriendsChanged(handler) {
  window.addEventListener(FRIENDS_CHANGED, handler);
  return () => window.removeEventListener(FRIENDS_CHANGED, handler);
}
