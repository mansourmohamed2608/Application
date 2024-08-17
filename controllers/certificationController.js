const path = require("path");
const multer = require("multer");
const Notification = require("../models/Notification");
const Certification = require("../models/Certification");
const { validationResult } = require("express-validator");
const fs = require("fs");

// Helper function to sanitize file names
const sanitizeFileName = (name) => {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
};

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/certifications/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir); // Directory where files will be stored
  },
  filename: async function (req, file, cb) {
    try {
      const { title } = req.body;
      const certificationName = title
        ? sanitizeFileName(title)
        : "unknown_cert";
      let filename = `${req.user.id}_${certificationName}${path.extname(
        file.originalname
      )}`;

      // Replace any backslashes with forward slashes
      filename = filename.replace(/\\/g, "/");
      cb(null, filename);
    } catch (error) {
      cb(error);
    }
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
    let documentPath = req.file ? req.file.path : null;

    // Replace any backslashes with forward slashes
    if (documentPath) {
      documentPath = documentPath.replace(/\\/g, "/");
    }

    try {
      const newCertification = new Certification({
        userId: req.user.id,
        title,
        year,
        document: documentPath,
      });

      const certification = await newCertification.save();

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
        if (certification.document && fs.existsSync(certification.document)) {
          fs.unlinkSync(certification.document);
        }
        // Set the new document path
        let documentPath = req.file.path;
        documentPath = documentPath.replace(/\\/g, "/");
        certification.document = documentPath;
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

    // Construct the URL for each certificate
    const certificatesWithUrl = certificates.map((cert) => {
      const documentUrl = cert.document
        ? `${req.protocol}://${req.get(
            "host"
          )}/uploads/certifications/${path.basename(cert.document)}`
        : null;
      return {
        ...cert.toObject(),
        documentUrl,
      };
    });

    res.json(certificatesWithUrl);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
exports.getCertificateById = async (req, res) => {
  const { certificationId } = req.params;

  try {
    const certification = await Certification.findById(certificationId);

    if (!certification) {
      return res.status(404).json({ msg: "Certification not found" });
    }

    // Construct the document URL
    const documentUrl = certification.document
      ? `${req.protocol}://${req.get(
          "host"
        )}/uploads/certifications/${path.basename(certification.document)}`
      : null;

    res.json({
      ...certification.toObject(),
      documentUrl,
    });
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
    if (certification.document && fs.existsSync(certification.document)) {
      fs.unlinkSync(certification.document);
    }

    await certification.remove();
    res.json({ msg: "Certification removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
