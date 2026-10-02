const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { usersCollection } = require("../config/db");

// One place to change how long a session lasts.
const TOKEN_TTL = "1h";
const SALT_ROUNDS = 10;

// Signs the token we hand back on signup and login. The payload deliberately
// holds only the id: anything else in there goes stale the moment the user
// edits their profile, and it is readable by anyone who has the token.
function issueToken(userId) {
  return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET_KEY, {
    expiresIn: TOKEN_TTL,
  });
}

// Mongo hands back an _id of type ObjectId. Turning a user document into
// something safe to send over the wire means dropping the password hash.
function publicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

function isValidId(id) {
  return ObjectId.isValid(id);
}

async function signUp(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "username, email and password are all required." });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters." });
  }

  try {
    const users = await usersCollection();

    const existing = await users.findOne({
      $or: [{ email }, { username }],
    });
    if (existing) {
      const field = existing.email === email ? "Email" : "Username";
      return res.status(400).json({ message: `${field} is already taken.` });
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);
    const token = issueToken(result.insertedId);

    res.status(201).json({
      message: "User created successfully!",
      token,
      user: { _id: result.insertedId, username, email },
    });
  } catch (err) {
    // 11000 is Mongo's duplicate-key code, raised by the unique indexes when
    // two signups for the same email land at the same moment.
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email or username already taken." });
    }
    console.error("Error during signup:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const users = await usersCollection();
    const user = await users.findOne({ email });

    // The same message for "no such user" and "wrong password" on purpose:
    // telling them apart lets an attacker enumerate which emails are registered.
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const token = issueToken(user._id);

    res.json({
      message: "Login successful!",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

// Resolves the caller from their own token. The frontend hits this on reload
// to turn a stored token back into a logged-in session.
async function getMe(req, res) {
  try {
    const users = await usersCollection();
    const user = await users.findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error during fetching current user:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

/*
 * The directory of accounts.
 *
 * This used to be reachable with no token at all, and stripped only the
 * password — so anyone who could reach the port could read every registered
 * email address. That is the sort of list that ends up in a spam run, and
 * nothing in the application ever needed it.
 *
 * It now requires an account, and returns usernames rather than contact
 * details. An email belongs to the person it reaches; /me still returns your
 * own, because that one is yours.
 */
async function getAllUsers(req, res) {
  try {
    const users = await usersCollection();
    const all = await users
      .find({})
      .project({ username: 1, createdAt: 1 })
      .toArray();
    res.json(all);
  } catch (err) {
    console.error("Error during fetching users:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getUserProfile(req, res) {
  const currentID = req.params.id;

  if (!isValidId(currentID)) {
    return res.status(400).json({ message: "Not a valid user id." });
  }

  try {
    const users = await usersCollection();
    /*
     * Your own record comes back whole; somebody else's comes back as the
     * public view. Same route, and the token decides which — so a person can
     * still read their own email here without handing everybody else's out.
     */
    const mine = req.user?.id === currentID;
    const user = await users.findOne(
      { _id: new ObjectId(currentID) },
      { projection: mine ? { password: 0 } : { username: 1, createdAt: 1 } }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error during fetching user:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function updateUserProfile(req, res) {
  const currentID = req.params.id;
  const { username, email, password } = req.body;

  if (!isValidId(currentID)) {
    return res.status(400).json({ message: "Not a valid user id." });
  }
  // Holding a valid token proves who you are, not that you own this account.
  if (req.user.id !== currentID) {
    return res.status(403).json({ message: "You can only edit your own account." });
  }

  try {
    const users = await usersCollection();

    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (password) {
      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters." });
      }
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    const updated = await users.findOneAndUpdate(
      { _id: new ObjectId(currentID) },
      { $set: updateFields },
      { returnDocument: "after", projection: { password: 0 } }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User updated successfully!", user: updated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email or username already taken." });
    }
    console.error("Error during updating user:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteUserProfile(req, res) {
  const currentID = req.params.id;

  if (!isValidId(currentID)) {
    return res.status(400).json({ message: "Not a valid user id." });
  }
  if (req.user.id !== currentID) {
    return res.status(403).json({ message: "You can only delete your own account." });
  }

  try {
    const users = await usersCollection();
    const result = await users.deleteOne({ _id: new ObjectId(currentID) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json({ message: "User deleted successfully!" });
  } catch (err) {
    console.error("Error during deleting user:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  signUp,
  login,
  getMe,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};
