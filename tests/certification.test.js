const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const User = require("../models/User");
const Certification = require("../models/Certification");
const jwt = require("jsonwebtoken");
jest.setTimeout(20000); // 20 seconds

describe("Certifications", () => {
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
    await Certification.deleteMany();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("should add a certification", async () => {
    const response = await request(app)
      .post("/api/certifications/add")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId: new mongoose.Types.ObjectId(),
        title: "Test Certification",
        year: "2024",
        document: "path/to/document",
        achievementDate: new Date(),
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("title", "Test Certification");
  });

  test("should return 401 if no token is provided", async () => {
    const response = await request(app).post("/api/certifications/add").send({
      userId: new mongoose.Types.ObjectId(),
      title: "Test Certification",
      year: "2024",
      document: "path/to/document",
      achievementDate: new Date(),
    });

    expect(response.statusCode).toBe(401);
  });
});
