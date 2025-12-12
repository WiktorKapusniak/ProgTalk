function registerTopicHandlers(io, socket) {
  socket.on("subscribeToTopic", (topicId) => {
    socket.join(`topic-${topicId}`);
    console.log(`Socket ${socket.id} subscribed to topic-${topicId}`);
  });
  socket.on("unsubscribeFromTopic", (topicId) => {
    socket.leave(`topic-${topicId}`);
    console.log(`Socket ${socket.id} unsubscribed from topic-${topicId}`);
  });
}
module.exports = { registerTopicHandlers };
