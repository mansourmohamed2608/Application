const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const User = require("../models/User");
const Chat = require("../models/Chat");
const jwt = require("jsonwebtoken");
jest.setTimeout(20000); // 20 seconds

describe("Chats", () => {
  let token;
  let emailCount = 0;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  beforeEach(async () => {
    emailCount++;
    const user = new User({
      username: "testuser",
      email: `test${emailCount}@example.com`,
      phone: "1234567890",
      name: "Test User",
      password: "password123",
    });

    await user.save();

    token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  });

  afterEach(async () => {
    await User.deleteMany();
    await Chat.deleteMany();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("should send a message", async () => {
    const recipient = new User({
      username: "recipient",
      email: `recipient${emailCount}@example.com`,
      phone: "0987654321",
      name: "Recipient User",
      password: "password123",
    });

    await recipient.save();

    const response = await request(app)
      .post("/api/chats/send")
      .set("Authorization", `Bearer ${token}`)
      .send({
        recipientId: recipient.id,
        text: "Hello!",
        date: new Date(),
      });

    console.log("Response Body:", response.body); // Log the response body for debugging

    expect(response.statusCode).toBe(200);
    expect(response.body.text).toBe("Hello!");
  });

  test("should return 401 if no token is provided", async () => {
    const recipient = new User({
      username: "recipient",
      email: `recipient${emailCount}@example.com`,
      phone: "0987654321",
      name: "Recipient User",
      password: "password123",
    });

    await recipient.save();

    const response = await request(app).post("/api/chats/send").send({
      recipientId: recipient.id,
      text: "Hello!",
      date: new Date(),
    });

    expect(response.statusCode).toBe(401);
  });
});
