const Post = require("../models/Post");
const User = require("../models/User");


// Helper function to check if the user has reacted
const hasUserReacted = (reacts, userId) => {
  for (const [reaction, users] of reacts) {
    if (users.includes(userId)) {
      return true;
    }
  }
  return false;
};

// Create a new post
exports.createPost = async (req, res) => {
  const { body, latitude, longitude } = req.body;

  if (!body) {
    return res.status(400).json({ msg: "Post body is required" });
  }

  if (!latitude || !longitude) {
    return res
      .status(400)
      .json({ msg: "Location (latitude and longitude) is required" });
  }

  try {
    const user = await User.findById(req.user.id);
    const major = user.major;
    console.log(major);
    const newPost = new Post({
      user: req.user.id,
      body,
      major: major,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });

    const post = await newPost.save();

    // Increment the postsCount for the user
    user.postsCount += 1;
    await user.save();

    const populatedPost = await Post.findById(post._id).populate("user", [
      "name",
      "major",
    ]);

    res.json(populatedPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get all posts with optional filters including location and pagination
exports.getAllPosts = async (req, res) => {
  try {
    const {
      gender,
      distance,
      longitude,
      latitude,
      page = 1,
      limit = 20,
    } = req.query;

    let query = { isArchived: false };

    if (gender) {
      query["user.gender"] = gender;
    }

    if (distance && longitude && latitude) {
      query.location = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(distance) / 3963.2,
          ],
        },
      };
    }

    const skip = (page - 1) * limit;

    const posts = await Post.find(query)
      .sort({ date: -1 })
      .populate("user", [
        "name",
        "major",
        "postsCount",
        "educationLevel",
        "profilePicture",
      ])
      .skip(skip)
      .limit(parseInt(limit));

    const formattedPosts = posts.map((post) => ({
      _id: post._id,
      body: post.body,
      major: post.major,
      reactsCount: Array.from(post.reacts.values()).reduce((a, b) => a + b, 0),
      hasReacted: hasUserReacted(post.reacts, req.user.id),
      date: timeSince(post.date),
      user: {
        name: post.user.name,
        major: post.user.major,
        educationLevel: post.user.educationLevel,
        profilePicture: post.user.profilePicture
          ? `${req.protocol}://${req.get("host")}/uploads/profilephotos/${
              post.user.profilePicture
            }`
          : null,
      },
      comments: post.comments.map((comment) => ({
        _id: comment._id,
        body: comment.body,
        user: comment.user.name,
        reactsCount: Array.from(comment.reacts.values()).reduce(
          (a, b) => a + b,
          0
        ),
        hasReacted: hasUserReacted(comment.reacts, req.user.id),
        date: timeSince(comment.date),
        replies: comment.replies.map((reply) => ({
          _id: reply._id,
          body: reply.body,
          user: reply.user.name,
          reactsCount: Array.from(reply.reacts.values()).reduce(
            (a, b) => a + b,
            0
          ),
          hasReacted: hasUserReacted(reply.reacts, req.user.id),
          date: timeSince(reply.date),
        })),
      })),
    }));

    res.json(formattedPosts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};




exports.getFriendsPosts = async (req, res) => {
  try {
    const {
      gender,
      distance,
      longitude,
      latitude,
      page = 1,
      limit = 20,
    } = req.query;

    const user = await User.findById(req.user.id).populate("friends", [
      "_id",
      "gender",
    ]);
    let friendIds = user.friends.map((friend) => friend._id);

    if (gender) {
      friendIds = user.friends
        .filter((friend) => friend.gender === gender)
        .map((friend) => friend._id);
    }

    let query = { user: { $in: friendIds }, isArchived: false };

    if (distance && longitude && latitude) {
      query.location = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(distance) / 3963.2,
          ],
        },
      };
    }

    const skip = (page - 1) * limit;

    const posts = await Post.find(query)
      .sort({ date: -1 })
      .populate("user", [
        "name",
        "major",
        "postsCount",
        "educationLevel",
        "profilePicture",
      ])
      .skip(skip)
      .limit(parseInt(limit));

    const formattedPosts = posts.map((post) => ({
      _id: post._id,
      body: post.body,
      major: post.major,
      reactsCount: Array.from(post.reacts.values()).reduce((a, b) => a + b, 0),
      hasReacted: hasUserReacted(post.reacts, req.user.id),
      date: timeSince(post.date),
      user: {
        name: post.user.name,
        major: post.user.major,
        educationLevel: post.user.educationLevel,
        profilePicture: post.user.profilePicture
          ? `${req.protocol}://${req.get("host")}/uploads/profilephotos/${
              post.user.profilePicture
            }`
          : null,
      },
      comments: post.comments.map((comment) => ({
        _id: comment._id,
        body: comment.body,
        user: comment.user.name,
        reactsCount: Array.from(comment.reacts.values()).reduce(
          (a, b) => a + b,
          0
        ),
        hasReacted: hasUserReacted(comment.reacts, req.user.id),
        date: timeSince(comment.date),
        replies: comment.replies.map((reply) => ({
          _id: reply._id,
          body: reply.body,
          user: reply.user.name,
          reactsCount: Array.from(reply.reacts.values()).reduce(
            (a, b) => a + b,
            0
          ),
          hasReacted: hasUserReacted(reply.reacts, req.user.id),
          date: timeSince(reply.date),
        })),
      })),
    }));

    res.json(formattedPosts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};



// Get all posts by a specific user ID with pagination
exports.getPostsByUserId = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  try {
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: userId, isArchived: false })
      .sort({ date: -1 })
      .populate("user", [
        "name",
        "major",
        "postsCount",
        "educationLevel",
        "profilePicture",
      ])
      .skip(skip)
      .limit(parseInt(limit));

    if (!posts || posts.length === 0) {
      return res.status(404).json({ msg: "No posts found for this user" });
    }

    const formattedPosts = posts.map((post) => ({
      _id: post._id,
      body: post.body,
      major: post.major,
      reactsCount: Array.from(post.reacts.values()).reduce((a, b) => a + b, 0),
      hasReacted: hasUserReacted(post.reacts, req.user.id),
      date: timeSince(post.date),
      user: {
        name: post.user.name,
        major: post.user.major,
        educationLevel: post.user.educationLevel,
        profilePicture: post.user.profilePicture
          ? `${req.protocol}://${req.get("host")}/uploads/profilephotos/${
              post.user.profilePicture
            }`
          : null,
      },
      comments: post.comments.map((comment) => ({
        _id: comment._id,
        body: comment.body,
        user: comment.user.name,
        reactsCount: Array.from(comment.reacts.values()).reduce(
          (a, b) => a + b,
          0
        ),
        hasReacted: hasUserReacted(comment.reacts, req.user.id),
        date: timeSince(comment.date),
        replies: comment.replies.map((reply) => ({
          _id: reply._id,
          body: reply.body,
          user: reply.user.name,
          reactsCount: Array.from(reply.reacts.values()).reduce(
            (a, b) => a + b,
            0
          ),
          hasReacted: hasUserReacted(reply.reacts, req.user.id),
          date: timeSince(reply.date),
        })),
      })),
    }));

    res.json(formattedPosts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};




