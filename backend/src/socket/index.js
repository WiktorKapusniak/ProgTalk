const { Server } = require("socket.io");
const { registerTopicHandlers } = require("./handlers/topics");
const { registerAdminHandlers } = require("./handlers/admin");
const { socketAuthMiddleware } = require("./middleware/auth");
function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    registerTopicHandlers(io, socket);
    registerPostHandlers(io, socket);
    registerAdminHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });

  return io;
}

module.exports = { initializeSocket };
