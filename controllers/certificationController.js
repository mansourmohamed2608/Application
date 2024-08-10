const path = require("path");
const multer = require("multer");
const Notification = require("../models/Notification");
const Certification = require("../models/Certification");
const { validationResult } = require("express-validator");
const fs = require("fs");
// Set up multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/certifications/"); // Directory where files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, req.user.id + "_" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage }).single("document");

exports.addCertification = (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(500).json({ msg: "File upload failed" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, year } = req.body;
    const documentPath = req.file ? req.file.path : null;

    try {
      const newCertification = new Certification({
        userId: req.user.id,
        title,
        year,
        document: documentPath,
      });

      const certification = await newCertification.save();

      // Optionally, add a notification
      // const newNotification = new Notification({
      //   userId: req.user.id,
      //   message: `New certification added: ${title}`,
      // });
      // await newNotification.save();

      res.json(certification);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });
};
exports.updateCertification = (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(500).json({ msg: "File upload failed" });
    }

    const { certificationId } = req.params;
    const { title, year } = req.body;

    try {
      const certification = await Certification.findById(certificationId);

      if (!certification) {
        return res.status(404).json({ msg: "Certification not found" });
      }

      // Ensure the user owns the certification
      if (certification.userId.toString() !== req.user.id) {
        return res.status(401).json({ msg: "User not authorized" });
      }

      // Update title and year if provided
      if (title) certification.title = title;
      if (year) certification.year = year;

      // Handle document replacement
      if (req.file) {
        // Remove the old document if it exists
        if (certification.document) {
          fs.unlinkSync(certification.document);
        }
        // Set the new document path
        certification.document = req.file.path;
      }

      const updatedCertification = await certification.save();
      res.json(updatedCertification);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });
};
exports.getCertificates = async (req, res) => {
  try {
    const certificates = await Certification.find({ userId: req.user.id }).sort(
      { achievementDate: -1 }
    );
    res.json(certificates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
// Delete a certification
exports.deleteCertification = async (req, res) => {
  const { certificationId } = req.params;

  try {
    const certification = await Certification.findById(certificationId);

    if (!certification) {
      return res.status(404).json({ msg: "Certification not found" });
    }

    // Ensure the user owns the certification
    if (certification.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Remove the document file if it exists
    if (certification.document) {
      fs.unlinkSync(certification.document);
    }

    await certification.remove();
    res.json({ msg: "Certification removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
