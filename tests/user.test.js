const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
jest.setTimeout(20000); // 20 seconds

describe("User Registration and Login", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoose.disconnect(); // Ensure proper disconnection
  });

  afterEach(async () => {
    await User.deleteMany();
  });

  test("should register a new user", async () => {
    const response = await request(app).post("/api/users/register").send({
      email: "unique1@example.com",
      phone: "1234567890",
      name: "Unique User1",
      password: "password123",
      confirmPassword: "password123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  test("should fail to register a user with an existing email", async () => {
    await User.create({
      email: "unique2@example.com",
      phone: "1234567890",
      name: "Unique User2",
      password: "password123",
    });

    const response = await request(app).post("/api/users/register").send({
      email: "unique2@example.com",
      phone: "1234567890",
      name: "Unique User3",
      password: "password123",
      confirmPassword: "password123",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("msg", "User already exists");
  });

  test("should login an existing user", async () => {
    const user = await User.create({
      email: "unique4@example.com",
      phone: "1234567890",
      name: "Unique User4",
      password: await bcrypt.hash("password123", 10),
    });

    const response = await request(app).post("/api/users/login").send({
      email: "unique4@example.com",
      password: "password123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  test("should fail to login with incorrect credentials", async () => {
    const response = await request(app).post("/api/users/login").send({
      email: "unique4@example.com",
      password: "wrongpassword",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("msg", "Invalid Credentials");
  });
});
