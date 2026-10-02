/*
 * Pair Lab rooms: two or more people editing one solution together.
 *
 * A room is a small record — which problem, which language, who is allowed in,
 * and the last saved state of the document. The live editing happens over the
 * WebSocket in realtime.js; this file is only about creating rooms and
 * deciding who may enter one.
 *
 * You may only invite people you are already friends with. That is the whole
 * access model, and it is deliberately narrow: a room hands somebody a live
 * editing session with you, which is a lot more than reading your profile, so
 * "anybody with the link" is not a door worth opening by default.
 */

const { ObjectId } = require("mongodb");
const { roomsCollection, usersCollection, friendshipsCollection } = require("../config/db");

/*
 * Each participant gets a colour, and it comes from their position in the
 * room's member list rather than from their name.
 *
 * Deriving it from the id would be prettier — the same person would be the
 * same colour everywhere — but two people in a two person room could then
 * collide, and a shared editor where both cursors are the same pink is worse
 * than one where your colour varies between rooms.
 */
const ROOM_COLOURS = [
  { name: "pink", hex: "#ec4899" },
  { name: "blue", hex: "#3b82f6" },
  { name: "emerald", hex: "#10b981" },
  { name: "amber", hex: "#f59e0b" },
  { name: "violet", hex: "#8b5cf6" },
];

function colourFor(index) {
  return ROOM_COLOURS[index % ROOM_COLOURS.length];
}

async function areFriends(a, b) {
  const friendships = await friendshipsCollection();
  const pairKey = [String(a), String(b)].sort().join(":");
  const row = await friendships.findOne({ pairKey, status: "accepted" });
  return Boolean(row);
}

/*
 * A room, as everybody in it should see it: who is in, what colour they are,
 * and never an email address.
 */
async function describe(room) {
  const users = await usersCollection();
  const people = await users
    .find({ _id: { $in: room.members.map((id) => new ObjectId(id)) } })
    .project({ username: 1 })
    .toArray();
  const byId = new Map(people.map((person) => [String(person._id), person.username]));

  return {
    id: String(room._id),
    slug: room.slug,
    language: room.language,
    ownerId: room.ownerId,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    members: room.members.map((id, index) => ({
      id,
      // A member whose account was deleted keeps their seat but loses a name.
      username: byId.get(id) || "someone",
      colour: colourFor(index).hex,
      colourName: colourFor(index).name,
      isOwner: id === room.ownerId,
    })),
  };
}

async function createRoom(req, res) {
  const slug = String(req.body.slug || "").trim();
  const language = String(req.body.language || "cpp");
  const me = String(req.user.id);

  if (!slug) return res.status(400).json({ message: "Which problem is the room for?" });

  try {
    const rooms = await roomsCollection();
    const now = new Date();
    const room = {
      slug,
      language,
      ownerId: me,
      members: [me],
      document: String(req.body.document || ""),
      version: 0,
      createdAt: now,
      updatedAt: now,
    };
    const { insertedId } = await rooms.insertOne(room);
    res.status(201).json(await describe({ ...room, _id: insertedId }));
  } catch (err) {
    console.error("Error creating room:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/* Every room this person belongs to, most recently used first. */
async function listRooms(req, res) {
  try {
    const rooms = await roomsCollection();
    const mine = await rooms
      .find({ members: String(req.user.id) })
      .sort({ updatedAt: -1 })
      .limit(30)
      .toArray();
    res.json({ rooms: await Promise.all(mine.map(describe)) });
  } catch (err) {
    console.error("Error listing rooms:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getRoom(req, res) {
  const id = String(req.params.id || "");
  if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Not a valid room." });

  try {
    const rooms = await roomsCollection();
    const room = await rooms.findOne({ _id: new ObjectId(id) });
    if (!room) return res.status(404).json({ message: "No such room." });
    /*
     * Not a member, not a room. A 404 rather than a 403 so that guessing at
     * ids cannot be used to discover which rooms exist.
     */
    if (!room.members.includes(String(req.user.id))) {
      return res.status(404).json({ message: "No such room." });
    }
    res.json(await describe(room));
  } catch (err) {
    console.error("Error reading room:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function inviteToRoom(req, res) {
  const id = String(req.params.id || "");
  const guest = String(req.body.userId || "");
  const me = String(req.user.id);

  if (!ObjectId.isValid(id) || !ObjectId.isValid(guest)) {
    return res.status(400).json({ message: "Not a valid room or person." });
  }
  if (guest === me) return res.status(400).json({ message: "You are already here." });

  try {
    const rooms = await roomsCollection();
    const room = await rooms.findOne({ _id: new ObjectId(id) });
    if (!room || !room.members.includes(me)) {
      return res.status(404).json({ message: "No such room." });
    }
    if (room.members.includes(guest)) {
      return res.status(409).json({ message: "They are already in this room." });
    }
    if (!(await areFriends(me, guest))) {
      return res.status(403).json({ message: "You can only invite people you are friends with." });
    }

    await rooms.updateOne(
      { _id: room._id },
      { $addToSet: { members: guest }, $set: { updatedAt: new Date() } }
    );
    const fresh = await rooms.findOne({ _id: room._id });
    res.json(await describe(fresh));
  } catch (err) {
    console.error("Error inviting to room:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/*
 * Leaving.
 *
 * The room itself is kept when the last person leaves rather than deleted: the
 * document in it is work somebody did, and a stray click on "Leave" should not
 * destroy it. An empty room simply stops appearing in anybody's list.
 */
async function leaveRoom(req, res) {
  const id = String(req.params.id || "");
  if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Not a valid room." });

  try {
    const rooms = await roomsCollection();
    const outcome = await rooms.updateOne(
      { _id: new ObjectId(id), members: String(req.user.id) },
      { $pull: { members: String(req.user.id) }, $set: { updatedAt: new Date() } }
    );
    if (!outcome.matchedCount) return res.status(404).json({ message: "No such room." });
    res.json({ left: true });
  } catch (err) {
    console.error("Error leaving room:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createRoom, listRooms, getRoom, inviteToRoom, leaveRoom, describe, colourFor };
