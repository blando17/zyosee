import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { compilerApi, errorMessage } from "../api";
import ProgressPanel from "../components/ProgressPanel";

/*
 * The profile: how the account is doing, and the controls for changing it.
 *
 * Progress comes from the compiler service, which owns the problems and the
 * submissions; the account itself comes from the accounts API. Two services,
 * so two requests, and a failure in either leaves the other half working — a
 * judge that cannot reach the problem list should not stop somebody changing
 * their password.
 *
 * Password is left blank unless the user wants to change it: sending an empty
 * string would hash the empty string and lock them out.
 */
export default function Profile() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
    password: "",
  });
  const [status, setStatus] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [problems, setProblems] = useState([]);
  const [progress, setProgress] = useState({ solved: [], attempted: [], favourites: [] });
  const [activity, setActivity] = useState({ recent: [], totals: { submissions: 0, judged: 0, accepted: 0 } });
  const [loadingProgress, setLoadingProgress] = useState(true);

  /*
   * All three at once rather than in sequence: none of them depends on another,
   * and waiting for three round trips end to end would leave the page empty for
   * no reason. A failure only costs the progress half of the page, so it is
   * reported to the console rather than thrown over the account form.
   */
  useEffect(() => {
    let live = true;
    Promise.allSettled([
      compilerApi.get("/problems"),
      compilerApi.get("/me/problems"),
      compilerApi.get("/me/activity"),
    ])
      .then(([list, mine, recent]) => {
        if (!live) return;
        if (list.status === "fulfilled") setProblems(list.value.data);
        if (mine.status === "fulfilled") setProgress(mine.value.data);
        if (recent.status === "fulfilled") setActivity(recent.value.data);
      })
      .finally(() => {
        if (live) setLoadingProgress(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const solved = useMemo(() => new Set(progress.solved), [progress.solved]);
  const attempted = useMemo(() => new Set(progress.attempted), [progress.attempted]);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "", text: "" });

    const fields = { username: form.username, email: form.email };
    if (form.password) fields.password = form.password;

    setBusy(true);
    try {
      await updateProfile(fields);
      setForm({ ...form, password: "" });
      setStatus({ type: "ok", text: "Profile updated." });
    } catch (err) {
      setStatus({ type: "error", text: errorMessage(err, "Could not update.") });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteAccount();
      navigate("/", { replace: true });
    } catch (err) {
      setStatus({ type: "error", text: errorMessage(err, "Could not delete.") });
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">{user.username}</h1>
        <p className="mt-1 text-sm text-ink-800">{user.email}</p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section>
          <ProgressPanel
            problems={problems}
            solved={solved}
            attempted={attempted}
            totals={activity.totals}
            recent={activity.recent}
            loading={loadingProgress}
            action={
              <Link
                to="/progress"
                className="inline-flex items-center gap-1 rounded-lg border border-brand-300 px-3 py-1.5
                           text-xs font-bold text-brand-800 transition hover:bg-brand-50"
              >
                Full progress
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </Link>
            }
          />
        </section>

        <section className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-bold text-ink-900">Your account</h2>
            <p className="mt-1 break-all text-xs text-ink-800">id {user._id}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  required
                  value={form.username}
                  onChange={handleChange}
                  className="field"
                />
              </div>

              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="field"
                />
              </div>

              <div>
                <label className="label" htmlFor="password">New password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  className="field"
                  placeholder="Leave blank to keep the current one"
                />
              </div>

              {status.text && (
                <p
                  className={`rounded-lg px-4 py-2.5 text-sm ${
                    status.type === "ok"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {status.text}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>

          <div className="card border-red-200">
            <h2 className="font-bold text-red-700">Delete account</h2>
            <p className="mt-1 text-sm text-ink-800">
              This removes your account from the database. It cannot be undone.
            </p>

            {confirmingDelete ? (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={busy}
                  className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  Yes, delete it
                </button>
                <button onClick={() => setConfirmingDelete(false)} className="btn-ghost">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="mt-4 rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 transition hover:bg-red-50"
              >
                Delete my account
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
