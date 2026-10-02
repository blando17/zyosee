import { createContext, useCallback, useContext, useEffect, useState } from "react";

/*
 * Light or dark, for the whole application.
 *
 * The theme is one attribute on <html>. Every colour in the app resolves
 * through CSS variables defined against that attribute (see index.css), so
 * flipping it re-themes eight hundred class names at once without a single
 * component re-rendering differently.
 *
 * WHAT DECIDES THE THEME, IN ORDER
 *
 *   1. what this person last chose here, if they ever chose
 *   2. otherwise, what their operating system asks for
 *
 * And 2 keeps applying: somebody who has never pressed the button follows
 * their system when it switches at sunset. Somebody who HAS pressed it has
 * made a decision about this site, and their system no longer overrides it —
 * which is the whole reason a site-level switch exists.
 */

const KEY = "oj_theme";
const ThemeContext = createContext(null);

function systemPrefersDark() {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (err) {
    // No matchMedia, or a browser that blocks it. Light is the safer guess.
    return false;
  }
}

function storedChoice() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "dark" || saved === "light" ? saved : null;
  } catch (err) {
    // Private window, or storage disabled. Nothing was chosen.
    return null;
  }
}

export function ThemeProvider({ children }) {
  /*
   * Resolved once, before the first paint, from the same two sources the
   * inline script in index.html uses. They have to agree or the page flashes
   * the wrong theme for a frame.
   */
  const [choice, setChoice] = useState(storedChoice);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  const theme = choice ?? (systemDark ? "dark" : "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    /*
     * Tells the browser itself which way round we are, so form controls,
     * scrollbars and the like are drawn to match. Without it a dark page gets
     * a bright white scrollbar down the side of it.
     */
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  /* Somebody who has not chosen keeps following their system. */
  useEffect(() => {
    let media;
    try {
      media = window.matchMedia("(prefers-color-scheme: dark)");
    } catch (err) {
      return undefined;
    }
    const listen = (event) => setSystemDark(event.matches);
    media.addEventListener("change", listen);
    return () => media.removeEventListener("change", listen);
  }, []);

  const setTheme = useCallback((next) => {
    setChoice(next);
    try {
      localStorage.setItem(KEY, next);
    } catch (err) {
      // It still applies for this visit; it just will not be remembered.
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside a ThemeProvider");
  return value;
}
