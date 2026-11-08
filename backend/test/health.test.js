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

});