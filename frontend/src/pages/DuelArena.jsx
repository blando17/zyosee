import { useCallback, useEffect, useState } from "react";
import Icon from "../components/Icon";
import { Link, useNavigate } from "react-router-dom";
import { authApi, errorMessage } from "../api";
import Avatar from "../components/Avatar";
import DuelChallengeCard from "../components/DuelChallengeCard";
import { relativeTime } from "../relativeTime";
import { durationText, languageName, mixText, modeOf } from "../duelText";

/*
 * The front door of the Duel Arena.
 *
 * ORDER OF THE PAGE, WHICH IS THE DESIGN
 *
 * The two ways to start a duel are what the screen is for, so they are the
 * biggest thing on it. Everything else is arranged by how urgent it is rather
 * than how interesting it looks:
 *
 *   a match already running   first, always, and impossible to miss. Somebody
 *                             with a live duel and a clock ticking does not
 *                             want to read about quick match presets.
 *   a challenge waiting       second. Somebody is waiting on an answer.
 *   the two start cards       the actual purpose of the page.
 *   history and record        last, because it is interesting, not urgent.
 */

const RANDOM_CHIPS = [
  { icon: "problems", label: "2 Easy", sub: "Problems" },
  { icon: "page", label: "1 Medium", sub: "Problem" },
  { icon: "timer", label: "30 Minutes", sub: "" },
  { icon: "gear", label: "Any language", sub: "" },
];

const CUSTOM_CHIPS = [
  { icon: "problems", label: "Choose", sub: "1 – 3 Problems" },
  { icon: "timer", label: "Set Duration", sub: "(10 – 60 min)" },
  { icon: "gear", label: "Any language", sub: "" },
  { icon: "books", label: "Any Difficulty", sub: "" },
];

function Chip({ icon, label, sub }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-surface px-3 py-2">
      <Icon name={icon} className="h-4 w-4 text-brand-700" />
      <span className="leading-tight">
        <span className="block text-xs font-extrabold text-ink-900">{label}</span>
        {sub && <span className="block text-[10px] text-ink-500">{sub}</span>}
      </span>
    </span>
  );
}

function StatTile({ icon, value, label, tint }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-brand-200 bg-surface px-3 py-2.5">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent-ink ${tint}`}>
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-xl font-extrabold tabular-nums text-ink-900">{value}</span>
        <span className="block text-[11px] text-ink-500">{label}</span>
      </span>
    </div>
  );
}

