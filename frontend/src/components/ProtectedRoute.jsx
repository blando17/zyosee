import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/*
 * Wraps any page that needs a session.
 *
 * The loading check matters: without it, a refresh on /compiler bounces you to
 * /login for a frame before GET /me has had a chance to answer.
 */
export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-brand-700">Checking your session...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    // Remembering where they were headed lets Login send them back there.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
