const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

router.get("/online-friends", auth, userController.getOnlineFriends);
router.get("/details", auth, userController.getUserDetails);
module.exports = router;
