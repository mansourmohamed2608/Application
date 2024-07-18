const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  name: { type: String, required: true },
  universityName: { type: String },
  mutualFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  info: { type: String },
  address: { type: String },
  phone: { type: String, required: true },
});

module.exports = mongoose.model("User", UserSchema);
