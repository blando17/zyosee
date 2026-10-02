/*
 * What stops someone guessing their way into an account.
 *
 * THREE LIMITERS, BECAUSE ONE WOULD BE WRONG
 *
 * The obvious implementation is "N login attempts per IP address" and it fails
 * badly in both directions at once.
 *
 *   It locks out people it should not. This judge is used by a class, and a
 *   class is behind one campus NAT. Every student shares an address, so a
 *   per-address limit tight enough to stop password guessing is a limit one
 *   person's typo spends on behalf of the whole room.
 *
 *   It misses the attack it was meant to stop. Guessing one password is slow;
 *   spraying one common password across every account is not, and that comes
 *   from one address but touches a different account each time, so a
 *   per-address counter sized for a lecture theatre never fills.
 *
 * So the account and the address are counted separately, with ceilings chosen
 * for what each one is actually defending:
 *
 *   per email    tight. Brute-forcing one account dies after a handful of
 *                tries, and because the bucket is the account being attacked
 *                rather than the attacker, moving to a new address does not
 *                reset it. It costs an innocent bystander nothing.
 *   per address  loose. High enough that a shared NAT full of real people
 *                never notices, low enough that spraying thousands of accounts
 *                from one machine stops.
 *   signup       per address, because mass account creation is the only thing
 *                worth stopping there.
 *
 * ONLY FAILURES COUNT ON LOGIN
 *
 * A correct password returns the budget untouched. Someone who signs in
 * normally forty times a day should never meet any of this, and the thing
 * being rationed is guesses, not sessions.
 */

const { createLimiter, addressKey } = require("./rateLimit");

const MINUTE = 60 * 1000;

const LOGIN_WINDOW_MS = Number(process.env.LOGIN_WINDOW_MINUTES || 15) * MINUTE;
const LOGIN_MAX_PER_EMAIL = Number(process.env.LOGIN_MAX_PER_EMAIL) || 8;
const LOGIN_MAX_PER_IP = Number(process.env.LOGIN_MAX_PER_IP) || 50;

const SIGNUP_WINDOW_MS = Number(process.env.SIGNUP_WINDOW_MINUTES || 60) * MINUTE;
const SIGNUP_MAX_PER_IP = Number(process.env.SIGNUP_MAX_PER_IP) || 30;

/*
 * A failed sign-in, as the limiter sees it.
 *
 * 401 only. A 400 is a malformed request and a 500 is this server's own fault;
 * charging somebody for either would mean a bug here could lock people out of
 * their own accounts.
 */
const wasRejected = (res) => res.statusCode === 401;

/*
 * The email, normalised, as a bucket.
 *
 * Lower-cased and trimmed so that changing the capitalisation of an address is
 * not a way to start a fresh budget. This is only the limiter's key — the
 * lookup in the controller is unchanged, and this does not make sign-in
 * case-insensitive.
 */
function emailKey(req) {
  const email = req.body?.email;
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  // Long enough to be a bucket of its own, short enough not to be a way of
  // writing arbitrary amounts of data into the limiter's memory.
  return trimmed ? `email:${trimmed.slice(0, 120)}` : null;
}

/*
 * The refusal, worded so it cannot be used to find out who is registered.
 *
 * The controller answers "Invalid credentials!" to both a wrong password and an
 * unknown email, specifically so nobody can discover which addresses have
 * accounts. A limiter that said "too many attempts on this account" would hand
 * back exactly that answer — it would only ever trigger for a real one.
 *
 * This message is identical either way, because the limiter counts attempts
 * against the address that was TYPED, whether or not it belongs to anybody.
 * Guessing at a non-existent email hits the same wall at the same moment.
 */
const tooManyLogins = (seconds) =>
  `Too many sign-in attempts. Try again in ${describe(seconds)}.`;

const tooManySignups = (seconds) =>
  `Too many accounts have been created from here recently. Try again in ${describe(seconds)}.`;

function describe(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "a minute" : `${minutes} minutes`;
}

// Per account. Mounted first, so the tight limit is the one that answers when
// both are full and the message is about the thing that actually ran out.
const loginByEmail = createLimiter({
  key: emailKey,
  max: LOGIN_MAX_PER_EMAIL,
  windowMs: LOGIN_WINDOW_MS,
  countWhen: wasRejected,
  message: tooManyLogins,
});

// Per address, for spraying.
const loginByAddress = createLimiter({
  key: addressKey,
  max: LOGIN_MAX_PER_IP,
  windowMs: LOGIN_WINDOW_MS,
  countWhen: wasRejected,
  message: tooManyLogins,
});

/*
 * Signup counts every attempt, not only the successful ones.
 *
 * The thing being rationed here is account creation itself, and a script
 * hammering the route with addresses that are already taken is doing the same
 * damage as one that succeeds — it is still a flood of bcrypt and database
 * round trips from one source.
 */
const signupByAddress = createLimiter({
  key: addressKey,
  max: SIGNUP_MAX_PER_IP,
  windowMs: SIGNUP_WINDOW_MS,
  message: tooManySignups,
});

module.exports = { loginByEmail, loginByAddress, signupByAddress };
