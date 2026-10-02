const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { LANGUAGES } = require("./languages");

/*
 * Writes the submitted source to disk so the compiler toolchain has a real
 * file to read.
 *
 * Every job gets its own folder under codes/<uuid>/. A folder rather than a
 * bare file because Java needs its class file beside its source, and because
 * deleting one folder afterwards is simpler than tracking scattered artifacts.
 * Nothing here survives the request: cleanupJob removes the whole folder.
 */

const dirCodes = path.join(__dirname, "codes");
const dirOutputs = path.join(__dirname, "outputs");

for (const dir of [dirCodes, dirOutputs]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateFile(language, content) {
  const jobId = uuid();
  const jobDir = path.join(dirCodes, jobId);
  fs.mkdirSync(jobDir, { recursive: true });

  const sourcePath = path.join(jobDir, LANGUAGES[language].sourceName);
  fs.writeFileSync(sourcePath, content);

  // Compiled binaries land outside the source folder so a program that lists
  // its own directory sees only its source.
  const binaryPath = path.join(dirOutputs, jobId);

  return { jobId, jobDir, sourcePath, binaryPath };
}

// Called in a finally block, so it must never throw and never take the request
// down with it.
function cleanupJob({ jobDir, binaryPath }) {
  try {
    fs.rmSync(jobDir, { recursive: true, force: true });
    fs.rmSync(binaryPath, { force: true });
  } catch (err) {
    console.error("Cleanup failed:", err.message);
  }
}

module.exports = { generateFile, cleanupJob };
