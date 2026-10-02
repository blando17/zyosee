/*
 * Where a solver's thinking is kept.
 *
 * Two copies, on purpose. The account's copy lives in MongoDB and is what
 * makes a board the same board on another machine. The browser's copy lives in
 * localStorage and is what makes it appear instantly, keeps it working with no
 * network, and is the only store there is for somebody who has not signed in.
 * reconcileThink below decides between them; the later one wins.
 *
 * The browser's copy sits beside the code drafts and follows the same rules,
 * for the same reasons:
 *
 *   Keyed by user.  Two people sharing a laptop must never see each other's
 *                   working out. This app has had that bug once already, with
 *                   code drafts, and the fix was this key.
 *   Cleared on log out, not on a token expiring. Logging out is somebody
 *                   leaving a machine that may not be theirs. Only the local
 *                   copy goes: the account's copy is theirs, and is waiting
 *                   the next time they sign in.
 *
 * Strokes are stored as points, not as a picture. That decision buys three
 * things at once: undo works, the board can be redrawn at any size without
 * going blurry, and a full board is a few kilobytes instead of the megabyte a
 * canvas snapshot would cost — which matters, because the whole of
 * localStorage is only a few megabytes and the code drafts share it.
 *
 * Every access is wrapped: storage can be disabled, full, or blocked outright
 * in a private window, and none of that is a reason for the page to break.
 */

import { compilerApi } from "./api";

export const THINK_PREFIX = "oj_think:";

// The board's own coordinate system. Everything is stored in these units and
// scaled to whatever size the canvas is actually drawn at, so a board sketched
// on a laptop still looks right on a monitor.
export const BOARD_WIDTH = 1600;
export const BOARD_HEIGHT = 1000;

export const EMPTY_PLAN = {
  approach: "",
  timeComplexity: "",
  spaceComplexity: "",
  insights: "",
  edgeCases: "",
};

export function thinkKey(userId, slug) {
  return `${THINK_PREFIX}${userId || "anon"}:${slug}`;
}

export function loadThink(userId, slug) {
  try {
    const raw = localStorage.getItem(thinkKey(userId, slug));
    if (!raw) return { items: [], plan: { ...EMPTY_PLAN }, updatedAt: null };

    const saved = JSON.parse(raw);
    return {
      items: Array.isArray(saved.items) ? saved.items : [],
      // Spread over the defaults so a plan saved before a field existed still
      // loads, with the new field blank rather than undefined.
      plan: { ...EMPTY_PLAN, ...(saved.plan || {}) },
      updatedAt: saved.updatedAt || null,
    };
  } catch (err) {
    return { items: [], plan: { ...EMPTY_PLAN }, updatedAt: null };
  }
}

/*
 * Writes the browser's copy. Returns what went wrong, or null.
 *
 * Quota is the failure worth reporting rather than swallowing: somebody who
 * has been drawing for ten minutes needs to know the board stopped saving,
 * because the alternative is losing it without ever being told.
 */
export function saveThink(userId, slug, { items, plan }, updatedAt = new Date().toISOString()) {
  const payload = JSON.stringify({ items, plan, updatedAt });
  try {
    localStorage.setItem(thinkKey(userId, slug), payload);
    return null;
  } catch (err) {
    if (err && (err.name === "QuotaExceededError" || err.code === 22)) {
      return "This browser is out of storage, so the board is no longer being saved.";
    }
    return "The board could not be saved in this browser.";
  }
}

/*
 * The account's copy, kept in MongoDB.
 *
 * The browser's copy stays, and is not a lesser one: it is what makes the
 * board appear the instant the page opens rather than after a round trip, what
 * keeps it working with no network, and the only store there is for somebody
 * who has not signed in. The server's copy is what makes it the same board on
 * a different machine.
 *
 * Whichever carries the later `updatedAt` wins. For one person's own notes
 * that is the right rule — there is no second author whose edit could be lost,
 * and offering to merge two versions of a doodle would be worse than useless.
 */
export async function fetchThink(slug) {
  const { data } = await compilerApi.get(`/me/thinking/${slug}`);
  return {
    items: Array.isArray(data.items) ? data.items : [],
    plan: { ...EMPTY_PLAN, ...(data.plan || {}) },
    updatedAt: data.updatedAt || null,
  };
}

export async function pushThink(slug, { items, plan, updatedAt }) {
  await compilerApi.put(`/me/thinking/${slug}`, { items, plan, updatedAt });
}

function newer(a, b) {
  const left = a?.updatedAt ? Date.parse(a.updatedAt) : 0;
  const right = b?.updatedAt ? Date.parse(b.updatedAt) : 0;
  return left >= right ? a : b;
}

/*
 * The board to show, from both copies.
 *
 * Reconciling rather than simply preferring the server matters for the case
 * this is really for: sketching something with no connection, then coming back
 * later. The local copy is then the newer one and must win, and must be sent
 * up rather than quietly replaced.
 */
export async function reconcileThink(userId, slug, { signedIn }) {
  const local = loadThink(userId, slug);
  if (!signedIn) return { state: local, synced: false };

  let remote = null;
  try {
    remote = await fetchThink(slug);
  } catch (err) {
    // No network, or the service is down. The local copy is still perfectly
    // usable; it simply is not synced yet.
    return { state: local, synced: false, offline: true };
  }

  const hasLocal = hasThinking(local);
  const hasRemote = hasThinking(remote);
  if (!hasLocal && !hasRemote) return { state: local, synced: true };

  const winner = !hasRemote ? local : !hasLocal ? remote : newer(local, remote);

  if (winner === local && hasLocal) {
    // Ours is ahead: push it, and treat a failure as simply not yet synced.
    try {
      await pushThink(slug, local);
      return { state: local, synced: true };
    } catch (err) {
      return { state: local, synced: false, offline: true };
    }
  }

  saveThink(userId, slug, remote, remote.updatedAt || new Date().toISOString());
  return { state: remote, synced: true };
}

export function removeThink(userId, slug) {
  try {
    localStorage.removeItem(thinkKey(userId, slug));
  } catch (err) {
    // Nothing to remove if storage is unavailable.
  }
}

// Called from log out, alongside the code drafts.
export function clearThinking() {
  try {
    const doomed = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(THINK_PREFIX)) doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
  } catch (err) {
    // Storage disabled or blocked. There is nothing to clear in that case.
  }
}

export function planIsEmpty(plan) {
  return !plan || Object.values(plan).every((value) => !String(value || "").trim());
}

export function hasThinking(state) {
  return Boolean(state && (state.items?.length || !planIsEmpty(state.plan)));
}
