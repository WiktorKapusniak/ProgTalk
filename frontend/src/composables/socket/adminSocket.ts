import { getSocket } from "./index";

export function useAdminSocket() {
  const subscribeToAdmin = () => {
    const socket = getSocket();
    if (!socket) {
      console.error("Socket not connected");
      return;
    }
    socket.emit("subscribeToAdmin");
  };

  const unsubscribeFromAdmin = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("unsubscribeFromAdmin");
  };

  const onNewRegistration = (callback: (...args: any[]) => void) => {
    const socket = getSocket();
    if (!socket) return;
    socket.on("newRegistration", callback);
  };
  const offNewRegistration = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off("newRegistration");
  };
  const onNewApproval = (callback: (...args: any[]) => void) => {
    const socket = getSocket();
    if (!socket) return;
    socket.on("newApproval", callback);
  };
  const offNewApproval = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off("newApproval");
  };
  return {
    subscribeToAdmin,
    unsubscribeFromAdmin,
    onNewRegistration,
    offNewRegistration,
    onNewApproval,
    offNewApproval,
  };
}
