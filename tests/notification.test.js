const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");
jest.setTimeout(20000); // 20 seconds

describe("Notifications", () => {
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
    await Notification.deleteMany();
  });

  test("should get notifications for the logged-in user", async () => {
    const notification = new Notification({
      userId: mongoose.Types.ObjectId(),
      message: "Test notification",
    });

    await notification.save();

    const response = await request(app)
      .get("/api/notifications")
      .set("x-auth-token", token);

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
  });

  test("should return 401 if no token is provided", async () => {
    const response = await request(app).get("/api/notifications");

    expect(response.statusCode).toBe(401);
  });
});
