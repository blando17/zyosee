const express = require("express");
const userController = require("../controllers/userController");
const authenticateToken = require("../middleware/authMiddleware");
const { loginByEmail, loginByAddress, signupByAddress } = require("../middleware/authLimits");

const userRouter = express.Router();

/*
 * Authentication, throttled.
 *
 * These are the only two routes on this service that hand out a token to
 * somebody who has not got one, which makes them the only two worth guessing
 * at. See middleware/authLimits.js for why login is counted twice — once per
 * account and once per address — and why only failures count.
 *
 * The limiters run before the controller, so a refused attempt never reaches
 * bcrypt. That is half the point: comparing a password hash is deliberately
 * expensive, so an unthrottled login route is a way to make this server do
 * costly work on demand, quite apart from whether any password is ever guessed.
 */
userRouter.post("/signup", signupByAddress, userController.signUp);
userRouter.post("/login", loginByEmail, loginByAddress, userController.login);

// Whoever is holding the token, resolved from the token itself. The frontend
// calls this on page load to restore the session.
userRouter.get("/me", authenticateToken, userController.getMe);

// Public reads
// Both need an account. Browsing problems is public; browsing the people who
// use the site is not.
userRouter.get("/users", authenticateToken, userController.getAllUsers);
userRouter.get("/users/:id", authenticateToken, userController.getUserProfile);

// Protected writes. authenticateToken proves you are someone; the controller
// then checks you are *this* someone before it writes.
userRouter.put("/users/:id", authenticateToken, userController.updateUserProfile);
userRouter.delete("/users/:id", authenticateToken, userController.deleteUserProfile);

module.exports = userRouter;
