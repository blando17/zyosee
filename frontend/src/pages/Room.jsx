import { useCallback, useEffect, useState } from "react";
import Icon from "../components/Icon";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authApi, compilerApi, errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import CodeEditor, { EDITOR_LINE_HEIGHT, EDITOR_PADDING, LANGUAGE_OPTIONS } from "../components/CodeEditor";
import Avatar from "../components/Avatar";
import useRoom from "../useRoom";
import RoomChat from "../components/RoomChat";
import ProblemDetail from "../components/ProblemDetail";
import RoomJudge from "../components/RoomJudge";

/*
 * Pair Lab: one problem, one document, two or more people.
 *
 * The page is deliberately thin. Everything about staying in step — the
 * socket, the shared text, who is present and where their cursor is — lives in
 * useRoom; this draws it.
 */

const TEXTAREA_ID = "pair-lab-editor";

const STATUS_TEXT = {
  connecting: { label: "Connecting...", dot: "bg-amber-400" },
  live: { label: "Synced", dot: "bg-emerald-500" },
  reconnecting: { label: "Reconnecting...", dot: "bg-amber-400" },
  denied: { label: "No access", dot: "bg-red-500" },
};

/*
 * Every cursor in the room, drawn over the code.
 *
 * Absolutely positioned inside the editor's scrolling box, so a marker stays
 * on its line as the code scrolls rather than hovering over a fixed frame.
 * The line height is imported from the editor rather than guessed, which is
 * why it is pinned there.
 *
 * Your own line is tinted too, fainter and without a name tag. You already
 * have a real caret, so the tint is not there to tell you where you are — it
 * is there so the colour you are in this room is never in doubt when you look
 * at somebody else's.
 */
