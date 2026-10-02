import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi, compilerApi, errorMessage } from "../api";
import Avatar from "../components/Avatar";
import { DIFFICULTY_DOT, DIFFICULTY_TINT, languageName, overallDifficulty } from "../duelText";
import { LANGUAGE_OPTIONS } from "../components/CodeEditor";

/*
 * Setting up a challenge.
 *
 * One page for both modes rather than two nearly identical ones, because the
 * parts that differ are small — a random duel has no problem picker and a
 * fixed length — and two copies of the opponent picker would be two places to
 * fix the next thing that is wrong with it.
 *
 * THE LIMITS ARE DRAWN, NOT JUST ENFORCED
 *
 * One to three problems, ten to sixty minutes. The server refuses anything
 * outside that, and it has to, because a browser is not where a rule lives.
 * But a form that lets you build something and then rejects it is a bad form,
 * so the controls here cannot express an invalid duel in the first place: the
 * Add button disappears at three, and the length is a fixed set of choices.
 */

const DURATIONS = [10, 15, 20, 30, 45, 60];
const MAX_PROBLEMS = 3;

export default function DuelCreate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get("mode") === "custom" ? "custom" : "random";

  const [friends, setFriends] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const [opponent, setOpponent] = useState(null);
  const [chosen, setChosen] = useState([]);
  const [minutes, setMinutes] = useState(30);
  const [language, setLanguage] = useState("cpp");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let live = true;
    Promise.allSettled([authApi.get("/friends"), compilerApi.get("/problems")])
      .then(([mates, list]) => {
        if (!live) return;
        if (mates.status === "fulfilled") setFriends(mates.value.data.friends || []);
        else setError(errorMessage(mates.reason, "Could not load your friends."));
        if (list.status === "fulfilled") setProblems(list.value.data);
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const picked = useMemo(() => new Set(chosen.map((problem) => problem.slug)), [chosen]);

  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return problems.slice(0, 25);
    return problems
      .filter(
        (problem) =>
          problem.title.toLowerCase().includes(needle) ||
          String(problem.number) === needle.replace(/^#/, "") ||
          (problem.tags || []).some((tag) => tag.toLowerCase().includes(needle))
      )
      .slice(0, 25);
  }, [problems, search]);

  const mix = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0 };
    if (mode === "random") return { Easy: 2, Medium: 1, Hard: 0 };
    for (const problem of chosen) counts[problem.difficulty] = (counts[problem.difficulty] || 0) + 1;
    return counts;
  }, [chosen, mode]);

  const ready = Boolean(opponent) && (mode === "random" || chosen.length > 0);

  async function send() {
    if (!ready) return;
    setSending(true);
    setError("");
    try {
      const { data } = await authApi.post("/duels", {
        mode,
        opponentId: opponent.id,
        language,
        ...(mode === "custom"
          ? { slugs: chosen.map((problem) => problem.slug), durationMinutes: minutes }
          : {}),
      });
      navigate(`/duels/${data.id}`);
    } catch (err) {
      setError(errorMessage(err, "Could not send that challenge."));
      setSending(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-2xl px-6 py-24 text-center text-brand-700">Loading...</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-14 pt-5 sm:px-6">
      <Link to="/arena" className="text-sm font-bold text-brand-700 hover:text-brand-900">
        ← Duel Arena
      </Link>

      <header className="mt-3 flex flex-wrap items-center gap-4 rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-100 via-brand-50 to-surface px-5 py-5 sm:px-7">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface shadow-sm">
          <Icon name={mode === "custom" ? "target" : "dice"} className="h-7 w-7 text-brand-700" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">
            {mode === "custom" ? "CREATE CUSTOM DUEL" : "RANDOM DUEL"}
          </h1>
          <p className="mt-0.5 text-sm text-ink-800">
            {mode === "custom"
              ? "Pick the problems, set the clock, send it."
              : "Two Easy and one Medium, drawn when you send the challenge and hidden until it starts."}
          </p>
        </div>
        <Link
          to={`/arena/new?mode=${mode === "custom" ? "random" : "custom"}`}
          className="btn-ghost px-3 py-2 text-sm"
        >
          Switch to {mode === "custom" ? "random" : "custom"}
        </Link>
      </header>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-4">
          {/* --------------------------- opponent --------------------------- */}
          <section className="overflow-hidden rounded-2xl border border-brand-200 bg-surface shadow-sm">
            <div className="flex items-center gap-2 border-b border-brand-100 px-4 py-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[11px] font-extrabold text-brand-800">
                1
              </span>
              <h2 className="text-sm font-extrabold text-ink-900">Challenge</h2>
              {opponent && (
                <button
                  type="button"
                  onClick={() => setOpponent(null)}
                  className="ml-auto text-xs font-bold text-brand-700 hover:text-brand-900"
                >
                  Change
                </button>
              )}
            </div>

            {friends.length === 0 ? (
              <p className="px-4 py-6 text-sm text-ink-500">
                You can only duel people you are friends with.{" "}
                <Link to="/friends" className="font-bold text-brand-700 hover:text-brand-900">
                  Add someone first
                </Link>
                .
              </p>
            ) : opponent ? (
              <div className="flex items-center gap-3 px-4 py-4">
                <Avatar name={opponent.username} size="h-11 w-11" className="text-sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-ink-900">@{opponent.username}</span>
                  <span className="text-xs text-ink-500">{opponent.solved} problems solved</span>
                </span>
                <span className="text-lg text-emerald-600" aria-hidden="true">✓</span>
              </div>
            ) : (
              <ul className="max-h-60 overflow-y-auto">
                {friends.map((friend) => (
                  <li key={friend.id}>
                    <button
                      type="button"
                      onClick={() => setOpponent(friend)}
                      className="flex w-full items-center gap-3 border-b border-brand-100 px-4 py-2.5 text-left transition last:border-b-0 hover:bg-brand-50"
                    >
                      <Avatar name={friend.username} size="h-8 w-8" className="text-xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink-900">
                          {friend.username}
                        </span>
                        <span className="text-[11px] text-ink-500">{friend.solved} solved</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* --------------------------- problems --------------------------- */}
          {mode === "custom" ? (
            <section className="overflow-hidden rounded-2xl border border-brand-200 bg-surface shadow-sm">
              <div className="flex items-center gap-2 border-b border-brand-100 px-4 py-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[11px] font-extrabold text-brand-800">
                  2
                </span>
                <h2 className="text-sm font-extrabold text-ink-900">Select problems</h2>
                <span className="ml-auto text-xs font-bold text-ink-500">
                  {chosen.length} / {MAX_PROBLEMS}
                </span>
              </div>

              {chosen.length > 0 && (
                <ol className="border-b border-brand-100">
                  {chosen.map((problem, index) => (
                    <li
                      key={problem.slug}
                      className="flex items-center gap-3 border-b border-brand-100 px-4 py-2.5 last:border-b-0"
                    >
                      <span className="font-display text-sm font-extrabold tabular-nums text-brand-600">
                        {index + 1}.
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink-900">
                        {problem.title}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${
                          DIFFICULTY_TINT[problem.difficulty]
                        }`}
                      >
                        {problem.difficulty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setChosen((list) => list.filter((one) => one.slug !== problem.slug))}
                        aria-label={`Remove ${problem.title}`}
                        className="shrink-0 rounded-md px-1.5 text-sm font-bold text-ink-500 transition hover:bg-rose-50 hover:text-rose-700"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ol>
              )}

              {chosen.length >= MAX_PROBLEMS ? (
                <p className="px-4 py-3 text-xs text-ink-500">
                  Three is the limit. Remove one to swap it out.
                </p>
              ) : (
                <>
                  <div className="px-4 py-3">
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search problems by name, number or topic..."
                      aria-label="Search problems"
                      className="field [&::-webkit-search-cancel-button]:appearance-none"
                    />
                  </div>
                  <ul className="max-h-64 overflow-y-auto border-t border-brand-100">
                    {matches.length === 0 && (
                      <li className="px-4 py-6 text-center text-sm text-ink-500">
                        Nothing matches that.
                      </li>
                    )}
                    {matches.map((problem) => {
                      const already = picked.has(problem.slug);
                      return (
                        <li key={problem.slug}>
                          <button
                            type="button"
                            disabled={already}
                            onClick={() => setChosen((list) => [...list, problem])}
                            className="flex w-full items-center gap-3 border-b border-brand-100 px-4 py-2 text-left transition last:border-b-0 hover:bg-brand-50 disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <span className="w-9 shrink-0 font-display text-[11px] font-extrabold tabular-nums text-brand-600">
                              #{problem.number}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
                              {problem.title}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${
                                DIFFICULTY_TINT[problem.difficulty]
                              }`}
                            >
                              {problem.difficulty}
                            </span>
                            <span className="shrink-0 text-xs font-bold text-brand-700">
                              {already ? "added" : "+ Add"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-brand-200 bg-surface shadow-sm">
              <div className="flex items-center gap-2 border-b border-brand-100 px-4 py-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-[11px] font-extrabold text-brand-800">
                  2
                </span>
                <h2 className="text-sm font-extrabold text-ink-900">Computer generated match</h2>
              </div>
              <div className="space-y-3 px-4 py-4">
                <ul className="space-y-2">
                  {[
                    { level: "Easy", count: 2 },
                    { level: "Medium", count: 1 },
                  ].map((row) => (
                    <li key={row.level} className="flex items-center gap-3 rounded-xl bg-brand-50 px-3 py-2.5">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DIFFICULTY_DOT[row.level]}`} aria-hidden="true" />
                      <span className="flex-1 text-sm font-bold text-ink-900">{row.level}</span>
                      <span className="font-display text-sm font-extrabold tabular-nums text-ink-900">
                        × {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="rounded-xl border border-brand-200 bg-surface px-3 py-2.5 text-xs text-ink-800">
                  <Icon name="lock" className="h-3.5 w-3.5 -mt-0.5" /> The three problems are drawn the moment you send
                  this, and neither of you is told which they are — not their names, not their
                  links — until the countdown ends.
                </p>
                <p className="text-xs text-ink-500">
                  Random duels run for a fixed 30 minutes. Use a custom duel to change the clock.
                </p>
              </div>
            </section>
          )}
        </div>

        {/* ---------------------------- summary ----------------------------- */}
        <div className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-brand-200 bg-surface shadow-sm">
            <div className="border-b border-brand-100 px-4 py-3">
              <h2 className="text-sm font-extrabold text-ink-900">Match difficulty</h2>
            </div>
            <ul className="px-4 py-3">
              {["Easy", "Medium", "Hard"].map((level) => (
                <li key={level} className="flex items-center gap-2.5 py-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${DIFFICULTY_DOT[level]}`} aria-hidden="true" />
                  <span className="flex-1 text-sm text-ink-800">{level}</span>
                  <span className="font-display text-sm font-extrabold tabular-nums text-ink-900">
                    {mix[level] || 0}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-brand-100 px-4 py-2.5 text-xs text-ink-500">
              Estimated difficulty{" "}
              <span className="font-bold text-ink-900">{overallDifficulty(mix)}</span>
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-brand-200 bg-surface p-4 shadow-sm">
            <div>
              <label htmlFor="duel-duration" className="label">
                Duration
              </label>
              <select
                id="duel-duration"
                value={mode === "random" ? 30 : minutes}
                disabled={mode === "random"}
                onChange={(event) => setMinutes(Number(event.target.value))}
                className="field disabled:cursor-not-allowed disabled:bg-brand-50 disabled:text-ink-500"
              >
                {DURATIONS.map((value) => (
                  <option key={value} value={value}>
                    {value} Minutes
                  </option>
                ))}
              </select>
              {mode === "random" && (
                <p className="mt-1 text-[11px] text-ink-500">Fixed for a quick match.</p>
              )}
            </div>

            <div>
              <label htmlFor="duel-language" className="label">
                Language
              </label>
              <select
                id="duel-language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="field"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-ink-500">
                Both of you play in {languageName(language)}, so the match is the same problem for
                both.
              </p>
            </div>
          </section>

          <button
            type="button"
            onClick={send}
            disabled={!ready || sending}
            className="btn-primary w-full justify-center py-3 text-sm font-extrabold uppercase tracking-wide disabled:opacity-50"
          >
            {sending
              ? "Sending..."
              : !opponent
                ? "Pick an opponent"
                : mode === "custom" && chosen.length === 0
                  ? "Pick at least one problem"
                  : "Send challenge →"}
          </button>

          <p className="text-center text-[11px] text-ink-500">
            They have to accept before anything starts. Nothing is revealed until you are both
            ready.
          </p>
        </div>
      </div>
    </main>
  );
}
