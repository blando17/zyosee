/*
 * Recomputes every problem's submission counters from the submission log.
 *
 * The counters are maintained one submission at a time, which is fast and
 * drifts if a write is ever lost — a database blip while a verdict was being
 * recorded, or a row deleted by hand. The log is the record of what actually
 * happened, so this throws the counters away and adds them up again.
 *
 * Safe to run at any time: it only writes the counters, never the log, and a
 * run with nothing to fix leaves the same numbers in place.
 *
 *   node scripts/rebuild-stats.js
 */

const path = require("path");
const COMPILER = path.join(__dirname, "..", "compiler");
require(path.join(COMPILER, "node_modules/dotenv")).config({ path: path.join(COMPILER, ".env") });

if (process.env.DNS_SERVERS) {
  require("dns").setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
}

const { rebuildStats } = require(path.join(COMPILER, "submissions"));

rebuildStats()
  .then((count) => {
    console.log(`  rebuilt counters for ${count} problem(s) that have submissions.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
