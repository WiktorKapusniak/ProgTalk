export default interface Post {
  _id: string;
  topic: string;
  author: string;
  content: string;
  code?: string;
  tags?: string[];
  references?: string[];
  likes: string[];
  deleted: boolean;
  createdAt: Date;
}
