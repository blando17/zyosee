/*
 * Friends. Every route here needs an account, and every one acts on the
 * caller's own friendships — the token decides who "me" is, never a parameter,
 * so there is no URL anybody can construct to manage somebody else's.
 */

const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const friendController = require("../controllers/friendController");

const friendRouter = express.Router();

friendRouter.get("/friends", authenticateToken, friendController.listFriends);
friendRouter.get("/friends/search", authenticateToken, friendController.searchUsers);
friendRouter.post("/friends/requests", authenticateToken, friendController.sendRequest);
friendRouter.post("/friends/:userId/accept", authenticateToken, friendController.acceptRequest);

// Declining, cancelling and unfriending are all "remove the row between us".
friendRouter.delete("/friends/:userId", authenticateToken, friendController.removeFriendship);

module.exports = friendRouter;
