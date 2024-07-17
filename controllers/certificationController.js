const Notification = require("../models/Notification");
const Certification = require("../models/Certification");
const { validationResult } = require("express-validator");

// Add a certification
exports.addCertification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, year, document } = req.body;

  try {
    const newCertification = new Certification({
      userId: req.user.id,
      title,
      year,
      document,
    });

    const certification = await newCertification.save();

    // Add notification for the user
    const newNotification = new Notification({
      userId: req.user.id,
      message: `New certification added: ${title}`,
    });
    await newNotification.save();

    res.json(certification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