export default function DuelArena() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await authApi.get("/duels");
      setBoard(data);
    } catch (err) {
      setError(errorMessage(err, "Could not open the arena."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function answer(duel, accept) {
    setBusyId(duel.id);
    setError("");
    try {
      const { data } = await authApi.post(`/duels/${duel.id}/respond`, { accept });
      if (accept) return navigate(`/duels/${data.id}`);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not answer that challenge."));
    } finally {
      setBusyId(null);
    }
  }

  async function withdraw(duel) {
    setBusyId(duel.id);
    try {
      await authApi.post(`/duels/${duel.id}/cancel`);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not withdraw that challenge."));
    } finally {
      setBusyId(null);
    }
  }

  if (!board) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center text-brand-700">
        Opening the arena...
      </main>
    );
  }

  const { incoming, outgoing, active, recent, stats } = board;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-5 sm:px-6">
      {/* ------------------------------- hero ------------------------------- */}
      <header className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-100 via-brand-50 to-surface px-5 py-6 sm:px-8 sm:py-8">
        {/* Decoration, hidden from screen readers: it says nothing the heading
            does not already say. */}
        <Icon
          name="duel"
          className="pointer-events-none absolute -right-10 -top-12 h-64 w-64 opacity-[0.06]"
          strokeWidth={0.9}
        />

        <div className="relative flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface text-brand-600 shadow-sm">
            <Icon name="duel" className="h-8 w-8" strokeWidth={1.6} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
              DUEL <span className="text-brand-600">ARENA</span>
            </h1>
            <p className="mt-1 text-sm font-semibold text-ink-800">Challenge another programmer.</p>
            <p className="text-xs text-ink-500">Compete. Solve. Get better.</p>
          </div>

          <div className="hidden shrink-0 rounded-2xl border border-brand-200 bg-surface/80 px-4 py-3 text-center sm:block">
            <p className="font-display text-xs font-extrabold uppercase tracking-widest text-brand-600">
              Your rating
            </p>
            <p className="font-display text-3xl font-extrabold tabular-nums text-ink-900">
              {stats.rating}
            </p>
            <p className="text-[10px] text-ink-500">
              {stats.total === 0 ? "unplayed" : `${stats.total} duel${stats.total === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
      </header>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      {/* --------------------------- running now ---------------------------- */}
      {active.length > 0 && (
        <section className="mt-5 space-y-3">
          {active.map((duel) => {
            const them = duel.players.find((player) => !player.isYou);
            return (
              <Link
                key={duel.id}
                to={`/duels/${duel.id}`}
                className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-brand-400 bg-surface px-4 py-3.5 shadow-sm transition hover:border-brand-500 hover:shadow"
              >
                <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-600" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-sm font-extrabold text-ink-900">
                    {duel.status === "live" ? "Duel in progress" : "Waiting in the lobby"} · vs{" "}
                    {them?.username}
                  </span>
                  <span className="text-xs text-ink-500">
                    {modeOf(duel.mode).label} · {duel.problemCount} problem
                    {duel.problemCount === 1 ? "" : "s"} · {durationText(duel.durationMs)}
                  </span>
                </span>
                <span className="btn-primary px-4 py-2 text-sm">
                  {duel.status === "live" ? "Rejoin →" : "Open lobby →"}
                </span>
              </Link>
            );
          })}
        </section>
      )}

      {/* -------------------------- waiting on you -------------------------- */}
      {incoming.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2.5 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-ink-900">
            <Icon name="inbox" className="h-4 w-4 text-brand-700" />
            Challenges waiting for you
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">
              {incoming.length}
            </span>
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {incoming.map((duel) => (
              <DuelChallengeCard
                key={duel.id}
                duel={duel}
                direction="incoming"
                busy={busyId === duel.id}
                onAccept={(d) => answer(d, true)}
                onDecline={(d) => answer(d, false)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------- start a duel -------------------------- */}
      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="flex flex-col overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-surface to-brand-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Icon name="dice" className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-extrabold text-ink-900">RANDOM DUEL</h2>
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-800">
                  <Icon name="compiler" className="h-3 w-3" /> Quick Match
                </span>
              </div>
              <p className="text-sm text-ink-500">Let the system pick the problems.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {RANDOM_CHIPS.map((chip) => (
              <Chip key={chip.label} {...chip} />
            ))}
          </div>

          <p className="mt-3 flex-1 text-sm text-ink-800">
            Two Easy problems and one Medium, drawn at random from the problem set. Neither of you
            sees them until the countdown ends.
          </p>

          <Link
            to="/arena/new?mode=random"
            className="btn-primary mt-4 w-full justify-center py-3 text-sm font-extrabold uppercase tracking-wide"
          >
            <Icon name="duel" className="h-4 w-4" /> Start random duel →
          </Link>
        </article>

        <article className="flex flex-col overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-surface to-brand-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Icon name="target" className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-extrabold text-ink-900">CUSTOM DUEL</h2>
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-800">
                  <Icon name="pair" className="h-3 w-3" /> Challenge a friend
                </span>
              </div>
              <p className="text-sm text-ink-500">You select the problems.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {CUSTOM_CHIPS.map((chip) => (
              <Chip key={chip.label} {...chip} />
            ))}
          </div>

          <p className="mt-3 flex-1 text-sm text-ink-800">
            Pick up to three problems yourself and set the clock. Your opponent is told what is in
            the match before they accept — but neither of you can open them early.
          </p>

          <Link
            to="/arena/new?mode=custom"
            className="mt-4 w-full justify-center rounded-lg bg-gradient-to-r from-brand-400 to-brand-300 px-5 py-3 text-center text-sm font-extrabold uppercase tracking-wide text-ink-900 shadow-sm transition hover:from-brand-500 hover:to-brand-400"
          >
            <Icon name="target" className="h-4 w-4" /> Create custom duel →
          </Link>
        </article>
      </section>

      {/* --------------------------- sent by you ---------------------------- */}
      {outgoing.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-ink-900">
            Waiting for an answer
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {outgoing.map((duel) => (
              <DuelChallengeCard
                key={duel.id}
                duel={duel}
                direction="outgoing"
                busy={busyId === duel.id}
                onCancel={withdraw}
              />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------- history and record ----------------------- */}
      <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-brand-200 bg-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-brand-100 px-4 py-3">
            <Icon name="history" className="h-4 w-4 text-brand-700" />
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-ink-900">
              Recent duels
            </h2>
          </div>

          {recent.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-500">
              No duels yet. Challenge somebody above.
            </p>
          ) : (
            <ul>
              {recent.map((duel) => {
                const them = duel.players.find((player) => !player.isYou);
                const you = duel.players.find((player) => player.isYou);
                const result = duel.scores;
                const outcome = result?.draw ? "draw" : result?.winnerId === you?.id ? "won" : "lost";
                const tint = {
                  won: "bg-emerald-50 text-emerald-700 ring-emerald-200",
                  lost: "bg-rose-50 text-rose-700 ring-rose-200",
                  draw: "bg-brand-100 text-brand-800 ring-brand-200",
                }[outcome];

                return (
                  <li key={duel.id}>
                    <Link
                      to={`/duels/${duel.id}`}
                      className="flex flex-wrap items-center gap-3 border-b border-brand-100 px-4 py-2.5 transition last:border-b-0 hover:bg-brand-50"
                    >
                      <Avatar name={them?.username} size="h-8 w-8" className="text-[11px]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink-900">
                          {them?.username}
                        </span>
                        <span className="text-[11px] text-ink-500">
                          {relativeTime(duel.finishedAt || duel.createdAt)}
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ring-1 ${tint}`}>
                        {outcome}
                      </span>
                      <span className="hidden shrink-0 text-xs text-ink-500 sm:block">
                        {modeOf(duel.mode).label}
                      </span>
                      <span className="shrink-0 font-display text-sm font-extrabold tabular-nums text-ink-900">
                        {result?.cards?.[you?.id]?.total ?? 0}
                        <span className="mx-1 text-ink-500">–</span>
                        {result?.cards?.[them?.id]?.total ?? 0}
                      </span>
                      <span className="shrink-0 text-brand-600" aria-hidden="true">›</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-brand-200 bg-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-brand-100 px-4 py-3">
            <Icon name="progress" className="h-4 w-4 text-brand-700" />
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-ink-900">
              Your stats
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 p-4">
            {/* A fixed tint, like the three beside it. bg-brand-100 is a themed token
              and goes dark in dark mode, which would hide the dark icon these
              discs carry — four tiles in a row have to behave the same way. */}
          <StatTile icon="trophy" value={stats.total} label="Total duels" tint="bg-amber-100" />
            <StatTile icon="trendUp" value={stats.won} label="Wins" tint="bg-emerald-100" />
            <StatTile icon="trendDown" value={stats.lost} label="Losses" tint="bg-rose-100" />
            <StatTile icon="scales" value={stats.drawn} label="Draws" tint="bg-sky-100" />
          </div>
          <p className="mx-4 mb-4 rounded-xl bg-brand-50 px-3 py-2.5 text-xs italic text-ink-800">
            <span className="text-base not-italic text-brand-400" aria-hidden="true">“</span>
            Great programmers aren't born, they're challenged.
          </p>
        </div>
      </section>

      <section className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-100 via-brand-50 to-surface px-5 py-4">
        <Icon name="trophy" className="h-5 w-5 text-brand-700" />
        <p className="min-w-0 flex-1 text-sm">
          <span className="block font-bold text-ink-900">Ready for a challenge?</span>
          <span className="text-xs text-ink-500">
            You can only duel people you are friends with.{" "}
            <Link to="/friends" className="font-bold text-brand-700 hover:text-brand-900">
              Add someone
            </Link>
            .
          </span>
        </p>
        <Link to="/arena/new?mode=random" className="btn-primary px-5 py-2.5 text-sm">
          <Icon name="duel" className="h-4 w-4" /> Challenge now →
        </Link>
      </section>
    </main>
  );
}
