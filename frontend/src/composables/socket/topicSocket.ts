import type Topic from "@/interfaces/Topic";
import { getSocket } from "./index";

export function useTopicSocket() {
  const subscribeToTopics = () => {
    const socket = getSocket();
    if (!socket) {
      console.error("Socket not connected");
      return;
    }
    socket.emit("subscribeToTopics");
  };

  const unsubscribeFromTopics = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("unsubscribeFromTopics");
  };

  const onNewTopic = (callback: (data: { newTopic: Topic }) => void) => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("newTopic", callback);
  };
  const offNewTopic = (callback?: (data: { newTopic: Topic }) => void) => {
    const socket = getSocket();
    if (!socket) return;
    if (callback) {
      socket.off("newTopic", callback);
      return;
    }
    socket.off("newTopic");
  };
  return {
    subscribeToTopics,
    unsubscribeFromTopics,
    onNewTopic,
    offNewTopic,
  };
}
