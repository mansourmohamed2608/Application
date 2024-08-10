const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and login
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post("/register", userController.registerUser);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", userController.loginUser);

/**
 * @swagger
 * /api/users/update-details:
 *   put:
 *     summary: Update user details
 *     security:
 *       - bearerAuth: []
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               birthDate:
 *                 type: string
 *               gender:
 *                 type: string
 *               educationLevel:
 *                 type: string
 *               major:
 *                 type: string
 *               submajor:
 *                 type: string
 *               country:
 *                 type: string
 *               universityName:
 *                 type: string
 *               info:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: User details updated successfully
 *       400:
 *         description: Bad request
 */
router.put("/update-details", auth, userController.updateUserDetails);

/**
 * @swagger
 * /api/users/online-friends:
 *   get:
 *     summary: Get online friends
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Users
 *     responses:
 *        200:
 *          description: A list of online friends
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/User'
 */
router.get("/online-friends", auth, userController.getOnlineFriends);

/**
 * @swagger
 * /api/users/details:
 *   get:
 *     summary: Get user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/details", auth, userController.getUserDetails);

router.post("/reset", userController.requestPasswordReset);

router.post("/verify-token", userController.verifyResetToken);

router.put("/reset", userController.resetPassword);
router.post(
  "/upload-profile-picture",
  auth,
  userController.uploadProfilePicture
);
router.get("/getAllUsers", auth, userController.getAllUsers);
router.get("/searchUsers", auth, userController.searchUsers);
module.exports = router;
