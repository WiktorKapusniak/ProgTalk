export default interface Post {
  _id: string;
  topic: string;
  author: {
    _id: string;
    username: string;
  };
  content: string;
  code?: string;
  tags?: string[];
  references?: string[]; // Array of Post IDs
  likes: string[]; // Array of User IDs
  deleted: boolean;
  createdAt: string; // ISO date string from backend
}
