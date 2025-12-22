const User = require("../models/User");
const express = require("express");
const router = express.Router();
const { isLoggedIn, isAdmin } = require("../middleware/auth");

router.post("/ban/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.banned = true;
    await user.save();
    res.json({ message: "User banned successfully" });
  } catch (err) {
    console.error("POST /ban/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/unban/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.banned = false;
    await user.save();
    res.json({ message: "User unbanned successfully" });
  } catch (err) {
    console.error("POST /unban/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
