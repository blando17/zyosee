/*
 * Public counts for the landing page.
 *
 * No authentication, deliberately. This answers "is anybody here?" for a
 * visitor who has not signed up yet, so requiring a token would mean only
 * people who already believed the answer could see it.
 *
 * Nothing here is about a person. Six totals go out; no name, no id and no
 * individual's activity is exposed by any of them.
 */

const express = require("express");
const statsController = require("../controllers/statsController");

const statsRouter = express.Router();

statsRouter.get("/stats", statsController.getStats);

module.exports = statsRouter;
