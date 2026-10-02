import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api";
import { onFriendsChanged } from "../friendsSignal";
import Avatar from "./Avatar";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * How many people are waiting on an answer.
   *
   * A friend request nobody is told about is a feature that does not work, so
   * the count sits on the link. It is re-read whenever the route changes,
   * which keeps it honest after accepting one without needing shared state or
   * a poll — the payload is a few hundred bytes and navigation is not frequent.
   */
  const [waiting, setWaiting] = useState(0);
  /*
   * Challenges waiting on an answer, and whether a match is running.
   *
   * A duel somebody started for you is worth interrupting for, and a duel with
   * a clock already ticking is worth interrupting for rather a lot — so the
   * arena link carries both. Its own endpoint, which is two counts and no
   * documents, because this is asked on every navigation.
   */
  const [duels, setDuels] = useState({ waiting: 0, running: 0 });
  /*
   * How many Core CS questions are queued for revision.
   *
   * On the link for the same reason the friend count is: a revision queue you
   * have to go looking for is a revision queue you forget about. Its own
   * endpoint, which returns two integers and no question ids, because this is
   * asked on every navigation.
   */
  const [revise, setRevise] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setWaiting(0);
      setDuels({ waiting: 0, running: 0 });
      setRevise(0);
      return;
    }

    let live = true;
    const read = () => {
      authApi
        .get("/corecs/counts")
        .then(({ data }) => {
          if (live) setRevise(data.revise || 0);
        })
        .catch(() => {});

      authApi
        .get("/duels/waiting")
        .then(({ data }) => {
          if (live) setDuels({ waiting: data.waiting || 0, running: data.running || 0 });
        })
        .catch(() => {});

      return authApi
        .get("/friends")
        .then(({ data }) => {
          if (live) setWaiting(data.incoming?.length || 0);
        })
        // A failure here costs a badge, not a navigation bar.
        .catch(() => {});
    };

    read();
    // Accepting a request does not change the route, so the path alone is not
    // enough to keep this honest; the friends page says when it has acted.
    const stop = onFriendsChanged(read);
    return () => {
      live = false;
      stop();
    };
  }, [isLoggedIn, location.pathname]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const linkClass = ({ isActive }) =>
    `rounded-lg px-2.5 py-2 text-sm font-medium transition sm:px-3 ${
      isActive ? "bg-brand-100 text-brand-800" : "text-ink-800 hover:bg-brand-100"
    }`;

  return (
    <header className="sticky top-0 z-10 border-b border-brand-200 bg-brand-50/90 backdrop-blur">
      {/* Wraps rather than overflowing. At 375px the brand plus four items do
          not fit on one line, and without this the Log out button was pushed
          past the right edge of the screen and clipped. */}
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          {/* The mark is the first two letters rather than an initial: a lone
              "Z" in a rounded square reads as a generic badge, and "ZY" is
              still legible at 36px. */}
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-300 font-bold text-ink-900">
            ZY
          </span>
          {/* tracking-wide, not the tracking-tight the mixed-case name had.
              Tight letter spacing is for lower case, where the ascenders and
              descenders already separate the letters; six capitals set tight
              run into each other and read as one block. */}
          <span className="text-lg font-bold tracking-wide text-ink-900">
            ZYOSEE
          </span>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <NavLink to="/problems" className={linkClass}>
            Problems
          </NavLink>
          {isLoggedIn ? (
            <>
              <NavLink to="/pair" className={linkClass}>
                Pair Lab
              </NavLink>
              <NavLink to="/arena" className={linkClass}>
                <span className="inline-flex items-center gap-1.5">
                  Arena
                  {duels.waiting > 0 ? (
                    <span
                      className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold tabular-nums text-white"
                      aria-label={`${duels.waiting} duel ${duels.waiting === 1 ? "challenge" : "challenges"} waiting`}
                    >
                      {duels.waiting}
                    </span>
                  ) : duels.running > 0 ? (
                    /* No number, because "1 duel" is not news — that it is
                       running is. A quiet pulse says so without competing with
                       the red count beside it. */
                    <span className="relative flex h-2 w-2" aria-label="a duel is in progress">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
                    </span>
                  ) : null}
                </span>
              </NavLink>
              <NavLink to="/corecs" className={linkClass}>
                <span className="inline-flex items-center gap-1.5">
                  Core CS
                  {revise > 0 && (
                    <span
                      className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold tabular-nums text-accent-ink"
                      aria-label={`${revise} ${revise === 1 ? "question" : "questions"} to revise`}
                    >
                      {revise}
                    </span>
                  )}
                </span>
              </NavLink>
              <NavLink to="/compiler" className={linkClass}>
                Compiler
              </NavLink>
              {/* Only drawn for an account on the server's allowlist. Hiding it
                  is tidiness: the /admin routes check again on every call. */}
              {isAdmin ? (
                <NavLink to="/add-problem" className={linkClass}>
                  Add problem
                </NavLink>
              ) : null}
              <NavLink to="/friends" className={linkClass}>
                <span className="inline-flex items-center gap-1.5">
                  Friends
                  {waiting > 0 && (
                    <span
                      className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold tabular-nums text-white"
                      aria-label={`${waiting} friend ${waiting === 1 ? "request" : "requests"} waiting`}
                    >
                      {waiting}
                    </span>
                  )}
                </span>
              </NavLink>
              <NavLink to="/progress" className={linkClass}>
                Progress
              </NavLink>
              {/*
                The account link, as initials rather than the whole username.
                A long name pushed the Log out button onto a second row; a disc
                is the same width whoever is signed in.

                The name still travels with it — as the link's accessible name
                and as the tooltip — so it is not a mystery button for anyone
                using a screen reader or hovering to check whose account this is.
              */}
              <NavLink
                to="/profile"
                title={`${user.username} — your profile`}
                aria-label={`${user.username} — your profile`}
                className={({ isActive }) =>
                  `rounded-full ring-offset-2 transition hover:opacity-90 focus:outline-none
                   focus-visible:ring-2 focus-visible:ring-brand-400 ${isActive ? "ring-2 ring-brand-400" : ""}`
                }
              >
                <Avatar name={user.username} size="h-9 w-9" className="text-sm" />
              </NavLink>
              <ThemeToggle />
              <button onClick={handleLogout} className="btn-ghost">
                Log out
              </button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
