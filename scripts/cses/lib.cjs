/*
 * Shared plumbing for the CSES import scripts.
 *
 * The scripts live outside backend/ and so have no node_modules of their own;
 * they borrow the API's, exactly as scripts/assign-numbers.js already does, so
 * the import runs against the same driver version the server uses.
 */

const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..", "..");
const BACKEND = path.join(ROOT, "backend");
const COMPILER = path.join(ROOT, "compiler");

require(path.join(BACKEND, "node_modules/dotenv")).config({ path: path.join(BACKEND, ".env") });
const { MongoClient } = require(path.join(BACKEND, "node_modules/mongodb"));

if (process.env.DNS_SERVERS) {
  require("dns").setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
}

const TESTDATA_DIR = process.env.TESTDATA_DIR || path.join(COMPILER, "testdata");

async function connect() {
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  return {
    client,
    problems: client.db(process.env.DB_NAME).collection("problems"),
  };
}

/*
 * The same slug rule the authoring API uses, in backend/services/testStore.js,
 * with accents folded first. One problem title carries a ü, and dropping the
 * accent gives "prufer-code" rather than a slug with a hole in it.
 */
function slugify(title) {
  return String(title || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

// The official problem set, scraped once into scripts/cses/official.json.
function official() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "official.json"), "utf8"));
}

module.exports = { ROOT, BACKEND, COMPILER, TESTDATA_DIR, connect, slugify, official };
