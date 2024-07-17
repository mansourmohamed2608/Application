const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const friendRequestController = require("../controllers/friendRequestController");
const auth = require("../middleware/auth");

/**
 * @swagger
 * /api/friend-requests/send:
 *   post:
 *     summary: Send a friend request
 *     tags: [Friend Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Friend request sent successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipient not found
 */
router.post(
  "/send",
  [auth, [check("recipientId", "Recipient ID is required").not().isEmpty()]],
  friendRequestController.sendFriendRequest
);
router.get("/", auth, friendRequestController.viewFriendRequests);
router.put("/:id/accept", auth, friendRequestController.acceptFriendRequest);
router.put("/:id/reject", auth, friendRequestController.rejectFriendRequest);

module.exports = router;
