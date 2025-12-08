const User = require("../models/User");
const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/auth");
const { hashPassword } = require("../utils/auth");
router.get("/:id", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (req.user._id.toString() !== id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      role: user.role,
      Banned: user.Banned,
      currentPage: user.currentPage,
    });
  } catch (err) {
    console.error("Get /:username error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/:id", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (req.user._id.toString() !== id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const body = req.body;
    if (body.username) user.username = body.username;
    if (body.password) user.password = await hashPassword(body.password);
    await user.save();
    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Patch /:username error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
