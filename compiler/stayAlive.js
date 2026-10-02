/*
 * Keeps the service alive through failures that are not its fault.
 *
 * This exists because the compiler died three times in one afternoon, each
 * time with the same stack: a DNS lookup for the MongoDB cluster timing out,
 * rejected in the background with nothing awaiting it. Node treats an unhandled
 * rejection as fatal and exits, so a blip on a tethered connection took the
 * whole judge down — including submissions that had nothing to do with
 * MongoDB, because /run needs no database at all.
 *
 * The driver re-resolves the SRV record on a timer of its own, so there is no
 * call site to wrap: the rejection belongs to a promise this code never sees.
 * A process-level handler is the only place to catch it.
 *
 * It logs loudly rather than silently swallowing, because an unhandled
 * rejection is still a bug worth seeing. What it must not do is decide that a
 * name lookup failing is a reason to stop judging.
 *
 * uncaughtException is deliberately NOT handled the same way. An exception that
 * escaped every try/catch leaves the process in a state nothing here can reason
 * about, and carrying on would be worse than restarting.
 */

function stayAlive(serviceName) {
  process.on("unhandledRejection", (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    const code = reason && reason.code ? ` [${reason.code}]` : "";
    console.error(`${serviceName}: unhandled rejection${code}: ${message}`);
    console.error(`${serviceName}: still running; this did not stop the service.`);
  });
}

module.exports = { stayAlive };
