import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Set by ProtectedRoute when it bounced someone off a page they wanted, and
  // by the session banner. Otherwise the home page, so signing in leaves you
  // choosing what to do rather than dropped into the compiler.
  const destination = location.state?.from || "/";

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Could not log in."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="card">
        <h1 className="text-2xl font-bold text-ink-900">Welcome back</h1>
        {/*
          Not "log in to open the compiler", which this used to say.

          Two things were wrong with it. It undersold the account — signing in
          opens Pair Lab, the Duel Arena, Core CS and your progress, and the
          compiler is the smallest of them. And it read as an instruction to
          somebody who had already decided to sign in and was looking at the
          form, which is a sentence doing no work.

          Three beats, echoing the headline on the home page.
        */}
        <p className="mt-1 text-sm text-ink-800">Problems to solve, friends to duel, code to run.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              className="field"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              className="field"
              placeholder="Your password"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-800">
          No account yet?{" "}
          <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
