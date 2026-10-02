/*
 * Pair Lab rooms. Every route needs an account, and every one checks that the
 * caller is a member of the room in question — the token says who you are, the
 * membership list says where you may go.
 */

const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const roomController = require("../controllers/roomController");

const roomRouter = express.Router();

roomRouter.get("/rooms", authenticateToken, roomController.listRooms);
roomRouter.post("/rooms", authenticateToken, roomController.createRoom);
roomRouter.get("/rooms/:id", authenticateToken, roomController.getRoom);
roomRouter.post("/rooms/:id/invite", authenticateToken, roomController.inviteToRoom);
roomRouter.post("/rooms/:id/leave", authenticateToken, roomController.leaveRoom);

module.exports = roomRouter;
