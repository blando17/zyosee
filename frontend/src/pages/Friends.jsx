import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "../components/Icon";
import { Link } from "react-router-dom";
import { authApi, errorMessage } from "../api";
import { relativeTime } from "../relativeTime";
import { announceFriendsChanged } from "../friendsSignal";
import Avatar from "../components/Avatar";
import SectionCard, { EmptyState } from "../components/SectionCard";
import { FriendsArt, InboxSpot, SentSpot } from "../components/Spots";

/*
 * Friends.
 *
 * Everything on this page is one of three states with the same person, so the
 * whole thing is driven by one fetch of /friends and one search. After any
 * action the list is reloaded rather than patched by hand: a friendship has
 * two sides and the other person may have acted in the meantime, so the
 * server's answer is the one worth drawing.
 *
 * WHAT IS NOT DRAWN HERE, AND WHY
 *
 * No "online" dot beside a name. Nothing in this system tracks whether an
 * account is currently connected — there is presence inside a Pair Lab room
 * and inside a duel, and nowhere else — so a green dot on this page would be
 * a decoration pretending to be information, and somebody would wait for a
 * reply from a person it claimed was there.
 */

const RELATION_LABEL = {
  friends: "Already friends",
  requested: "Request sent",
  "awaiting-you": "Asked you",
};

const SORTS = {
  recent: { label: "Recently added", compare: (a, b) => new Date(b.since) - new Date(a.since) },
  name: { label: "Name", compare: (a, b) => a.username.localeCompare(b.username) },
  solved: { label: "Problems solved", compare: (a, b) => (b.solved || 0) - (a.solved || 0) },
};

function SearchIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="M13.5 13.5 L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Person({ person, note, children }) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-brand-100 px-4 py-3 transition last:border-b-0 hover:bg-brand-50/60">
      <Avatar name={person.username} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-ink-900">{person.username}</p>
        {/* The name is clipped if it has to be, but the note is allowed to
            wrap: "asked 58 mi..." tells you nothing, and these lines are short
            enough that a second one costs almost nothing. */}
        {note && <p className="text-xs text-ink-500">{note}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </li>
  );
}

