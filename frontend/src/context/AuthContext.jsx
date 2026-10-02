import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  authApi,
  TOKEN_KEY,
  errorMessage,
  handleSessionLost,
  isTokenExpired,
  storedToken,
  tokenExpiryMs,
  clearDrafts,
} from "../api";

/*
 * Holds the session for the whole app.
 *
 * The token lives in localStorage so a refresh does not log you out, and three
 * separate things make sure the page never claims to be logged in when it is
 * not:
 *
 *   1. On boot, a stored token is checked for expiry before it is used at all.
 *      An expired one is dropped without bothering the server.
 *   2. A timer fires at the exact moment the token lapses, so a page left open
 *      updates itself rather than waiting for the next click to fail.
 *   3. Any request that comes back 401 or 403 clears the session, whichever
 *      endpoint it was. That is the backstop for a token the server rejects for
 *      a reason we could not see, such as a restarted service with a new secret.
 *
 * Whichever one fires, `sessionExpired` goes true and the banner appears.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  /*
   * Whether this account may author problems.
   *
   * Asked of the server rather than decided here, because the allowlist lives
   * in the API's environment and the browser has no business knowing it. This
   * only decides whether the Add Problem link is drawn; every /admin route
   * checks again on the server, so hiding the link is tidiness, not security.
   */
  const [isAdmin, setIsAdmin] = useState(false);
  const expiryTimer = useRef(null);

  const endSession = useCallback((expired) => {
    localStorage.removeItem(TOKEN_KEY);
    clearTimeout(expiryTimer.current);
    setUser(null);
    setIsAdmin(false);
    if (expired) setSessionExpired(true);
  }, []);

  // Fires exactly when the token lapses, so a page sitting open all afternoon
  // shows the banner on its own instead of looking signed in until you click.
  const scheduleExpiry = useCallback(
    (token) => {
      clearTimeout(expiryTimer.current);
      const expiresAt = tokenExpiryMs(token);
      if (!expiresAt) return;

      const wait = expiresAt - Date.now();
      if (wait <= 0) {
        endSession(true);
        return;
      }
      // setTimeout tops out around 24 days; these tokens last an hour, so the
      // clamp is only here to keep a strange value from firing immediately.
      expiryTimer.current = setTimeout(() => endSession(true), Math.min(wait, 2 ** 31 - 1));
    },
    [endSession]
  );

  // The interceptors call this from wherever a request was refused.
  useEffect(() => {
    handleSessionLost(() => {
      setUser((current) => {
        // Only announce an expiry to someone who thought they were logged in.
        if (current) setSessionExpired(true);
        return null;
      });
      clearTimeout(expiryTimer.current);
    });
  }, []);

  useEffect(() => {
    const token = storedToken();

    if (!token) {
      setLoading(false);
      return;
    }
    if (isTokenExpired(token)) {
      // Nothing to ask the server: it would refuse this token anyway.
      endSession(false);
      setLoading(false);
      return;
    }

    scheduleExpiry(token);

    authApi
      .get("/me")
      .then(({ data }) => {
        setUser(data);
        refreshAdmin();
      })
      .catch(() => endSession(false))
      .finally(() => setLoading(false));

    return () => clearTimeout(expiryTimer.current);
  }, [endSession, scheduleExpiry]);

  /*
   * One question, asked of the server: may this account author problems? It
   * never throws into the caller, because failing to answer it should mean the
   * link stays hidden, not that signing in fails.
   */
  function refreshAdmin() {
    authApi
      .get("/admin/me")
      .then(({ data }) => setIsAdmin(Boolean(data.admin)))
      .catch(() => setIsAdmin(false));
  }

  function persist(token, nextUser) {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(nextUser);
    refreshAdmin();
    setSessionExpired(false);
    scheduleExpiry(token);
  }

  async function login(email, password) {
    const { data } = await authApi.post("/login", { email, password });
    persist(data.token, data.user);
    return data.user;
  }

  async function signup(username, email, password) {
    const { data } = await authApi.post("/signup", { username, email, password });
    persist(data.token, data.user);
    return data.user;
  }

  function logout() {
    // Deliberately leaving, so nothing this account typed is left behind for
    // whoever signs in next on this machine. An expiring token does not do
    // this; see clearDrafts in api.js for why the two differ.
    clearDrafts();
    endSession(false);
    setSessionExpired(false);
  }

  async function updateProfile(fields) {
    const { data } = await authApi.put(`/users/${user._id}`, fields);
    setUser(data.user);
    return data.user;
  }

  async function deleteAccount() {
    await authApi.delete(`/users/${user._id}`);
    logout();
  }

  const value = {
    user,
    loading,
    isAdmin,
    isLoggedIn: Boolean(user),
    sessionExpired,
    dismissSessionExpired: () => setSessionExpired(false),
    login,
    signup,
    logout,
    updateProfile,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}

export { errorMessage };
