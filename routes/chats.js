const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const auth = require("../middleware/auth");

/**
 * @swagger
 * /api/chats/send:
 *   post:
 *     summary: Send a message
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Chats
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - text
 *               - date
 *             properties:
 *               recipientId:
 *                 type: string
 *               text:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Message sent
 *       400:
 *         description: Missing fields
 *       500:
 *         description: Server error
 */
router.post("/send", auth, chatController.sendMessage);

module.exports = router;

/**
 * @swagger
 * /api/chats/history/{userId}:
 *   get:
 *     summary: Get chat history
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No chat messages found
 */
router.get("/history/:userId", auth, chatController.getChatHistory);

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: Get all chats
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Unauthorized
 */
router.get("/", auth, chatController.getAllChats);

module.exports = router;
