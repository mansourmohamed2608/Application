const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Import the User model

module.exports = async function (req, res, next) {
  // Get token from header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;

    // Check if OTP is verified in the database
    const user = await User.findById(req.user.id).select("otpVerified");
    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    if (!user.otpVerified) {
      return res.status(401).json({ msg: "OTP verification required" });
    }

    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};
