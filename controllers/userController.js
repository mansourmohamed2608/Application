const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const { getOnlineUsers } = require("../socket"); // Import the function to get online users

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
      profilePicture,
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
      user.profilePicture = profilePicture;
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
        "name firstName lastName universityName friends info address major profession country birthDate gender educationLevel profilePicture certifications skills"
      )
      .populate("certifications");

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
