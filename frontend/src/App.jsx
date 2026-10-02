import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { PageGlow } from "./components/Spots";
import SessionBanner from "./components/SessionBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";

/*
 * Every page except the landing one is loaded on demand.
 *
 * The whole app used to be a single 510 kB bundle, which meant somebody
 * arriving at the front page downloaded the problem editor, the thinking
 * whiteboard, the duel arena, the admin authoring form and the whole of
 * Prism's syntax highlighting before anything could paint — none of which
 * that first screen uses.
 *
 * Home stays eager. It is the page most arrivals land on, and lazy-loading
 * the thing somebody is already looking at buys a spinner, not a saving.
 */
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Compiler = lazy(() => import("./pages/Compiler"));
const Problems = lazy(() => import("./pages/Problems"));
const Problem = lazy(() => import("./pages/Problem"));
const Think = lazy(() => import("./pages/Think"));
const Profile = lazy(() => import("./pages/Profile"));
const Progress = lazy(() => import("./pages/Progress"));
const Friends = lazy(() => import("./pages/Friends"));
const Room = lazy(() => import("./pages/Room"));
const PairLab = lazy(() => import("./pages/PairLab"));
const DuelArena = lazy(() => import("./pages/DuelArena"));
const DuelCreate = lazy(() => import("./pages/DuelCreate"));
const Duel = lazy(() => import("./pages/Duel"));
const AddProblem = lazy(() => import("./pages/AddProblem"));
const CoreCS = lazy(() => import("./pages/CoreCS"));
const CoreCsSubject = lazy(() => import("./pages/CoreCsSubject"));
const CoreCsTopic = lazy(() => import("./pages/CoreCsTopic"));
const CoreCsRevision = lazy(() => import("./pages/CoreCsRevision"));

/*
 * What shows while a page's code is on its way.
 *
 * Deliberately plain and deliberately NOT a spinner. On a fast connection the
 * chunk arrives in a few dozen milliseconds, and a spinner that appears and
 * vanishes in that time is a flash of anxiety about nothing. A line of text in
 * the page's own colours simply looks like the page has not finished yet.
 */
function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm text-brand-700">Loading...</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      {/* One backdrop for the whole app, not one per page. See Spots.jsx. */}
      <PageGlow />
      <Navbar />
      <SessionBanner />
      <Suspense fallback={<PageLoading />}>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Browsing problems needs no account. Submitting does, and the
            Submit button on the problem page enforces that itself. */}
        <Route path="/problems" element={<Problems />} />
        <Route path="/problems/:slug" element={<Problem />} />
        {/* Thinking mode gets its own URL rather than being a dialog over the
            problem: it is a place you spend several minutes, leave, and come
            back to, and all three of those want the back button to work. */}
        <Route path="/problems/:slug/think" element={<Think />} />
        <Route
          path="/compiler"
          element={
            <ProtectedRoute>
              <Compiler />
            </ProtectedRoute>
          }
        />
        {/* Authoring is admin-only, and the server enforces that on every
            /admin route. ProtectedRoute here only keeps a logged-out visitor
            from seeing an empty form. */}
        <Route
          path="/add-problem"
          element={
            <ProtectedRoute>
              <AddProblem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pair"
          element={
            <ProtectedRoute>
              <PairLab />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms/:id"
          element={
            <ProtectedRoute>
              <Room />
            </ProtectedRoute>
          }
        />
        {/* The arena, setting a challenge up, and one duel. Three routes
            rather than one, because they are three different things you can
            be in the middle of — but a duel keeps ONE address from the
            challenge to the result, since it moves between those states on
            its own while you are looking at it. */}
        <Route
          path="/arena"
          element={
            <ProtectedRoute>
              <DuelArena />
            </ProtectedRoute>
          }
        />
        <Route
          path="/arena/new"
          element={
            <ProtectedRoute>
              <DuelCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/duels/:id"
          element={
            <ProtectedRoute>
              <Duel />
            </ProtectedRoute>
          }
        />
        {/* Core CS interview prep. Four routes rather than one, because the
            subject list, a subject's dashboard, one topic and the revision
            queue are four different places you can be — and all four are
            worth being able to link to and come back to.

            Browsing needs an account only because progress is per-user; the
            content itself is the same for everybody. */}
        <Route
          path="/corecs"
          element={
            <ProtectedRoute>
              <CoreCS />
            </ProtectedRoute>
          }
        />
        <Route
          path="/corecs/:subject"
          element={
            <ProtectedRoute>
              <CoreCsSubject />
            </ProtectedRoute>
          }
        />
        {/* Declared before /corecs/:subject/:topic. React Router ranks a
            static segment above a dynamic one, so this would win either way —
            written first so the intent is not a thing you have to know. */}
        <Route
          path="/corecs/:subject/revise"
          element={
            <ProtectedRoute>
              <CoreCsRevision />
            </ProtectedRoute>
          }
        />
        <Route
          path="/corecs/:subject/:topic"
          element={
            <ProtectedRoute>
              <CoreCsTopic />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <main className="mx-auto max-w-md px-6 py-24 text-center">
              <h1 className="text-3xl font-bold text-brand-700">Page not found</h1>
            </main>
          }
        />
        </Routes>
      </Suspense>
    </div>
  );
}
