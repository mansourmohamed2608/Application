const express = require("express");
const router = express.Router();
const friendRequestController = require("../controllers/friendRequestController");
const auth = require("../middleware/auth");

/**
 * @swagger
 * /api/friend-requests:
 *   post:
 *     summary: Send a friend request
 *     tags: [FriendRequests]
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
router.post("/", auth, friendRequestController.sendFriendRequest);

/**
 * @swagger
 * /api/friend-requests:
 *   get:
 *     summary: View friend requests received by the user
 *     tags: [FriendRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Friend requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FriendRequest'
 *       401:
 *         description: Unauthorized
 */
router.get("/", auth, friendRequestController.viewFriendRequests);

/**
 * @swagger
 * /api/friend-requests/{id}/accept:
 *   put:
 *     summary: Accept friend request
 *     tags: [FriendRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the friend request
 *     responses:
 *       200:
 *         description: Friend request accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FriendRequest'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Friend request not found
 */
router.put("/:id/accept", auth, friendRequestController.acceptFriendRequest);

/**
 * @swagger
 * /api/friend-requests/{id}/reject:
 *   put:
 *     summary: Reject friend request
 *     tags: [FriendRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the friend request
 *     responses:
 *       200:
 *         description: Friend request rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FriendRequest'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Friend request not found
 */
router.put("/:id/reject", auth, friendRequestController.rejectFriendRequest);

module.exports = router;
