const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");

// Add a notification
exports.addNotification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, message } = req.body;

  try {
    const newNotification = new Notification({
      userId,
      message,
    });

    const notification = await newNotification.save();
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort(
      { date: -1 }
    );
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