export default function Friends() {
  const [data, setData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState("");
  const [sort, setSort] = useState("recent");

  const searchToken = useRef(0);

  const load = useCallback(async () => {
    try {
      const { data: fresh } = await authApi.get("/friends");
      setData(fresh);
      setError("");
      // The badge in the navigation bar counts the same requests.
      announceFriendsChanged();
    } catch (err) {
      setError(errorMessage(err, "Could not load your friends."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /*
   * Search as you type, a beat behind.
   *
   * Every request carries a ticket, and a reply holding a stale one is thrown
   * away. Without that, a slow response for "al" can land after a fast one for
   * "algo" and leave the wrong results on screen — the classic out-of-order
   * bug in any search box.
   */
  useEffect(() => {
    const text = term.trim();
    if (text.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    const ticket = (searchToken.current += 1);
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { data: found } = await authApi.get("/friends/search", { params: { q: text } });
        if (ticket === searchToken.current) setResults(found.results || []);
      } catch (err) {
        if (ticket === searchToken.current) setResults([]);
      } finally {
        if (ticket === searchToken.current) setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [term]);

  const act = useCallback(
    async (key, request, success) => {
      setBusy(key);
      setNotice("");
      try {
        const { data: outcome } = await request();
        setNotice(outcome?.message || success);
        await load();
        // The relation shown beside a search result is now out of date.
        if (term.trim().length >= 2) {
          const { data: found } = await authApi.get("/friends/search", { params: { q: term.trim() } });
          setResults(found.results || []);
        }
      } catch (err) {
        setNotice(errorMessage(err, "That did not work."));
      } finally {
        setBusy("");
      }
    },
    [load, term]
  );

  const add = (person) =>
    act(`add:${person.id}`, () => authApi.post("/friends/requests", { userId: person.id }), `Request sent to ${person.username}.`);
  const accept = (person) =>
    act(`accept:${person.id}`, () => authApi.post(`/friends/${person.id}/accept`), `You and ${person.username} are now friends.`);
  const remove = (person, wording) =>
    act(`remove:${person.id}`, () => authApi.delete(`/friends/${person.id}`), wording);

  const totalSolvedByFriends = useMemo(
    () => data.friends.reduce((total, friend) => total + (friend.solved || 0), 0),
    [data.friends]
  );

  // Sorted for display only; the server's order is never relied upon.
  const sortedFriends = useMemo(
    () => [...data.friends].sort(SORTS[sort].compare),
    [data.friends, sort]
  );

  if (loading) {
    return <main className="mx-auto max-w-2xl px-6 py-24 text-center text-brand-700">Loading...</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6">

      {/* -------------------------------- hero -------------------------------- */}
      <header className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-100 via-brand-50 to-surface px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface text-brand-600 shadow-sm">
            <Icon name="pair" className="h-7 w-7" strokeWidth={1.6} />
          </span>

          <div className="min-w-[12rem] flex-1">
            <h1 className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">Friends</h1>
            <p className="mt-0.5 text-sm text-ink-800">
              Code together. Compete together. Grow together.
            </p>
            <p className="mt-1.5 text-sm text-ink-500">
              {data.friends.length === 0 ? (
                "Find someone you know and compare notes."
              ) : (
                <>
                  <span className="font-bold text-brand-700">
                    {data.friends.length} {data.friends.length === 1 ? "friend" : "friends"}
                  </span>
                  , {totalSolvedByFriends} {totalSolvedByFriends === 1 ? "problem" : "problems"} solved
                  between them.
                </>
              )}
            </p>
          </div>

          <div className="hidden shrink-0 items-end gap-1 sm:flex">
            {/* Set in the display face rather than a script one: no handwriting
                family is loaded, and faking it with a fallback would come out
                as plain italic on most machines anyway. */}
            <p className="mb-6 -rotate-6 font-display text-sm font-extrabold leading-tight text-brand-700">
              Better
              <br />
              Code
              <br />
              Together
            </p>
            <FriendsArt className="h-28 w-auto lg:h-32" />
          </div>
        </div>
      </header>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
      {notice && (
        <p className="mt-4 rounded-lg bg-brand-100 px-4 py-2.5 text-sm font-medium text-brand-900">{notice}</p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-4">
          {/* ---------------------------- find people --------------------------- */}
          <SectionCard
            icon="search"
            title="Find people"
            action={
              <span className="hidden text-[11px] text-ink-500 sm:block">
                Search by username to add new friends
              </span>
            }
          >
            <div className="px-4 py-3.5">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500">
                    <SearchIcon />
                  </span>
                  <input
                    type="search"
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder="Search by username..."
                    aria-label="Search for people by username"
                    className="field pl-10 [&::-webkit-search-cancel-button]:appearance-none"
                  />
                </div>
                {/* The list updates as you type, so this is a focus target and
                    a signpost rather than the only way to run a search — which
                    is why it is not disabled and never blocks anything. */}
                <button
                  type="button"
                  onClick={() => setTerm((text) => text.trim())}
                  className="btn-primary shrink-0 px-5 py-2.5 text-sm"
                >
                  Search
                </button>
              </div>

              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[9px] font-bold text-brand-800"
                  aria-hidden="true"
                >
                  i
                </span>
                Usernames only. Nobody can be found here by their email address.
              </p>
            </div>

            {term.trim().length >= 2 && (
              <ul className="border-t border-brand-100">
                {searching && <li className="px-4 py-3 text-sm text-brand-700">Searching...</li>}
                {!searching && results.length === 0 && (
                  <li className="px-4 py-3 text-sm text-ink-500">Nobody with a name like that.</li>
                )}
                {!searching &&
                  results.map((person) => (
                    <Person key={person.id} person={person} note={RELATION_LABEL[person.relation]}>
                      {person.relation === "none" && (
                        <button type="button" onClick={() => add(person)} disabled={busy === `add:${person.id}`} className="btn-primary px-3 py-1.5 text-xs">
                          {busy === `add:${person.id}` ? "Sending..." : "Add friend"}
                        </button>
                      )}
                      {person.relation === "awaiting-you" && (
                        <button type="button" onClick={() => accept(person)} disabled={busy === `accept:${person.id}`} className="btn-primary px-3 py-1.5 text-xs">
                          Accept
                        </button>
                      )}
                      {person.relation === "requested" && (
                        <button type="button" onClick={() => remove(person, "Request withdrawn.")} className="btn-ghost px-3 py-1.5 text-xs">
                          Cancel
                        </button>
                      )}
                      {person.relation === "friends" && (
                        <span className="text-xs font-bold text-emerald-700">✓ Friends</span>
                      )}
                    </Person>
                  ))}
              </ul>
            )}
          </SectionCard>

          {/* ---------------------------- your friends -------------------------- */}
          <SectionCard
            icon="friends"
            title="Your friends"
            count={data.friends.length}
            action={
              data.friends.length > 1 && (
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-500">
                  Sort by
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="rounded-lg border border-brand-200 bg-surface px-2 py-1 text-[11px] font-bold text-ink-900
                               focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    {Object.entries(SORTS).map(([key, option]) => (
                      <option key={key} value={key}>{option.label}</option>
                    ))}
                  </select>
                </label>
              )
            }
          >
            {data.friends.length === 0 ? (
              <EmptyState art={<InboxSpot className="h-20 w-auto" />} title="Nobody yet">
                Search above to send your first request. You need a friend before you can pair on a
                problem or send a duel.
              </EmptyState>
            ) : (
              <ul>
                {sortedFriends.map((friend) => (
                  <Person
                    key={friend.id}
                    person={friend}
                    note={`${friend.solved} solved · friends since ${relativeTime(friend.since)}`}
                  >
                    <Link
                      to="/pair"
                      className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-50"
                    >
                      Pair up
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(friend, `${friend.username} removed.`)}
                      disabled={busy === `remove:${friend.id}`}
                      className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-800 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </Person>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* ------------------------------ the inbox ----------------------------- */}
        <div className="space-y-4">
          <SectionCard icon="inbox" title="Requests for you" count={data.incoming.length}>
            {data.incoming.length === 0 ? (
              <EmptyState art={<InboxSpot className="h-[4.5rem] w-auto" />} title="Nothing waiting">
                When someone sends you a friend request, it will show up here.
              </EmptyState>
            ) : (
              <ul>
                {data.incoming.map((person) => (
                  <Person key={person.id} person={person} note={`asked ${relativeTime(person.sentAt)}`}>
                    <button type="button" onClick={() => accept(person)} disabled={busy === `accept:${person.id}`} className="btn-primary px-3 py-1.5 text-xs">
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(person, "Request declined.")}
                      disabled={busy === `remove:${person.id}`}
                      className="rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-ink-800 transition hover:bg-brand-50"
                    >
                      Decline
                    </button>
                  </Person>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard icon="outbox" title="Sent by you" count={data.outgoing.length}>
            {data.outgoing.length === 0 ? (
              <EmptyState art={<SentSpot className="h-[4.5rem] w-auto" />} title="None outstanding">
                Your sent friend requests will appear here until they are accepted or declined.
              </EmptyState>
            ) : (
              <ul>
                {data.outgoing.map((person) => (
                  <Person key={person.id} person={person} note={`sent ${relativeTime(person.sentAt)}`}>
                    <button
                      type="button"
                      onClick={() => remove(person, "Request withdrawn.")}
                      disabled={busy === `remove:${person.id}`}
                      className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-800 transition hover:bg-brand-50"
                    >
                      Cancel
                    </button>
                  </Person>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      {/* ------------------------------ what next ----------------------------- */}
      <section className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-100 via-brand-50 to-surface px-5 py-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-600 shadow-sm">
          <Icon name="bulb" className="h-5 w-5" />
        </span>
        <p className="min-w-[12rem] flex-1 text-sm">
          <span className="block font-bold text-ink-900">Friends make problem solving more fun</span>
          <span className="text-xs text-ink-500">
            Solve one file together in Pair Lab, or challenge them to a timed duel.
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/pair" className="btn-ghost px-4 py-2 text-sm">
            <Icon name="pair" className="h-4 w-4" /> Pair Lab
          </Link>
          <Link to="/arena" className="btn-primary px-4 py-2 text-sm">
            <Icon name="duel" className="h-4 w-4" /> Duel Arena →
          </Link>
        </div>
      </section>
    </main>
  );
}
