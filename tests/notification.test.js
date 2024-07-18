const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");
jest.setTimeout(20000); // 20 seconds

describe("Notifications", () => {
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
    await Notification.deleteMany();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("should get notifications for the logged-in user", async () => {
    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  test("should return 401 if no token is provided", async () => {
    const response = await request(app).get("/api/notifications");

    expect(response.statusCode).toBe(401);
  });
});
