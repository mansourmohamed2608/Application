const express = require("express");
const connectDB = require("./config/db");
const app = express();
app.set('trust proxy', true);
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./swagger"); // Ensure you have swagger setup
const http = require("http");
const { Server } = require("socket.io");
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

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("message", (message) => {
    handleSignaling(io, socket, message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));

module.exports = app;
