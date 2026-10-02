const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

/*
 * A single shared MongoClient for the whole process.
 *
 * Opening a new connection per request is the classic beginner mistake: Atlas
 * caps how many connections one cluster will accept, and each handshake costs
 * a round trip. So we open one client lazily, keep it, and hand out the same
 * database handle to every controller.
 */

const dns = require("dns");

/*
 * DNS, and why this is here.
 *
 * A mongodb+srv:// URI is resolved with an SRV lookup, which Node performs
 * itself rather than handing to the operating system. When the only nameserver
 * macOS offers is an IPv6 link-local address with a zone index, such as
 * fe80::1%en0, Node's resolver cannot use it and quietly falls back to
 * 127.0.0.1. Nothing listens there, so every SRV lookup fails with ECONNREFUSED
 * and the database appears to be unreachable while ordinary browsing works
 * fine, because ordinary hostname lookups go through the OS instead.
 *
 * Setting DNS_SERVERS in .env points Node at a resolver that can answer.
 * Unset, nothing changes and the system configuration is used as before.
 */
function applyDnsOverride() {
  const configured = (process.env.DNS_SERVERS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!configured.length) return;
  try {
    dns.setServers(configured);
  } catch (err) {
    console.error("Ignoring DNS_SERVERS, it is not a valid resolver list:", err.message);
  }
}

applyDnsOverride();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
const SERVER_SELECTION_TIMEOUT_MS =
  Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 8000;

let client;
let connecting = null;

async function connectClient() {
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Copy .env.sample to .env first.");
  }
  if (client) return client.db(dbName);

  /*
   * One attempt at a time, and a failed attempt is not remembered.
   *
   * The obvious version assigns `client` before awaiting connect(), and that is
   * a trap: when connect() throws, `client` is already set, so every later call
   * sees a truthy client, skips connecting, and hands out a database handle on
   * a socket that was never opened. The API then fails every request until it
   * is restarted, with no way back.
   *
   * So the handle is published only once connect() has returned, and a failure
   * clears the in-flight promise so the next caller genuinely retries.
   */
  if (!connecting) {
    connecting = (async () => {
      const next = new MongoClient(uri, {
        // Fail a request rather than hold it open for the driver's thirty
        // second default. A login that hangs looks like a dead server.
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      });
      await next.connect();

      // Unique indexes are the only thing that actually prevents two people
      // signing up with the same email at the same instant. The findOne check
      // in the controller is a nicer error message, not a guarantee.
      const db = next.db(dbName);
      await db.collection("users").createIndex({ email: 1 }, { unique: true });
      await db.collection("users").createIndex({ username: 1 }, { unique: true });
      await db.collection("problems").createIndex({ slug: 1 }, { unique: true });
      // Sparse, because problems authored before problemId existed do not have
      // one and a plain unique index would treat every missing value as a clash.
      await db
        .collection("problems")
        .createIndex({ problemId: 1 }, { unique: true, sparse: true });

      /*
       * One row per pair of people, whichever way round the request went.
       *
       * TWO fields, for two different jobs, and the split is not cosmetic:
       *
       *   pairKey  "idLow:idHigh" — a plain string. The unique index goes
       *            here. Because the ids are sorted before joining, A-B and
       *            B-A produce the same key, so one constraint prevents both a
       *            duplicate request and two people asking each other in the
       *            same instant.
       *
       *   pair     the same two ids as an array, indexed but NOT unique, so
       *            "every row I am part of" is one query.
       *
       * The unique index must not go on the array. An index on an array field
       * is multikey — Mongo indexes each element separately — so `unique`
       * there means no two documents may share ANY element, which would allow
       * each person exactly one friendship for life. It fails the moment
       * somebody makes a second friend, and not before.
       */
      await db.collection("friendships").createIndex({ pairKey: 1 }, { unique: true });
      await db.collection("friendships").createIndex({ pair: 1 });

      // Pair Lab rooms. `members` is the list of people allowed in, so this is
      // the index behind "which rooms am I part of".
      await db.collection("rooms").createIndex({ members: 1, updatedAt: -1 });

      /*
       * Duels. `players` holds both ids, so this one index answers both "my
       * challenges" and "my history"; the sort key is on it because every
       * screen that asks wants the newest first.
       */
      await db.collection("duels").createIndex({ players: 1, createdAt: -1 });
      // Finalising a duel whose clock ran out while nobody was watching scans
      // for exactly this: live ones, past their end.
      await db.collection("duels").createIndex({ status: 1, endsAt: 1 });

      /*
       * Core CS progress: one row per person per subject, and the unique index
       * is what guarantees it. Two tabs marking a question Done at the same
       * instant both upsert; without this, both could insert and the person
       * would quietly end up with two halves of their own progress.
       */
      await db
        .collection("corecs")
        .createIndex({ userId: 1, subject: 1 }, { unique: true });

      client = next;
      console.log(`Connected to MongoDB, database "${dbName}"`);
      return client;
    })().finally(() => {
      connecting = null;
    });
  }

  await connecting;
  return client.db(dbName);
}

// Every collection this API touches goes through a helper, so a typo in a
// collection name is a one-line fix instead of a hunt through controllers.
async function usersCollection() {
  const db = await connectClient();
  return db.collection("users");
}

/*
 * Problems. This API is the only writer; the compiler service reads the same
 * collection to judge against. One owner for writes means the two services can
 * never disagree about what a problem is.
 */
async function problemsCollection() {
  const db = await connectClient();
  return db.collection("problems");
}

async function friendshipsCollection() {
  const db = await connectClient();
  return db.collection("friendships");
}

/*
 * Submissions, which the COMPILER writes and this API only ever reads.
 *
 * The mirror of the problems arrangement above: one writer, so the two
 * services cannot disagree. It is read here for one reason — a friends list in
 * a judge that cannot say how many problems your friends have solved is a list
 * of names — and every query against it in this service is a count.
 */
async function submissionsCollection() {
  const db = await connectClient();
  return db.collection("submissions");
}

async function roomsCollection() {
  const db = await connectClient();
  return db.collection("rooms");
}

/*
 * Duels, owned entirely by this API.
 *
 * The compiler READS one — it has to check that a submission claiming to
 * belong to a duel really does, before it stamps it — but it never writes one.
 * The mirror of the problems arrangement: submissions have a single writer in
 * the compiler, duels have a single writer here, and neither service can
 * contradict the other about what happened.
 */
async function duelsCollection() {
  const db = await connectClient();
  return db.collection("duels");
}

/*
 * Core CS interview prep: what each person has marked Done or for Revision.
 *
 * ONE DOCUMENT PER PERSON PER SUBJECT, not one per question. A row per
 * answered question would be the obvious shape and it is the wrong one here:
 * every screen in this section — the dashboard, a topic, the revision queue —
 * needs the whole of somebody's state for a subject at once, so a per-question
 * collection would mean fetching two hundred documents to draw one progress
 * bar. Two arrays of question ids fit in a few hundred bytes and answer all
 * three screens in a single read.
 *
 * The question ids themselves live in the frontend's content modules and are
 * never written here by the server. That is deliberate: content is data the
 * app ships, progress is data the person owns, and mixing the two would mean a
 * database migration every time a question is reworded.
 */
async function coreCsCollection() {
  const db = await connectClient();
  return db.collection("corecs");
}

module.exports = {
  connectClient,
  usersCollection,
  problemsCollection,
  friendshipsCollection,
  submissionsCollection,
  roomsCollection,
  duelsCollection,
  coreCsCollection,
};
