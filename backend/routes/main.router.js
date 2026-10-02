const express = require("express");
const userRouter = require("./user.router");
const problemRouter = require("./problem.router");
const friendRouter = require("./friend.router");
const roomRouter = require("./room.router");
const duelRouter = require("./duel.router");
const coreCsRouter = require("./corecs.router");
const statsRouter = require("./stats.router");

const mainRouter = express.Router();

mainRouter.get("/", (req, res) => {
  res.json({ service: "online-judge-accounts", status: "ok" });
});

mainRouter.use(userRouter);
mainRouter.use(problemRouter);
mainRouter.use(friendRouter);
mainRouter.use(roomRouter);
mainRouter.use(duelRouter);
mainRouter.use(coreCsRouter);
mainRouter.use(statsRouter);

module.exports = mainRouter;
