import { useState } from "react";
import { compilerApi } from "../api";

/*
 * The AI complexity analyser: three figures, nothing else.
 *
 * Purple on purpose. Everything the judge reports was measured by running your
 * program. This is a language model reading your source and giving an opinion.
 * Those are different kinds of claim and the page should not dress them alike.
 *
 * The API key lives on the compiler service. This component posts code to our
 * own server, which adds the key and calls Google.
 */

const CASES = [
  { key: "best", label: "Best" },
  { key: "average", label: "Average" },
  { key: "worst", label: "Worst" },
];

function errorFor(err) {
  const payload = err?.response?.data;
  return {
    setup: payload?.error === "not_configured",
    message: payload?.message || err?.message || "Something went wrong.",
  };
}

export default function AiAnalysis({ language, code, available }) {
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleAnalyse() {
    setBusy(true);
    setError(null);
    setAnalysis(null);
    try {
      const { data } = await compilerApi.post("/analyse", { language, code });
      setAnalysis(data);
    } catch (err) {
      setError(errorFor(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-ai">
      <div className="card-ai-header">
        <span>Time complexity</span>
      </div>

      <div className="space-y-3 px-4 py-4">
        {analysis ? (
          <div className="grid grid-cols-3 gap-3">
            {CASES.map(({ key, label }) => (
              <div key={key} className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                  {label}
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-violet-900">{analysis[key]}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleAnalyse} disabled={busy || !available} className="btn-ai">
              {busy ? "Reading your code..." : "Analyse complexity"}
            </button>
            {!available && (
              <span className="text-xs text-violet-800">
                Needs a Gemini API key on the compiler service.
              </span>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3">
            <p className="text-sm text-ink-800">{error.message}</p>
            {error.setup && (
              <p className="mt-1 text-xs text-ink-800">
                Paste one from{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-violet-700 underline"
                >
                  aistudio.google.com/apikey
                </a>{" "}
                after <code className="font-mono">GEMINI_API_KEY=</code> in{" "}
                <code className="font-mono">compiler/.env</code>, then restart the compiler.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
