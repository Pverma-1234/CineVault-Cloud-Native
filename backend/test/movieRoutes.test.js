const request = require("supertest");

// Mock TMDB before importing the application
jest.mock("../config/tmdb", () => ({
    get: jest.fn()
}));

const app = require("../app");
const tmdb = require("../config/tmdb");

describe("CineVault Movie API", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // TRENDING MOVIES

    describe("GET /api/movies/trending", () => {

        test("should return trending movies successfully", async () => {
            const mockMovies = [
                {
                    id: 1,
                    title: "Movie One",
                    vote_average: 8.5
                },
                {
                    id: 2,
                    title: "Movie Two",
                    vote_average: 7.9
                }
            ];

            tmdb.get.mockResolvedValue({
                data: {
                    results: mockMovies
                }
            });

            const response = await request(app)
                .get("/api/movies/trending");

            expect(response.statusCode).toBe(200);

            expect(response.body).toEqual({
                success: true,
                results: mockMovies
            });

            expect(tmdb.get).toHaveBeenCalledWith(
                "/trending/movie/week"
            );
        });

        test("should return 500 when TMDB trending request fails", async () => {
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            tmdb.get.mockRejectedValue(
                new Error("TMDB connection failed")
            );

            const response = await request(app)
                .get("/api/movies/trending");

            expect(response.statusCode).toBe(500);

            expect(response.body).toEqual({
                success: false,
                message: "Unable to fetch trending movies"
            });

            consoleSpy.mockRestore();
        });

    });

    // POPULAR MOVIES

    describe("GET /api/movies/popular", () => {

        test("should return popular movies successfully", async () => {
            const mockMovies = [
                {
                    id: 3,
                    title: "Popular Movie One",
                    vote_average: 8.2
                },
                {
                    id: 4,
                    title: "Popular Movie Two",
                    vote_average: 7.5
                }
            ];

            tmdb.get.mockResolvedValue({
                data: {
                    results: mockMovies
                }
            });

            const response = await request(app)
                .get("/api/movies/popular");

            expect(response.statusCode).toBe(200);

            expect(response.body).toEqual({
                success: true,
                results: mockMovies
            });

            expect(tmdb.get).toHaveBeenCalledWith(
                "/movie/popular"
            );
        });

        test("should return 500 when TMDB popular request fails", async () => {
            const consoleSpy = jest
                .spyOn(console, "error")
                .mockImplementation(() => {});

            tmdb.get.mockRejectedValue(
                new Error("TMDB connection failed")
            );

            const response = await request(app)
                .get("/api/movies/popular");

            expect(response.statusCode).toBe(500);

            expect(response.body).toEqual({
                success: false,
                message: "Unable to fetch popular movies"
            });

            consoleSpy.mockRestore();
        });

    });

});