const { Server } = require("socket.io");
const User = require("./models/User");

const onlineUsers = {}; // Key: user ID, Value: socket ID

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    // Handle user going online
    socket.on("userOnline", async (userId) => {
      onlineUsers[userId] = socket.id;
      console.log("User is online:", userId);
      await User.findByIdAndUpdate(userId, { status: "online" });
    });

    // Handle user disconnect
    socket.on("disconnect", async () => {
      console.log("Client disconnected", socket.id);
      for (const [userId, socketId] of Object.entries(onlineUsers)) {
        if (socketId === socket.id) {
          delete onlineUsers[userId];
          console.log("User disconnected:", userId);
          await User.findByIdAndUpdate(userId, { status: "offline" });
          break;
        }
      }
    });

    // Handle user joining a room
    socket.on("join-room", (roomId, userId) => {
      socket.join(roomId);
      socket.broadcast.to(roomId).emit("user-connected", userId);

      socket.on("disconnect", () => {
        socket.broadcast.to(roomId).emit("user-disconnected", userId);
      });
    });
  });

  return io;
};

module.exports = { setupSocket, onlineUsers };
