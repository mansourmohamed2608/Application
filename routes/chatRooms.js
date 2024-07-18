const express = require("express");
const router = express.Router();
const chatRoomController = require("../controllers/chatRoomController");
const auth = require("../middleware/auth");
/**
 * @swagger
 * /api/chat-rooms/create:
 *   post:
 *     summary: Create a chat room
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Chat Rooms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - createdBy
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               createdBy:
 *                 type: string
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Chat room created
 *       400:
 *         description: Missing fields
 *       500:
 *         description: Server error
 */
router.post("/create", auth, chatRoomController.createChatRoom);
/**
 * @swagger
 * /api/chat-rooms/add-user:
 *   post:
 *     summary: Add a user to a chat room
 *     tags: [ChatRooms]
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
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat room not found
 */
router.post("/add-user", auth, chatRoomController.addUserToChatRoom);

/**
 * @swagger
 * /api/chat-rooms/start-call:
 *   post:
 *     summary: Start a chat room call
 *     tags: [ChatRooms]
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
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat room not found
 */
router.post("/start-call", auth, chatRoomController.startCall);

/**
 * @swagger
 * /api/chat-rooms:
 *   get:
 *     summary: Get all chat rooms
 *     tags: [ChatRooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat rooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatRoom'
 *       401:
 *         description: Unauthorized
 */
router.get("/", auth, chatRoomController.getAllChatRooms);

/**
 * @swagger
 * /api/chat-rooms/{id}:
 *   get:
 *     summary: Get chat room details
 *     tags: [ChatRooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the chat room
 *     responses:
 *       200:
 *         description: Chat room details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoom'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat room not found
 */
router.get("/:id", auth, chatRoomController.getChatRoomDetails);

/**
 * @swagger
 * /api/chat-rooms/join:
 *   post:
 *     summary: Join a chat room
 *     tags: [ChatRooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Joined chat room successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chat room not found
 */
router.post("/join", auth, chatRoomController.joinChatRoom);

module.exports = router;
