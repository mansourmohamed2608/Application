const Notification = require('../models/Notification');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// Send a friend request
exports.sendFriendRequest = async (req, res) => {
  const { recipientId } = req.body;

  try {
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ msg: 'Recipient not found' });
    }

    const newFriendRequest = new FriendRequest({
      sender: req.user.id,
      recipient: recipientId
    });

    const friendRequest = await newFriendRequest.save();

    // Add notification for the recipient
    const newNotification = new Notification({
      userId: recipientId,
      message: `You have a new friend request from ${req.user.username}`
    });
    await newNotification.save();

    res.json(friendRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
