const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  googleId: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  profilePicture: { type: String },
  accessToken: { type: String },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  universityName: { type: String },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  info: { type: String },
  address: { type: String },
  phone: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
