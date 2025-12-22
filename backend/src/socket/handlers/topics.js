function registerTopicHandlers(io, socket) {
  socket.on("subscribeToTopics", () => {
    socket.join(`topics`);
    console.log(`Socket ${socket.id} subscribed to topics`);
  });
  socket.on("unsubscribeFromTopics", () => {
    socket.leave(`topics`);
    console.log(`Socket ${socket.id} unsubscribed from topics`);
  });
}
module.exports = { registerTopicHandlers };
