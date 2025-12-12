const jwt = require("jsonwebtoken");
const User = require("../../models/User");

async function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }
    if (user.Banned) {
      return next(new Error("Authentication error: User is banned"));
    }
    socket.user = user;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
}
module.exports = { socketAuthMiddleware };
