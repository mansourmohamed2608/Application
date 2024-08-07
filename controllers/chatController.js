const Chat = require("../models/Chat");
const User = require("../models/User");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const path = require("path");

exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text, photo, video, date } = req.body;
    let fileUrl = null;
    let fileName = null;
    let fileType = null;

    if (!recipientId || (!text && !photo && !video && !req.files) || !date) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Handle file upload
    if (req.files && req.files.file) {
      const file = req.files.file;
      fileName = file.name;
      fileType = file.mimetype;
      const uploadPath = path.join(__dirname, "../uploads/", fileName);

      await file.mv(uploadPath, (err) => {
        if (err) {
          console.error("File upload error:", err);
          return res.status(500).send(err);
        }
      });

      fileUrl = `/uploads/${fileName}`;
    }

    const chat = new Chat({
      chatId: req.body.chatId || new mongoose.Types.ObjectId(),
      sender: req.user.id,
      recipient: recipientId,
      text,
      photo,
      video,
      file: fileUrl,
      fileName,
      fileType,
      date,
    });

    await chat.save();

    // Fetch the sender's user details
    const sender = await User.findById(req.user.id);

    // Create a new notification for the recipient
    const newNotification = new Notification({
      userId: recipientId,
      message: `You have a new message from ${sender.name}`, // Include the sender's name
      read: false,
      date: new Date(),
    });

    await newNotification.save();

    res.status(200).json(chat);
  } catch (err) {
    console.error("Error Saving Chat:", err.message);
    res.status(500).send("Server Error");
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const chatHistory = await Chat.find({
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id },
      ],
    })
      .sort({ date: -1 })
      .limit(50);

    if (chatHistory.length === 0) {
      return res.status(404).json({ msg: "No chat messages found" });
    }

    res.json(chatHistory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [{ sender: req.user.id }, { recipient: req.user.id }],
    })
      .populate("sender", "username")
      .populate("recipient", "username")
      .sort({ date: -1 });

    if (chats.length === 0) {
      return res.status(404).json({ msg: "No chats found" });
    }

    res.json(chats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
