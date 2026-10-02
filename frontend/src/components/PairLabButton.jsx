import { useState } from "react";
import Icon from "./Icon";
import { useNavigate } from "react-router-dom";
import { authApi, errorMessage } from "../api";

/*
 * Starts a Pair Lab room for this problem, or reopens the one already going.
 *
 * Reusing an existing room matters more than it looks: pressing this twice
 * would otherwise leave a trail of near-identical rooms, and the friend you
 * invited would be sitting in the first one wondering where you are.
 */
export default function PairLabButton({ slug, language, code }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true);
    setError("");
    try {
      const { data } = await authApi.get("/rooms");
      const open = (data.rooms || []).find((room) => room.slug === slug);
      if (open) return navigate(`/rooms/${open.id}`);

      const { data: room } = await authApi.post("/rooms", { slug, language, document: code || "" });
      navigate(`/rooms/${room.id}`);
    } catch (err) {
      setError(errorMessage(err, "Could not open a room."));
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 px-3 py-1.5
                   text-xs font-bold text-brand-800 transition hover:bg-brand-50 disabled:opacity-60"
      >
        <Icon name="pair" className="h-4 w-4" />
        {busy ? "Opening..." : "Solve together"}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </>
  );
}
