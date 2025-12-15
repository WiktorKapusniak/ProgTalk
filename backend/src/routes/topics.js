const User = require("../models/User");
const express = require("express");
const router = express.Router();
const Topic = require("../models/Topic");
const { isAdmin, isModerator, loadTopic, checkIfBlockedInTopic } = require("../middleware/auth");
// POST /api/topics
router.post("/", async (req, res) => {
  const { title, description } = req.body;
  try {
    const mainMod = await User.findById(req.user._id);
    const newTopic = new Topic({
      title,
      description,
      parentTopic: null,
      mainModerator: req.user._id,
    });
    await newTopic.save();
    res.status(201).json({ message: "Topic created successfully", topic: newTopic });
  } catch (err) {
    console.error("POST / create topic error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/topics?page=1&limit=20&parentId=null
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, parentId } = req.query;
    const skip = (page - 1) * limit;

    const query = { isHidden: false };

    if (parentId !== undefined && parentId !== null) {
      query.parentTopic = parentId;
    } else {
      query.parentTopic = null;
    }

    const topics = await Topic.find(query)
      .populate("mainModerator", "username")
      .populate("moderators", "username")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Topic.countDocuments(query);

    res.json({
      topics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /topics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/topics/:id/subtopics
router.get("/:id/subtopics", async (req, res) => {
  try {
    const { id } = req.params;
    const subtopics = await Topic.find({ parentTopic: id, isHidden: false })
      .populate("mainModerator", "username")
      .populate("moderators", "username");
    res.json(subtopics);
  } catch (err) {
    console.error("GET /:id/subtopics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/topics/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await Topic.findById(id).populate("mainModerator", "username").populate("moderators", "username");
    if (!topic || topic.isHidden) {
      return res.status(404).json({ message: "Topic not found" });
    }
    res.json(topic);
  } catch (err) {
    console.error("GET /:id topic error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/topics/:id
router.patch("/:id", loadTopic, isModerator, async (req, res) => {
  try {
    const topic = req.topic;
    const { title, description } = req.body;

    if (title) topic.title = title;
    if (description) topic.description = description;

    await topic.save();
    res.json({ message: "Topic updated successfully", topic });
  } catch (err) {
    console.error("PATCH /:id topic error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/topics/:id/subtopics
router.post("/:id/subtopics", loadTopic, isModerator, async (req, res) => {
  try {
    const parentTopic = req.topic;
    const { title, description } = req.body;

    if (parentTopic.isClosed) {
      return res.status(403).json({ message: "Cannot add subtopic to closed topic" });
    }

    const newSubtopic = new Topic({
      title,
      description,
      parentTopic: parentTopic._id,
      mainModerator: req.user._id,
    });

    await newSubtopic.save();
    res.status(201).json({ message: "Subtopic created successfully", topic: newSubtopic });
  } catch (err) {
    console.error("POST /:id/subtopics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/topics/:id/moderators
router.post("/:id/moderators", loadTopic, isModerator, async (req, res) => {
  try {
    const topic = req.topic;
    const { moderatorId } = req.body;

    const userToAdd = await User.findById(moderatorId);
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    if (topic.moderators.includes(moderatorId) || topic.mainModerator.toString() === moderatorId) {
      return res.status(400).json({ message: "User is already a moderator" });
    }
    topic.moderators.push(moderatorId);
    await topic.save();
    res.json({ message: "Moderator added successfully", topic });
  } catch (err) {
    console.error("POST /:id/moderators error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// DELETE /api/topics/:id/moderators/:moderatorId
router.delete("/:id/moderators/:moderatorId", loadTopic, isModerator, async (req, res) => {
  try {
    const topic = req.topic;
    const { moderatorId } = req.params;

    if (topic.mainModerator.toString() === moderatorId) {
      return res.status(400).json({ message: "Cannot remove main moderator" });
    }
    if (!topic.moderators.includes(moderatorId)) {
      return res.status(404).json({ message: "Moderator not found in this topic" });
    }
    topic.moderators = topic.moderators.filter((modId) => modId.toString() !== moderatorId);
    await topic.save();
    res.json({ message: "Moderator removed successfully", topic });
  } catch (err) {
    console.error("DELETE /:id/moderators/:moderatorId error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/topics/:id/block-user
router.post("/:id/block-user", loadTopic, isModerator, async (req, res) => {
  try {
    const topic = req.topic;
    const { userId, allowedSubtopics = [] } = req.body;

    const userToBlock = await User.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyBlocked = topic.blockedUsers.find((b) => b.user.toString() === userId);
    if (alreadyBlocked) {
      return res.status(400).json({ message: "User already blocked in this topic" });
    }

    topic.blockedUsers.push({
      user: userId,
      allowedSubtopics: allowedSubtopics || [],
    });

    await topic.save();
    res.json({ message: "User blocked successfully", topic });
  } catch (err) {
    console.error("POST /:id/block-user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/topics/:id/unblock-user
router.post("/:id/unblock-user", loadTopic, isModerator, async (req, res) => {
  try {
    const topic = req.topic;
    const { userId } = req.body;

    topic.blockedUsers = topic.blockedUsers.filter((b) => b.user.toString() !== userId);

    await topic.save();
    res.json({ message: "User unblocked successfully" });
  } catch (err) {
    console.error("POST /:id/unblock-user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/topics/:id/close
router.post("/:id/close", loadTopic, isAdmin, async (req, res) => {
  try {
    const topic = req.topic;
    if (topic.isClosed) {
      return res.status(400).json({ message: "Topic is already closed" });
    }
    topic.isClosed = true;
    await topic.save();
    res.json({ message: "Topic closed successfully" });
  } catch (err) {
    console.error("POST /api/topics/:id/close:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// POST /api/topics/:id/open
router.post("/:id/open", loadTopic, isAdmin, async (req, res) => {
  try {
    const topic = req.topic;
    if (!topic.isClosed) {
      return res.status(400).json({ message: "Topic is already open" });
    }
    topic.isClosed = false;
    await topic.save();
    res.json({ message: "Topic opened successfully" });
  } catch (err) {
    console.error("POST /api/topics/:id/open:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//POST /api/topics/:id/hide
router.post("/:id/hide", loadTopic, isAdmin, async (req, res) => {
  try {
    const topic = req.topic;
    if (topic.isHidden) {
      return res.status(400).json({ message: "Topic is already hidden" });
    }
    topic.isHidden = true;
    await topic.save();
    res.json({ message: "Topic hidden successfully" });
  } catch (err) {
    console.error("POST /api/topics/:id/hide:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//POST /api/topics/:id/unhide
router.post("/:id/unhide", loadTopic, isAdmin, async (req, res) => {
  try {
    const topic = req.topic;
    if (!topic.isHidden) {
      return res.status(400).json({ message: "Topic is already visible" });
    }
    topic.isHidden = false;
    await topic.save();
    res.json({ message: "Topic unhidden successfully" });
  } catch (err) {
    console.error("POST /api/topics/:id/unhide:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
