/*
 * Problem authoring routes.
 *
 * Every one of these is admin-only. Reading problems is not here at all: the
 * compiler service serves the public problem list and statements, because it is
 * the thing that also has to judge against them.
 */

const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");
const problemController = require("../controllers/problemController");

const problemRouter = express.Router();

/*
 * The authoring routes' own body parser.
 *
 * A problem's curated test inputs are part of the request, and a case built to
 * separate a linear solution from a quadratic one is megabytes of text on its
 * own. The application-wide parser keeps its small default and skips these
 * paths; see backend/index.js for why it has to skip rather than simply come
 * first.
 *
 * It is mounted per route rather than on the router so that it runs only after
 * the caller has been authenticated and found to be an administrator. Nobody
 * else can make the server read a large body.
 */
const authoringBody = express.json({ limit: "24mb" });

// Tells the frontend whether to show the Add Problem link at all. Auth only,
// because a logged-in non-admin asking "am I an admin" gets an honest no rather
// than a 403 the page has to interpret.
problemRouter.get("/admin/me", authenticateToken, async (req, res) => {
  const { isAdminEmail } = require("../middleware/adminMiddleware");
  const { usersCollection } = require("../config/db");
  const { ObjectId } = require("mongodb");
  try {
    const users = await usersCollection();
    const user = await users.findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { email: 1 } }
    );
    res.json({ admin: Boolean(user && isAdminEmail(user.email)) });
  } catch (err) {
    res.json({ admin: false });
  }
});

problemRouter.get("/admin/problems", authenticateToken, requireAdmin, problemController.listAll);
problemRouter.post("/admin/problems", authenticateToken, requireAdmin, authoringBody, problemController.createProblem);
problemRouter.delete("/admin/problems/:slug", authenticateToken, requireAdmin, problemController.deleteProblem);

// Authoring aids. Neither writes anything.
problemRouter.post("/admin/problems/preview-tests", authenticateToken, requireAdmin, authoringBody, problemController.previewTests);
problemRouter.post("/admin/problems/suggest-spec", authenticateToken, requireAdmin, authoringBody, problemController.suggestSpec);

module.exports = problemRouter;
