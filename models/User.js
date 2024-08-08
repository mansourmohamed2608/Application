const mongoose = require("mongoose");

const Certification = require("./Certification");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  profilePicture: { type: String }, // Ensure this line exists
  backgroundPicture: { type: String },
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
  profession: { type: String },
  country: { type: String },
  socialService: { type: String },
  friendsCount: { type: Number, default: 0 },
  requestsCount: { type: Number, default: 0 },
  cities: [{ type: String }],
  certifications: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Certification" },
  ],
  skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
});

module.exports = mongoose.model("User", UserSchema);
