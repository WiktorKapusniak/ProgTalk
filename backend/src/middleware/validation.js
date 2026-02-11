function validateLogin(req, res, next) {
  const { username, password } = req.body;

  if (!username || typeof username !== "string" || username.trim().length === 0) {
    return res.status(400).json({ message: "Valid username is required" });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  next();
}

function validateRegister(req, res, next) {
  const { username, email, password } = req.body;

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return res.status(400).json({ message: "Username must be at least 3 characters" });
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ message: "Valid email is required" });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  next();
}

function validateTopicCreation(req, res, next) {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ message: "Topic title is required" });
  }

  if (title.length > 200) {
    return res.status(400).json({ message: "Topic title must be less than 200 characters" });
  }

  next();
}

function validatePostCreation(req, res, next) {
  const { content } = req.body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return res.status(400).json({ message: "Post content is required" });
  }

  if (content.length > 10000) {
    return res.status(400).json({ message: "Post content must be less than 10000 characters" });
  }

  next();
}

module.exports = {
  validateLogin,
  validateRegister,
  validateTopicCreation,
  validatePostCreation,
};
