import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon";
import { Link, useNavigate } from "react-router-dom";
import { authApi, compilerApi, errorMessage } from "../api";
import Avatar from "../components/Avatar";
import SectionCard, { EmptyState } from "../components/SectionCard";
import { PairLabArt, PartnerSpot, RoomsSpot } from "../components/Spots";
import { relativeTime } from "../relativeTime";
import { starterFor } from "../starters";

/*
 * The Pair Lab front door: choose a problem, choose who with, go.
 *
 * Starting a session is one screen rather than a trail through the problem
 * list, because the decision people actually make is "who am I working with
 * and on what" — and those two are made together. The two panels are numbered
 * for that reason: it is one task in two parts, not two unrelated pickers.
 */

const DIFFICULTY_TINT = {
  Easy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-800 ring-amber-200",
  Hard: "bg-rose-50 text-rose-700 ring-rose-200",
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="M13.5 13.5 L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function PairLab() {
  const navigate = useNavigate();

  const [problems, setProblems] = useState([]);
  const [friends, setFriends] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [chosenProblem, setChosenProblem] = useState(null);
  const [chosenFriend, setChosenFriend] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let live = true;
    Promise.allSettled([
      compilerApi.get("/problems"),
      authApi.get("/friends"),
      authApi.get("/rooms"),
    ])
      .then(([list, mates, mine]) => {
        if (!live) return;
        if (list.status === "fulfilled") setProblems(list.value.data);
        else setError(errorMessage(list.reason, "Could not load the problems."));
        if (mates.status === "fulfilled") setFriends(mates.value.data.friends || []);
        if (mine.status === "fulfilled") setRooms(mine.value.data.rooms || []);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const bySlug = useMemo(
    () => new Map(problems.map((problem) => [problem.slug, problem])),
    [problems]
  );

  const matches = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const pool = needle
      ? problems.filter(
          (problem) =>
            problem.title.toLowerCase().includes(needle) ||
            String(problem.number) === needle.replace(/^#/, "") ||
            (problem.tags || []).some((tag) => tag.toLowerCase().includes(needle))
        )
      : problems;
    return pool.slice(0, 40);
  }, [problems, search]);

  async function start() {
    if (!chosenProblem) return;
    setStarting(true);
    setError("");
    try {
      /*
       * Reuse a room already open for this problem rather than stacking up
       * near-identical ones — otherwise the partner invited to the first is
       * sitting somewhere you are not.
       */
      let room = rooms.find((existing) => existing.slug === chosenProblem.slug);
      if (!room) {
        /*
         * A new room opens on the language's skeleton rather than an empty
         * file. Two people staring at a blank editor both wait for the other
         * to type the includes.
         */
        const { data } = await authApi.post("/rooms", {
          slug: chosenProblem.slug,
          language: "cpp",
          document: starterFor(null, "cpp"),
        });
        room = data;
      }

      if (chosenFriend && !room.members.some((member) => member.id === chosenFriend.id)) {
        await authApi.post(`/rooms/${room.id}/invite`, { userId: chosenFriend.id });
      }
      navigate(`/rooms/${room.id}`);
    } catch (err) {
      setError(errorMessage(err, "Could not open the room."));
      setStarting(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-2xl px-6 py-24 text-center text-brand-700">Loading Pair Lab...</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6">

      {/* -------------------------------- hero -------------------------------- */}
      <header className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-100 via-brand-50 to-surface px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-center gap-5">
          <div className="min-w-[14rem] flex-1">
            <h1 className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">Pair Lab</h1>
            <p className="mt-1 max-w-md text-sm text-ink-800">
              Pick a problem and somebody to solve it with. One file, two cursors, one conversation.
            </p>
          </div>
          {/* Hidden on the narrowest screens: it is decoration, and at 375px
              the words are what somebody needs the room for. */}
          <PairLabArt className="hidden h-32 w-auto shrink-0 sm:block sm:h-40 lg:h-44" />
        </div>
      </header>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* ----------------------------- the problem ---------------------------- */}
        <SectionCard
          step="1"
          title="Choose a problem"
          subtitle={chosenProblem ? "Picked — change it any time." : `${problems.length} to pick from.`}
          action={
            chosenProblem && (
              <button
                type="button"
                onClick={() => setChosenProblem(null)}
                className="text-xs font-bold text-brand-700 transition hover:text-brand-900"
              >
                Change
              </button>
            )
          }
        >
          {chosenProblem ? (
            <div className="flex flex-wrap items-center gap-3 bg-brand-50/60 px-4 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface font-display text-xs font-extrabold tabular-nums text-brand-700 shadow-sm">
                #{chosenProblem.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-ink-900">{chosenProblem.title}</span>
                <span className="text-xs text-ink-500">
                  {chosenProblem.testCount} test cases · {(chosenProblem.tags || []).slice(0, 3).join(", ")}
                </span>
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${DIFFICULTY_TINT[chosenProblem.difficulty]}`}>
                {chosenProblem.difficulty}
              </span>
            </div>
          ) : (
            <>
              <div className="px-4 py-3">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500">
                    <SearchIcon />
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, number or topic..."
                    aria-label="Search problems"
                    className="field pl-10 [&::-webkit-search-cancel-button]:appearance-none"
                  />
                </div>
              </div>

              <ul className="max-h-[24rem] overflow-y-auto border-t border-brand-100">
                {matches.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-ink-500">Nothing matches that.</li>
                )}
                {matches.map((problem) => (
                  <li key={problem.slug}>
                    <button
                      type="button"
                      onClick={() => setChosenProblem(problem)}
                      className="group flex w-full items-center gap-3 border-b border-brand-100 px-4 py-2.5 text-left transition last:border-b-0 hover:bg-brand-50"
                    >
                      <span className="flex h-7 shrink-0 items-center rounded-lg bg-brand-50 px-2 font-display text-[11px] font-extrabold tabular-nums text-brand-700 ring-1 ring-brand-100 transition group-hover:bg-surface">
                        #{problem.number}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
                        {problem.title}
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${DIFFICULTY_TINT[problem.difficulty]}`}>
                        {problem.difficulty}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>

        {/* ----------------------------- the partner ---------------------------- */}
        <div className="space-y-4">
          <SectionCard
            step="2"
            title="Choose a partner"
            subtitle={friends.length ? "Optional — you can invite from inside." : undefined}
          >
            {friends.length === 0 ? (
              <EmptyState art={<PartnerSpot className="h-20 w-auto" />} title="No friends yet">
                Add somebody to pair with — or start alone and invite from inside the room.
              </EmptyState>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {friends.map((friend) => {
                  const picked = chosenFriend?.id === friend.id;
                  return (
                    <li key={friend.id}>
                      <button
                        type="button"
                        onClick={() => setChosenFriend(picked ? null : friend)}
                        aria-pressed={picked}
                        className={`flex w-full items-center gap-3 border-b border-brand-100 px-4 py-2.5 text-left transition last:border-b-0 ${
                          picked ? "bg-brand-100" : "hover:bg-brand-50"
                        }`}
                      >
                        <Avatar name={friend.username} size="h-9 w-9" className="text-xs" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink-900">{friend.username}</span>
                          <span className="text-[11px] text-ink-500">{friend.solved} solved</span>
                        </span>
                        {picked && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white" aria-hidden="true">
                            ✓
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {friends.length === 0 && (
              <div className="border-t border-brand-100 px-4 py-3">
                <Link to="/friends" className="btn-ghost w-full justify-center py-2 text-sm">
                  Find someone to add
                </Link>
              </div>
            )}
          </SectionCard>

          <button
            type="button"
            onClick={start}
            disabled={!chosenProblem || starting}
            className="btn-primary w-full justify-center py-3.5 text-sm font-extrabold disabled:opacity-50"
          >
            {starting
              ? "Opening the room..."
              : chosenProblem
                ? `Enter room${chosenFriend ? ` with ${chosenFriend.username}` : ""} →`
                : "Pick a problem first"}
          </button>
          {chosenProblem && !chosenFriend && friends.length > 0 && (
            <p className="text-center text-xs text-ink-500">
              No partner picked — you can invite somebody once you are inside.
            </p>
          )}

          {/*
            What a room actually is.
            The column beside a long problem list is short, and the gap under
            the button was dead space. This fills it with the thing a
            first-time visitor is missing — nothing on this screen otherwise
            says what happens after you press the button — rather than with
            padding.
          */}
          <SectionCard icon="sparkle" title="Inside a room">
            <ul className="space-y-2.5 px-4 py-3.5">
              {[
                { icon: "problems", text: "One file. You both type in it, and every keystroke shows up on the other screen." },
                { icon: "pen", text: "Your line is tinted in your colour, theirs in another, so you never edit over each other." },
                { icon: "chat", text: "A chat panel sits beside the editor for talking the approach through." },
                { icon: "scales", text: "Run and submit without leaving. Whoever presses Submit gets the solve on their record." },
              ].map((row) => (
                <li key={row.icon} className="flex gap-2.5">
                  <Icon name={row.icon} className="mt-0.5 h-3.5 w-3.5 text-brand-600" />
                  <span className="text-[11px] leading-relaxed text-ink-800">{row.text}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      {/* ------------------------------ your rooms ---------------------------- */}
      <SectionCard
        icon="door"
        title="Your rooms"
        subtitle="Sessions you are already part of."
        count={rooms.length}
        className="mt-4"
      >
        {rooms.length === 0 ? (
          <EmptyState art={<RoomsSpot className="h-20 w-auto" />} title="No sessions yet">
            Pick a problem above to start one. Rooms keep their code, so you can come back to it.
          </EmptyState>
        ) : (
          <ul>
            {rooms.map((room) => {
              const problem = bySlug.get(room.slug);
              return (
                <li key={room.id}>
                  <Link
                    to={`/rooms/${room.id}`}
                    className="group flex flex-wrap items-center gap-3 border-b border-brand-100 px-4 py-3 transition last:border-b-0 hover:bg-brand-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                      <Icon name="pair" className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-ink-900">
                        {problem ? problem.title : room.slug}
                      </span>
                      <span className="text-xs text-ink-500">last active {relativeTime(room.updatedAt)}</span>
                    </span>

                    <span className="flex items-center -space-x-2">
                      {room.members.map((member) => (
                        <span
                          key={member.id}
                          title={member.username}
                          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white font-display text-[11px] font-extrabold text-white"
                          style={{ backgroundColor: member.colour }}
                        >
                          {(member.username || "?").charAt(0).toUpperCase()}
                        </span>
                      ))}
                    </span>

                    <span className="text-xs font-bold text-brand-700 transition group-hover:translate-x-0.5">
                      Open →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </main>
  );
}
