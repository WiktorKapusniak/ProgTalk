const express = require("express");
const router = express.Router();
const Tag = require("../models/Tag");
const { isAdmin } = require("../middleware/auth");
// POST /api/tags
router.post("/", isAdmin, async (req, res) => {
  const { name } = req.body;
  try {
    const newTag = new Tag({ name });
    await newTag.save();
    res.status(201).json({ message: "Tag created successfully", tag: newTag });
  } catch (err) {
    console.error("POST /api/tags error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/tags
router.get("/", async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json({ tags });
  } catch (err) {
    console.error("GET /api/tags error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