function Cursors({ members, meId, myLine }) {
  const marks = members
    .filter((member) => member.id !== meId && member.line)
    .map((member) => ({ ...member, mine: false }));

  const me = members.find((member) => member.id === meId);
  if (me && myLine) marks.push({ ...me, line: myLine, mine: true });

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      {marks.map((mark) => (
        <div
          key={mark.mine ? "me" : mark.id}
          className="absolute left-0 right-0 transition-[top] duration-150"
          style={{ top: EDITOR_PADDING + (mark.line - 1) * EDITOR_LINE_HEIGHT }}
        >
          <div
            className="h-[20px] w-full"
            style={{
              backgroundColor: `${mark.colour}${mark.mine ? "14" : "24"}`,
              borderLeft: `3px solid ${mark.colour}`,
            }}
          />
          {!mark.mine && (
            <span
              className="absolute right-2 -top-[2px] rounded px-1.5 py-[1px] text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: mark.colour }}
            >
              {mark.username}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [problem, setProblem] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [friends, setFriends] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState("");
  const [myLine, setMyLine] = useState(null);

  const { status, error, document: code, members, me, language, chat, lastResult, edit, reportLine, say, shareResult, changeLanguage } =
    useRoom(id, { username: user?.username, textareaId: TEXTAREA_ID });

  const loadRoom = useCallback(async () => {
    try {
      const { data } = await authApi.get(`/rooms/${id}`);
      setRoom(data);
      const { data: p } = await compilerApi.get(`/problems/${data.slug}`);
      setProblem(p);
    } catch (err) {
      setLoadError(errorMessage(err, "That room is not available."));
    }
  }, [id]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    authApi
      .get("/friends")
      .then(({ data }) => setFriends(data.friends || []))
      .catch(() => {});
  }, []);

  async function invite(friend) {
    setNotice("");
    try {
      const { data } = await authApi.post(`/rooms/${id}/invite`, { userId: friend.id });
      setRoom(data);
      setNotice(`${friend.username} can now join.`);
      setInviting(false);
    } catch (err) {
      setNotice(errorMessage(err, "Could not invite them."));
    }
  }

  async function leave() {
    try {
      await authApi.post(`/rooms/${id}/leave`);
    } catch (err) {
      // Leaving a room that has already gone is not a failure worth blocking on.
    }
    navigate(problem ? `/problems/${problem.slug}` : "/problems");
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{loadError}</p>
        <Link to="/problems" className="btn-ghost mt-6">Back to problems</Link>
      </main>
    );
  }

  if (!room || !problem) {
    return <main className="mx-auto max-w-2xl px-6 py-24 text-center text-brand-700">Opening the room...</main>;
  }

  const state = STATUS_TEXT[status] || STATUS_TEXT.connecting;
  const alreadyIn = new Set(room.members.map((member) => member.id));
  const invitable = friends.filter((friend) => !alreadyIn.has(friend.id));

  return (
    <main className="mx-auto max-w-[110rem] px-4 pb-10 pt-5 sm:px-6">
      <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-100 via-brand-50 to-surface px-5 py-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-600 shadow-sm">
          <Icon name="pair" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-extrabold text-ink-900">Pair Lab</h1>
          <p className="truncate text-xs text-ink-500">Solve together, learn together.</p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-bold text-ink-800 ring-1 ring-brand-200">
          <span className={`h-2 w-2 rounded-full ${state.dot}`} aria-hidden="true" />
          {state.label}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* Who is here, in their room colour. */}
          <div className="flex items-center -space-x-2">
            {members.map((member) => (
              <span
                key={member.id}
                title={`${member.username}${member.line ? ` — line ${member.line}` : ""}`}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white font-display text-xs font-extrabold text-white"
                style={{ backgroundColor: member.colour }}
              >
                {(member.username || "?").charAt(0).toUpperCase()}
              </span>
            ))}
          </div>

          <div className="relative">
            <button type="button" onClick={() => setInviting((open) => !open)} className="btn-ghost px-3 py-1.5 text-sm">
              Invite
            </button>
            {inviting && (
              <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-brand-200 bg-surface p-2 shadow-lg">
                <p className="px-2 pb-1 text-xs font-bold text-ink-500">Invite a friend</p>
                {invitable.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-ink-500">
                    {friends.length === 0 ? (
                      <>No friends yet. <Link to="/friends" className="font-bold text-brand-700">Add one</Link>.</>
                    ) : (
                      "Everyone you know is already here."
                    )}
                  </p>
                ) : (
                  <ul>
                    {invitable.map((friend) => (
                      <li key={friend.id}>
                        <button
                          type="button"
                          onClick={() => invite(friend)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-brand-50"
                        >
                          <Avatar name={friend.username} size="h-7 w-7" className="text-[11px]" />
                          <span className="truncate font-medium text-ink-900">{friend.username}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={leave}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            Leave room
          </button>
        </div>
      </header>

      {(error || notice) && (
        <p className={`mt-3 rounded-lg px-4 py-2.5 text-sm ${error ? "bg-red-50 text-red-700" : "bg-brand-100 text-brand-900"}`}>
          {error || notice}
        </p>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)_21rem]">
        <section className="card max-h-[78vh] overflow-y-auto">
          <ProblemDetail problem={problem} />
        </section>

        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-brand-200 bg-surface shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-brand-100 px-4 py-2.5">
            <select
              value={language}
              onChange={(event) => changeLanguage(event.target.value)}
              className="rounded-lg border border-brand-200 bg-surface px-2.5 py-1.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              aria-label="Language for everyone in the room"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <ul className="flex flex-wrap items-center gap-3 text-xs">
              {members.map((member) => (
                <li key={member.id} className="inline-flex items-center gap-1.5 font-semibold text-ink-800">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: member.colour }} aria-hidden="true" />
                  {member.username}
                  {member.id === me?.id && <span className="text-ink-500">(you)</span>}
                  {member.line && <span className="text-ink-500">ln {member.line}</span>}
                </li>
              ))}
            </ul>
          </div>

          <CodeEditor
            value={code}
            onChange={edit}
            language={language}
            height="62vh"
            textareaId={TEXTAREA_ID}
            onCaretLine={(line) => {
              setMyLine(line);
              reportLine(line);
            }}
            overlay={<Cursors members={members} meId={me?.id} myLine={myLine} />}
          />

          <RoomJudge
            slug={problem.slug}
            language={language}
            code={code}
            samples={problem.samples}
            me={me}
            lastResult={lastResult}
            onResult={shareResult}
          />
        </section>

        <section className="flex max-h-[78vh] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-brand-200 bg-surface shadow-sm">
          <div className="flex items-center gap-2 border-b border-brand-100 px-4 py-2.5">
            <Icon name="chat" className="h-4 w-4 text-brand-700" />
            <h2 className="text-sm font-extrabold text-ink-900">Chat</h2>
            <span className="ml-auto text-xs text-ink-500">
              {members.length} here
            </span>
          </div>
          <RoomChat chat={chat} me={me} onSay={say} disabled={status !== "live"} />
        </section>
      </div>
    </main>
  );
}
