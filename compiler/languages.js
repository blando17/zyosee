/*
 * Everything language-specific lives here, so adding a new language is one
 * entry in this table plus nothing else.
 *
 * sourceName  what the file must be called on disk. Java is the awkward one:
 *             the public class name has to match the filename, so every Java
 *             job gets its own folder containing a file literally called
 *             Main.java rather than a UUID-named file.
 * compile     given the job's paths, returns the shell command to compile, or
 *             null for interpreted languages that skip the compile step.
 * run         returns [command, args] to execute, run with the job folder as
 *             the working directory.
 * timeFactor  multiplies a problem's time limit for this language. The same
 *             correct algorithm is simply slower in an interpreter than in
 *             compiled C, so holding every language to one wall-clock number
 *             fails correct Python for being written in Python. Real judges do
 *             this; the factors here are the usual ones.
 */

const path = require("path");

const LANGUAGES = {
  cpp: {
    label: "C++",
    sourceName: "main.cpp",
    compile: ({ sourcePath, binaryPath }) =>
      `g++ "${sourcePath}" -o "${binaryPath}" -std=c++17 -O2`,
    run: ({ binaryPath }) => [binaryPath, []],
    timeFactor: 1,
  },
  c: {
    label: "C",
    sourceName: "main.c",
    compile: ({ sourcePath, binaryPath }) =>
      `gcc "${sourcePath}" -o "${binaryPath}" -std=c11 -O2`,
    run: ({ binaryPath }) => [binaryPath, []],
    timeFactor: 1,
  },
  py: {
    label: "Python 3",
    sourceName: "main.py",
    compile: () => null,
    run: ({ sourcePath }) => ["python3", [sourcePath]],
    timeFactor: 3,
  },
  java: {
    label: "Java",
    sourceName: "Main.java",
    compile: ({ sourcePath, jobDir }) => `javac -d "${jobDir}" "${sourcePath}"`,
    run: ({ jobDir }) => ["java", ["-cp", jobDir, "Main"]],
    timeFactor: 2,
  },
};

function isSupported(language) {
  return Object.prototype.hasOwnProperty.call(LANGUAGES, language);
}

// A problem states one time limit; this is what that limit becomes for a
// particular language.
function timeLimitFor(language, baseMs) {
  return Math.round(baseMs * (LANGUAGES[language].timeFactor || 1));
}

module.exports = { LANGUAGES, isSupported, timeLimitFor };
