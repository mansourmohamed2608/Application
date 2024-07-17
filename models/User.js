const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
});

module.exports = mongoose.model("User", UserSchema);
