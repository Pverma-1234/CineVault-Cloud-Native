const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = require("../app");

const {
    findUserByEmail,
    findUserById,
    createUser
} = require("../models/userModel");

// Mock DynamoDB model operations
jest.mock("../models/userModel", () => ({
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn()
}));

describe("CineVault Authentication API", () => {

    beforeAll(() => {
        process.env.JWT_SECRET = "test-secret-for-cinevault";
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ==========================================
    // REGISTRATION TESTS
    // ==========================================

    describe("POST /api/auth/register", () => {

        test("should register a new user successfully", async () => {
            findUserByEmail.mockResolvedValue(null);
            createUser.mockResolvedValue();

            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Test User",
                    email: "test@example.com",
                    password: "Password123"
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.user.email).toBe("test@example.com");

            expect(createUser).toHaveBeenCalledTimes(1);

            // Ensure password is not returned
            expect(response.body.user.password).toBeUndefined();

            // Ensure stored password is hashed
            const savedUser = createUser.mock.calls[0][0];

            expect(savedUser.password).not.toBe("Password123");

            expect(
                await bcrypt.compare(
                    "Password123",
                    savedUser.password
                )
            ).toBe(true);
        });

        test("should reject duplicate email registration", async () => {
            findUserByEmail.mockResolvedValue({
                userId: "existing-user",
                email: "test@example.com"
            });

            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Test User",
                    email: "test@example.com",
                    password: "Password123"
                });

            expect(response.statusCode).toBe(409);
            expect(response.body.success).toBe(false);
            expect(createUser).not.toHaveBeenCalled();
        });

        test("should reject missing registration fields", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    email: "test@example.com"
                });

            expect(response.statusCode).toBe(400);
        });

        test("should reject passwords shorter than 8 characters", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Test User",
                    email: "test@example.com",
                    password: "123"
                });

            expect(response.statusCode).toBe(400);
        });

        test("should reject an invalid email address", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Test User",
                    email: "invalid-email",
                    password: "Password123"
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
        });

        test("should reject a non-string email", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Test User",
                    email: 12345,
                    password: "Password123"
                });

            expect(response.statusCode).toBe(400);
        });

        test("should normalize email and name during registration", async () => {
            findUserByEmail.mockResolvedValue(null);
            createUser.mockResolvedValue();

            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "  Test User  ",
                    email: "  TEST@EXAMPLE.COM  ",
                    password: "Password123"
                });

            expect(response.statusCode).toBe(201);

            const savedUser = createUser.mock.calls[0][0];

            expect(savedUser.email).toBe("test@example.com");
            expect(savedUser.name).toBe("Test User");
        });

        test("should return 500 when database registration fails", async () => {
            findUserByEmail.mockResolvedValue(null);
            createUser.mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Test User",
                    email: "test@example.com",
                    password: "Password123"
                });

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });

    });

    // ==========================================
    // LOGIN TESTS
    // ==========================================

    describe("POST /api/auth/login", () => {

        test("should login successfully with valid credentials", async () => {
            const hashedPassword = await bcrypt.hash(
                "Password123",
                12
            );

            findUserByEmail.mockResolvedValue({
                userId: "test-user-id",
                name: "Test User",
                email: "test@example.com",
                password: hashedPassword
            });

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "test@example.com",
                    password: "Password123"
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();

            const decoded = jwt.verify(
                response.body.token,
                process.env.JWT_SECRET,
                { issuer: "cinevault-api" }
            );

            expect(decoded.userId).toBe("test-user-id");
        });

        test("should reject incorrect password", async () => {
            const hashedPassword = await bcrypt.hash(
                "Password123",
                12
            );

            findUserByEmail.mockResolvedValue({
                userId: "test-user-id",
                name: "Test User",
                email: "test@example.com",
                password: hashedPassword
            });

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "test@example.com",
                    password: "WrongPassword"
                });

            expect(response.statusCode).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test("should reject login for unknown email", async () => {
            findUserByEmail.mockResolvedValue(null);

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "unknown@example.com",
                    password: "Password123"
                });

            expect(response.statusCode).toBe(401);
        });

        test("should reject missing login credentials", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "",
                    password: ""
                });

            expect(response.statusCode).toBe(400);
        });

        test("should normalize email during login", async () => {
            const hashedPassword = await bcrypt.hash(
                "Password123",
                12
            );

            findUserByEmail.mockResolvedValue({
                userId: "test-user-id",
                name: "Test User",
                email: "test@example.com",
                password: hashedPassword
            });

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: " TEST@EXAMPLE.COM ",
                    password: "Password123"
                });

            expect(response.statusCode).toBe(200);

            expect(findUserByEmail).toHaveBeenCalledWith(
                "test@example.com"
            );
        });

        test("should return 500 when login database operation fails", async () => {
            findUserByEmail.mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "test@example.com",
                    password: "Password123"
                });

            expect(response.statusCode).toBe(500);
        });

    });

    // ==========================================
    // PROTECTED PROFILE TESTS
    // ==========================================

    describe("GET /api/auth/profile", () => {

        test("should reject requests without JWT", async () => {
            const response = await request(app)
                .get("/api/auth/profile");

            expect(response.statusCode).toBe(401);
        });

        test("should return profile with valid JWT", async () => {
            const token = jwt.sign(
                {
                    userId: "test-user-id",
                    email: "test@example.com"
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1h",
                    issuer: "cinevault-api"
                }
            );

            findUserById.mockResolvedValue({
                userId: "test-user-id",
                name: "Test User",
                email: "test@example.com",
                createdAt: "2026-11-08T10:00:00.000Z"
            });

            const response = await request(app)
                .get("/api/auth/profile")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user.email).toBe("test@example.com");
        });

        test("should return 404 when user does not exist", async () => {
            const token = jwt.sign(
                {
                    userId: "unknown-user",
                    email: "unknown@example.com"
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1h",
                    issuer: "cinevault-api"
                }
            );

            findUserById.mockResolvedValue(null);

            const response = await request(app)
                .get("/api/auth/profile")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(404);
        });

        test("should return 500 when profile database operation fails", async () => {
            const token = jwt.sign(
                {
                    userId: "test-user-id",
                    email: "test@example.com"
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1h",
                    issuer: "cinevault-api"
                }
            );

            findUserById.mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app)
                .get("/api/auth/profile")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(500);
        });

    });

});