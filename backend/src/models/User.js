const { Schema, model } = require("mongoose");
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  Banned: { type: Boolean, default: false },
  currentPage: { type: Number, default: 1 },
});
module.exports = model("User", userSchema);
