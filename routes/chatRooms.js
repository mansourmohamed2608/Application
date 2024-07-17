const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const chatRoomController = require("../controllers/chatRoomController");
const auth = require("../middleware/auth");

/**
 * @swagger
 * /api/chat-rooms/create:
 *   post:
 *     summary: Create a chat room
 *     tags: [Chat Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Chat room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoom'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/create",
  [
    auth,
    [
      check("name", "Name is required").not().isEmpty(),
      check("members", "Members are required").isArray(),
    ],
  ],
  chatRoomController.createChatRoom
);

/**
 * @swagger
 * /api/chat-rooms/add-user:
 *   post:
 *     summary: Add a user to a chat room
 *     tags: [Chat Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatRoomId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User added to chat room successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoom'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat room not found
 */
router.post(
  "/add-user",
  [
    auth,
    [
      check("chatRoomId", "Chat room ID is required").not().isEmpty(),
      check("userId", "User ID is required").not().isEmpty(),
    ],
  ],
  chatRoomController.addUserToChatRoom
);

/**
 * @swagger
 * /api/chat-rooms/start-call:
 *   post:
 *     summary: Start a chat room call
 *     tags: [Chat Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatRoomId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Call started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoom'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat room not found
 */
router.post(
  "/start-call",
  [auth, [check("chatRoomId", "Chat room ID is required").not().isEmpty()]],
  chatRoomController.startCall
);
router.get("/", auth, chatRoomController.getAllChatRooms);
router.get("/:id", auth, chatRoomController.getChatRoomDetails);
router.post("/join", auth, chatRoomController.joinChatRoom);

module.exports = router;
