const express = require("express");
const router = express.Router();
const certificationController = require("../controllers/certificationController");
const auth = require("../middleware/auth");

/**
 * @swagger
 * /api/certifications/add:
 *   post:
 *     summary: Add a certification
 *     tags: [Certifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               year:
 *                 type: string
 *               document:
 *                 type: string
 *     responses:
 *       200:
 *         description: Certification added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/add", auth, certificationController.addCertification);

module.exports = router;
