const { Schema, model } = require("mongoose");

const postSchema = new Schema({
  topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true }, // do jakiego tematu należy wpis
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  code: { type: String },
  tags: [{ type: String }],
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],

  deleted: { type: Boolean, default: false }, // usunięty przez autora (widoczny tylko dla adminów)
  createdAt: { type: Date, default: Date.now },
});
postSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

module.exports = model("Post", postSchema);
