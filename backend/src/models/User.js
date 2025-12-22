const { Schema, model } = require("mongoose");
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  banned: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
});
module.exports = model("User", userSchema);
