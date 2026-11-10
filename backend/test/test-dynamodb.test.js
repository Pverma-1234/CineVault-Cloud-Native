const mockSend = jest.fn();

jest.mock("../config/dynamodb", () => ({
    client: {
        send: mockSend
    }
}));

const { testConnection } = require("../test-dynamodb");

describe("test-dynamodb.js", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should successfully connect to DynamoDB", async () => {
        mockSend.mockResolvedValueOnce({
            TableNames: ["CineVaultUsers", "CineVaultWatchlist"]
        });

        await testConnection();

        expect(mockSend).toHaveBeenCalledTimes(1);

        expect(console.log).toHaveBeenCalledWith(
            "DynamoDB connection successful!"
        );

        expect(console.log).toHaveBeenCalledWith(
            "Available tables:",
            ["CineVaultUsers", "CineVaultWatchlist"]
        );
    });

    test("should handle DynamoDB connection failure", async () => {
        mockSend.mockRejectedValueOnce(
            new Error("Connection failed")
        );

        await testConnection();

        expect(console.error).toHaveBeenCalledWith(
            "DynamoDB connection failed:",
            expect.any(Error)
        );
    });

});