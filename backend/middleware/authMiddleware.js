const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

/*
 * Reads the "Authorization: Bearer <token>" header, verifies the signature,
 * and hangs the decoded payload on req.user so controllers downstream know
 * who is calling. A missing token is 401 (you did not identify yourself);
 * a bad or expired one is 403 (you identified yourself and it did not hold up).
 *
 * WHY THESE REPLIES CARRY reason: "token"
 *
 * 403 is also the right answer to "you are who you say you are, and you still
 * may not do that" — inviting somebody you are not friends with, editing
 * another person's account, answering a challenge that was not sent to you.
 * Several controllers reply that way and are right to.
 *
 * The browser could not tell the two apart. Its interceptor treated every 403
 * as a dead session, so a perfectly ordinary refusal — challenge somebody who
 * has just unfriended you — logged the user out instead of showing them the
 * message. The marker is what lets the browser clear the session for the first
 * kind and simply report the second.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Access token required!" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token required!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    /*
     * The signature being valid is not the same as the payload being usable.
     *
     * Three controllers downstream do `new ObjectId(req.user.id)`, which
     * THROWS on anything that is not a 24-character hex string, and an
     * exception in a route handler becomes a 500. A token this service did not
     * issue is a rejected token, not a server fault, and it should say so
     * here rather than blowing up three routes later.
     */
    if (!ObjectId.isValid(decoded?.id)) {
      return res.status(403).json({ message: "Invalid or expired token!", reason: "token" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token!", reason: "token" });
  }
}

module.exports = authenticateToken;
