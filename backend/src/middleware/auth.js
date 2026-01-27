const passport = require("passport");
const Topic = require("../models/Topic");

function isLoggedIn(req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.banned) {
      return res.status(403).json({ message: "Forbidden: User is banned" });
    }
    req.user = user;
    next();
  })(req, res, next);
}

function isAdmin(req, res, next) {
  isLoggedIn(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }
    next();
  });
}

function isApproved(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!req.user.approved) {
    return res.status(403).json({ message: "Forbidden: Account not approved yet. Please wait for admin approval." });
  }
  next();
}

async function loadTopic(req, res, next) {
  try {
    const topicId = req.params.id || req.params.topicId;

    if (!topicId) {
      return res.status(400).json({ message: "Topic ID is required" });
    }

    const topic = await Topic.findById(topicId);

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    req.topic = topic;
    next();
  } catch (err) {
    console.error("Load topic middleware error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
function isModerator(req, res, next) {
  const topic = req.topic;

  const isTopicModerator =
    topic.mainModerator.toString() === req.user._id.toString() ||
    topic.moderators.some((mod) => mod.toString() === req.user._id.toString()) ||
    req.user.role === "admin";

  if (!isTopicModerator) {
    return res.status(403).json({ message: "You are not a moderator of this topic" });
  }

  next();
}

async function checkIfBlockedInTopic(req, res, next) {
  try {
    const topicId = req.params.topicId || req.topic._id;
    const userId = req.user._id;

    async function isBlockedRecursive(currentTopicId, previousTopicId = null) {
      const currentTopic = await Topic.findById(currentTopicId);
      if (!currentTopic) return false;

      const block = currentTopic.blockedUsers.find((b) => b.user.toString() === userId.toString());

      if (block) {
        if (previousTopicId && block.allowedSubtopics.includes(previousTopicId)) {
          return false;
        }
        return true;
      }
      if (currentTopic.parentTopic) {
        return isBlockedRecursive(currentTopic.parentTopic, currentTopicId);
      }

      return false;
    }

    const isBlocked = await isBlockedRecursive(topicId);

    if (isBlocked) {
      return res.status(403).json({ message: "You are blocked from posting in this topic" });
    }

    next();
  } catch (err) {
    console.error("checkIfBlockedInTopic error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
module.exports = {
  isLoggedIn,
  isAdmin,
  loadTopic,
  isApproved,
  isModerator,
  checkIfBlockedInTopic,
};
