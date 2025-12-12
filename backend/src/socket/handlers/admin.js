function registerAdminHandlers(io, socket) {
  if (socket.user.role === "admin") {
    socket.join("admins");
    console.log(`Socket ${socket.id} joined admins room`);
  }
}
function notifyAdmins(io, event, data) {
  io.to("admins").emit(event, data);
}
module.exports = { registerAdminHandlers, notifyAdmins };
