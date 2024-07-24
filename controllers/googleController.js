const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const axios = require("axios");
const User = require("../models/User"); // Assuming User model is in ../models/User
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://mobile-app-backend-woad.vercel.app/auth/google/callback", // Update to match your new website
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          const email = profile.emails && profile.emails[0].value;
          const picture = profile.photos[0].value;
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: email,
            profilePicture: picture,
            accessToken: accessToken,
          });
          await user.save();
        } else {
          user.accessToken = accessToken;
          await user.save();
        }

        done(null, user);
      } catch (error) {
        console.error("Error in Google Strategy:", error);
        done(error, null);
      }
    }
  )
);

const extractToken = (req) => {
  const auth = req.headers.auth;
  return auth;
};

const logout = async (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { accessToken: token },
      { accessToken: null }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error during logout" });
  }
};

const validateTokenWithGoogleAndDatabase = async (token) => {
  try {
    const googleResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`
    );
    const googleData = googleResponse.data;
    const user = await User.findOne({ googleId: googleData.sub });

    if (!user) {
      throw new Error("No matching user found or token mismatch.");
    }

    return user;
  } catch (error) {
    console.error(
      "Error verifying token with Google or fetching user from DB:",
      error
    );
    throw new Error("Token verification failed or user not found.");
  }
};

const GJWT = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    const user = await validateTokenWithGoogleAndDatabase(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: " + error.message });
  }
};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error("Error deserializing user:", error);
    done(error, null);
  }
});

module.exports = { passport, logout, GJWT };
