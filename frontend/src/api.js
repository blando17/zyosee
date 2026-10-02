import axios from "axios";

/*
 * Two backends, so two axios instances.
 *
 * The accounts API on 5001 issues the token; the compiler service on 8000 only
 * verifies it. Both expect the same "Authorization: Bearer <token>" header.
 */

export const TOKEN_KEY = "oj_token";

// Every work-in-progress solution is stored under a key starting with this.
export const DRAFT_PREFIX = "oj_draft:";

// And every thinking board and plan under this one. Defined in thinkStore.js;
// repeated here so clearDrafts does not drag that module into every import.
const THINK_PREFIX = "oj_think:";

/*
 * Throws away every saved draft in this browser.
 *
 * Called on a deliberate log out, not on a token expiring. The difference
 * matters: an expired token means the same person is about to sign back in and
 * would be furious to lose what they had typed, while logging out is someone
 * leaving a machine that may not be theirs. Their half-finished solution should
 * not still be sitting in it for whoever signs in next.
 */
export function clearDrafts() {
  try {
    const doomed = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      // The thinking board and the plan go too. They are working notes left on
      // a machine the next person may not be entitled to read, exactly like a
      // half-finished solution.
      if (key && (key.startsWith(DRAFT_PREFIX) || key.startsWith(THINK_PREFIX))) doomed.push(key);
    }
    doomed.forEach((key) => localStorage.removeItem(key));
  } catch (err) {
    // Storage disabled or blocked. There is nothing to clear in that case.
  }
}

export const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://localhost:5001",
});

export const compilerApi = axios.create({
  baseURL: import.meta.env.VITE_COMPILER_URL || "http://localhost:8000",
});

/*
 * When a token expires.
 *
 * A JWT carries its own expiry in the payload, and the payload is plain
 * base64url that anyone can read. Reading it here is not a security check, the
 * server still verifies the signature on every request; it is so the page can
 * stop claiming you are logged in the moment the token lapses, instead of
 * finding out an hour later when you press Submit.
 */
export function tokenExpiryMs(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json);
    return typeof exp === "number" ? exp * 1000 : null;
  } catch (err) {
    // A token we cannot read is a token we cannot trust.
    return null;
  }
}

export function isTokenExpired(token) {
  if (!token) return true;
  const expiresAt = tokenExpiryMs(token);
  // No readable expiry means we cannot rule it out, so let the server decide.
  if (expiresAt === null) return false;
  return Date.now() >= expiresAt;
}

export function storedToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/*
 * One place for the app to hear that the session is gone.
 *
 * Registered by AuthContext. Every request goes through the interceptors below,
 * so a lapsed session is caught wherever it happens rather than in each button's
 * own error handling.
 */
let onSessionLost = () => {};

export function handleSessionLost(callback) {
  onSessionLost = callback;
}

function attachToken(instance) {
  instance.interceptors.request.use((config) => {
    const token = storedToken();

    // An expired token is worse than no token: it produces a 403 that reads
    // like a bug rather than a sign-in prompt. Drop it and say so.
    if (token && isTokenExpired(token)) {
      localStorage.removeItem(TOKEN_KEY);
      onSessionLost();
      return config;
    }

    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const reason = error?.response?.data?.reason;

      /*
       * 401 always means the session is gone: nothing identified the caller.
       *
       * 403 does NOT, and treating it as though it did was a real bug. The
       * servers use 403 for two different things — "your token did not hold
       * up", which is a dead session, and "you are exactly who you say you are
       * and you still may not do this", which is an ordinary refusal. Both
       * arrived here as the same number, so being told you cannot challenge
       * somebody you are no longer friends with LOGGED YOU OUT, and the
       * message explaining why was thrown away with the session that would
       * have displayed it.
       *
       * Both auth middlewares now mark their own refusals with reason "token".
       * Everything else is handed back to whoever made the request, to be
       * shown to the person as the sentence it is.
       */
      if (status === 401 || (status === 403 && reason === "token")) {
        localStorage.removeItem(TOKEN_KEY);
        onSessionLost();
      }
      return Promise.reject(error);
    }
  );
}

attachToken(authApi);
attachToken(compilerApi);

// Express sends errors as { message }, but a network failure has no response
// at all. This turns both into a string a component can render.
export function errorMessage(err, fallback = "Something went wrong.") {
  return err?.response?.data?.message || err?.message || fallback;
}
