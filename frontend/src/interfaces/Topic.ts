export default interface Topic {
  _id: string;
  title: string;
  description: string;
  mainModerator: {
    _id: string;
    username: string;
  };
  moderators: Array<{
    _id: string;
    username: string;
  }>;
  isHidden: boolean;
  createdAt: Date;
  isClosed: boolean;
}
