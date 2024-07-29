const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  profilePicture: { type: String },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  name: { type: String, required: true },
  universityName: { type: String },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  info: { type: String },
  address: { type: String },
  phone: { type: String, required: false, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  birthDate: { type: Date },
  gender: { type: String, enum: ["male", "female"] },
  educationLevel: { type: String },
  major: { type: String },
  submajor: { type: String },
  country: { type: String },
});

module.exports = mongoose.model("User", UserSchema);
