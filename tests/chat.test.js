const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const User = require("../models/User");
const Chat = require("../models/Chat");
const jwt = require("jsonwebtoken");
jest.setTimeout(20000); // 20 seconds

describe("Chats", () => {
  let token;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const user = new User({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });

    await user.save();

    token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Chat.deleteMany();
  });

  test("should send a message", async () => {
    const chat = new Chat({
      chatId: mongoose.Types.ObjectId(),
      sender: mongoose.Types.ObjectId(),
      text: "Hello!",
    });

    await chat.save();

    const response = await request(app)
      .post("/api/chats/send")
      .set("x-auth-token", token)
      .send({
        chatId: chat.chatId,
        text: "Hello!",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.text).toBe("Hello!");
  });

  test("should return 401 if no token is provided", async () => {
    const response = await request(app).post("/api/chats/send").send({
      chatId: mongoose.Types.ObjectId(),
      text: "Hello!",
    });

    expect(response.statusCode).toBe(401);
  });
});
