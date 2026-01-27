const User = require("../models/User");
const express = require("express");
const router = express.Router();
const { isLoggedIn, isAdmin } = require("../middleware/auth");

router.post("/ban/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.isAdmin) {
      return res.status(403).json({ message: "Cannot ban an admin user" });
    }
    if (user.banned) {
      return res.status(400).json({ message: "User is already banned" });
    }
    user.banned = true;
    await user.save();
    res.json({ message: "User banned successfully" });
  } catch (err) {
    console.error("POST /ban/:username error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/unban/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.banned) {
      return res.status(400).json({ message: "User is not banned" });
    }
    user.banned = false;
    await user.save();
    res.json({ message: "User unbanned successfully" });
  } catch (err) {
    console.error("POST /unban/:username error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
