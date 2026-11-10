const request = require("supertest");
const app = require("../app");

describe("CineVault Health API", () => {

    test("GET /health should return status 200", async () => {

        const response = await request(app).get("/health");

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            success: true,
            message: "CineVault backend is running!"
        });

    });
    test("should allow requests from an allowed origin", async () => {
        const response = await request(app)
            .get("/health")
            .set("Origin", "http://localhost:8080");

        expect(response.statusCode).toBe(200);
    });

    test("should reject requests from an unauthorized origin", async () => {
        const response = await request(app)
            .get("/health")
            .set("Origin", "https://unauthorized-example.com");

        expect(response.statusCode).toBe(500);
    });

});