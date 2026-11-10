const mockSend = jest.fn();

jest.mock("../config/dynamodb", () => ({
    client: {
        send: mockSend
    }
}));

const {
    createWatchlistTable
} = require("../database/createWatchlistTable");

describe("createWatchlistTable.js", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should not create table when it already exists", async () => {
        mockSend.mockResolvedValueOnce({});

        await createWatchlistTable();

        expect(mockSend).toHaveBeenCalledTimes(1);
    });

    test("should create watchlist table when it does not exist", async () => {
        const error = new Error("Table not found");
        error.name = "ResourceNotFoundException";

        mockSend
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
                Table: { TableStatus: "ACTIVE" }
            });

        await createWatchlistTable();

        expect(mockSend).toHaveBeenCalledTimes(3);
    });

    test("should handle unexpected database errors", async () => {
        mockSend.mockRejectedValueOnce(
            new Error("Database connection failed")
        );

        await createWatchlistTable();

        expect(console.error).toHaveBeenCalled();
    });

    test("should wait until table becomes ACTIVE", async () => {
        const error = new Error("Table not found");
        error.name = "ResourceNotFoundException";

        jest.useFakeTimers();

        mockSend
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
                Table: { TableStatus: "CREATING" }
            })
            .mockResolvedValueOnce({
                Table: { TableStatus: "ACTIVE" }
            });

        const promise = createWatchlistTable();

        await jest.advanceTimersByTimeAsync(1000);
        await promise;

        expect(mockSend).toHaveBeenCalledTimes(4);

        jest.useRealTimers();
    });

});