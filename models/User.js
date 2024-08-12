const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
  country: { type: String },
  socialService: { type: String },
  friendsCount: { type: Number, default: 0 },
  postsCount: { type: Number, default: 0 },
  requestsCount: { type: Number, default: 0 },
  cities: [{ type: String }],
  certifications: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Certification" },
  ],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
  resetToken: String,
  resetTokenExpiry: Date,
  age: { type: Number },
});

UserSchema.pre("save", function (next) {
  if (this.birthDate) {
    const today = new Date();
    let age = today.getFullYear() - this.birthDate.getFullYear();
    const m = today.getMonth() - this.birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < this.birthDate.getDate())) {
      age--;
    }
    this.age = age; // Store the calculated age in the database
  } else {
    this.age = null; // If no birthDate, set age to null
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
