jest.mock("../config/dynamodb", () => ({
    docClient: {
        send: jest.fn()
    }
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
    PutCommand: jest.fn().mockImplementation((input) => ({ input })),
    QueryCommand: jest.fn().mockImplementation((input) => ({ input })),
    DeleteCommand: jest.fn().mockImplementation((input) => ({ input }))
}));

const { docClient } = require("../config/dynamodb");
const {
    PutCommand,
    QueryCommand,
    DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const {
    addMovie,
    getWatchlist,
    removeMovie
} = require("../models/watchlistModel");

describe("Watchlist Model Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("addMovie()", () => {
        test("should add a movie to DynamoDB", async () => {
            docClient.send.mockResolvedValue({});

            const movie = {
                id: "123",
                title: "Inception",
                poster_path: "/poster.jpg",
                vote_average: 8.8,
                release_date: "2010-07-16",
                overview: "A mind-bending thriller"
            };

            const result = await addMovie("user-1", movie);

            expect(PutCommand).toHaveBeenCalledWith(
                expect.objectContaining({
                    TableName: "CineVaultWatchlist",
                    Item: expect.objectContaining({
                        userId: "user-1",
                        movieId: 123,
                        title: "Inception",
                        posterPath: "/poster.jpg",
                        rating: 8.8,
                        releaseDate: "2010-07-16"
                    }),
                    ConditionExpression:
                        "attribute_not_exists(userId) AND attribute_not_exists(movieId)"
                })
            );

            expect(result.movieId).toBe(123);
            expect(result.addedAt).toEqual(expect.any(String));
        });

        test("should use default values for optional movie fields", async () => {
            docClient.send.mockResolvedValue({});

            const movie = {
                id: 456,
                title: "Interstellar"
            };

            const result = await addMovie("user-1", movie);

            expect(result.posterPath).toBeNull();
            expect(result.rating).toBe(0);
            expect(result.releaseDate).toBeNull();
            expect(result.overview).toBe("");
        });

        test("should propagate DynamoDB errors", async () => {
            docClient.send.mockRejectedValue(new Error("Database error"));

            await expect(
                addMovie("user-1", { id: 123, title: "Inception" })
            ).rejects.toThrow("Database error");
        });
    });

    describe("getWatchlist()", () => {
        test("should return the user's watchlist", async () => {
            const movies = [
                { movieId: 123, title: "Inception" },
                { movieId: 456, title: "Interstellar" }
            ];

            docClient.send.mockResolvedValue({ Items: movies });

            const result = await getWatchlist("user-1");

            expect(QueryCommand).toHaveBeenCalledWith({
                TableName: "CineVaultWatchlist",
                KeyConditionExpression: "userId = :userId",
                ExpressionAttributeValues: {
                    ":userId": "user-1"
                }
            });

            expect(result).toEqual(movies);
        });

        test("should return an empty array when no items exist", async () => {
            docClient.send.mockResolvedValue({});

            const result = await getWatchlist("user-1");

            expect(result).toEqual([]);
        });

        test("should propagate DynamoDB errors", async () => {
            docClient.send.mockRejectedValue(new Error("Query failed"));

            await expect(
                getWatchlist("user-1")
            ).rejects.toThrow("Query failed");
        });
    });

    describe("removeMovie()", () => {
        test("should remove a movie from DynamoDB", async () => {
            const deletedMovie = {
                userId: "user-1",
                movieId: 123,
                title: "Inception"
            };

            docClient.send.mockResolvedValue({
                Attributes: deletedMovie
            });

            const result = await removeMovie("user-1", "123");

            expect(DeleteCommand).toHaveBeenCalledWith({
                TableName: "CineVaultWatchlist",
                Key: {
                    userId: "user-1",
                    movieId: 123
                },
                ReturnValues: "ALL_OLD"
            });

            expect(result).toEqual(deletedMovie);
        });

        test("should return null when the movie does not exist", async () => {
            docClient.send.mockResolvedValue({});

            const result = await removeMovie("user-1", 999);

            expect(result).toBeNull();
        });

        test("should propagate DynamoDB errors", async () => {
            docClient.send.mockRejectedValue(new Error("Delete failed"));

            await expect(
                removeMovie("user-1", 123)
            ).rejects.toThrow("Delete failed");
        });
    });
});