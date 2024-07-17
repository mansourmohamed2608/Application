const Chat = require("../models/Chat");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");

// Send a message
exports.sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { recipientId, text } = req.body;

  try {
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ msg: "Recipient not found" });
    }

    const newMessage = new Chat({
      sender: req.user.id,
      recipient: recipientId,
      text,
    });

    const message = await newMessage.save();

    // Add notification for the recipient
    const newNotification = new Notification({
      userId: recipientId,
      message: `New message from ${req.user.username}`,
    });
    await newNotification.save();

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Get chat history
exports.getChatHistory = async (req, res) => {
  try {
    const chatHistory = await Chat.find({
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id },
      ],
    })
      .sort({ date: -1 })
      .limit(50); // Limiting to the latest 50 messages

    if (chatHistory.length === 0) {
      return res.status(404).json({ msg: "No chat messages found" });
    }

    res.json(chatHistory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
// Get all chats
exports.getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.user.id })
      .populate("users", "username")
      .sort({ "messages.timestamp": -1 });
    res.json(chats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
