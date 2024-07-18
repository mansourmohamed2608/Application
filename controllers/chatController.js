const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");

exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text, date } = req.body;

    console.log("Request Body:", req.body); // Log the request body

    if (!recipientId || !text || !date) {
      console.log("Missing fields");
      return res.status(400).json({ msg: "All fields are required" });
    }

    const chat = new Chat({
      chatId: req.body.chatId || new mongoose.Types.ObjectId(),
      sender: req.user.id,
      recipient: recipientId,
      text,
      date,
    });

    console.log("Chat Object:", chat); // Log the chat object before saving

    await chat.save();
    res.status(200).json(chat);
  } catch (err) {
    console.error("Error Saving Chat:", err.message); // Log the error message
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
    const chats = await Chat.find({ users: req.user.id })
      .populate("users", "username")
      .sort({ "messages.timestamp": -1 });
    res.json(chats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
