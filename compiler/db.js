/*
 * The compiler service's read side of MongoDB.
 *
 * Problems used to be folders read at startup. They are documents now, which
 * means this service needs the database too. It only ever reads: the accounts
 * API owns every write to the problems collection, so there is exactly one
 * place that can create or change a problem.
 *
 * Same single-client rule as the accounts API. Atlas caps connections per
 * cluster, and a client per request would burn through them.
 */

const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

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
let warned = false;

function isConfigured() {
  return Boolean(uri && dbName);
}

async function connectClient() {
  if (!isConfigured()) {
    throw new Error("MONGODB_URI or DB_NAME is missing from compiler/.env");
  }
  if (client) return client.db(dbName);

  /*
   * One attempt at a time, and a failed attempt is not remembered.
   *
   * The obvious version assigns `client` before awaiting connect(), and that
   * is a trap: when connect() throws, `client` is already set, so every later
   * call sees a truthy client, skips connecting, and hands out a database
   * handle on a socket that was never opened. The service then fails every
   * request until it is restarted, with no way back.
   *
   * So the handle is published only once connect() has returned, and a failure
   * clears the in-flight promise so the next caller genuinely retries.
   */
  if (!connecting) {
    connecting = (async () => {
      const next = new MongoClient(uri, {
        // Fail a request rather than hold it open for the driver's thirty
        // second default. A health check that hangs looks like a dead service.
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      });
      await next.connect();
      client = next;
      console.log(`Compiler connected to MongoDB, database "${dbName}"`);
      return client;
    })().finally(() => {
      connecting = null;
    });
  }

  await connecting;
  return client.db(dbName);
}

async function problemsCollection() {
  const db = await connectClient();
  return db.collection("problems");
}

/*
 * Duels, which the ACCOUNTS API writes and this service only ever reads.
 *
 * A submission may claim to belong to a duel. Before that claim is written
 * onto the submission it has to be checked against the duel itself — is it
 * running, is this person in it, is this one of its problems — and that check
 * has to happen here, in the service that actually judges, because this is the
 * only place that knows a submission was really made.
 *
 * Reading only. The duel's own state machine belongs to the accounts API, and
 * two services moving the same match between states is how a match ends twice.
 */
async function duelsCollection() {
  const db = await connectClient();
  return db.collection("duels");
}

/*
 * Used at boot. A judge with no database is not a judge, but it is still a
 * working online compiler, so this reports the failure and lets the service
 * start rather than exiting. /run keeps working; /problems comes back empty.
 */
async function tryConnect() {
  try {
    await connectClient();
    return true;
  } catch (err) {
    if (!warned) {
      console.error("Compiler could not reach MongoDB:", err.message);
      console.error("Problems and judging are unavailable; /run still works.");
      warned = true;
    }
    return false;
  }
}

module.exports = { connectClient, problemsCollection, duelsCollection, isConfigured, tryConnect };
