const express = require("express");
const connectDB = require("./config/db");
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
const { Server } = require("socket.io");
const path = require("path");
const User = require("./models/User"); // Import the User model

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

// Define Routes
app.use("/api/users", require("./routes/users"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/chats", require("./routes/chats"));
app.use("/api/friend-requests", require("./routes/friendRequests"));
app.use("/api/chat-rooms", require("./routes/chatRooms"));
app.use("/api/certifications", require("./routes/certifications"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Error Handling Middleware
app.use(require("./middleware/errorHandler"));

// WebSocket Server for signaling
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const onlineUsers = {}; // Key: user ID, Value: socket ID

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("userOnline", async (userId) => {
    onlineUsers[userId] = socket.id;
    console.log("User is online:", userId);
    await User.findByIdAndUpdate(userId, { status: "online" });
  });

  socket.on("disconnect", async () => {
    for (const [userId, socketId] of Object.entries(onlineUsers)) {
      if (socketId === socket.id) {
        delete onlineUsers[userId];
        console.log("User disconnected:", userId);
        await User.findByIdAndUpdate(userId, { status: "offline" });
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = { app, onlineUsers }; // Export both app and onlineUsers
