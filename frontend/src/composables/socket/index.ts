import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
export const getSocket = () => socket;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  const token = localStorage.getItem("token");
  socket = io("http://localhost:5000", {
    auth: { token },
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};
