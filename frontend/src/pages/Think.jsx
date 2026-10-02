import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../components/Icon";
import { Link, useNavigate, useParams } from "react-router-dom";
import { compilerApi, errorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import ThinkingBoard from "../components/ThinkingBoard";
import ThinkMark from "../components/ThinkMark";
import { EMPTY_PLAN, pushThink, reconcileThink, saveThink } from "../thinkStore";

/*
 * Thinking mode: a board to sketch on and a plan to fill in, before the editor.
 *
 * A few decisions worth recording, because they are the difference between
 * this being useful and being a step people click past.
 *
 * It is a page, not a modal. Thinking about a problem is a mode you are in for
 * several minutes, and it deserves a URL: the back button works, it can be
 * left open in a tab, and returning to it later is a link rather than a hunt.
 *
 * The problem statement is here, on a tab beside the plan. You cannot plan
 * something you cannot re-read, and sending somebody back and forth between
 * two pages to check the input format is exactly the friction that would make
 * them stop bothering.
 *
 * Nothing is required. There is no validation on the plan and no gate on the
 * way out — "Start coding" is always available. A tool that makes you fill in
 * boxes before it lets you work gets clicked through, not used.
 *
 * Nothing here reveals the answer. The hint and the editorial both live on the
 * problem page and neither is shown, which is the whole point: this is for
 * your thinking, not for being told.
 */

const COMPLEXITIES = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n^2)", "O(n^3)", "O(2^n)", "O(n!)", "O(h)", "O(m + n)"];

const SAVE_DELAY_MS = 600;

const DIFFICULTY_TINT = {
  Easy: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-900 ring-amber-200",
  Hard: "bg-rose-50 text-rose-800 ring-rose-200",
};

function Field({ label, icon, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-ink-900">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <Icon name={icon} className="h-3.5 w-3.5" />
        </span>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 pl-8 text-[11px] text-ink-500">{hint}</p>}
    </div>
  );
}

