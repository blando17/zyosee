import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { compilerApi, errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import ProblemFilters from "../components/ProblemFilters";
import ProgressSummary from "../components/ProgressSummary";
import { ProblemCard, ProblemRow } from "../components/ProblemListItem";

/*
 * The problem list.
 *
 * Reading it needs no account, which is why the problems themselves are fetched
 * without a token. What needs one is everything personal — which problems you
 * have solved, and which you starred — so that is a second request made only
 * when somebody is signed in, and its absence degrades the page rather than
 * breaking it.
 *
 * Filtering, sorting and paging all happen here in the browser. Seventy-odd
 * problems is a few kilobytes of JSON; sending a query to the server for every
 * tick box would add a round trip per keystroke and a paging API, to sort a
 * list that already fits in memory. If the set ever grows past a few thousand
 * this is the thing to move server-side.
 *
 * The facet counts are the one part worth reading closely. See countsFor below.
 */

const PAGE_SIZE = 15;

/*
 * Which page buttons to draw.
 *
 * Every page used to get a button, which was fine at seventy-odd problems and
 * five pages. The judge now holds several hundred, so the same loop drew more
 * than thirty buttons in one non-wrapping row: on a phone that is a strip four
 * times wider than the screen, and because it is inside the page rather than a
 * scroller it dragged the whole document sideways.
 *
 * So the first page, the last page, and a short window around the current one
 * are shown, with a gap marked by null wherever numbers were left out. The
 * ends are always present because "go back to the start" is the one jump
 * people actually want, and the window means the row is a fixed width however
 * many pages there are.
 */
function pageWindow(current, total, span = 1) {
  const wanted = new Set([1, total]);
  for (let n = current - span; n <= current + span; n += 1) {
    if (n >= 1 && n <= total) wanted.add(n);
  }

  const pages = [...wanted].sort((a, b) => a - b);
  const out = [];
  let previous = 0;
  for (const n of pages) {
    if (previous && n - previous > 1) out.push(null);
    out.push(n);
    previous = n;
  }
  return out;
}
const LEVELS = ["Easy", "Medium", "Hard"];

const SORTS = [
  { id: "popular", label: "Popular" },
  { id: "number", label: "Number" },
  { id: "difficulty", label: "Difficulty" },
  { id: "acceptance", label: "Acceptance" },
  { id: "title", label: "Title" },
  // Oldest solve first, so the top of the list is what you are most likely to
  // have forgotten. Problems never solved sort last: they are not stale, they
  // are simply not done.
  { id: "stalest", label: "Needs revisiting" },
];

const STATUSES = new Set(["all", "solved", "attempted", "unsolved"]);

const EMPTY_FILTERS = {
  status: "all",
  difficulties: new Set(),
  topics: new Set(),
  companies: new Set(),
};

function isDirty(filters, query) {
  return Boolean(
    query ||
      filters.status !== "all" ||
      filters.difficulties.size ||
      filters.topics.size ||
      filters.companies.size
  );
}

/*
 * Tallies one field across a list of problems, commonest first.
 *
 * Ties are broken by name so the order does not wobble between renders as
 * counts change — a list that reshuffles while you read it is unusable.
 */
function tally(problems, field) {
  const counts = new Map();
  for (const problem of problems) {
    for (const value of problem[field] || []) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export default function Problems() {
  const { user } = useAuth();

  const [problems, setProblems] = useState([]);
  const [progress, setProgress] = useState({ solved: [], attempted: [], favourites: [], lastSolved: {}, lastTried: {} });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  /*
   * The review link on the progress page arrives as ?status=solved&sort=stalest.
   * Read once, as the initial state rather than as a controlled value: after
   * landing here the filters belong to whoever is clicking them, and having the
   * URL keep snapping them back would be maddening.
   */
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => {
    const status = searchParams.get("status");
    return STATUSES.has(status) ? { ...EMPTY_FILTERS, status } : EMPTY_FILTERS;
  });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(() => {
    const wanted = searchParams.get("sort");
    return SORTS.some((option) => option.id === wanted) ? wanted : "popular";
  });
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);

  const searchBox = useRef(null);

  useEffect(() => {
    compilerApi
      .get("/problems")
      .then(({ data }) => setProblems(data))
      .catch((err) => setError(errorMessage(err, "Could not load the problems.")))
      .finally(() => setLoading(false));
  }, []);

  /*
   * Personal state, fetched separately and only when signed in.
   *
   * A failure here is deliberately swallowed: not knowing what you have solved
   * is a worse list, not a broken one, and an error banner over the whole page
   * would be out of proportion.
   */
  useEffect(() => {
    if (!user) {
      setProgress({ solved: [], attempted: [], favourites: [], lastSolved: {}, lastTried: {} });
      return;
    }
    compilerApi
      .get("/me/problems")
      .then(({ data }) => setProgress(data))
      .catch(() => {});
  }, [user]);

  // Ctrl+K, or Cmd+K on a Mac, the shortcut every search field has.
  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchBox.current?.focus();
        searchBox.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const solved = useMemo(() => new Set(progress.solved), [progress.solved]);
  const attempted = useMemo(() => new Set(progress.attempted), [progress.attempted]);
  const favourites = useMemo(() => new Set(progress.favourites), [progress.favourites]);

  const statusOf = useCallback(
    (slug) => (solved.has(slug) ? "solved" : attempted.has(slug) ? "attempted" : "unsolved"),
    [solved, attempted]
  );

  /*
   * One predicate per filter, kept apart so the facet counts can leave one out.
   *
   * That is the whole reason this is not a single `matches()` function: the
   * count beside "Array" has to be the number of problems that would remain if
   * Array were ticked, which means applying every filter EXCEPT the topic one.
   */
  const tests = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return {
      query: (p) =>
        !needle ||
        p.title.toLowerCase().includes(needle) ||
        String(p.number) === needle.replace(/^#/, "") ||
        (p.tags || []).some((t) => t.toLowerCase().includes(needle)) ||
        (p.companies || []).some((c) => c.toLowerCase().includes(needle)),
      status: (p) => filters.status === "all" || statusOf(p.slug) === filters.status,
      difficulty: (p) => !filters.difficulties.size || filters.difficulties.has(p.difficulty),
      topics: (p) => !filters.topics.size || (p.tags || []).some((t) => filters.topics.has(t)),
      companies: (p) =>
        !filters.companies.size || (p.companies || []).some((c) => filters.companies.has(c)),
    };
  }, [query, filters, statusOf]);

  // Everything matching every filter. This is what gets sorted and paged.
  const matching = useMemo(
    () => problems.filter((p) => Object.values(tests).every((test) => test(p))),
    [problems, tests]
  );

  /*
   * The problems a facet's counts are measured against: everything that passes
   * the OTHER filters. Tick a second topic and the counts beside the companies
   * update; the counts beside the topics do not collapse to the one you picked.
   */
  const countsFor = useCallback(
    (except) =>
      problems.filter((p) =>
        Object.entries(tests).every(([name, test]) => name === except || test(p))
      ),
    [problems, tests]
  );

  const facets = useMemo(() => {
    const forStatus = countsFor("status");
    const forDifficulty = countsFor("difficulty");
    return {
      status: {
        solved: forStatus.filter((p) => statusOf(p.slug) === "solved").length,
        attempted: forStatus.filter((p) => statusOf(p.slug) === "attempted").length,
        unsolved: forStatus.filter((p) => statusOf(p.slug) === "unsolved").length,
      },
      difficulty: LEVELS.reduce((acc, level) => {
        acc[level] = forDifficulty.filter((p) => p.difficulty === level).length;
        return acc;
      }, {}),
      topics: tally(countsFor("topics"), "tags"),
      companies: tally(countsFor("companies"), "companies"),
    };
  }, [countsFor, statusOf]);

  const solvedAt = progress.lastSolved || {};

  const sorted = useMemo(() => {
    const byNumber = (a, b) => (a.number || 0) - (b.number || 0);
    const copy = [...matching];
    switch (sort) {
      case "number":
        return copy.sort(byNumber);
      case "title":
        return copy.sort((a, b) => a.title.localeCompare(b.title));
      case "difficulty":
        return copy.sort(
          (a, b) => LEVELS.indexOf(a.difficulty) - LEVELS.indexOf(b.difficulty) || byNumber(a, b)
        );
      case "stalest":
        return copy.sort((a, b) => {
          const x = solvedAt[a.slug] ? Date.parse(solvedAt[a.slug]) : Infinity;
          const y = solvedAt[b.slug] ? Date.parse(solvedAt[b.slug]) : Infinity;
          return x - y || byNumber(a, b);
        });
      case "acceptance":
        // Never attempted sorts last rather than as 0%: it is missing data, not
        // a hard problem.
        return copy.sort((a, b) => {
          const x = a.stats?.acceptance;
          const y = b.stats?.acceptance;
          if (x === null || x === undefined) return y === null || y === undefined ? byNumber(a, b) : 1;
          if (y === null || y === undefined) return -1;
          return y - x || byNumber(a, b);
        });
      default:
        return copy.sort(
          (a, b) => (b.stats?.submissions || 0) - (a.stats?.submissions || 0) || byNumber(a, b)
        );
    }
  }, [matching, sort, solvedAt]);

  // A filter that shortens the list must not leave you on a page past its end.
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const shown = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  useEffect(() => setPage(1), [query, filters, sort]);

  const byDifficulty = useMemo(
    () =>
      LEVELS.reduce((acc, level) => {
        const all = problems.filter((p) => p.difficulty === level);
        acc[level] = { solved: all.filter((p) => solved.has(p.slug)).length, total: all.length };
        return acc;
      }, {}),
    [problems, solved]
  );

  /*
   * Starring, applied to the page before the server has answered.
   *
   * A star that waits for a round trip feels broken. If the request fails the
   * change is put back, so the page never ends up disagreeing with the server.
   */
  const toggleStar = useCallback(
    (slug) => {
      const starred = favourites.has(slug);
      setProgress((p) => ({
        ...p,
        favourites: starred ? p.favourites.filter((s) => s !== slug) : [...p.favourites, slug],
      }));
      const request = starred
        ? compilerApi.delete(`/me/favourites/${slug}`)
        : compilerApi.put(`/me/favourites/${slug}`);
      request.catch(() => {
        setProgress((p) => ({
          ...p,
          favourites: starred ? [...p.favourites, slug] : p.favourites.filter((s) => s !== slug),
        }));
      });
    },
    [favourites]
  );

  const dirty = isDirty(filters, query);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Problems</h1>
          <p className="mt-1 text-sm text-ink-800">
            Practise, submit to the judge, and watch your progress build up.
          </p>
        </div>

        {user ? (
          <ProgressSummary solved={solved.size} total={problems.length} byDifficulty={byDifficulty} />
        ) : (
          <div className="rounded-2xl border border-brand-200 bg-surface px-5 py-4 text-sm shadow-sm">
            <p className="font-bold text-ink-900">Track your progress</p>
            <p className="mt-1 text-ink-800">
              <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-900">
                Log in
              </Link>{" "}
              to see what you have solved.
            </p>
          </div>
        )}
      </header>

      {error && (
        <p className="mt-8 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ProblemFilters
            facets={facets}
            filters={filters}
            dirty={dirty}
            showStatus={Boolean(user)}
            onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
            onReset={() => {
              setFilters(EMPTY_FILTERS);
              setQuery("");
            }}
          />
        </div>

        <section className="min-w-0">
          <div className="relative">
            <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              ref={searchBox}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search problems by name, number, topic or company..."
              aria-label="Search problems"
              className="w-full rounded-xl border border-brand-200 bg-surface py-3 pl-11 pr-24 text-sm
                         text-ink-900 placeholder-brand-400/80 shadow-sm transition
                         focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200
                         [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => { setQuery(""); searchBox.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs
                           font-semibold text-brand-700 hover:bg-brand-50"
              >
                Clear
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md
                              border border-brand-200 bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700">
                Ctrl + K
              </kbd>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, difficulties: new Set() }))}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                filters.difficulties.size === 0
                  ? "bg-brand-200 text-ink-900"
                  : "text-brand-800 hover:bg-brand-100"
              }`}
            >
              All problems ({facets.difficulty.Easy + facets.difficulty.Medium + facets.difficulty.Hard})
            </button>
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, difficulties: new Set([level]) }))}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  filters.difficulties.size === 1 && filters.difficulties.has(level)
                    ? "bg-brand-200 text-ink-900"
                    : "text-brand-800 hover:bg-brand-100"
                }`}
              >
                {level} ({facets.difficulty[level]})
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs font-semibold text-brand-800" htmlFor="sort">
                Sort by
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-lg border border-brand-200 bg-surface px-2.5 py-1.5 text-sm
                           text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              >
                {SORTS.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>

              <div className="flex overflow-hidden rounded-lg border border-brand-200">
                {["list", "grid"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setView(mode)}
                    title={mode === "list" ? "List view" : "Grid view"}
                    aria-label={mode === "list" ? "List view" : "Grid view"}
                    aria-pressed={view === mode}
                    className={`px-2.5 py-2 transition ${
                      view === mode ? "bg-brand-400 text-ink-900" : "bg-surface text-brand-700 hover:bg-brand-50"
                    }`}
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                      {mode === "list" ? (
                        <path d="M3 5.5h14v2H3zm0 4h14v2H3zm0 4h14v2H3z" />
                      ) : (
                        <path d="M3 3.5h6v6H3zm8 0h6v6h-6zm-8 8h6v6H3zm8 0h6v6h-6z" />
                      )}
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading && <p className="mt-8 text-brand-700">Loading...</p>}

          {!loading && !sorted.length && (
            <div className="mt-6 rounded-2xl border border-brand-200 bg-surface px-6 py-12 text-center shadow-sm">
              <p className="font-semibold text-ink-900">Nothing matches those filters.</p>
              {dirty && (
                <button
                  type="button"
                  onClick={() => { setFilters(EMPTY_FILTERS); setQuery(""); }}
                  className="btn-ghost mt-4"
                >
                  Clear the filters
                </button>
              )}
            </div>
          )}

          {!loading && sorted.length > 0 && view === "list" && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-brand-200 bg-surface shadow-sm">
              {shown.map((problem) => (
                <ProblemRow
                  key={problem.slug}
                  problem={problem}
                  status={statusOf(problem.slug)}
                  starred={favourites.has(problem.slug)}
                  onToggleStar={user ? () => toggleStar(problem.slug) : null}
                  lastSolved={progress.lastSolved?.[problem.slug]}
                  lastTried={progress.lastTried?.[problem.slug]}
                  signedIn={Boolean(user)}
                />
              ))}
            </div>
          )}

          {!loading && sorted.length > 0 && view === "grid" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((problem) => (
                <ProblemCard
                  key={problem.slug}
                  problem={problem}
                  status={statusOf(problem.slug)}
                  starred={favourites.has(problem.slug)}
                  onToggleStar={user ? () => toggleStar(problem.slug) : null}
                  lastSolved={progress.lastSolved?.[problem.slug]}
                  lastTried={progress.lastTried?.[problem.slug]}
                  signedIn={Boolean(user)}
                />
              ))}
            </div>
          )}

          {!loading && sorted.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-brand-800">
                Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, sorted.length)} of{" "}
                {sorted.length} {sorted.length === 1 ? "problem" : "problems"}
              </p>

              {pageCount > 1 && (
                <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="Pagination">
                  <button
                    type="button"
                    onClick={() => setPage(current - 1)}
                    disabled={current === 1}
                    className="rounded-lg border border-brand-200 bg-surface px-2.5 py-1.5 text-sm
                               text-brand-800 transition hover:bg-brand-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {pageWindow(current, pageCount).map((number, i) =>
                    number === null ? (
                      <span key={`gap-${i}`} className="px-1 text-sm text-ink-500" aria-hidden="true">
                        …
                      </span>
                    ) : (
                      <button
                        key={number}
                        type="button"
                        onClick={() => setPage(number)}
                        aria-current={number === current ? "page" : undefined}
                        className={`min-w-[2.25rem] rounded-lg px-2.5 py-1.5 text-sm font-semibold transition ${
                          number === current
                            ? "bg-brand-400 text-ink-900"
                            : "border border-brand-200 bg-surface text-brand-800 hover:bg-brand-50"
                        }`}
                      >
                        {number}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(current + 1)}
                    disabled={current === pageCount}
                    className="rounded-lg border border-brand-200 bg-surface px-2.5 py-1.5 text-sm
                               text-brand-800 transition hover:bg-brand-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
