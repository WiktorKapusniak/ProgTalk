const { Schema, model } = require("mongoose");

const topicSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },

  parentTopic: { type: Schema.Types.ObjectId, ref: "Topic", default: null },

  mainModerator: { type: Schema.Types.ObjectId, ref: "User", required: true },
  moderators: [{ type: Schema.Types.ObjectId, ref: "User" }],

  blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],

  isClosed: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

module.exports = model("Topic", topicSchema);