/* A titled panel, so the board and the plan read as two halves of one page. */
function PanelHeading({ icon, title, tint, children }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-brand-700 ${tint}`}>
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <h2 className="text-sm font-bold text-ink-900">{title}</h2>
      {children}
    </div>
  );
}

export default function Think() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?._id;

  const [problem, setProblem] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("plan");

  const [items, setItems] = useState([]);
  const [plan, setPlan] = useState(EMPTY_PLAN);
  const [saved, setSaved] = useState(true);
  const [synced, setSynced] = useState(false);
  const [storageWarning, setStorageWarning] = useState("");
  const [ready, setReady] = useState(false);

  const saveTimer = useRef(null);
  const signedIn = Boolean(user);

  useEffect(() => {
    compilerApi
      .get(`/problems/${slug}`)
      .then(({ data }) => setProblem(data))
      .catch((err) => setLoadError(errorMessage(err, "Could not load that problem.")));
  }, [slug]);

  /*
   * Loaded once the identity is known, and re-loaded if it changes.
   *
   * `ready` guards the autosave below: without it the first render would save
   * an empty board over whatever was stored, before the load had run.
   */
  useEffect(() => {
    let live = true;
    setReady(false);
    reconcileThink(userId, slug, { signedIn }).then((outcome) => {
      if (!live) return;
      setItems(outcome.state.items);
      setPlan(outcome.state.plan);
      setSynced(Boolean(outcome.synced));
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [userId, slug, signedIn]);

  /*
   * Autosave, a beat after the last change rather than on every stroke.
   *
   * The browser's copy is written first and synchronously, so the work is safe
   * before the network is involved at all. The account's copy follows; if that
   * fails the board is still saved, and the label says "in this browser"
   * rather than claiming a sync that did not happen.
   */
  useEffect(() => {
    if (!ready) return;
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const stamp = new Date().toISOString();
      const failure = saveThink(userId, slug, { items, plan }, stamp);
      setStorageWarning(failure || "");
      setSaved(!failure);

      if (!signedIn) return;
      try {
        await pushThink(slug, { items, plan, updatedAt: stamp });
        setSynced(true);
      } catch (err) {
        setSynced(false);
        // 413 is the one worth saying out loud: the board is too big to store
        // on the account, and no amount of waiting will change that.
        if (err?.response?.status === 413) {
          setStorageWarning(err.response.data?.message || "That board is too large to save to your account.");
        }
      }
    }, SAVE_DELAY_MS);
    return () => clearTimeout(saveTimer.current);
  }, [items, plan, ready, userId, slug, signedIn]);

  // Nothing is lost by leaving, but it is worth writing before the tab closes.
  useEffect(() => {
    function flush() {
      if (ready) saveThink(userId, slug, { items, plan });
    }
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [items, plan, ready, userId, slug]);

  const setField = (name) => (event) => setPlan((p) => ({ ...p, [name]: event.target.value }));

  const samples = useMemo(() => problem?.samples || [], [problem]);

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{loadError}</p>
        <Link to="/problems" className="btn-ghost mt-6">Back to problems</Link>
      </main>
    );
  }

  if (!problem) {
    return <main className="mx-auto max-w-2xl px-6 py-24 text-center text-brand-700">Loading...</main>;
  }

  return (
    <main className="mx-auto max-w-[105rem] px-4 pb-10 pt-6 sm:px-6">
      <header className="flex flex-wrap items-center gap-3">
        <Link
          to={`/problems/${slug}`}
          className="rounded-lg border border-brand-200 bg-surface px-2.5 py-1.5 text-brand-800 transition hover:bg-brand-50"
          aria-label="Back to the problem"
          title="Back to the problem"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </Link>

        <h1 className="text-xl font-extrabold text-ink-900">{problem.title}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${DIFFICULTY_TINT[problem.difficulty] || "bg-brand-50 text-brand-800 ring-brand-200"}`}>
          {problem.difficulty}
        </span>

        <span className="ml-auto inline-flex items-center gap-1.5 border-b-2 border-brand-400 pb-0.5 text-xs font-extrabold uppercase tracking-wider text-brand-800">
          <Icon name="bulb" className="h-4 w-4" /> Think first
        </span>

        <button type="button" onClick={() => navigate(`/problems/${slug}`)} className="btn-primary">
          Start coding
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </header>

      {/*
        The banner. Kept short on purpose: every pixel it takes is a pixel off
        the board, which is the thing people came here to use. It sets the tone
        and then gets out of the way.
      */}
      <section className="relative mt-4 overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-100 via-brand-50 to-surface px-5 py-5 sm:px-7">
        {/* Soft shapes behind the text, clipped by the rounded corner. */}
        <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-200/40 blur-2xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-rose-200/30 blur-2xl" />

        <div className="relative flex flex-wrap items-center gap-x-6 gap-y-4">
          <ThinkMark className="h-20 w-20 shrink-0 drop-shadow-sm" />

          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">
              <span className="text-brand-600">Think</span> before you code
            </h2>
            <p className="mt-1 text-sm font-medium text-ink-800">
              Never mind the syntax. Work out the algorithm first.
            </p>
            <p className="text-xs text-ink-500">
              A few minutes of good thinking saves a long argument with the compiler.
            </p>
          </div>

          <figure className="relative max-w-xs rounded-2xl border border-brand-200/80 bg-surface/70 px-4 py-3 backdrop-blur-sm">
            <span aria-hidden="true" className="absolute -left-1 -top-3 font-display text-4xl leading-none text-brand-300">
              &ldquo;
            </span>
            <blockquote className="pl-3 text-sm font-semibold leading-snug text-ink-900">
              Good developers write code.<br />Great developers think first.
            </blockquote>
            <figcaption className="mt-1 pl-3 text-[11px] font-medium text-ink-500">&mdash; Anonymous</figcaption>
          </figure>
        </div>
      </section>

      {storageWarning && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{storageWarning}</p>
      )}

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <PanelHeading icon="palette" title="Thinking board" tint="bg-brand-100">
              <span className="hidden text-xs text-ink-500 sm:inline">
                Sketch it. Hold Shift for a straight edge.
              </span>
            </PanelHeading>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
              <span className={`h-1.5 w-1.5 rounded-full ${saved ? "bg-emerald-500" : "bg-amber-400"}`} aria-hidden="true" />
              {!saved
                ? "Saving..."
                : signedIn
                  ? synced
                    ? "Saved to your account"
                    : "Saved in this browser, not yet synced"
                  : "Saved in this browser"}
            </span>
          </div>
          <ThinkingBoard items={items} onChange={setItems} boardId={`${userId || "anon"}:${slug}`} />
        </section>

        <section className="flex min-w-0 flex-col">
          <div className="mb-2 flex gap-1 rounded-xl border border-brand-200 bg-surface p-1" role="tablist">
            {[
              { id: "plan", label: "Your plan", icon: "memo" },
              { id: "problem", label: "The problem", icon: "problems" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={tab === option.id}
                onClick={() => setTab(option.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                  tab === option.id
                    ? "bg-gradient-to-r from-brand-300 to-brand-200 text-ink-900 shadow-sm"
                    : "text-brand-800 hover:bg-brand-50"
                }`}
              >
                <span aria-hidden="true">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>

          {tab === "plan" ? (
            <div className="card space-y-4 border-brand-200">
              <Field label="Approach" icon="target">
                <textarea
                  rows={5}
                  value={plan.approach}
                  onChange={setField("approach")}
                  placeholder="How would you solve it? Say it in plain words before you say it in code."
                  className="field resize-y"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Time" icon="timer">
                  <input
                    list="complexities"
                    value={plan.timeComplexity}
                    onChange={setField("timeComplexity")}
                    placeholder="O(n)"
                    className="field"
                  />
                </Field>
                <Field label="Space" icon="package">
                  <input
                    list="complexities"
                    value={plan.spaceComplexity}
                    onChange={setField("spaceComplexity")}
                    placeholder="O(1)"
                    className="field"
                  />
                </Field>
              </div>
              {/* Suggestions, not a fixed list: a problem whose answer is
                  O(n * 2^n) should not be unspellable. */}
              <datalist id="complexities">
                {COMPLEXITIES.map((value) => <option key={value} value={value} />)}
              </datalist>

              <Field label="Key insight" icon="bulb" hint="The one observation that makes it work.">
                <textarea
                  rows={3}
                  value={plan.insights}
                  onChange={setField("insights")}
                  placeholder="What do you notice that turns this from hard into easy?"
                  className="field resize-y"
                />
              </Field>

              <Field label="Edge cases" icon="warning" hint="The inputs most likely to break it.">
                <textarea
                  rows={4}
                  value={plan.edgeCases}
                  onChange={setField("edgeCases")}
                  placeholder={"Empty input\nOne element\nDuplicates\nThe largest size allowed"}
                  className="field resize-y"
                />
              </Field>

              <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
                Nothing here is required, and none of it is marked.{" "}
                {signedIn
                  ? "It saves to your account, so it follows you to any machine, and waits beside the editor."
                  : "It stays in this browser. Log in and it will follow you to any machine."}
              </p>
            </div>
          ) : (
            <div className="card max-h-[70vh] space-y-4 overflow-y-auto">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-900">
                {problem.statement}
              </p>

              <div>
                <h3 className="mb-1 text-sm font-bold text-brand-800">Input</h3>
                <p className="whitespace-pre-line text-sm text-ink-900">{problem.inputFormat}</p>
              </div>

              <div>
                <h3 className="mb-1 text-sm font-bold text-brand-800">Output</h3>
                <p className="whitespace-pre-line text-sm text-ink-900">{problem.outputFormat}</p>
              </div>

              {problem.constraints?.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-bold text-brand-800">Constraints</h3>
                  <ul className="list-disc space-y-0.5 pl-5 text-sm text-ink-900">
                    {problem.constraints.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                </div>
              )}

              {samples.map((sample, index) => (
                <div key={sample.index}>
                  <h3 className="mb-1 text-sm font-bold text-brand-800">Example {index + 1}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <pre className="overflow-x-auto rounded-lg bg-brand-50 p-2 text-xs text-ink-900">{sample.input}</pre>
                    <pre className="overflow-x-auto rounded-lg bg-brand-50 p-2 text-xs text-ink-900">{sample.expected}</pre>
                  </div>
                  {sample.note && <p className="mt-1 text-xs text-brand-800">{sample.note}</p>}
                </div>
              ))}

              {/* The hint and the editorial are deliberately not here. This page
                  is for working it out; both of those are one click away on the
                  problem page for when you want them. */}
            </div>
          )}
        </section>
      </div>

      {/*
        The closing note, and a second way into the editor.
        The button in the header is always reachable; this one is where
        somebody who has just finished writing their plan is already looking.
      */}
      <footer className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-surface px-5 py-4">
        <Icon name="seedling" className="h-7 w-7 text-brand-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink-900">
            A well thought out approach makes the solution simpler.
          </p>
          <p className="text-xs text-ink-500">
            Take your time. Good thinking leads to code you do not have to argue with.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/problems/${slug}`)}
          className="btn-primary shrink-0"
        >
          I&rsquo;m ready &mdash; start coding
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </footer>
    </main>
  );
}
