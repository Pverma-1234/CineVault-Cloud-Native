const request = require("supertest");
const jwt = require("jsonwebtoken");

// Configure JWT secret for testing
process.env.JWT_SECRET = "cinevault-test-secret-123456789";

// Mock DynamoDB model operations
jest.mock("../models/watchlistModel", () => ({
    addMovie: jest.fn(),
    getWatchlist: jest.fn(),
    removeMovie: jest.fn()
}));

const app = require("../app");

const {
    addMovie,
    getWatchlist,
    removeMovie
} = require("../models/watchlistModel");

// Generate a valid JWT for protected routes
const generateToken = () => {
    return jwt.sign(
        {
            userId: "test-user-123",
            email: "test@example.com"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h",
            issuer: "cinevault-api"
        }
    );
};

describe("CineVault Watchlist API", () => {

    let token;

    beforeEach(() => {
        jest.clearAllMocks();
        token = generateToken();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // POST /api/watchlist

    describe("POST /api/watchlist", () => {

        test("should add a movie successfully", async () => {
            const movie = {
                id: 123,
                title: "Inception",
                poster_path: "/poster.jpg",
                vote_average: 8.8
            };

            addMovie.mockResolvedValue(movie);

            const response = await request(app)
                .post("/api/watchlist")
                .set("Authorization", `Bearer ${token}`)
                .send(movie);

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.movie).toEqual(movie);

            expect(addMovie).toHaveBeenCalledWith(
                "test-user-123",
                expect.objectContaining({
                    id: 123,
                    title: "Inception"
                })
            );
        });

        test("should reject invalid movie details", async () => {
            const response = await request(app)
                .post("/api/watchlist")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    id: -1,
                    title: ""
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);

            expect(addMovie).not.toHaveBeenCalled();
        });

        test("should reject requests without authentication", async () => {
            const response = await request(app)
                .post("/api/watchlist")
                .send({
                    id: 123,
                    title: "Inception"
                });

            expect(response.statusCode).toBe(401);
        });

        test("should return 409 for duplicate movies", async () => {
            addMovie.mockRejectedValue({
                name: "ConditionalCheckFailedException"
            });

            const response = await request(app)
                .post("/api/watchlist")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    id: 123,
                    title: "Inception"
                });

            expect(response.statusCode).toBe(409);
            expect(response.body.success).toBe(false);
        });

        test("should handle database errors", async () => {
            jest.spyOn(console, "error").mockImplementation(() => {});

            addMovie.mockRejectedValue(
                new Error("Database unavailable")
            );

            const response = await request(app)
                .post("/api/watchlist")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    id: 123,
                    title: "Inception"
                });

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });

    });

    // GET /api/watchlist

    describe("GET /api/watchlist", () => {

        test("should fetch watchlist successfully", async () => {
            const movies = [
                {
                    movieId: 123,
                    title: "Inception"
                },
                {
                    movieId: 456,
                    title: "Interstellar"
                }
            ];

            getWatchlist.mockResolvedValue(movies);

            const response = await request(app)
                .get("/api/watchlist")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.count).toBe(2);
            expect(response.body.movies).toEqual(movies);

            expect(getWatchlist).toHaveBeenCalledWith(
                "test-user-123"
            );
        });

        test("should handle watchlist database errors", async () => {
            jest.spyOn(console, "error").mockImplementation(() => {});

            getWatchlist.mockRejectedValue(
                new Error("Database unavailable")
            );

            const response = await request(app)
                .get("/api/watchlist")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });

        test("should reject unauthenticated requests", async () => {
            const response = await request(app)
                .get("/api/watchlist");

            expect(response.statusCode).toBe(401);
        });

    });

    // DELETE /api/watchlist/:movieId

    describe("DELETE /api/watchlist/:movieId", () => {

        test("should remove a movie successfully", async () => {
            removeMovie.mockResolvedValue({
                movieId: 123,
                title: "Inception"
            });

            const response = await request(app)
                .delete("/api/watchlist/123")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);

            expect(removeMovie).toHaveBeenCalledWith(
                "test-user-123",
                123
            );
        });

        test("should reject invalid movie IDs", async () => {
            const response = await request(app)
                .delete("/api/watchlist/abc")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);

            expect(removeMovie).not.toHaveBeenCalled();
        });

        test("should return 404 when movie does not exist", async () => {
            removeMovie.mockResolvedValue(null);

            const response = await request(app)
                .delete("/api/watchlist/999")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(404);
            expect(response.body.success).toBe(false);
        });

        test("should handle database errors during deletion", async () => {
            jest.spyOn(console, "error").mockImplementation(() => {});

            removeMovie.mockRejectedValue(
                new Error("Database unavailable")
            );

            const response = await request(app)
                .delete("/api/watchlist/123")
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
        });

    });

});