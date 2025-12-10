const { Schema, model } = require("mongoose");

const postSchema = new Schema({
  topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  code: { type: String },
  tags: [{ type: String }],
  references: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],

  deleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
postSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

module.exports = model("Post", postSchema);
