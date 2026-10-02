import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/*
 * Says plainly that the session has gone, the moment it goes.
 *
 * Before this, an expired token left the page looking signed in until you
 * pressed Run or Submit, and the failure arrived as an error inside the results
 * panel, which reads like the judge broke rather than like you need to sign in
 * again.
 *
 * It sits above the page rather than replacing it, and nothing navigates on its
 * own, so whatever you were typing stays on screen.
 */
export default function SessionBanner() {
  const { sessionExpired, dismissSessionExpired } = useAuth();
  const location = useLocation();

  if (!sessionExpired) return null;

  return (
    <div className="sticky top-[57px] z-20 border-b border-amber-300 bg-amber-100 px-6 py-2.5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <p className="text-sm font-semibold text-amber-900">
          Your session has expired. Log in again to run or submit code.
        </p>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="rounded-lg bg-amber-900 px-3 py-1.5 text-sm font-semibold text-amber-50 transition hover:bg-amber-800"
          >
            Log in
          </Link>
          <button
            type="button"
            onClick={dismissSessionExpired}
            className="rounded-lg px-2 py-1.5 text-sm font-medium text-amber-900 hover:underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
