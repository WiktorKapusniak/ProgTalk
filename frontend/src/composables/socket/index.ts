import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => socket;

export const connectSocket = (): Socket => {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem("token");

  // dev http://localhost:5173
  // prod https://localhost
  const socketUrl = import.meta.env.DEV ? "http://localhost:5173" : window.location.origin;

  socket = io(socketUrl, {
    auth: {
      token,
    },
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
