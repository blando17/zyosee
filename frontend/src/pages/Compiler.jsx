import { useState } from "react";
import CodeEditor, { LANGUAGE_OPTIONS } from "../components/CodeEditor";
import VerdictBadge from "../components/Verdict";
import { compilerApi, errorMessage } from "../api";
// Shared with the problem page, so there is one place boilerplate lives.
import { COMPILER_STARTERS as STARTERS } from "../starters";


export default function Compiler() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(STARTERS.cpp);
  const [input, setInput] = useState("2 3");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  // Switching language swaps in that language's starter, but only when the
  // editor still holds an untouched starter. Nobody wants their work erased.
  function handleLanguageChange(event) {
    const next = event.target.value;
    const untouched = Object.values(STARTERS).includes(code.trim());
    setLanguage(next);
    if (untouched) setCode(STARTERS[next]);
  }

  async function handleRun() {
    setBusy(true);
    setResult(null);
    try {
      const { data } = await compilerApi.post("/run", { language, code, input });
      setResult(data);
    } catch (err) {
      setResult({ verdict: "server_error", message: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  const verdict = result?.verdict || null;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Compiler</h1>
          <p className="text-sm text-ink-800">
            Nothing here is saved. Code is compiled, run, then deleted.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="field w-40"
            aria-label="Language"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button onClick={handleRun} disabled={busy} className="btn-primary">
            {busy ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="card p-0 overflow-hidden">
          <h2 className="border-b border-brand-200 bg-brand-100 px-4 py-2.5 text-sm font-bold text-brand-800">
            Source
          </h2>
          <CodeEditor value={code} onChange={setCode} language={language} height="420px" />
        </section>

        <div className="flex flex-col gap-6">
          <section className="card p-0 overflow-hidden">
            <h2 className="border-b border-brand-200 bg-brand-100 px-4 py-2.5 text-sm font-bold text-brand-800">
              Input
            </h2>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Whatever your program reads from standard input"
              className="h-32 w-full resize-none border-0 px-4 py-3 font-mono text-sm focus:outline-none"
            />
          </section>

          <section className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-brand-200 bg-brand-100 px-4 py-2">
              <h2 className="text-sm font-bold text-brand-800">Output</h2>
              {verdict && (
                <div className="flex items-center gap-2">
                  {typeof result.runMs === "number" && (
                    // Compile time is shown apart from run time, and quietly,
                    // because it says nothing about the program. A hello-world
                    // in C++ spends roughly 250 ms in the compiler and under a
                    // millisecond running.
                    <span className="text-xs text-brand-800">
                      <span className="font-semibold">{result.runMs} ms</span> run
                      {typeof result.compileMs === "number" && result.compileMs > 0 && (
                        <span className="text-brand-800/60"> · {result.compileMs} ms compile</span>
                      )}
                    </span>
                  )}
                  <VerdictBadge verdict={verdict} />
                </div>
              )}
            </div>

            <pre className="h-56 overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-sm text-ink-900">
              {!result && "Press Run to see the output."}
              {result?.verdict === "success" && (result.output || "(no output)")}
              {result && result.verdict !== "success" && result.message}
            </pre>

            {result?.compilerWarnings && (
              <div className="border-t border-brand-200 bg-amber-50 px-4 py-3">
                <p className="mb-1 text-xs font-bold text-amber-900">Compiler warnings</p>
                <pre className="whitespace-pre-wrap font-mono text-xs text-amber-900">
                  {result.compilerWarnings}
                </pre>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
