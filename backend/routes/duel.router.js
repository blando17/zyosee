/*
 * Duel Arena.
 *
 * Every route needs an account, and every one re-checks that the caller is one
 * of the two players in the duel it names — the token says who you are, the
 * duel's own player list says which duels are any of your business.
 */

const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const duelController = require("../controllers/duelController");

const duelRouter = express.Router();

duelRouter.get("/duels", authenticateToken, duelController.listDuels);
duelRouter.post("/duels", authenticateToken, duelController.createDuel);
duelRouter.get("/duels/waiting", authenticateToken, duelController.countWaiting);
duelRouter.get("/duels/rating", authenticateToken, duelController.ratingHistory);
// Both declared BEFORE /duels/:id, or "waiting" and "rating" are read as duel
// ids and answered with a 400.
duelRouter.get("/duels/:id", authenticateToken, duelController.getDuel);
duelRouter.post("/duels/:id/respond", authenticateToken, duelController.respondToDuel);
duelRouter.post("/duels/:id/ready", authenticateToken, duelController.readyUp);
duelRouter.post("/duels/:id/cancel", authenticateToken, duelController.cancelDuel);
duelRouter.post("/duels/:id/end", authenticateToken, duelController.endDuel);

module.exports = duelRouter;
