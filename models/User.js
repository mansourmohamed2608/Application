const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  universityName: { type: String },
  mutualFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  info: { type: String },
  address: { type: String },
});

module.exports = mongoose.model("User", UserSchema);
