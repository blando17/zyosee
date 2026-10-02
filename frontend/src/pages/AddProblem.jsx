import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi, errorMessage } from "../api";

/*
 * Authoring a problem.
 *
 * The form is long because a judge needs more than a statement: it needs a way
 * to decide whether an answer is right. The sections build up to that.
 *
 * The part worth understanding before reading the rest is the reference
 * solution. Constraints describe what an input may look like, and from them the
 * server can generate as many inputs as you like. Nothing in a constraint says
 * what the correct OUTPUT is, so generated inputs are run through a solution
 * you supply and whatever it prints becomes the expected output. That is also
 * why the examples you type are checked against it before anything is saved: if
 * the two disagree, one of them is wrong, and it is far better to hear that
 * here than from someone whose correct answer was marked wrong.
 */

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const LANGUAGES = [
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "py", label: "Python 3" },
  { value: "java", label: "Java" },
];

// The kinds of case the generator cannot invent for you, offered as labels so
// the important ones are not forgotten rather than as anything the server reads.
const CURATED_KINDS = [
  "Normal case",
  "Smallest allowed input",
  "Largest allowed input",
  "All duplicates",
  "Negative values",
  "Overflow risk",
  "Special case",
];

const EMPTY_EXAMPLE = { input: "", expected: "", note: "" };
const EMPTY_MANUAL = { label: CURATED_KINDS[0], input: "" };
const EMPTY_FIELD = { name: "", type: "int", min: 1, max: 1000, scales: false };

function Section({ title, hint, children, tone = "brand" }) {
  const ring = tone === "violet" ? "border-violet-200" : "border-brand-200";
  return (
    <section className={`rounded-2xl border ${ring} bg-surface p-5 shadow-sm sm:p-6`}>
      <h2 className="text-lg font-bold text-ink-900">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-ink-600">{hint}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function RowActions({ onRemove, disabled, label = "Remove" }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      disabled={disabled}
      className="text-xs font-semibold text-brand-700 hover:text-brand-900 disabled:cursor-not-allowed disabled:text-ink-400"
    >
      {label}
    </button>
  );
}