// Update a post by ID
exports.updatePost = async (req, res) => {
  const { postId } = req.params;
  const { body, latitude, longitude } = req.body;

  try {
    let post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Ensure the user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Update the post fields if they exist in the request
    if (body) post.body = body;
    if (latitude && longitude) {
      post.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    post = await post.save();

    const populatedPost = await Post.findById(post._id).populate("user", [
      "name",
      "major",
    ]);

    res.json(populatedPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Delete a post by ID
exports.deletePost = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Ensure the user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await post.remove();

    // Decrement the postsCount for the user
    const user = await User.findById(req.user.id);
    user.postsCount -= 1;
    await user.save();

    res.json({ msg: "Post removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Archive a post by ID
exports.archivePost = async (req, res) => {
  const { postId } = req.params;

  try {
    let post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Ensure the user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Archive the post
    post.isArchived = true;
    await post.save();

    res.json({ msg: "Post archived" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
// Add a reaction to a comment or a reply
exports.addReaction = async (req, res) => {
  const { postId, commentId, replyId } = req.params;
  const { reaction } = req.body;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    let target;
    if (replyId) {
      // Find the reply within the nested replies
      target = post.comments.id(commentId).replies.id(replyId);
    } else {
      // Find the comment
      target = post.comments.id(commentId);
    }

    if (!target) {
      return res.status(404).json({ msg: "Comment or reply not found" });
    }

    // Increment the reaction count
    target.reacts.set(reaction, (target.reacts.get(reaction) || 0) + 1);
    await post.save();

    return res.status(200).json(target);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
// Add a reply to a comment or a reply
exports.addReply = async (req, res) => {
  const { postId, commentId, replyId } = req.params;
  const { body } = req.body;

  if (!body) {
    return res.status(400).json({ msg: "Reply body is required" });
  }

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    let target;
    if (replyId) {
      // Find the reply within the nested replies
      target = post.comments.id(commentId).replies.id(replyId);
    } else {
      // Find the comment
      target = post.comments.id(commentId);
    }

    if (!target) {
      return res.status(404).json({ msg: "Comment or reply not found" });
    }

    // Add the new reply
    const newReply = {
      user: req.user.id,
      body,
    };

    target.replies.push(newReply);
    await post.save();

    res.json(target.replies[target.replies.length - 1]); // Return the last reply
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
// Get a specific post by postId with comments, replies, reacts, and time since creation
exports.getPostDetailsByPostId = async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId)
      .populate({
        path: "user",
        select: "name major postsCount educationLevel profilePicture", // Populate user details including educationLevel and profilePicture
      })
      .populate({
        path: "comments.user",
        select: "name",
      })
      .populate({
        path: "comments.replies.user",
        select: "name",
      });

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const formattedPost = {
      _id: post._id,
      body: post.body,
      major: post.major,
      reactsCount: Array.from(post.reacts.values()).reduce((a, b) => a + b, 0),
      date: timeSince(post.date),
      user: {
        name: post.user.name,
        major: post.user.major,
        educationLevel: post.user.educationLevel,
        profilePicture: post.user.profilePicture
          ? `${req.protocol}://${req.get("host")}/uploads/profilephotos/${post.user.profilePicture}`
          : null,
      },
      comments: post.comments.map((comment) => ({
        _id: comment._id,
        body: comment.body,
        user: comment.user.name,
        reactsCount: Array.from(comment.reacts.values()).reduce(
          (a, b) => a + b,
          0
        ),
        date: timeSince(comment.date),
        replies: comment.replies.map((reply) => ({
          _id: reply._id,
          body: reply.body,
          user: reply.user.name,
          reactsCount: Array.from(reply.reacts.values()).reduce(
            (a, b) => a + b,
            0
          ),
          date: timeSince(reply.date),
        })),
      })),
    };

    res.json(formattedPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Add a comment to a post
exports.addComment = async (req, res) => {
  const { postId } = req.params;
  const { body } = req.body;

  if (!body) {
    return res.status(400).json({ msg: "Comment body is required" });
  }

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const newComment = {
      user: req.user.id,
      body,
    };

    post.comments.push(newComment);
    await post.save();

    // Populate the user info of the comment before returning
    const populatedPost = await Post.findById(postId)
      .populate("user", "name major")
      .populate({
        path: "comments.user",
        select: "name profilePicture", // Populate the user info of the comment
      });

    res.json(populatedPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
// Add a reaction to a post
exports.addReactionToPost = async (req, res) => {
  const { postId } = req.params;
  const { reaction } = req.body;

  if (!reaction) {
    return res.status(400).json({ msg: "Reaction is required" });
  }

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Increment the reaction count for the given reaction type
    post.reacts.set(reaction, (post.reacts.get(reaction) || 0) + 1);

    await post.save();

    const populatedPost = await Post.findById(postId).populate("user", [
      "name",
      "major",
    ]);

    res.json(populatedPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
// Remove a reaction from a post
exports.removeReactionFromPost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    let removed = false;
    for (const [reactionType, userIds] of post.reacts) {
      if (userIds.includes(userId)) {
        post.reacts.set(
          reactionType,
          userIds.filter((id) => id.toString() !== userId.toString())
        );
        removed = true;
        break;
      }
    }

    if (!removed) {
      return res.status(404).json({ msg: "User has not reacted" });
    }

    await post.save();

    res.json({ msg: "Reaction removed", post });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Remove a reaction from a comment or reply
exports.removeReaction = async (req, res) => {
  const { postId, commentId, replyId } = req.params;
  const userId = req.user.id;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    let target;
    if (replyId) {
      target = post.comments.id(commentId).replies.id(replyId);
    } else {
      target = post.comments.id(commentId);
    }

    if (!target) {
      return res.status(404).json({ msg: "Comment or reply not found" });
    }

    let removed = false;
    for (const [reactionType, userIds] of target.reacts) {
      if (userIds.includes(userId)) {
        target.reacts.set(
          reactionType,
          userIds.filter((id) => id.toString() !== userId.toString())
        );
        removed = true;
        break;
      }
    }

    if (!removed) {
      return res.status(404).json({ msg: "User has not reacted" });
    }

    await post.save();

    res.json({ msg: "Reaction removed", target });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
// Helper function to calculate time since creation
const timeSince = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);

  if (interval >= 1) {
    return interval === 1 ? "1 year ago" : `${interval} years ago`;
  }
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? "1 month ago" : `${interval} months ago`;
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? "1 day ago" : `${interval} days ago`;
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? "1 hour ago" : `${interval} hours ago`;
  }
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;
  }
  return "Just now";
};
