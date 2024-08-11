const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const { getOnlineUsers } = require("../socket"); // Import the function to get online users
const multer = require("multer");
const path = require("path");
/**
 * Register User
 * @route POST /api/users/register
 * @access Public
 */
exports.registerUser = [
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
      user = new User({ email, phone, name, password });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      console.log(`Hashed Password: ${user.password}`); // Debugging print
      await user.save();

      const payload = { user: { id: user.id } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
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
exports.loginUser = [
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
      }

      console.log(`Stored Password: ${user.password}`);
      console.log(`Plain Text Password: ${password}`);
      console.log(`Stored Hashed Password: ${user.password}`);
      const isMatch = bcrypt.compare(password, user.password);
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

/**
 * Update User Details
 * @route PUT /api/users/update-details
 * @access Private
 */
exports.updateUserDetails = [
  check("firstName", "First name is required").not().isEmpty(),
  check("lastName", "Last name is required").not().isEmpty(),
  check("birthDate", "Birth date is required").not().isEmpty(),
  check("gender", "Gender is required").not().isEmpty(),
  check("educationLevel", "Education level is required").not().isEmpty(),
  check("major", "Major is required").not().isEmpty(),
  check("profession", "Profession  is required").not().isEmpty(),
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
      profession,
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
      user.profession = profession;
      user.country = country;
      user.universityName = universityName;
      user.info = info;
      user.address = address;
      await user.save();

      res.json({ msg: "User details updated successfully" });
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
exports.getOnlineFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("friends");
    const onlineUsers = getOnlineUsers(); // Get the current state of online users
    const onlineFriends = user.friends.filter(
      (friend) => onlineUsers[friend.id]
    );

    res.json(onlineFriends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
/**
 * Get User Details
 * @route GET /api/users/details
 * @access Private
 */
/**
 * Get User Details
 * @route GET /api/users/details
 * @access Private
 */
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select(
        "_id profilePicture backgroundPicture name firstName lastName major educationLevel universityName friends friendsCount posts postsCount info address country birthDate certifications skills"
      )
      .populate("certifications skills posts");

    // The age virtual field will automatically be included when the user object is serialized to JSON
    res.json({
      ...user.toObject(), // Convert the Mongoose document to a plain JS object
      age: user.age, // Explicitly add the age if needed
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
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

    // Filter by gender
    if (gender) {
      query.gender = gender;
    }

    // Filter by university
    if (universityName) {
      query.universityName = universityName;
    }

    // Filter by major
    if (major) {
      query.major = major;
    }

    // Filter by age range
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

    // Filter by location (distance)
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

    // Find users based on the query
    const users = await User.find(
      query,
      "name _id profession universityName profilePicture"
    );

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.requestPasswordReset = async (req, res) => {
  const { phone } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send the reset token via email or SMS
    // const resetMessage = `Your verification code is ${resetToken}`;
    // const mailOptions = {
    //   to: user.email,
    //   from: process.env.EMAIL_USER,
    //   subject: "Password Reset",
    //   text: resetMessage,
    // };

    // transporter.sendMail(mailOptions, (err, response) => {
    //   if (err) {
    //     console.error("Error sending email: ", err);
    //     res.status(500).json({ message: "Error sending email" });
    //   } else {
    //     res
    //       .status(200)
    //       .json({ message: "Verification code sent to your phone" });
    //   }
    // });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
exports.verifyResetToken = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }, // Ensure the token has not expired
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    res.status(200).json({ message: "Token is valid" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }, // Ensure the token has not expired
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    // Hash and save the new password
    user.password = await bcrypt.hash(password, 10);
    // Clear the resetToken and resetTokenExpiry fields
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Directory to save uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, req.user.id + path.extname(file.originalname)); // Save file with user ID
  },
});
// File filter to allow only image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Only images are allowed!");
  }
};
// Initialize multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // Limit file size to 1MB
  fileFilter: fileFilter,
}).single("profilePicture");

// Controller function to upload profile picture
exports.uploadProfilePicture = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const user = await User.findById(req.user.id);
      user.profilePicture = `/uploads/${req.file.filename}`;
      await user.save();

      res.json({
        message: "Profile picture uploaded successfully",
        profilePicture: user.profilePicture,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
};

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ msg: "Query parameter is required" });
    }

    const users = await User.find(
      { name: new RegExp(query, "i") },
      "name _id profilePicture"
    );

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
