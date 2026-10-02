/*
 * Friends.
 *
 * One row per pair of people, in a `friendships` collection, keyed by the two
 * user ids SORTED. That ordering is the whole design:
 *
 *   - A asking B and B asking A are the same row, so the unique index refuses
 *     the second one. No duplicate requests, and no way for two people who
 *     press the button at the same moment to end up with two rows facing
 *     opposite directions.
 *   - Every lookup is one query on one field, whichever side you are on.
 *
 * `requestedBy` remembers which way the request went, which is all that is
 * needed to tell an invitation you received from one you sent.
 *
 * Removing a friendship, declining a request and cancelling one you sent are
 * the same operation — delete the row — so they are one endpoint. What differs
 * is only how it is described in the interface.
 *
 * Nothing here ever returns an email address. Your own is yours; somebody
 * else's is not yours to hand out because you know their username.
 */

const { ObjectId } = require("mongodb");
const { usersCollection, friendshipsCollection, submissionsCollection } = require("../config/db");

const SEARCH_LIMIT = 10;

// Sorted, so the pair reads the same from either side.
function pairOf(a, b) {
  return [String(a), String(b)].sort();
}

/*
 * The unique key for a pair: the same two ids, joined into one string.
 *
 * A scalar rather than the array, because a unique index on an array is
 * multikey and would constrain each id individually — one friendship per
 * person. See the index in db.js.
 */
function keyOf(a, b) {
  return pairOf(a, b).join(":");
}

/*
 * A user's public face: who they are, never how to contact them.
 *
 * One function so no route can forget. Adding a field here is a deliberate
 * decision about what everybody is allowed to see.
 */
function publicUser(user, extra = {}) {
  return {
    id: String(user._id),
    username: user.username,
    joinedAt: user.createdAt || null,
    ...extra,
  };
}

/*
 * A search box is a regular expression injection waiting to happen: a query of
 * ".*" would match everybody, and a pathological one can be made to run for a
 * very long time. Every special character is escaped so the text is only ever
 * text.
 */
