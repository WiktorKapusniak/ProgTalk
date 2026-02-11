function registerAdminHandlers(io, socket) {
  if (socket.user.role === "admin") {
    socket.join("admins");
    console.log(`Socket ${socket.id} joined admins room`);
  }
  socket.on("disconnect", () => {
    if (socket.user.role === "admin") {
      console.log(`Socket ${socket.id} left admins room`);
      socket.leave("admins");
    }
  });
}
function notifyAdmins(io, event, data) {
  io.to("admins").emit(event, data);
}
module.exports = { registerAdminHandlers, notifyAdmins };
