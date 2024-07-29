const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { logout, GJWT } = require("../controllers/googleController");

// Trigger Google Authentication
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Auth Callback
router.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Authentication error", details: err });
    }
    if (!user) {
      return res.status(401).json({
        error: "Authentication failed",
        details: "No user information received from Google.",
      });
    }

    const payload = { id: user.id };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  })(req, res, next);
});

// Authentication failure route
router.get("/auth/google/failure", (req, res) => {
  res.status(401).send("Authentication failed");
});

// Logout route
router.get("/logout", logout);

// Check Access Token route
router.get("/checkaccesstoken", GJWT, (req, res) => {
  res.status(200).json({ message: "Token is valid", user: req.user });
});

module.exports = router;