function literal(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function solvedCounts(userIds) {
  if (!userIds.length) return {};
  const submissions = await submissionsCollection();
  const rows = await submissions
    .aggregate([
      { $match: { userId: { $in: userIds.map(String) }, verdict: "accepted" } },
      { $group: { _id: { user: "$userId", slug: "$slug" } } },
      { $group: { _id: "$_id.user", solved: { $sum: 1 } } },
    ])
    .toArray();

  const counts = {};
  for (const row of rows) counts[row._id] = row.solved;
  return counts;
}

/*
 * Everything about this person's friendships, in one request: who they are
 * friends with, who has asked them, and who they have asked.
 */
async function listFriends(req, res) {
  try {
    const me = String(req.user.id);
    const friendships = await friendshipsCollection();
    const rows = await friendships.find({ pair: me }).toArray();

    const otherId = (row) => row.pair.find((id) => id !== me) || me;
    const ids = rows.map(otherId);

    const users = await usersCollection();
    const people = await users
      .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } })
      .project({ username: 1, createdAt: 1 })
      .toArray();
    const byId = new Map(people.map((person) => [String(person._id), person]));

    const accepted = rows.filter((row) => row.status === "accepted");
    const counts = await solvedCounts(accepted.map(otherId));

    const friends = [];
    const incoming = [];
    const outgoing = [];

    for (const row of rows) {
      const person = byId.get(otherId(row));
      // The other account was deleted while the row survived. Skip it rather
      // than render a friendship with nobody.
      if (!person) continue;

      if (row.status === "accepted") {
        friends.push(publicUser(person, {
          solved: counts[otherId(row)] || 0,
          since: row.respondedAt || row.createdAt,
        }));
      } else if (row.requestedBy === me) {
        outgoing.push(publicUser(person, { sentAt: row.createdAt }));
      } else {
        incoming.push(publicUser(person, { sentAt: row.createdAt }));
      }
    }

    friends.sort((a, b) => b.solved - a.solved || a.username.localeCompare(b.username));
    res.json({ friends, incoming, outgoing });
  } catch (err) {
    console.error("Error listing friends:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/*
 * Find people by username.
 *
 * Username only — never email. Searching by email would turn this box into a
 * way of confirming whether a given address has an account here, which is
 * nobody's business but the owner's.
 *
 * Each result carries how you already stand with that person, so the interface
 * can offer the right button instead of offering "Add" to somebody who asked
 * you yesterday.
 */
async function searchUsers(req, res) {
  const term = String(req.query.q || "").trim();
  if (term.length < 2) return res.json({ results: [] });

  try {
    const me = String(req.user.id);
    const users = await usersCollection();
    const matches = await users
      .find({ username: { $regex: literal(term), $options: "i" }, _id: { $ne: new ObjectId(me) } })
      .project({ username: 1, createdAt: 1 })
      .limit(SEARCH_LIMIT)
      .toArray();

    if (!matches.length) return res.json({ results: [] });

    const friendships = await friendshipsCollection();
    // Matching an array field against a scalar asks "does this array contain
    // it", which is exactly the question: every row I am part of.
    const rows = await friendships.find({ pair: me }).toArray();
    const relation = new Map();
    for (const row of rows) {
      const other = row.pair.find((id) => id !== me) || me;
      relation.set(
        other,
        row.status === "accepted" ? "friends" : row.requestedBy === me ? "requested" : "awaiting-you"
      );
    }

    res.json({
      results: matches.map((person) =>
        publicUser(person, { relation: relation.get(String(person._id)) || "none" })
      ),
    });
  } catch (err) {
    console.error("Error searching users:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function sendRequest(req, res) {
  const target = String(req.body.userId || "");
  const me = String(req.user.id);

  if (!ObjectId.isValid(target)) {
    return res.status(400).json({ message: "That is not a valid user." });
  }
  if (target === me) {
    return res.status(400).json({ message: "You cannot add yourself." });
  }

  try {
    const users = await usersCollection();
    const person = await users.findOne({ _id: new ObjectId(target) }, { projection: { username: 1 } });
    if (!person) return res.status(404).json({ message: "No such user." });

    const friendships = await friendshipsCollection();
    const pair = pairOf(me, target);
    const existing = await friendships.findOne({ pairKey: keyOf(me, target) });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(409).json({ message: `You and ${person.username} are already friends.` });
      }
      /*
       * They asked first. Pressing "add" is the same intention as pressing
       * "accept", so treat it as one rather than reporting a clash the person
       * would not understand.
       */
      if (existing.requestedBy !== me) {
        await friendships.updateOne(
          { _id: existing._id },
          { $set: { status: "accepted", respondedAt: new Date() } }
        );
        return res.json({ status: "accepted", message: `You and ${person.username} are now friends.` });
      }
      return res.status(409).json({ message: `You have already asked ${person.username}.` });
    }

    await friendships.insertOne({
      pair,
      pairKey: keyOf(me, target),
      requestedBy: me,
      status: "pending",
      createdAt: new Date(),
      respondedAt: null,
    });
    res.status(201).json({ status: "pending", message: `Request sent to ${person.username}.` });
  } catch (err) {
    // The unique index caught a request the check above could not: the other
    // person pressed their button in the same instant. Their row stands.
    if (err.code === 11000) {
      return res.status(409).json({ message: "There is already a request between you." });
    }
    console.error("Error sending friend request:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/*
 * Accept an invitation.
 *
 * Only the person who RECEIVED it may accept, which is the check that stops
 * somebody accepting on your behalf — or accepting their own request and
 * adding themselves to your friends list.
 */
async function acceptRequest(req, res) {
  const other = String(req.params.userId || "");
  const me = String(req.user.id);

  if (!ObjectId.isValid(other)) {
    return res.status(400).json({ message: "That is not a valid user." });
  }

  try {
    const friendships = await friendshipsCollection();
    const outcome = await friendships.updateOne(
      { pairKey: keyOf(me, other), status: "pending", requestedBy: { $ne: me } },
      { $set: { status: "accepted", respondedAt: new Date() } }
    );

    if (!outcome.matchedCount) {
      return res.status(404).json({ message: "There is no request from that person to accept." });
    }
    res.json({ status: "accepted" });
  } catch (err) {
    console.error("Error accepting friend request:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/*
 * Decline, cancel, or unfriend.
 *
 * All three are "remove the row between these two people", and both parties
 * are entitled to do it: you may withdraw a request you sent, refuse one you
 * received, and end a friendship you are in.
 */
async function removeFriendship(req, res) {
  const other = String(req.params.userId || "");
  const me = String(req.user.id);

  if (!ObjectId.isValid(other)) {
    return res.status(400).json({ message: "That is not a valid user." });
  }

  try {
    const friendships = await friendshipsCollection();
    const outcome = await friendships.deleteOne({ pairKey: keyOf(me, other) });
    if (!outcome.deletedCount) {
      return res.status(404).json({ message: "You have no connection with that person." });
    }
    res.json({ status: "removed" });
  } catch (err) {
    console.error("Error removing friendship:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { listFriends, searchUsers, sendRequest, acceptRequest, removeFriendship };
