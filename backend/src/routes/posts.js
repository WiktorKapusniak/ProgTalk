const User = require("../models/User");
const express = require("express");
const router = express.Router();
const Topic = require("../models/Topic");
const Post = require("../models/Post");
const { isAdmin, isModerator, loadTopic, checkIfBlockedInTopic } = require("../middleware/auth");

// GET /api/topics/:topicId/posts?page=1&limit=20
router.get("/topics/:topicId/posts", loadTopic, async (req, res) => {
  try {
    const topic = req.topic;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ topic: topic._id, deleted: false }).populate("author", "username").skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

    const total = await Post.countDocuments({ topic: topic._id, deleted: false });

    return res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /:topicId/posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/topics/:topicId/posts
router.post("/topics/:topicId/posts", loadTopic, checkIfBlockedInTopic, async (req, res) => {
  try {
    const parentTopic = req.topic;
    const { content, code, tags, references } = req.body;
    const author = req.user._id;

    if (parentTopic.isClosed) {
      return res.status(403).json({ message: "Cannot add post to closed topic" });
    }

    const newPost = new Post({
      content,
      code,
      tags,
      author,
      references,
      topic: parentTopic._id,
    });
    await newPost.save();
    const io = req.app.get("io");

    const populatedPost = await Post.findById(newPost._id).populate("author", "username");
    io.to(`subtopic-${parentTopic._id}`).emit("newPost", {
      newPost: populatedPost,
    });

    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (err) {
    console.error("POST /:topicId/posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/posts/:postId
router.delete("/posts/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    post.deleted = true;
    await post.save();

    const io = req.app.get("io");
    io.to(`topic-${post.topic}`).emit("post-deleted", { postId: post._id });

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("DELETE /posts/:postId error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/posts/:id/like
router.post("/posts/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: "Post already liked" });
    }
    post.likes.push(req.user._id);
    await post.save();

    const io = req.app.get("io");
    io.to(`subtopic-${post.topic}`).emit("postLiked", { postId: post._id, likes: post.likes });

    res.json({ message: "Post liked successfully" });
  } catch (err) {
    console.error("POST /posts/:id/like error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/posts/:id/like
router.delete("/posts/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const likeIndex = post.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      return res.status(400).json({ message: "Post not liked yet" });
    }
    post.likes.splice(likeIndex, 1);
    await post.save();
    const io = req.app.get("io");
    io.to(`subtopic-${post.topic}`).emit("postUnliked", { postId: post._id, likes: post.likes });
    res.json({ message: "Post unliked successfully" });
  } catch (err) {
    console.error("DELETE /posts/:id/like error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
