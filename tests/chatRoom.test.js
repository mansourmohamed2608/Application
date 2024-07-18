const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const User = require("../models/User");
const ChatRoom = require("../models/ChatRoom");
const jwt = require("jsonwebtoken");
jest.setTimeout(20000); // 20 seconds

describe("Chat Rooms", () => {
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
    await ChatRoom.deleteMany();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("should create a chat room", async () => {
    const response = await request(app)
      .post("/api/chat-rooms/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Room",
        code: "12345",
        createdBy: new mongoose.Types.ObjectId(), // Ensure createdBy field is provided
        members: [],
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("name", "Test Room");
  });

  test("should return 401 if no token is provided", async () => {
    const response = await request(app).post("/api/chat-rooms/create").send({
      name: "Test Room",
      code: "12345",
      createdBy: new mongoose.Types.ObjectId(), // Ensure createdBy field is provided
      members: [],
    });

    expect(response.statusCode).toBe(401);
  });
});
