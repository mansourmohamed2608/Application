const ChatRoom = require("../models/ChatRoom");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");

// Create a chat room
exports.createChatRoom = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, members } = req.body;

  try {
    const newChatRoom = new ChatRoom({
      name,
      members,
    });

    const chatRoom = await newChatRoom.save();

    // Notify all members about the new chat room
    for (const memberId of members) {
      const newNotification = new Notification({
        userId: memberId,
        message: `You have been added to a new chat room: ${name}`,
      });
      await newNotification.save();
    }

    res.json(chatRoom);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Add a user to a chat room
exports.addUserToChatRoom = async (req, res) => {
  const { chatRoomId, userId } = req.body;

  try {
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return res.status(404).json({ msg: "Chat room not found" });
    }

    if (!chatRoom.members.includes(userId)) {
      chatRoom.members.push(userId);
      await chatRoom.save();

      // Notify the user about being added to the chat room
      const newNotification = new Notification({
        userId,
        message: `You have been added to the chat room: ${chatRoom.name}`,
      });
      await newNotification.save();
    }

    res.json(chatRoom);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Start a chat room call
exports.startCall = async (req, res) => {
  const { chatRoomId } = req.body;

  try {
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return res.status(404).json({ msg: "Chat room not found" });
    }

    // Notify all members about the start of the call
    for (const memberId of chatRoom.members) {
      const newNotification = new Notification({
        userId: memberId,
        message: `A call has started in the chat room: ${chatRoom.name}`,
      });
      await newNotification.save();
    }

    res.json({ msg: "Call started" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
// Get all chat rooms
exports.getAllChatRooms = async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find()
      .populate("members", "username")
      .populate("createdBy", "username");
    res.json(chatRooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Get chat room details
exports.getChatRoomDetails = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findById(req.params.id)
      .populate("members", "username")
      .populate("createdBy", "username");
    if (!chatRoom) {
      return res.status(404).json({ msg: "Chat room not found" });
    }
    res.json(chatRoom);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Join a chat room
exports.joinChatRoom = async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findOne({ code: req.body.code });
    if (!chatRoom) {
      return res.status(404).json({ msg: "Chat room not found" });
    }
    if (!chatRoom.members.includes(req.user.id)) {
      chatRoom.members.push(req.user.id);
      await chatRoom.save();
    }
    res.json(chatRoom);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
