const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { recordLogin, recordActivity } = require("../lib/recordActivity");

const router = express.Router();

// Helper to generate JWT
function generateToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment");
  }

  return jwt.sign(
    {
      id: String(user._id),
      email: user.email,
      name: user.name,
    },
    secret,
    { expiresIn: "7d" }
  );
}

// POST /auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name || "",
      email,
      password: hashedPassword,
    });

    const token = generateToken(user);

    await recordActivity(req, user._id, "signup", { email: user.email });

    return res.status(201).json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email is already registered" });
    }
    return res.status(500).json({ error: "Failed to sign up" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user);

    await recordLogin(req, user._id, true);
    await recordActivity(req, user._id, "login", { email: user.email });

    return res.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Failed to log in" });
  }
});

module.exports = router;

