function registerSubtopicHandlers(io, socket) {
  socket.on("subscribeToSubtopic", (subtopicId) => {
    socket.join(`subtopic-${subtopicId}`);
    console.log(`User ${socket.user.username} subscribed to subtopic ${subtopicId}`);
  });
  socket.on("unsubscribeFromSubtopic", (subtopicId) => {
    socket.leave(`subtopic-${subtopicId}`);
    console.log(`User ${socket.user.username} unsubscribed from subtopic ${subtopicId}`);
  });
}
module.exports = { registerSubtopicHandlers };
