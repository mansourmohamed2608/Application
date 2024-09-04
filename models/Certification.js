const mongoose = require("mongoose");

const CertificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Certificate Name
  title: { type: String, required: true },

  // Issuer (Institution that issued the certificate)
  issuer: { type: String, required: true },

  // Issue Date (Date when the certificate was issued)
  issueDate: { type: Date, required: true },

  // Expiration Date (If applicable)
  expirationDate: { type: Date, required: false },

  // Certificate Link (URL where the certificate can be viewed)
  certificateLink: { type: String, required: false },

  // Document (Path to the uploaded certificate image or document)
  document: { type: String, required: true },

  // Date of creation in the system
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Certification", CertificationSchema);
