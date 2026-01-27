import type Topic from "@/interfaces/Topic";
import type Post from "@/interfaces/Post";
import { getSocket } from "./index";

export function useSubtopicSocket(parentTopicId: string) {
  const subscribeToSubtopic = () => {
    const socket = getSocket();
    if (!socket) {
      console.error("Socket not connected");
      return;
    }
    socket.emit("subscribeToSubtopic", parentTopicId);
  };

  const unsubscribeFromSubtopic = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.emit("unsubscribeFromSubtopic", parentTopicId);
  };

  const onNewSubtopic = (callback: (data: { newSubtopic: Topic }) => void) => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("newSubtopic", callback);
  };
  const offNewSubtopic = (callback?: (data: { newSubtopic: Topic }) => void) => {
    const socket = getSocket();
    if (!socket) return;
    if (callback) {
      socket.off("newSubtopic", callback);
      return;
    }
    socket.off("newSubtopic");
  };

  const onNewPost = (callback: (data: { newPost: Post }) => void) => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("newPost", callback);
  };

  const offNewPost = (callback?: (data: { newPost: Post }) => void) => {
    const socket = getSocket();
    if (!socket) return;
    if (callback) {
      socket.off("newPost", callback);
      return;
    }
    socket.off("newPost");
  };

  const onPostLiked = (callback: (data: { postId: string; likes: string[] }) => void) => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("postLiked", callback);
  };

  const offPostLiked = (callback?: (data: { postId: string; likes: string[] }) => void) => {
    const socket = getSocket();
    if (!socket) return;
    if (callback) {
      socket.off("postLiked", callback);
      return;
    }
    socket.off("postLiked");
  };

  const onPostUnliked = (callback: (data: { postId: string; likes: string[] }) => void) => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("postUnliked", callback);
  };

  const offPostUnliked = (callback?: (data: { postId: string; likes: string[] }) => void) => {
    const socket = getSocket();
    if (!socket) return;
    if (callback) {
      socket.off("postUnliked", callback);
      return;
    }
    socket.off("postUnliked");
  };

  const onPostDeleted = (callback: (data: { postId: string }) => void) => {
    const socket = getSocket();
    if (!socket) return;
    socket.on("post-deleted", callback);
  };

  const offPostDeleted = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off("post-deleted");
  };

  return {
    subscribeToSubtopic,
    unsubscribeFromSubtopic,
    onNewSubtopic,
    offNewSubtopic,
    onNewPost,
    offNewPost,
    onPostLiked,
    offPostLiked,
    onPostUnliked,
    offPostUnliked,
    onPostDeleted,
    offPostDeleted,
  };
}
