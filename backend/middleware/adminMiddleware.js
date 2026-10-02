/*
 * Who may author problems.
 *
 * An allowlist of email addresses in the environment rather than a role on the
 * user document. It needs no migration for accounts that already exist, no UI
 * for promoting people, and it cannot be changed by anything short of editing
 * the server's .env and restarting, which is the right bar for the one
 * privilege that can rewrite what every submission is judged against.
 *
 * The token carries only a user id, so the email comes from the database. That
 * is one extra read per admin request, which is fine: these routes are used
 * when a problem is written, not when one is solved.
 *
 * This runs on the server. The frontend also hides the Add Problem link from
 * everyone else, but that is a convenience, not the control: hiding a button
 * stops nobody from calling the route directly.
 */

const { ObjectId } = require("mongodb");
const { usersCollection } = require("../config/db");

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  const allowed = adminEmails();
  return allowed.length > 0 && allowed.includes(String(email || "").toLowerCase());
}

async function requireAdmin(req, res, next) {
  const allowed = adminEmails();
  if (!allowed.length) {
    return res.status(503).json({
      message:
        "No administrators are configured. Set ADMIN_EMAILS in backend/.env to the " +
        "email address that should be allowed to author problems, then restart the API.",
    });
  }

  try {
    const users = await usersCollection();
    const user = await users.findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { email: 1, username: 1 } }
    );
    if (!user || !isAdminEmail(user.email)) {
      return res.status(403).json({ message: "This account may not author problems." });
    }
    req.admin = { id: String(user._id), email: user.email, username: user.username };
    next();
  } catch (err) {
    console.error("Admin check failed:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { requireAdmin, isAdminEmail, adminEmails };
