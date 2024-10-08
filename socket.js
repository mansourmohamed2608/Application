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

    // Handle RTC signaling data
    socket.on("rtc-signal", (data) => {
      socket.to(data.roomId).emit("rtc-signal", data);
    });

    // Handle call initiation
    socket.on("call-user", (data) => {
      const { recipientId, offer } = data;
      const recipientSocketId = onlineUsers[recipientId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("incoming-call", {
          from: socket.id,
          offer: offer,
        });
      }
    });

    // Handle call answer
    socket.on("answer-call", (data) => {
      const { to, answer } = data;
      io.to(onlineUsers[to]).emit("call-answered", { answer });
    });

    // Handle ICE candidate exchange
    socket.on("ice-candidate", (data) => {
      const { to, candidate } = data;
      io.to(onlineUsers[to]).emit("ice-candidate", { candidate });
    });
  });

  return io;
};

// Function to get the current state of onlineUsers
const getOnlineUsers = () => {
  return onlineUsers;
};

module.exports = { setupSocket, getOnlineUsers };
