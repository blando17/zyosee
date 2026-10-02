/*
 * Core CS interview prep: the part the server owns.
 *
 * The questions, answers, diagrams and numericals are NOT here. They are
 * static content that ships with the frontend, because they are the same for
 * everybody and change only when somebody edits a file. What the server owns
 * is the one thing that differs per person and has to survive a new browser:
 * which questions they have marked Done, and which they want to see again.
 *
 * WHY THE SERVER DOES NOT VALIDATE QUESTION IDS
 *
 * It cannot, without a copy of the question bank — and keeping a second copy
 * in the database is exactly the coupling this design avoids. So an id is
 * treated as an opaque string: bounded in length, bounded in count, and never
 * interpreted. The worst a bad id can do is sit in an array that no screen
 * ever looks at, because the frontend only ever asks "is this question, which
 * I already have, in that list".
 *
 * The limits below are what stops that from being a place to store data.
 */

const { coreCsCollection } = require("../config/db");

// Subjects this section knows about. OS is the only one with content today;
// the rest are listed so a request for one is an honest "not yet" rather than
// silently creating a row for a subject that does not exist.
const SUBJECTS = ["os", "oops", "dbms", "sql", "cn"];

// An id is "os-sched-12" shaped. Sixty characters is roughly three times the
// longest the content generator produces, which leaves room to rename things
// without leaving anybody's saved progress behind.
const MAX_ID_LENGTH = 60;

/*
 * A ceiling on how many questions one person may have marked.
 *
 * The OS bank is a few hundred questions and all five subjects together will
 * not reach four thousand, so this never bites a real user. It is here so that
 * a script cannot turn somebody's progress row into a megabyte of junk: Mongo
 * documents have a 16 MB limit, and a row that large would break every read of
 * it rather than just the write that caused it.
 */
const MAX_MARKS = 4000;

function badSubject(subject) {
  return !SUBJECTS.includes(subject);
}

function shape(row) {
  return {
    subject: row?.subject || "os",
    done: row?.done || [],
    revise: row?.revise || [],
    updatedAt: row?.updatedAt || null,
  };
}

/*
 * GET /corecs/:subject — everything this person has marked, in one read.
 *
 * Absent is not an error. Somebody who has never opened the section has no
 * row, and answering 404 would make every dashboard handle a special case for
 * the most common state there is. Empty lists say the same thing better.
 */
async function getProgress(req, res) {
  const { subject } = req.params;
  if (badSubject(subject)) {
    return res.status(400).json({ message: "Unknown subject." });
  }

  try {
    const corecs = await coreCsCollection();
    const row = await corecs.findOne({ userId: req.user.id, subject });
    return res.json(shape(row || { subject }));
  } catch (err) {
    console.error("Reading Core CS progress failed:", err);
    return res.status(500).json({ message: "Could not load your progress." });
  }
}

/*
 * POST /corecs/:subject/mark — one question moves to one state.
 *
 * The three states are exclusive by construction rather than by convention:
 * every write pulls the id out of BOTH arrays first and then pushes it into at
 * most one. Marking something Done that was queued for revision therefore
 * takes it off the queue, which is what anybody pressing that button means,
 * and there is no path that leaves an id in both lists.
 *
 * "none" is how a question is un-marked, and it is the same operation with
 * nothing pushed afterwards.
 */
async function mark(req, res) {
  const { subject } = req.params;
  const { id, state } = req.body || {};

  if (badSubject(subject)) {
    return res.status(400).json({ message: "Unknown subject." });
  }
  if (typeof id !== "string" || !id.trim() || id.length > MAX_ID_LENGTH) {
    return res.status(400).json({ message: "A question id is required." });
  }
  if (!["done", "revise", "none"].includes(state)) {
    return res.status(400).json({ message: "State must be done, revise or none." });
  }

  const questionId = id.trim();

  try {
    const corecs = await coreCsCollection();

    /*
     * Two writes, not one, and they cannot be merged.
     *
     * Mongo refuses $pull and $addToSet on the same field in a single update —
     * "Updating the path 'done' would create a conflict" — so removing the id
     * from everywhere and then adding it back to one place has to be two
     * round trips. The order matters: pull first, so a crash between them
     * leaves the question unmarked rather than marked twice.
     */
    await corecs.updateOne(
      { userId: req.user.id, subject },
      {
        $pull: { done: questionId, revise: questionId },
        $setOnInsert: { userId: req.user.id, subject },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    if (state !== "none") {
      const field = state === "done" ? "done" : "revise";
      /*
       * The size guard rides on the query, not on a read beforehand.
       *
       * Checking the count first and then writing is a race two tabs can lose;
       * making the cap part of the filter means the database decides. A write
       * that matches nothing here is a person who has somehow marked four
       * thousand questions, which is answered below rather than silently
       * dropped.
       */
      const result = await corecs.updateOne(
        {
          userId: req.user.id,
          subject,
          [`${field}.${MAX_MARKS - 1}`]: { $exists: false },
        },
        { $addToSet: { [field]: questionId }, $set: { updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res
          .status(409)
          .json({ message: "You have marked as many questions as this list holds." });
      }
    }

    const row = await corecs.findOne({ userId: req.user.id, subject });
    return res.json(shape(row));
  } catch (err) {
    console.error("Marking a Core CS question failed:", err);
    return res.status(500).json({ message: "Could not save that." });
  }
}

/*
 * POST /corecs/:subject/reset — clear one list, or both.
 *
 * Emptying the revision queue after a session is the common case; wiping Done
 * is the rare, deliberate "start this subject again". Both are destructive and
 * the browser confirms before calling, but the server still refuses a reset
 * that names no list rather than guessing that the caller meant everything.
 */
async function reset(req, res) {
  const { subject } = req.params;
  const { lists } = req.body || {};

  if (badSubject(subject)) {
    return res.status(400).json({ message: "Unknown subject." });
  }

  const wanted = (Array.isArray(lists) ? lists : []).filter(
    (name) => name === "done" || name === "revise"
  );
  if (!wanted.length) {
    return res.status(400).json({ message: "Say which list to clear." });
  }

  try {
    const corecs = await coreCsCollection();
    const cleared = {};
    wanted.forEach((name) => {
      cleared[name] = [];
    });

    await corecs.updateOne(
      { userId: req.user.id, subject },
      { $set: { ...cleared, updatedAt: new Date() }, $setOnInsert: { userId: req.user.id, subject } },
      { upsert: true }
    );

    const row = await corecs.findOne({ userId: req.user.id, subject });
    return res.json(shape(row));
  } catch (err) {
    console.error("Resetting Core CS progress failed:", err);
    return res.status(500).json({ message: "Could not clear that." });
  }
}

/*
 * GET /corecs/counts — how many questions are waiting, across every subject.
 *
 * Its own endpoint because the navigation bar asks on every page change and
 * wants two numbers, not two hundred question ids. Same reasoning as the
 * arena's /duels/waiting.
 */
async function counts(req, res) {
  try {
    const corecs = await coreCsCollection();
    const rows = await corecs.find({ userId: req.user.id }).toArray();

    const bySubject = {};
    let revise = 0;
    rows.forEach((row) => {
      const done = row.done?.length || 0;
      const queued = row.revise?.length || 0;
      bySubject[row.subject] = { done, revise: queued };
      revise += queued;
    });

    return res.json({ revise, bySubject });
  } catch (err) {
    console.error("Counting Core CS progress failed:", err);
    // A failure here costs a badge, not a navigation bar.
    return res.json({ revise: 0, bySubject: {} });
  }
}

module.exports = { getProgress, mark, reset, counts };
