const mongoose = require("mongoose");

const CertificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: { type: String, required: true },
  year: { type: String, required: true },
  document: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  achievementDate: { type: Date, required: true },
});

module.exports = mongoose.model("Certification", CertificationSchema);
