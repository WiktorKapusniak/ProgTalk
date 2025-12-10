const { Schema, model } = require("mongoose");

const topicSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  parentTopic: { type: Schema.Types.ObjectId, ref: "Topic", default: null },
  mainModerator: { type: Schema.Types.ObjectId, ref: "User", required: true },

  moderators: [{ type: Schema.Types.ObjectId, ref: "User" }],

  blockedUsers: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      allowedSubtopics: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
      blockedAt: { type: Date, default: Date.now },
    },
  ],

  isClosed: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = model("Topic", topicSchema);
