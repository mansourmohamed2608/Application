const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");

const getTokenFromHeaders = (req) => {
  const auth = req.headers.auth;
  return auth;
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
    const token = getTokenFromHeaders(req);

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

module.exports = GJWT;
