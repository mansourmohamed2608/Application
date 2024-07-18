const Notification = require("../models/Notification");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

exports.sendFriendRequest = async (req, res) => {
  const { recipientId } = req.body;

  try {
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ msg: "Recipient not found" });
    }

    const newFriendRequest = new FriendRequest({
      sender: req.user.id,
      recipient: recipientId,
    });

    const friendRequest = await newFriendRequest.save();

    const newNotification = new Notification({
      userId: recipientId,
      message: `You have a new friend request from ${req.user.username}`,
    });
    await newNotification.save();

    res.json(friendRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.viewFriendRequests = async (req, res) => {
  try {
    const friendRequests = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("requester", "username");
    res.json(friendRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.id);
    if (!friendRequest) {
      return res.status(404).json({ msg: "Friend request not found" });
    }

    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    res.json(friendRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

exports.rejectFriendRequest = async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.id);
    if (!friendRequest) {
      return res.status(404).json({ msg: "Friend request not found" });
    }

    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    friendRequest.status = "rejected";
    await friendRequest.save();

    res.json(friendRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
