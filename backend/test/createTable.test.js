const mockSend = jest.fn();

jest.mock("../config/dynamodb", () => ({
    client: {
        send: mockSend
    }
}));

const {
    createUsersTable,
    waitForTableActive
} = require("../database/createTable");

describe("createTable.js", () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("should create users table when table does not exist", async () => {
        const error = new Error("Table not found");
        error.name = "ResourceNotFoundException";

        mockSend
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
                Table: { TableStatus: "ACTIVE" }
            });

        await createUsersTable();

        expect(mockSend).toHaveBeenCalledTimes(3);
    });

    test("should not create table when it already exists", async () => {
        mockSend
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
                Table: {
                    GlobalSecondaryIndexes: [
                        { IndexName: "EmailIndex" }
                    ]
                }
            })
            .mockResolvedValueOnce({
                Table: { TableStatus: "ACTIVE" }
            });

        await createUsersTable();

        expect(mockSend).toHaveBeenCalledTimes(3);
    });

    test("should add EmailIndex when it does not exist", async () => {
        mockSend
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
                Table: {
                    GlobalSecondaryIndexes: []
                }
            })
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({
                Table: { TableStatus: "ACTIVE" }
            });

        await createUsersTable();

        expect(mockSend).toHaveBeenCalledTimes(4);
    });

    test("should handle database errors", async () => {
        mockSend.mockRejectedValueOnce(
            new Error("Database connection failed")
        );

        await createUsersTable();

        expect(console.error).toHaveBeenCalled();
    });

    test("should wait until table becomes ACTIVE", async () => {
        mockSend.mockResolvedValueOnce({
            Table: { TableStatus: "ACTIVE" }
        });

        await waitForTableActive();

        expect(mockSend).toHaveBeenCalledTimes(1);
    });
    test("should handle unexpected DescribeTable errors", async () => {
    mockSend.mockRejectedValueOnce(
        new Error("Access denied")
    );

    await createUsersTable();

    expect(console.error).toHaveBeenCalled();
});

test("should wait when table is not ACTIVE", async () => {
    jest.useFakeTimers();

    mockSend
        .mockResolvedValueOnce({
            Table: { TableStatus: "CREATING" }
        })
        .mockResolvedValueOnce({
            Table: { TableStatus: "ACTIVE" }
        });

    const promise = waitForTableActive();

    await jest.advanceTimersByTimeAsync(1000);

    await promise;

    expect(mockSend).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
});

});