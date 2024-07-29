const express = require("express");
const connectDB = require("./config/db");
const session = require("express-session");
const passport = require("passport");
const app = express();
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./swagger");
const http = require("http");
const path = require("path");

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(morgan("combined"));
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Express session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Use the generated secret key from .env file
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Define Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/chats", require("./routes/chats"));
app.use("/api/friend-requests", require("./routes/friendRequests"));
app.use("/api/chat-rooms", require("./routes/chatRooms"));
app.use("/api/certifications", require("./routes/certifications"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/", require("./routes/google"));

// Error Handling Middleware
app.use(require("./middleware/errorHandler"));

// WebSocket Server for signaling
const server = http.createServer(app);
const { setupSocket } = require("./socket");
setupSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = app; // Export only the app instance