export default function AddProblem() {
  const [form, setForm] = useState({
    title: "",
    difficulty: "Easy",
    tags: "",
    timeLimitMs: 2000,
    statement: "",
    inputFormat: "",
    outputFormat: "",
    constraints: "",
    hint: "",
  });
  const [examples, setExamples] = useState([{ ...EMPTY_EXAMPLE }, { ...EMPTY_EXAMPLE }]);
  const [manualTests, setManualTests] = useState([{ ...EMPTY_MANUAL }]);
  const [reference, setReference] = useState({ language: "cpp", code: "" });
  const [generator, setGenerator] = useState({ seed: 20260922, cases: 8, fields: [] });

  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [disagreements, setDisagreements] = useState([]);
  const [preview, setPreview] = useState(null);
  const [created, setCreated] = useState(null);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const constraintLines = form.constraints.split("\n").map((l) => l.trim()).filter(Boolean);

  function patchList(setter, index, patch) {
    setter((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function suggestSpec() {
    setError("");
    setBusy("suggest");
    try {
      const { data } = await authApi.post("/admin/problems/suggest-spec", {
        constraints: constraintLines,
      });
      // Fields only. Reading the constraints should not undo a seed or a case
      // count already chosen, which is what merging the whole suggestion did.
      setGenerator((prev) => ({ ...prev, fields: data.fields || [] }));
      if (!data.fields?.length) {
        setError(
          "Nothing could be read from those constraints. Lines shaped like " +
            '"1 <= n <= 200000" are understood; anything in prose has to be filled in by hand.'
        );
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function previewTests() {
    setError("");
    setPreview(null);
    setBusy("preview");
    try {
      const { data } = await authApi.post("/admin/problems/preview-tests", { generator });
      setPreview(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy("");
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setDisagreements([]);
    setCreated(null);
    setBusy("save");
    try {
      const { data } = await authApi.post("/admin/problems", {
        title: form.title,
        difficulty: form.difficulty,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        timeLimitMs: Number(form.timeLimitMs),
        statement: form.statement,
        inputFormat: form.inputFormat,
        outputFormat: form.outputFormat,
        constraints: constraintLines,
        hint: form.hint,
        examples,
        manualTests,
        referenceSolution: reference,
        generator: generator.fields.length ? generator : null,
      });
      setCreated(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(errorMessage(err));
      setDisagreements(err?.response?.data?.disagreements || []);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy("");
    }
  }

  if (created) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="card text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Saved</p>
          <h1 className="mt-2 text-3xl font-bold text-ink-900">{created.title}</h1>
          <p className="mt-3 text-ink-700">
            {created.testCount} test cases built: {created.samples} shown as examples,{" "}
            {created.manual} curated, {created.generated} generated.{" "}
            {(created.bytes / 1024 / 1024).toFixed(2)} MB of test data written.
          </p>
          {/* Measured from the reference solution rather than typed, so it is
              worth showing: it is the ceiling every submission is held to. */}
          <p className="mt-2 text-sm text-ink-600">
            Largest correct answer: {(created.largestOutputBytes / 1024).toFixed(1)} KB.
            Submissions may print up to {(created.outputLimitBytes / 1024).toFixed(0)} KB.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={`/problems/${created.slug}`} className="btn-primary">
              Open the problem
            </Link>
            <button type="button" onClick={() => window.location.reload()} className="btn-ghost">
              Add another
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          Add a problem
        </h1>
        <p className="mt-2 max-w-3xl text-ink-700">
          The statement is for the solver. The reference solution and constraints are for the
          judge: together they decide what every submission is measured against.
        </p>
      </header>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">{error}</p>
          {disagreements.length ? (
            <ul className="mt-3 space-y-2 text-sm text-red-900">
              {disagreements.map((d) => (
                <li key={d.label} className="rounded-lg bg-surface/70 p-3">
                  <span className="font-semibold">{d.label}</span>
                  <div className="mt-1 grid gap-1 sm:grid-cols-2">
                    <div>
                      <span className="text-xs uppercase text-red-700">You typed</span>
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs">{d.youWrote}</pre>
                    </div>
                    <div>
                      <span className="text-xs uppercase text-red-700">Reference printed</span>
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs">{d.referencePrinted}</pre>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={submit} className="space-y-6">
        <Section title="Question" hint="How the problem appears in the list.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="title">Question</label>
              <input id="title" className="field" value={form.title} onChange={set("title")}
                placeholder="Two Sum" required />
            </div>
            <div>
              <label className="label" htmlFor="difficulty">Difficulty</label>
              <select id="difficulty" className="field" value={form.difficulty} onChange={set("difficulty")}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="tags">Related topics</label>
              <input id="tags" className="field" value={form.tags} onChange={set("tags")}
                placeholder="array, hash map" />
              <p className="mt-1 text-xs text-ink-500">Separated by commas. Shown under the title.</p>
            </div>
            <div>
              <label className="label" htmlFor="timeLimitMs">Time limit (ms)</label>
              <input id="timeLimitMs" type="number" className="field" value={form.timeLimitMs}
                onChange={set("timeLimitMs")} min={200} max={15000} step={100} />
              <p className="mt-1 text-xs text-ink-500">
                For C and C++. Python gets 3x and Java 2x automatically.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Description" hint="What the solver reads.">
          <div>
            <label className="label" htmlFor="statement">Description</label>
            <textarea id="statement" className="field min-h-[9rem] resize-y" value={form.statement}
              onChange={set("statement")} required
              placeholder="You are given an array of n integers and a target value…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="inputFormat">Input format</label>
              <textarea id="inputFormat" className="field min-h-[6rem] resize-y" value={form.inputFormat}
                onChange={set("inputFormat")} required
                placeholder={"Line 1: the integer n.\nLine 2: n integers."} />
            </div>
            <div>
              <label className="label" htmlFor="outputFormat">Output format</label>
              <textarea id="outputFormat" className="field min-h-[6rem] resize-y" value={form.outputFormat}
                onChange={set("outputFormat")} required
                placeholder="One line holding the two positions." />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="constraints">Constraints</label>
            <textarea id="constraints" className="field min-h-[6rem] resize-y font-mono text-sm"
              value={form.constraints} onChange={set("constraints")} required
              placeholder={"2 <= n <= 200000\n-1000000000 <= a[i] <= 1000000000"} />
            <p className="mt-1 text-xs text-ink-500">
              One per line. Lines shaped like <code>2 &lt;= n &lt;= 200000</code> can also be read
              by the generator below; anything else is shown to the solver but not understood.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="hint">Hint (optional)</label>
            <input id="hint" className="field" value={form.hint} onChange={set("hint")}
              placeholder="A single pass with a hash map is enough." />
          </div>
        </Section>

        <Section
          title="Examples"
          hint="Shown in the statement, and the only test cases a solver ever sees. Two are required."
        >
          {examples.map((example, index) => (
            <div key={index} className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-brand-800">Example {index + 1}</span>
                <RowActions
                  onRemove={() => setExamples((prev) => prev.filter((_, i) => i !== index))}
                  disabled={examples.length <= 2}
                  label={examples.length <= 2 ? "Required" : "Remove"}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Input</label>
                  <textarea className="field min-h-[5rem] resize-y font-mono text-sm"
                    value={example.input}
                    onChange={(e) => patchList(setExamples, index, { input: e.target.value })} />
                </div>
                <div>
                  <label className="label">Expected output</label>
                  <textarea className="field min-h-[5rem] resize-y font-mono text-sm"
                    value={example.expected}
                    onChange={(e) => patchList(setExamples, index, { expected: e.target.value })} />
                </div>
              </div>
              <div className="mt-3">
                <label className="label">Explanation (optional)</label>
                <input className="field" value={example.note}
                  onChange={(e) => patchList(setExamples, index, { note: e.target.value })}
                  placeholder="The values at positions 0 and 1 are 2 and 7, and 2 + 7 is 9." />
              </div>
            </div>
          ))}
          <button type="button" className="btn-ghost"
            onClick={() => setExamples((prev) => [...prev, { ...EMPTY_EXAMPLE }])}>
            Add example
          </button>
        </Section>

        <Section
          title="Reference solution"
          hint="A solution you trust. It produces the expected output for every generated and curated case, so it decides what correct means."
        >
          <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
            <div>
              <label className="label" htmlFor="refLang">Language</label>
              <select id="refLang" className="field" value={reference.language}
                onChange={(e) => setReference((p) => ({ ...p, language: e.target.value }))}>
                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="refCode">Code</label>
              <textarea id="refCode" className="field min-h-[12rem] resize-y font-mono text-sm"
                value={reference.code} required
                onChange={(e) => setReference((p) => ({ ...p, code: e.target.value }))}
                placeholder="#include <bits/stdc++.h>&#10;using namespace std;&#10;int main() { … }" />
            </div>
          </div>
        </Section>

        <Section
          title="Curated test cases"
          hint="The cases a generator cannot think of. Type the input only; the reference solution supplies the expected output."
        >
          {manualTests.map((test, index) => (
            <div key={index} className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <select className="field max-w-[16rem] py-1.5 text-sm" value={test.label}
                  onChange={(e) => patchList(setManualTests, index, { label: e.target.value })}>
                  {CURATED_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <RowActions onRemove={() => setManualTests((prev) => prev.filter((_, i) => i !== index))} />
              </div>
              <textarea className="field min-h-[5rem] resize-y font-mono text-sm" value={test.input}
                onChange={(e) => patchList(setManualTests, index, { input: e.target.value })}
                placeholder={"2\n1000000000 1000000000"} />
            </div>
          ))}
          <button type="button" className="btn-ghost"
            onClick={() => setManualTests((prev) => [...prev, { ...EMPTY_MANUAL }])}>
            Add curated case
          </button>
        </Section>

        <Section
          title="Generated test cases"
          hint="Built from the input shape below, climbing in size so a slow solution fails on the later ones. Same seed, same tests, every time."
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-28">
              <label className="label" htmlFor="seed">Seed</label>
              <input id="seed" type="number" className="field" value={generator.seed}
                onChange={(e) => setGenerator((p) => ({ ...p, seed: Number(e.target.value) }))} />
            </div>
            <div className="w-28">
              <label className="label" htmlFor="cases">Cases</label>
              <input id="cases" type="number" min={0} max={50} className="field" value={generator.cases}
                onChange={(e) => setGenerator((p) => ({ ...p, cases: Number(e.target.value) }))} />
            </div>
            <button type="button" className="btn-ghost" onClick={suggestSpec}
              disabled={busy === "suggest" || !constraintLines.length}>
              {busy === "suggest" ? "Reading…" : "Read from constraints"}
            </button>
            <button type="button" className="btn-ghost" onClick={previewTests}
              disabled={busy === "preview" || !generator.fields.length}>
              {busy === "preview" ? "Building…" : "Preview inputs"}
            </button>
          </div>

          {generator.fields.map((field, index) => (
            <div key={index} className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-brand-800">Field {index + 1}</span>
                <RowActions
                  onRemove={() =>
                    setGenerator((p) => ({ ...p, fields: p.fields.filter((_, i) => i !== index) }))
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="label">Name</label>
                  <input className="field font-mono text-sm" value={field.name}
                    onChange={(e) =>
                      setGenerator((p) => ({
                        ...p,
                        fields: p.fields.map((f, i) => (i === index ? { ...f, name: e.target.value } : f)),
                      }))
                    } placeholder="n" />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="field" value={field.type}
                    onChange={(e) =>
                      setGenerator((p) => ({
                        ...p,
                        fields: p.fields.map((f, i) => (i === index ? { ...f, type: e.target.value } : f)),
                      }))
                    }>
                    <option value="int">Single integer</option>
                    <option value="intArray">Array of integers</option>
                    <option value="sumOfK">Sum of k array values</option>
                  </select>
                </div>
                {field.type === "sumOfK" ? (
                  <>
                    <div>
                      <label className="label">From array</label>
                      <input className="field font-mono text-sm" value={field.from || ""}
                        onChange={(e) =>
                          setGenerator((p) => ({
                            ...p,
                            fields: p.fields.map((f, i) => (i === index ? { ...f, from: e.target.value } : f)),
                          }))
                        } placeholder="a" />
                    </div>
                    <div>
                      <label className="label">k</label>
                      <input type="number" min={1} max={5} className="field" value={field.k || 2}
                        onChange={(e) =>
                          setGenerator((p) => ({
                            ...p,
                            fields: p.fields.map((f, i) => (i === index ? { ...f, k: Number(e.target.value) } : f)),
                          }))
                        } />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="label">Min</label>
                      <input type="number" className="field" value={field.min ?? 0}
                        onChange={(e) =>
                          setGenerator((p) => ({
                            ...p,
                            fields: p.fields.map((f, i) => (i === index ? { ...f, min: Number(e.target.value) } : f)),
                          }))
                        } />
                    </div>
                    <div>
                      <label className="label">Max</label>
                      <input type="number" className="field" value={field.max ?? 0}
                        onChange={(e) =>
                          setGenerator((p) => ({
                            ...p,
                            fields: p.fields.map((f, i) => (i === index ? { ...f, max: Number(e.target.value) } : f)),
                          }))
                        } />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-700">
                {field.type === "int" ? (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={Boolean(field.scales)}
                      onChange={(e) =>
                        setGenerator((p) => ({
                          ...p,
                          fields: p.fields.map((f, i) => (i === index ? { ...f, scales: e.target.checked } : f)),
                        }))
                      } />
                    Grow across cases (this is the size)
                  </label>
                ) : null}
                {field.type === "intArray" ? (
                  <>
                    <label className="flex items-center gap-2">
                      Length
                      <input className="field w-24 py-1 font-mono text-sm" value={field.length ?? ""}
                        onChange={(e) =>
                          setGenerator((p) => ({
                            ...p,
                            fields: p.fields.map((f, i) => (i === index ? { ...f, length: e.target.value } : f)),
                          }))
                        } placeholder="n" />
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={Boolean(field.distinct)}
                        onChange={(e) =>
                          setGenerator((p) => ({
                            ...p,
                            fields: p.fields.map((f, i) => (i === index ? { ...f, distinct: e.target.checked } : f)),
                          }))
                        } />
                      All different
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={Boolean(field.sorted)}
                        onChange={(e) =>
                          setGenerator((p) => ({
                            ...p,
                            fields: p.fields.map((f, i) => (i === index ? { ...f, sorted: e.target.checked } : f)),
                          }))
                        } />
                      Sorted
                    </label>
                  </>
                ) : null}
              </div>
            </div>
          ))}

          <button type="button" className="btn-ghost"
            onClick={() => setGenerator((p) => ({ ...p, fields: [...p.fields, { ...EMPTY_FIELD }] }))}>
            Add field
          </button>

          {preview ? (
            <div className="rounded-xl border border-brand-300 bg-surface p-4">
              <p className="text-sm font-semibold text-brand-800">
                {preview.count} inputs, {(preview.totalBytes / 1024 / 1024).toFixed(2)} MB in total.
                Nothing has been saved.
              </p>
              <div className="mt-3 max-h-64 space-y-2 overflow-auto">
                {preview.cases.map((c) => (
                  <details key={c.index} className="rounded-lg bg-brand-50 p-2">
                    <summary className="cursor-pointer text-sm font-medium text-ink-800">
                      Case {c.index} · {c.bytes.toLocaleString()} bytes
                    </summary>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-ink-700">
                      {c.preview}
                    </pre>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </Section>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn-primary" disabled={busy === "save"}>
            {busy === "save" ? "Building test cases…" : "Save problem"}
          </button>
          <p className="text-sm text-ink-600">
            Saving compiles your reference solution and runs it once per test case, so a large
            problem takes a few seconds.
          </p>
        </div>
      </form>
    </main>
  );
}
