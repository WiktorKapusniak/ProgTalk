const User = require("../models/User");
const express = require("express");
const router = express.Router();
const { isLoggedIn, isAdmin } = require("../middleware/auth");

// GET /api/admin/users/banned
router.get("/users/banned", async (req, res) => {
  try {
    const bannedUsers = await User.find({ banned: true }).select("-password");
    res.status(200).json(bannedUsers);
  } catch (err) {
    console.error("GET /users/banned error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/ban/:username
router.get("/users/pending-approval", async (req, res) => {
  try {
    const pendingUsers = await User.find({ approved: false }).select("-password");
    res.status(200).json(pendingUsers);
  } catch (err) {
    console.error("GET /users/pending-approval error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/users/:id/approve
router.post("/users/:id/approve", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.approved = true;
    await user.save();
    const { notifyAdmins } = require("../socket/handlers/admin");

    const io = req.app.get("io");
    notifyAdmins(io, "newApproval", { message: "Użytkownik został approved przez admina" });

    res.status(200).json({ message: "User approved successfully" });
  } catch (err) {
    console.error("POST /users/:id/approve error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
