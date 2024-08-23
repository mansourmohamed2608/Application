const User = require("../models/User");
const Post = require("../models/Post");
const Skill = require("../models/skill");
const Certification = require("../models/Certification.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const { getOnlineUsers } = require("../socket"); // Import the function to get online users
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto"); // For generating OTP
const request = require("request"); // For making HTTP requests
const otpStore = require("../temp/otpStore"); // Importing the OTP store

const sendOtp = async (req, res) => {
  const { phone } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString(); // Generate OTP
  const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

  try {
    //Find the user by phone number
    let user = await User.findOne({ phone: phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //Update the user's OTP and expiration time
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const options = {
      method: "POST",
      url: "https://instawhats.com/api/create-message",
      headers: {},
      formData: {
        appkey: "3ce72a03-562b-42f2-b107-600fcc2093cd",
        authkey: "v83Rh1D4KcZyOvWsWPIR7VJWzKB12XFjZeXIwQNzY7hBbLCDZo",
        to: phone,
        message: `Your OTP code is: ${otp}`,
        file: "",
      },
    };

    request(options, (error, response) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ message: "OTP sent successfully" });
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error, OTP not sent" });
  }
};

/**
 * Register User
 * @route POST /api/users/register
 * @access Public
 */
const registerUser = [
  check("email", "Please include a valid email").isEmail(),
  check("phone", "Phone number is required").not().isEmpty(),
  check("name", "Name is required").not().isEmpty(),
  check("password", "Password must be 6 or more characters").isLength({
    min: 6,
  }),
  check("confirmPassword", "Confirm password is required").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, phone, name, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    try {
      let user = await User.findOne({ phone });
      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      user = new User({
        email,
        phone,
        name,
        password,
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Call the sendOtp function to send the OTP
      await sendOtp({ body: { phone } }, res);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  },
];
/**
 * Login User
 * @route POST /api/users/login
 * @access Public
 */
const loginUser = [
  check("phone", "Please include a valid phone number").not().isEmpty(),
  check("password", "Password is required").exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;
    console.log(`Phone: ${phone}, Password: ${password}`);
    try {
      // Find user by phone number
      let user = await User.findOne({ phone });
      if (!user) {
        console.log("User not found");
        return res.status(400).json({ msg: "Invalid Credentials" });
      }

      if (!user.password) {
        console.log("User password is undefined");
        return res.status(400).json({ msg: "Password is not set" });
      }

      console.log(`Stored Password: ${user.password}`);
      console.log(`Plain Text Password: ${password}`);
      console.log(`Stored Hashed Password: ${user.password}`);

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        console.log("Password mismatch");
        return res.status(400).json({ msg: "Invalid Credentials" });
      }

      const payload = { user: { id: user.id } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
        (err, token) => {
          if (err) {
            console.error(`JWT Sign Error: ${err.message}`);
            throw err;
          }
          console.log(`Generated Token: ${token}`);
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(`Server Error: ${err.message}`);
      res.status(500).send("Server error");
    }
  },
];

const changePassword = [
  check("oldPassword", "Old password is required").exists(),
  check("newPassword", "New password must be 6 or more characters").isLength({
    min: 6,
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { oldPassword, newPassword } = req.body;

    try {
      const user = await User.findById(req.user.id);

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Old password is incorrect" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.otpVerified = false; // Mark as not verified by OTP

      await user.save();

      // Send OTP after changing the password
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

      user.otp = otp;
      user.otpExpiry = otpExpiry;

      await user.save();

      // Send the OTP via SMS or another service
      const options = {
        method: "POST",
        url: "https://instawhats.com/api/create-message",
        headers: {},
        formData: {
          appkey: "3ce72a03-562b-42f2-b107-600fcc2093cd",
          authkey: "v83Rh1D4KcZyOvWsWPIR7VJWzKB12XFjZeXIwQNzY7hBbLCDZo",
          to: user.phone,
          message: `Your OTP code is: ${otp}`,
          file: "",
        },
      };

      request(options, (error, response) => {
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({
          msg: "Password changed successfully. OTP sent to verify the change.",
        });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  },
];

const verifyOtpForPasswordChange = async (req, res) => {
  const { otp } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if the OTP has expired
    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Check if the OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark the OTP as verified
    user.otpVerified = true;
    user.otp = undefined; // Clear OTP
    user.otpExpiry = undefined; // Clear OTP expiry

    await user.save();

    res.status(200).json({
      message: "OTP verified successfully. Your password change is confirmed.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update User Details
 * @route PUT /api/users/update-details
 * @access Private
 */
const addUserDetails = [
  check("firstName", "First name is required").not().isEmpty(),
  check("lastName", "Last name is required").not().isEmpty(),
  check("birthDate", "Birth date is required").not().isEmpty(),
  check("gender", "Gender is required").not().isEmpty(),
  check("educationLevel", "Education level is required").not().isEmpty(),
  check("major", "Major is required").not().isEmpty(),
  check("country", "Country is required").not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      birthDate,
      gender,
      educationLevel,
      major,
      country,
      universityName,
      info,
      address,
    } = req.body;

    try {
      let user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      user.firstName = firstName;
      user.lastName = lastName;
      user.birthDate = birthDate;
      user.gender = gender;
      user.educationLevel = educationLevel;
      user.major = major;
      user.country = country;
      user.universityName = universityName;
      user.info = info;
      user.address = address;
      await user.save();

      res.json({ msg: "User details added successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  },
];

const updateUserDetails = [
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName,
      lastName,
      birthDate,
      universityName,
      major,
      address,
      info,
    } = req.body;

    try {
      let user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      user.firstName = firstName;
      user.lastName = lastName;
      user.birthDate = birthDate;
      user.universityName = universityName;
      user.major = major;
      user.address = address;
      user.info = info;

      await user.save();

      res.json({ msg: "User details updated successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  },
];

const updateAccount = [
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email } = req.body;

    try {
      let user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      user.name = name;
      user.email = email;

      await user.save();

      res.json({ msg: "Account updated successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  },
];

/**
 * Get Online Friends
 * @route GET /api/users/online-friends
 * @access Private
 */
const getOnlineFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("friends");
    const onlineUsers = getOnlineUsers(); // Get the current state of online users
    const onlineFriends = user.friends.filter(
      (friend) => onlineUsers[friend.id]
    );

    // Attach the profile picture URL to each friend
    const onlineFriendsWithProfilePics = onlineFriends.map((friend) => {
      return {
        ...friend.toObject(),
        profilePictureUrl: friend.profilePicture
          ? `${req.protocol}://${req.get("host")}/uploads/profilephotos/${
              friend.profilePicture
            }`
          : null,
      };
    });

    res.json(onlineFriendsWithProfilePics);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

/**
 * Get My Details
 * @route GET /api/users/details
 * @access Private
 */
const getMyDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select(
        "_id profilePicture backgroundPicture name firstName lastName major educationLevel universityName age friends friendsCount posts postsCount info address country certifications skills"
      )
      .populate("certifications skills posts");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Populate certifications with URLs
    const populatedCertifications = await Certification.find({
      userId: user._id,
    }).sort({
      year: -1,
    });

    const certificationsWithUrl = populatedCertifications.map((cert) => {
      const documentUrl = cert.document
        ? `${req.protocol}://${req.get(
            "host"
          )}/uploads/certifications/${path.basename(cert.document)}`
        : null;
      return {
        ...cert.toObject(),
        documentUrl,
      };
    });

    // Populate skills
    const populatedSkills = await Skill.find({ userId: user._id }).sort({
      title: 1,
    });

    // Populate posts
    const populatedPosts = await Post.find({ user: user._id })
      .populate("user", "name major profilePicture")
      .sort({ date: -1 });

    const profilePictureUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/profilephotos/${user.profilePicture}`;

    res.json({
      ...user.toObject(),
      profilePictureUrl,
      posts: populatedPosts,
      skills: populatedSkills,
      certifications: certificationsWithUrl, // Include the populated certifications with URLs in the response
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

/**
 * Get User Details
 * @route GET /api/users/:userId/details
 * @access Private
 */
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select(
        "_id profilePicture backgroundPicture name firstName lastName major educationLevel universityName age posts postsCount info address country certifications skills friends"
      )
      .populate("certifications skills posts");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const loggedInUser = await User.findById(req.user.id).select("friends");

    // Ensure `friends` array is defined
    const userFriends = user.friends || [];
    const loggedInUserFriends = loggedInUser.friends || [];

    const mutualFriends = userFriends.filter((friendId) =>
      loggedInUserFriends.includes(friendId.toString())
    );

    const populatedMutualFriends = await User.find({
      _id: { $in: mutualFriends },
    }).select("name profilePicture");

    const profilePictureUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/profilephotos/${user.profilePicture}`;

    // Populate certifications with URLs
    const populatedCertifications = await Certification.find({
      userId: user._id,
    }).sort({
      year: -1,
    });

    const certificationsWithUrl = populatedCertifications.map((cert) => {
      const documentUrl = cert.document
        ? `${req.protocol}://${req.get(
            "host"
          )}/uploads/certifications/${path.basename(cert.document)}`
        : null;
      return {
        ...cert.toObject(),
        documentUrl,
      };
    });

    // Populate skills
    const populatedSkills = await Skill.find({ userId: user._id }).sort({
      title: 1,
    });

    // Populate posts
    const populatedPosts = await Post.find({ user: user._id })
      .populate("user", "name major profilePicture")
      .sort({ date: -1 });

    res.json({
      ...user.toObject(),
      profilePictureUrl,
      mutualFriends: populatedMutualFriends,
      mutualFriendsCount: populatedMutualFriends.length,
      posts: populatedPosts,
      skills: populatedSkills,
      certifications: certificationsWithUrl, // Include the populated certifications with URLs in the response
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const {
      gender,
      distance,
      longitude,
      latitude,
      universityName,
      major,
      minAge,
      maxAge,
    } = req.query;

    let query = {};

    if (gender) query.gender = gender;
    if (universityName) query.universityName = universityName;
    if (major) query.major = major;

    if (minAge || maxAge) {
      const today = new Date();
      const currentYear = today.getFullYear();

      if (minAge) {
        const minBirthYear = currentYear - minAge;
        query.birthDate = { $lte: new Date(`${minBirthYear}-12-31`) };
      }

      if (maxAge) {
        const maxBirthYear = currentYear - maxAge;
        query.birthDate = query.birthDate || {};
        query.birthDate.$gte = new Date(`${maxBirthYear}-01-01`);
      }
    }

    if (distance && longitude && latitude) {
      query.location = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(distance) / 3963.2,
          ],
        },
      };
    }

    const users = await User.find(
      query,
      "name _id major universityName profilePicture"
    );

    // Add profile picture URL to each user
    const usersWithProfilePictureUrl = users.map((user) => ({
      ...user.toObject(),
      profilePictureUrl: `${req.protocol}://${req.get(
        "host"
      )}/uploads/profilephotos/${user.profilePicture}`,
    }));

    res.json(usersWithProfilePictureUrl);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const requestPasswordReset = async (req, res) => {
  const { phone } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    // Set OTP and mark as not verified by OTP
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpVerified = false; // Mark as not verified by OTP

    await user.save();

    // Send the OTP via SMS or an external service
    const options = {
      method: "POST",
      url: "https://instawhats.com/api/create-message",
      headers: {},
      formData: {
        appkey: "3ce72a03-562b-42f2-b107-600fcc2093cd",
        authkey: "v83Rh1D4KcZyOvWsWPIR7VJWzKB12XFjZeXIwQNzY7hBbLCDZo",
        to: phone,
        message: `Your OTP code is: ${otp}`,
        file: "",
      },
    };

    request(options, (error, response) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ message: "OTP sent successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  const { phone, newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const user = await User.findOne({
      phone,
      otpVerified: true, // Ensure OTP was verified
    });
    if (!user)
      return res.status(400).json({ message: "OTP verification required" });

    // Hash and save the new password
    user.password = await bcrypt.hash(newPassword, 10);
    // Clear the OTP fields
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpVerified = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ msg: "Query parameter is required" });
    }

    const users = await User.find(
      { name: new RegExp(query, "i") },
      "name _id profilePicture"
    );

    // Add profile picture URL to each user
    const usersWithProfilePictureUrl = users.map((user) => ({
      ...user.toObject(),
      profilePictureUrl: `${req.protocol}://${req.get(
        "host"
      )}/uploads/profilephotos/${user.profilePicture}`,
    }));

    res.json(usersWithProfilePictureUrl);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const profilePhotosDir = path.join(__dirname, "../uploads/profilephotos");
if (!fs.existsSync(profilePhotosDir)) {
  fs.mkdirSync(profilePhotosDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilePhotosDir);
  },
  filename: function (req, file, cb) {
    const filename = `${req.user.id}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, filename);
  },
});

// File filter to check for image types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, and GIF images are allowed."
      ),
      false
    );
  }
};

// Initialize Multer with storage and fileFilter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});
const uploadProfilePicture = [
  upload.single("profilePicture"), // Multer middleware for handling single file upload
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the user already has a profile picture
      if (user.profilePicture) {
        // Path to the existing profile picture
        const oldProfilePicturePath = path.join(
          profilePhotosDir,
          user.profilePicture
        );

        // Check if the file exists in the folder
        if (fs.existsSync(oldProfilePicturePath)) {
          // Remove the existing profile picture file
          fs.unlinkSync(oldProfilePicturePath);
        }
      }

      // Check if file was uploaded (in case the filter blocked it)
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "No valid image file uploaded" });
      }

      // Save the new profile picture's file name in the database
      user.profilePicture = req.file.filename;
      await user.save();

      res.json({
        message: "Profile picture uploaded successfully",
        profilePicture: req.file.filename,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "Server error" });
    }
  },
];

// Controller function to verify OTP
const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    // Find the user by phone number
    const user = await User.findOne({ phone: phone });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the OTP has expired
    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Check if the OTP matches
    if (user.otp !== otp) {
      console.log(user.otp);
      console.log(otp);
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark the user as verified
    user.otpVerified = true;
    // Optionally clear the OTP fields after successful verification
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    // Generate JWT token
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" }, // Set token expiration time
      (err, token) => {
        if (err) throw err;
        return res.status(200).json({
          message: "OTP verified successfully",
          token, // Send the JWT token in the response
        });
      }
    );
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  sendOtp,
  registerUser,
  loginUser,
  changePassword,
  verifyOtpForPasswordChange,
  addUserDetails,
  updateUserDetails,
  updateAccount,
  getOnlineFriends,
  getMyDetails,
  getUserDetails,
  requestPasswordReset,

  resetPassword,
  uploadProfilePicture,
  getAllUsers,
  searchUsers,
  verifyOTP,
};
