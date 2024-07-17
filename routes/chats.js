const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const chatController = require("../controllers/chatController");
const auth = require("../middleware/auth");

/**
 * @swagger
 * /api/chats/send:
 *   post:
 *     summary: Send a message
 *     tags: [Chats]
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
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipient not found
 */
router.post(
  "/send",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  chatController.sendMessage
);

/**
 * @swagger
 * /api/chats/{userId}:
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
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No chat messages found
 */
router.get("/:userId", auth, chatController.getChatHistory);
router.get("/", auth, chatController.getAllChats);

module.exports = router;
