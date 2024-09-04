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

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});
const sendOtp = async (req, res) => {
  const { phone } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString(); // Generate OTP
  const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

  try {
    // Find the user by phone number
    let user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's OTP and expiration time
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // First API options
    const firstApiOptions = {
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

    // Second API options (as a fallback)
    const secondApiOptions = {
      method: "POST",
      url: "https://example.com/api/send-sms", // Replace with the actual second API URL
      headers: {},
      formData: {
        apiKey: "your-second-api-key", // Replace with the actual API key for the second service
        to: phone,
        message: `Your OTP code is: ${otp}`,
      },
    };

    // Attempt to send OTP using the first API
    request(firstApiOptions, function (error, response) {
      if (error || response.statusCode !== 200) {
        console.error("First API failed, attempting second API...");

        // If the first API fails, try the second API
        request(secondApiOptions, function (error, response) {
          if (error || response.statusCode !== 200) {
            console.error("Both APIs failed.");
            return res
              .status(500)
              .json({ error: "Failed to send OTP via both APIs." });
          }
          console.log("OTP sent successfully via the second API.");
          return res
            .status(200)
            .json({ message: "OTP sent successfully via the second API." });
        });
      } else {
        console.log("OTP sent successfully via the first API.");
        return res
          .status(200)
          .json({ message: "OTP sent successfully via the first API." });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error, OTP not sent" });
  }
};

module.exports = {
  sendOtp,
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

      // Check if the user has completed their profile details
      const requiredFields = [
        "firstName",
        "lastName",
        "birthDate",
        "gender",
        "educationLevel",
        "major",
      ];

      const isProfileComplete = requiredFields.every((field) => user[field]);

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

          // Return the token and profile completion status
          res.json({
            token,
            profileComplete: isProfileComplete,
          });
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
      user.otpVerified = false;

      await user.save();

      await sendOtp({ body: { phone } }, res);
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
  upload.single("profilePicture"), // Handle profile picture upload
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

      // Handle profile picture upload
      if (req.file) {
        if (user.profilePicture) {
          const oldProfilePicturePath = path.join(
            profilePhotosDir,
            user.profilePicture
          );
          if (fs.existsSync(oldProfilePicturePath)) {
            fs.unlinkSync(oldProfilePicturePath);
          }
        }
        user.profilePicture = req.file.filename;
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

      res.json({
        msg: "User details added successfully",
        profilePicture: user.profilePicture,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  },
];

const updateUserDetails = [
  upload.single("profilePicture"), // Handle profile picture upload
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

      // Handle profile picture upload
      if (req.file) {
        if (user.profilePicture) {
          const oldProfilePicturePath = path.join(
            profilePhotosDir,
            user.profilePicture
          );
          if (fs.existsSync(oldProfilePicturePath)) {
            fs.unlinkSync(oldProfilePicturePath);
          }
        }
        user.profilePicture = req.file.filename;
      }

      user.firstName = firstName;
      user.lastName = lastName;
      user.birthDate = birthDate;
      user.universityName = universityName;
      user.major = major;
      user.address = address;
      user.info = info;

      await user.save();

      res.json({
        msg: "User details updated successfully",
        profilePicture: user.profilePicture,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  },
];

const updateAccount = [
  check("email", "Please include a valid email").isEmail(),
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

      // Check if the email is already in use by another user
      if (email !== user.email) {
        let emailExists = await User.findOne({ email: email });
        if (emailExists) {
          return res.status(400).json({ msg: "Email is already in use" });
        }
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
      (friend) =>
        onlineUsers[friend.id] && friend._id.toString() !== req.user.id // Exclude the logged-in user
    );

    // Attach the profile picture URL and mark each friend as `isFriend`
    const onlineFriendsWithProfilePics = onlineFriends.map((friend) => {
      return {
        ...friend.toObject(),
        profilePictureUrl: friend.profilePicture
          ? `${req.protocol}://${req.get("host")}/uploads/profilephotos/${
              friend.profilePicture
            }`
          : null,
        isFriend: true, // Since this is the friends list, they are all friends
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
// Get user details by ID and check if they are a friend
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select(
        "_id profilePicture backgroundPicture name firstName lastName major educationLevel universityName age posts postsCount info address country certifications skills friends"
      )
      .populate("certifications skills posts");

    if (!user || user._id.toString() === req.user.id) {
      return res
        .status(404)
        .json({ msg: "User not found or can't view your own details" });
    }

    const loggedInUser = await User.findById(req.user.id).select("friends");

    const isFriend = loggedInUser.friends.includes(user._id);

    const profilePictureUrl = user.profilePicture
      ? `${req.protocol}://${req.get("host")}/uploads/profilephotos/${
          user.profilePicture
        }`
      : null;

    res.json({
      ...user.toObject(),
      isFriend, // Include the `isFriend` status
      profilePictureUrl,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get all users with optional filters including location and pagination
const getAllUsers = async (req, res) => {
  try {
    const {
      gender,
      distance,
      longitude,
      latitude,
      page = 1,
      limit = 20,
    } = req.query;

    // Fetch the logged-in user to access their friends list
    const loggedInUser = await User.findById(req.user.id).select("friends");

    let query = { _id: { $ne: req.user.id } }; // Exclude the current user from results

    if (gender) {
      query.gender = gender;
    }

    // Filter by location if longitude, latitude, and distance are provided
    if (distance && longitude && latitude) {
      query.location = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(distance) / 3963.2, // Earth's radius in miles
          ],
        },
      };
    }

    // Pagination
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select("name major educationLevel profilePicture") // Fetch required fields
      .skip(skip)
      .limit(Math.min(limit, 100)); // Cap limit to 100

    // Add 'isFriend' field based on whether the user is in the friends array
    const usersWithFriendStatus = users.map((user) => ({
      ...user.toObject(),
      isFriend: loggedInUser.friends.includes(user._id),
      profilePictureUrl: user.profilePicture
        ? `${req.protocol}://${req.get("host")}/uploads/profilephotos/${
            user.profilePicture
          }`
        : null,
    }));

    res.json(usersWithFriendStatus);
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

    await sendOtp({ body: { phone } }, res);

    request(options, (error, response) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
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

    const loggedInUser = await User.findById(req.user.id).select("friends");

    const users = await User.find(
      {
        name: new RegExp(query, "i"),
        _id: { $ne: req.user.id }, // Exclude the currently logged-in user
      },
      "name _id profilePicture"
    );

    // Add profile picture URL and check if each user is a friend
    const usersWithFriendStatus = users.map((user) => ({
      ...user.toObject(),
      profilePictureUrl: `${req.protocol}://${req.get(
        "host"
      )}/uploads/profilephotos/${user.profilePicture}`,
      isFriend: loggedInUser.friends.includes(user._id), // Check if this user is a friend
    }));

    res.json(usersWithFriendStatus);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Initialize Multer with storage and fileFilter

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
