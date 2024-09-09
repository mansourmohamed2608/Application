const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const postController = require("../controllers/postsController");

// @route   POST /api/posts
// @desc    Create a post
// @access  Private
router.post("/createpost", auth, postController.createPost);

// @route   GET /api/posts
// @desc    Get all posts
// @access  Private
router.get("/getAllPosts", auth, postController.getAllPosts);

// @route   GET /api/posts/friends
// @desc    Get all posts from friends
// @access  Private
router.get("/getFriendsPosts", auth, postController.getFriendsPosts);

// @route   GET /api/posts/me
// @desc    Get all posts by the logged-in user
// @access  Private
router.get("/GetUserposts/:userId", auth, postController.getPostsByUserId);

// @route   PUT /api/posts/:postId
// @desc    Update a post by ID
// @access  Private
router.put("/updatePost/:postId", auth, postController.updatePost);

// @route   DELETE /api/posts/:postId
// @desc    Delete a post by ID
// @access  Private
router.delete("/deletePost/:postId", auth, postController.deletePost);

// @route   PUT /api/posts/archive/:postId
// @desc    Archive a post by ID
// @access  Private
router.put("/archivePost/:postId", auth, postController.archivePost);

// @route   PUT /api/posts/:postId/comments/:commentId/reacts
// @desc    React to a comment
// @access  Private
router.put(
  "/:postId/comments/:commentId/reacts",
  auth,
  postController.addReaction
);

// @route   PUT /api/posts/:postId/comments/:commentId/replies/:replyId/reacts
// @desc    React to a reply
// @access  Private
router.put(
  "/:postId/comments/:commentId/replies/:replyId/reacts",
  auth,
  postController.addReaction
);

// @route   POST /api/posts/:postId/comments/:commentId/replies
// @desc    Add a reply to a comment
// @access  Private
router.post(
  "/:postId/comments/:commentId/replies",
  auth,
  postController.addReply
);

// @route   POST /api/posts/:postId/comments/:commentId/replies/:replyId/replies
// @desc    Add a reply to a reply
// @access  Private
router.post(
  "/:postId/comments/:commentId/replies/:replyId/replies",
  auth,
  postController.addReply
);

// @route   GET /api/posts/:postId/details
// @desc    Get post by post ID with comments, replies, reacts, and time since creation
// @access  Private
router.get("/:postId/details", auth, postController.getPostDetailsByPostId);

// ----------------------- New Routes -----------------------

// @route   POST /api/posts/:postId/comments
// @desc    Add a comment to a post
// @access  Private
router.post("/:postId/comments", auth, postController.addComment);

// @route   PUT /api/posts/:postId/react
// @desc    Add a reaction to a post
// @access  Private
router.put("/:postId/react", auth, postController.addReactionToPost);

// @route   DELETE /api/posts/:postId/comments/:commentId/replies/:replyId/react
// @desc    Remove a reaction from a reply
// @access  Private
router.delete(
  "/:postId/comments/:commentId/replies/:replyId/react",
  auth,
  postController.removeReaction
);

// @route   DELETE /api/posts/:postId/comments/:commentId/react
// @desc    Remove a reaction from a comment
// @access  Private
router.delete("/:postId/comments/:commentId/react", auth, postController.removeReaction);

// @route   DELETE /api/posts/:postId/react
// @desc    Remove a reaction from a post
// @access  Private
router.delete("/:postId/react", auth, postController.removeReactionFromPost);
module.exports = router;
