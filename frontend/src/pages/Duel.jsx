import { useCallback, useState } from "react";
import Icon from "../components/Icon";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authApi, errorMessage } from "../api";
import useDuel from "../useDuel";
import DuelLobby from "../components/DuelLobby";
import DuelLive from "../components/DuelLive";
import DuelResult from "../components/DuelResult";
import DuelCountdown from "../components/DuelCountdown";
import DuelChallengeCard from "../components/DuelChallengeCard";

/*
 * One duel, from challenge to result, at one URL.
 *
 * WHY IT IS NOT FOUR PAGES
 *
 * A duel moves through the lobby, the countdown, the match and the result on
 * its own, often while you are looking at it — the other person pressing ready
 * is not something this browser did. Separate routes would mean navigating
 * somebody's page for them every time their opponent acted, and the back
 * button would walk them into a screen that no longer exists.
 *
 * So the address is the duel, and what is drawn follows the duel's state,
 * which arrives over the socket. Refreshing at any moment lands in the right
 * place, and so does opening the link an hour later.
 *
 * WHAT DECIDES THE STATE
 *
 * The server, entirely. This component reads `duel.status` and, for the
 * countdown, compares the server's clock to `startedAt`. It never decides that
 * a duel has started or ended — it can only notice.
 */

export default function Duel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { duel, activity, status, error, refresh, report, serverNow, absorb } = useDuel(id);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const act = useCallback(
    async (route, then) => {
      setBusy(true);
      setNotice("");
      try {
        const { data } = await authApi.post(`/duels/${id}/${route}`);
        absorb(data);
        refresh();
        if (then) then(data);
      } catch (err) {
        setNotice(errorMessage(err, "That did not work."));
      } finally {
        setBusy(false);
      }
    },
    [id, absorb, refresh]
  );

  const answer = useCallback(
    async (accept) => {
      setBusy(true);
      setNotice("");
      try {
        const { data } = await authApi.post(`/duels/${id}/respond`, { accept });
        absorb(data);
        if (!accept) navigate("/arena");
      } catch (err) {
        setNotice(errorMessage(err, "Could not answer that challenge."));
      } finally {
        setBusy(false);
      }
    },
    [id, absorb, navigate]
  );

  /*
   * Ending early is confirmed, but by the page rather than window.confirm.
   *
   * A native dialog blocks the whole tab — including the clock and the socket
   * — which is the one thing that should never stop during a match. It also
   * cannot say what is actually at stake in a way anybody reads. The
   * confirmation lives in the End match button instead; see DuelLive.
   */
  const endMatch = useCallback(() => act("end"), [act]);

  const rematch = useCallback(async () => {
    if (!duel) return;
    setBusy(true);
    setNotice("");
    try {
      const them = duel.players.find((player) => !player.isYou);
      const { data } = await authApi.post("/duels", {
        mode: duel.mode,
        opponentId: them.id,
        language: duel.language,
        // A custom rematch is the same problems again, which is the point of
        // asking for one. A random rematch draws fresh problems, which is also
        // the point of asking for one.
        ...(duel.mode === "custom"
          ? {
              slugs: (duel.problems || []).map((problem) => problem.slug),
              durationMinutes: Math.round(duel.durationMs / 60000),
            }
          : {}),
      });
      navigate(`/duels/${data.id}`);
    } catch (err) {
      setNotice(errorMessage(err, "Could not start a rematch."));
      setBusy(false);
    }
  }, [duel, navigate]);

  if (error && !duel) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</p>
        <Link to="/arena" className="btn-ghost mt-6">
          Back to the arena
        </Link>
      </main>
    );
  }

  if (!duel) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center text-brand-700">
        Opening the duel...
      </main>
    );
  }

  const banner = notice && (
    <p className="mx-auto mt-4 max-w-3xl rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      {notice}
    </p>
  );

  /* ----------------------------- still a challenge ---------------------- */
  if (duel.status === "pending") {
    const mine = duel.challengerId === duel.players.find((player) => player.isYou)?.id;
    return (
      <main className="mx-auto max-w-lg px-4 pb-14 pt-6 sm:px-6">
        <Link to="/arena" className="text-sm font-bold text-brand-700 hover:text-brand-900">
          ← Duel Arena
        </Link>
        {banner}
        <div className="mt-3">
          <DuelChallengeCard
            duel={duel}
            direction={mine ? "outgoing" : "incoming"}
            busy={busy}
            onAccept={() => answer(true)}
            onDecline={() => answer(false)}
            onCancel={() => act("cancel", () => navigate("/arena"))}
          />
        </div>
      </main>
    );
  }

  /* --------------------------- called off, or gone ---------------------- */
  if (["declined", "cancelled", "expired"].includes(duel.status)) {
    const words = {
      declined: "That challenge was declined.",
      cancelled: "That duel was called off.",
      expired: "That challenge expired before it was answered.",
    }[duel.status];
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <Icon name="peace" className="mx-auto h-11 w-11 text-brand-500" strokeWidth={1.5} />
        <p className="mt-3 text-ink-800">{words}</p>
        <Link to="/arena" className="btn-primary mt-6">
          Back to the arena
        </Link>
      </main>
    );
  }

  /* -------------------------------- finished ---------------------------- */
  if (duel.status === "finished") {
    return (
      <>
        {banner}
        <DuelResult duel={duel} onRematch={rematch} rematching={busy} />
      </>
    );
  }

  /*
   * Live, but not started: the countdown.
   *
   * The lobby stays underneath rather than being replaced, so the three
   * seconds are a moment in the match rather than a separate screen that
   * flashes past. The problems are not in this payload yet either way — the
   * server withholds them until `startedAt` has genuinely passed.
   */
  const started = duel.startedAt ? new Date(duel.startedAt).getTime() <= serverNow() : false;

  if (duel.status === "live" && !started) {
    return (
      <>
        <DuelLobby duel={duel} onReady={() => act("ready")} onCancel={() => navigate("/arena")} busy />
        <DuelCountdown startedAt={duel.startedAt} serverNow={serverNow} onDone={refresh} />
      </>
    );
  }

  if (duel.status === "live") {
    /*
     * Started, but the statements have not arrived yet — the reveal and this
     * browser's copy of the duel are a few hundred milliseconds apart. A brief
     * honest message beats rendering an empty match.
     */
    if (!duel.problems || duel.problems.some((problem) => !problem.slug)) {
      return (
        <main className="mx-auto max-w-2xl px-6 py-24 text-center text-brand-700">
          <Icon name="duel" className="mx-auto h-11 w-11 text-brand-500" strokeWidth={1.5} />
          <p className="mt-3">Revealing the problems...</p>
          <button type="button" onClick={refresh} className="btn-ghost mt-5">
            Refresh
          </button>
        </main>
      );
    }
    return (
      <>
        {banner}
        {status === "reconnecting" && (
          <p className="bg-amber-50 py-1.5 text-center text-xs font-semibold text-amber-900">
            Reconnecting — your work is safe and the clock is still the server's.
          </p>
        )}
        <DuelLive
          duel={duel}
          activity={activity}
          serverNow={serverNow}
          onRefresh={refresh}
          onReport={report}
          onEnd={endMatch}
        />
      </>
    );
  }

  /* ------------------------------- the lobby ---------------------------- */
  return (
    <>
      {banner}
      <DuelLobby
        duel={duel}
        busy={busy}
        onReady={() => act("ready")}
        onCancel={() => act("cancel", () => navigate("/arena"))}
      />
    </>
  );
}
