const express = require("express");
const router = express.Router();
const passport = require("passport");
require("../controllers/GoogleAuthController");
const { logout, GJWT } = require("../controllers/GoogleAuthController");
const verifyGJWT = require("../middleware/googleJWT");

// Trigger Google Authentication
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Auth Callback
router.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", (err, user, info) => {
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

    req.login(user, { session: true }, (err) => {
      if (err) {
        return next(err);
      }
      req.session.userId = user.id;

      const accessToken = user.accessToken;

      if (!accessToken) {
        return res.status(500).json({
          error: "Authentication error",
          details: "No access token received.",
        });
      }

      res.cookie("accesstoken", accessToken, { httpOnly: true, secure: true });
      res.redirect(
        `https://https://mobile-app-backend-woad.vercel.app/?y=${accessToken}&username=${user.name}&userid=${user.id}&profileimg=${user.profilePicture}`
      );
    });
  })(req, res, next);
});

// Authentication failure route
router.get("/auth/google/failure", (req, res) => {
  res.status(401).send("Authentication failed");
});

// Successful authentication route, if needed separately
router.get("/auth/google/success", (req, res) => {
  if (req.user && req.user.name) {
    res.status(200).send(`Hello ${req.user.name}!`);
  } else {
    res.status(400).send("No user information available.");
  }
});

router.get("/logout", logout);
router.get("/checkaccesstoken", GJWT, verifyGJWT);

module.exports = router;
