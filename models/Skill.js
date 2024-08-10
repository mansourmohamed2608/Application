const mongoose = require("mongoose");

const SkillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: { type: String, required: true },
});

module.exports = mongoose.model("Skill", SkillSchema);
