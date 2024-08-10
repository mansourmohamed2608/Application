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
    const user = await User.findById(req.user.id);
    const newFriendRequest = new FriendRequest({
      sender: req.user.id,
      senderName: user.name,
      recipient: recipientId,
    });

    const friendRequest = await newFriendRequest.save();

    const newNotification = new Notification({
      userId: recipientId,
      message: `You have a new friend request from ${user.name}`,
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
    }).populate("sender", "name");
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

    // Ensure that the current user is the recipient of the friend request
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Update the friend request status to 'accepted'
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Add each user to the other's friends list
    const recipient = await User.findById(req.user.id);
    const sender = await User.findById(friendRequest.sender);

    if (!recipient.friends.includes(sender._id)) {
      recipient.friends.push(sender._id);
      recipient.friendsCount += 1; // Increment friendsCount
    }

    if (!sender.friends.includes(recipient._id)) {
      sender.friends.push(recipient._id);
      sender.friendsCount += 1; // Increment friendsCount
    }

    await recipient.save();
    await sender.save();

    // Send notification to the sender of the friend request
    const newNotification = new Notification({
      userId: sender._id,
      message: `${recipient.name} has accepted your friend request.`,
    });
    await newNotification.save();

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
