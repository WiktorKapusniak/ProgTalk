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
  reference?: string;
  likes: string[];
  deleted: boolean;
  createdAt: string;
}
