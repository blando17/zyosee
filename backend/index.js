const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { stayAlive } = require("./utils/stayAlive");
stayAlive("accounts");

const mainRouter = require("./routes/main.router");
const { attachRealtime } = require("./realtime/rooms");
const { attachDuelRealtime } = require("./realtime/duels");
const { createSocketRouter } = require("./realtime/socketRouter");
const { connectClient } = require("./config/db");

const app = express();

/*
 * Which browser origins may call this API.
 *
 * A list, not a single value, because Vite does not insist on port 5173: if
 * something else already holds it, Vite quietly starts on 5174 instead and says
 * so only in its own terminal. The browser then blocks every reply from this
 * API for coming from an origin it was not told about, and the page reports a
 * network error that looks like the server being down. Allowing the handful of
 * ports Vite actually falls back to keeps a port clash from breaking signup.
 */
function allowedOrigins() {
  const configured = (process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return configured.length
    ? configured
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
}


app.use(cors({ origin: allowedOrigins() }));

/*
 * The ordinary body limit, which is express's default 100 kb.
 *
 * Authoring a problem is the one request that legitimately carries megabytes:
 * a problem's curated test inputs travel in it, and a grid or a graph with a
 * hundred thousand edges is not small. Those routes install their own, far
 * larger parser AFTER checking the caller is an administrator.
 *
 * This parser therefore has to step aside for them, rather than merely being
 * followed by a bigger one. Whichever json parser runs first is the one that
 * reads the stream, so leaving this in the way would reject the request at
 * 100 kb no matter what the route asked for.
 *
 * Everything else — signing up, logging in, submitting a solution — keeps the
 * small limit, so an unauthenticated caller can never make the server buffer
 * more than that.
 */
const ordinaryBody = express.json();
app.use((req, res, next) => {
  if (req.path.startsWith("/admin/problems")) return next();
  return ordinaryBody(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

app.use("/", mainRouter);

/*
 * Body parser failures, answered in JSON.
 *
 * Express's default handler renders an HTML error page. Every caller here is
 * fetch() expecting JSON, so a request that was merely too long came back as
 * "<!DOCTYPE ..." and the page showed a parse error instead of the reason.
 * Registered last, so it catches errors thrown by the parsers that run first.
 */
app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      message: "That request is larger than this service accepts. Send less in one go.",
    });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "That request body was not valid JSON." });
  }
  return next(err);
});

const PORT = process.env.PORT || 5001;

// Connect before we start listening, so a bad URI fails loudly at boot rather
// than on the first signup attempt.
connectClient()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Accounts API listening on port ${PORT}`);
    });

    /*
     * The sockets share this HTTP server rather than opening a port of their
     * own, so there is one address, one set of allowed origins, and nothing
     * extra to configure or firewall.
     *
     * Both endpoints go through one router. See socketRouter.js for why they
     * cannot simply be two WebSocketServers each naming its own path.
     */
    const sockets = createSocketRouter(server, allowedOrigins());
    attachRealtime(sockets);
    attachDuelRealtime(sockets);
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  });
