require("dotenv").config();

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { hashPassword, verifyPassword } = require("../utils/auth");
const { notifyAdmins } = require("../socket/handlers/admin");
const { validateLogin, validateRegister } = require("../middleware/validation");
const jwt = require("jsonwebtoken");

// POST /api/auth/login
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    const user = await User.findOne({ username });
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.json({
      token,
      userId: user._id,
    });
  } catch (err) {
    console.error("Post /login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/register
router.post("/register", validateRegister, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email and password are required" });
    }
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: "Username or email already in use" });
    }
    const newUser = new User({
      username,
      password: await hashPassword(password),
      email,
      createdAt: new Date(),
    });
    await newUser.save();
    const io = req.app.get("io");
    if (io) {
      notifyAdmins(io, "newRegistration", { message: "Nowy użytkownik czeka na approval" });
    }
    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Post /register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
