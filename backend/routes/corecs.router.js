/*
 * Core CS interview prep.
 *
 * Every route needs an account, because all four of them are about one
 * person's own progress and there is nothing here that is anybody else's
 * business. The token says who is asking; no route takes a user id, so there
 * is no way to ask about somebody else's revision queue.
 */

const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const corecsController = require("../controllers/corecsController");

const coreCsRouter = express.Router();

// Declared BEFORE /corecs/:subject, or "counts" is read as a subject name and
// answered with a 400. Same trap as /duels/waiting.
coreCsRouter.get("/corecs/counts", authenticateToken, corecsController.counts);
coreCsRouter.get("/corecs/:subject", authenticateToken, corecsController.getProgress);
coreCsRouter.post("/corecs/:subject/mark", authenticateToken, corecsController.mark);
coreCsRouter.post("/corecs/:subject/reset", authenticateToken, corecsController.reset);

module.exports = coreCsRouter;
