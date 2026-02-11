const User = require("../models/User");
const express = require("express");
const router = express.Router();
const Topic = require("../models/Topic");
const { isAdmin, isLoggedIn, isModerator, loadTopic, checkIfBlockedInTopic } = require("../middleware/auth");
const { validateTopicCreation } = require("../middleware/validation");

async function getAllSubtopicIds(topicId) {
  const subtopics = await Topic.find({ parentTopic: topicId }, "_id");
  let ids = subtopics.map((t) => t._id.toString());
  for (const sub of subtopics) {
    const subIds = await getAllSubtopicIds(sub._id);
    ids = ids.concat(subIds);
  }
  return ids;
}

// POST /api/topics
router.post("/", validateTopicCreation, async (req, res) => {
  const { title, description } = req.body;
  try {
    const io = req.app.get("io");
    const newTopic = new Topic({
      title,
      description,
      parentTopic: null,
      mainModerator: req.user._id,
    });
    io.to(`topics`).emit("newTopic", { newTopic: newTopic });
    await newTopic.save();
    res.status(201).json({ message: "Topic created successfully", topic: newTopic });
  } catch (err) {
    console.error("POST / create topic error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/topics?page=1&limit=20&parentId=null
router.get("/", isLoggedIn, async (req, res) => {
  try {
    const { page = 1, limit = 10, parentId } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (!req.user || req.user.role !== "admin") {
      query.isHidden = false;
    }
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
router.get("/:id/subtopics", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    let query = { parentTopic: id };
    if (!user || user.role !== "admin") {
      query.isHidden = false;
    }
    const subtopics = await Topic.find(query)
      .populate("mainModerator", "username")
      .populate("moderators", "username")
      .sort({ createdAt: -1 });
    res.json(subtopics);
  } catch (err) {
    console.error("GET /:id/subtopics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/topics/:id
router.get("/:id", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await Topic.findById(id).populate("mainModerator", "username").populate("moderators", "username");
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }
    if (topic.isHidden) {
      if (!req.user || req.user.role !== "admin") {
        return res.status(404).json({ message: "Topic not found" });
      }
    }
    res.json(topic);
  } catch (err) {
    console.error("GET /:id topic error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/topics/:id
router.patch("/:id", loadTopic, async (req, res) => {
  try {
    const topic = req.topic;
    if (!req.user || topic.mainModerator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only main moderator can edit this topic" });
    }
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
router.post("/:id/subtopics", loadTopic, validateTopicCreation, async (req, res) => {
  try {
    const io = req.app.get("io");
    const parentTopic = req.topic;
    const { title, description } = req.body;

    if (parentTopic.isClosed) {
      return res.status(403).json({ message: "Cannot add subtopic to closed topic" });
    }

    const blockedUsersCopy = parentTopic.blockedUsers.map((b) => ({
      user: b.user,
      allowedSubtopics: b.allowedSubtopics || [],
    }));

    const newSubtopic = new Topic({
      title,
      description,
      parentTopic: parentTopic._id,
      mainModerator: req.user._id,
      blockedUsers: blockedUsersCopy,
    });

    await newSubtopic.save();
    io.to(`subtopic-${parentTopic._id}`).emit("newSubtopic", { newSubtopic: newSubtopic });
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
    const { username } = req.body;

    const userToAdd = await User.findOne({ username: username });
    const moderatorId = userToAdd ? userToAdd._id.toString() : null;
    if (!userToAdd) {
      return res.status(404).json({ message: "User not found" });
    }

    if (
      topic.moderators.map((id) => id.toString()).includes(moderatorId) ||
      topic.mainModerator.toString() === moderatorId
    ) {
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
router.delete("/:id/moderators/:username", loadTopic, isModerator, async (req, res) => {
  try {
    const topic = req.topic;
    const { username } = req.params;

    const userToRemove = await User.findOne({ username: username });
    const moderatorId = userToRemove ? userToRemove._id.toString() : null;
    if (!userToRemove) {
      return res.status(404).json({ message: "User not found" });
    }
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
    const { username, allowedSubtopics = [] } = req.body;

    const userToBlock = await User.findOne({ username });
    const userId = userToBlock ? userToBlock._id.toString() : null;
    if (!userToBlock) {
      return res.status(404).json({ message: "User not found" });
    }

    if (topic.mainModerator && topic.mainModerator.toString() === userId) {
      return res.status(400).json({ message: "Cannot block main moderator of this topic" });
    }
    const subtopicIds = await getAllSubtopicIds(topic._id);
    const alreadyBlocked = topic.blockedUsers.find((b) => b.user.toString() === userId);
    if (!alreadyBlocked) {
      topic.blockedUsers.push({
        user: userId,
        allowedSubtopics: allowedSubtopics || [],
      });
      topic.moderators = topic.moderators.filter((modId) => modId.toString() !== userId);
      await topic.save();
    }
    for (const subId of subtopicIds) {
      const subtopic = await Topic.findById(subId);
      if (!subtopic) continue;
      if (subtopic.mainModerator && subtopic.mainModerator.toString() === userId) {
        continue;
      }
      const alreadyBlockedInSub = subtopic.blockedUsers.find((b) => b.user.toString() === userId);
      if (!alreadyBlockedInSub) {
        subtopic.blockedUsers.push({
          user: userId,
          allowedSubtopics: [],
        });
        subtopic.moderators = subtopic.moderators.filter((modId) => modId.toString() !== userId);
        await subtopic.save();
      }
    }
    res.json({ message: "User blocked in topic and all subtopics (except where user is main moderator)", topic });
  } catch (err) {
    console.error("POST /:id/block-user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/topics/:id/unblock-user
router.post("/:id/unblock-user", loadTopic, isModerator, async (req, res) => {
  try {
    const topic = req.topic;
    const { username } = req.body;
    const userToUnblock = await User.findOne({ username });
    const userId = userToUnblock ? userToUnblock._id.toString() : null;
    if (!userToUnblock) {
      return res.status(404).json({ message: "User not found" });
    }

    topic.blockedUsers = topic.blockedUsers.filter((b) => b.user.toString() !== userId);
    await topic.save();

    const subtopicIds = await getAllSubtopicIds(topic._id);
    for (const subId of subtopicIds) {
      const subtopic = await Topic.findById(subId);
      if (!subtopic) continue;
      subtopic.blockedUsers = subtopic.blockedUsers.filter((b) => b.user.toString() !== userId);
      await subtopic.save();
    }

    async function allowInParentTopics(currentTopic) {
      if (!currentTopic.parentTopic) return;
      const parent = await Topic.findById(currentTopic.parentTopic);
      if (!parent) return;
      const block = parent.blockedUsers.find((b) => b.user.toString() === userId);
      if (block && !block.allowedSubtopics.map((id) => id.toString()).includes(currentTopic._id.toString())) {
        block.allowedSubtopics.push(currentTopic._id);
        await parent.save();
      }
      await allowInParentTopics(parent);
    }
    await allowInParentTopics(topic);

    res.json({ message: "User unblocked in topic and all subtopics" });
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

// GET /api/topics/:id/blocked-users
router.get("/:id/blocked-users", loadTopic, isModerator, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id).populate("blockedUsers.user", "username");

    if (topic.mainModerator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only main moderator can view blocked users" });
    }

    res.json(
      topic.blockedUsers.map((b) => ({
        _id: b.user._id,
        username: b.user.username,
        blockedAt: b.blockedAt,
      })),
    );
  } catch (err) {
    console.error("GET blocked users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
