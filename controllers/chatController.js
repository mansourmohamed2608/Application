const Chat = require("../models/Chat");
const User = require("../models/User");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const path = require("path");

exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text, date } = req.body;
    let fileUrl = null;
    let fileName = null;
    let fileType = null;

    if (!recipientId || (!text && !req.files) || !date) {
      return res.status(400).json({
        msg: "Recipient, message text or file, and date are required",
      });
    }

    // Handle file upload
    if (req.files && req.files.file) {
      const file = req.files.file;
      fileName = file.name;
      fileType = file.mimetype;
      const uploadDir = path.join(__dirname, "../uploads/chat");

      // Ensure the upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uploadPath = path.join(uploadDir, fileName);

      await file.mv(uploadPath, (err) => {
        if (err) {
          console.error("File upload error:", err);
          return res.status(500).send("File upload failed");
        }
      });

      fileUrl = `/uploads/chat/${fileName}`;
    }

    const chat = new Chat({
      chatId: req.body.chatId || new mongoose.Types.ObjectId(),
      sender: req.user.id,
      recipient: recipientId,
      text,
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
      message: `You have a new message from ${sender.name}`,
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
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Find all messages in the chat where the recipient is the current user and the message is unread
    const unreadMessages = await Chat.find({
      chatId,
      recipient: userId,
      isRead: false,
    });

    // Update the messages to mark them as read
    if (unreadMessages.length > 0) {
      await Chat.updateMany(
        {
          chatId,
          recipient: userId,
          isRead: false,
        },
        { $set: { isRead: true } }
      );
    }

    res.status(200).json({ msg: "Messages marked as read" });
  } catch (err) {
    console.error("Error marking messages as read:", err.message);
    res.status(500).send("Server error");
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

    res.json(chatHistory); // Include the full message details, including `isRead`
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.getAllChats = async (req, res) => {
  try {
    // Find all chats where the user is either the sender or recipient
    const chats = await Chat.find({
      $or: [{ sender: req.user.id }, { recipient: req.user.id }],
    })
      .populate("sender", "name profilePicture status")
      .populate("recipient", "name profilePicture status")
      .sort({ date: -1 });

    if (chats.length === 0) {
      return res.status(404).json({ msg: "No chats found" });
    }

    // Prepare response with required information
    const chatDetails = chats.map((chat) => {
      const lastMessage = {
        text: chat.text || chat.photo || chat.video || chat.file || "",
        sentBy: chat.sender.name,
        isRead: chat.isRead, // Include the isRead status directly
      };

      const otherUser =
        chat.sender.id === req.user.id ? chat.recipient : chat.sender;

      return {
        chatId: chat._id,
        userId: otherUser._id,
        userName: otherUser.name,
        profilePicture: otherUser.profilePicture,
        lastMessage,
        isOnline: otherUser.status === "online",
      };
    });

    res.json(chatDetails);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
exports.getAllContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all friends
    const user = await User.findById(userId).populate(
      "friends",
      "name _id profilePicture"
    );
    const friends = user.friends;

    // Get all users with whom the current user has chats
    const chats = await Chat.find({
      participants: { $in: [userId] },
    }).populate("participants", "name _id profilePicture");

    let chatUsers = [];

    // Extract the other participants from each chat
    chats.forEach((chat) => {
      chat.participants.forEach((participant) => {
        if (participant._id.toString() !== userId) {
          chatUsers.push(participant);
        }
      });
    });

    // Combine friends and chat users
    const combinedUsers = [...friends, ...chatUsers];

    // Filter out duplicates by user ID
    const uniqueUsers = Array.from(
      new Set(combinedUsers.map((user) => user._id.toString()))
    ).map((id) => {
      return combinedUsers.find((user) => user._id.toString() === id);
    });

    res.json(uniqueUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
