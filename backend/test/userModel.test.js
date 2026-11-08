jest.mock("../config/dynamodb", () => ({
    docClient: {
        send: jest.fn()
    }
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
    PutCommand: jest.fn().mockImplementation((input) => ({ input })),
    GetCommand: jest.fn().mockImplementation((input) => ({ input })),
    QueryCommand: jest.fn().mockImplementation((input) => ({ input }))
}));

const { docClient } = require("../config/dynamodb");

const {
    PutCommand,
    GetCommand,
    QueryCommand
} = require("@aws-sdk/lib-dynamodb");

const {
    findUserByEmail,
    findUserById,
    createUser
} = require("../models/userModel");

describe("User Model Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // findUserByEmail tests
    describe("findUserByEmail()", () => {
        test("should return user when email exists", async () => {
            const user = {
                userId: "user-123",
                email: "test@example.com",
                name: "Test User"
            };

            docClient.send.mockResolvedValue({
                Items: [user]
            });

            const result = await findUserByEmail("test@example.com");

            expect(QueryCommand).toHaveBeenCalledWith({
                TableName: "CineVaultUsers",
                IndexName: "EmailIndex",
                KeyConditionExpression: "email = :email",
                ExpressionAttributeValues: {
                    ":email": "test@example.com"
                }
            });

            expect(result).toEqual(user);
        });

        test("should return null when email does not exist", async () => {
            docClient.send.mockResolvedValue({
                Items: []
            });

            const result = await findUserByEmail("unknown@example.com");

            expect(result).toBeNull();
        });

        test("should return null when Items is undefined", async () => {
            docClient.send.mockResolvedValue({});

            const result = await findUserByEmail("unknown@example.com");

            expect(result).toBeNull();
        });

        test("should propagate DynamoDB errors", async () => {
            docClient.send.mockRejectedValue(new Error("Query failed"));

            await expect(
                findUserByEmail("test@example.com")
            ).rejects.toThrow("Query failed");
        });
    });

    // findUserById tests
    describe("findUserById()", () => {
        test("should return user when userId exists", async () => {
            const user = {
                userId: "user-123",
                email: "test@example.com"
            };

            docClient.send.mockResolvedValue({
                Item: user
            });

            const result = await findUserById("user-123");

            expect(GetCommand).toHaveBeenCalledWith({
                TableName: "CineVaultUsers",
                Key: {
                    userId: "user-123"
                }
            });

            expect(result).toEqual(user);
        });

        test("should return null when user does not exist", async () => {
            docClient.send.mockResolvedValue({});

            const result = await findUserById("unknown-user");

            expect(result).toBeNull();
        });

        test("should propagate DynamoDB errors", async () => {
            docClient.send.mockRejectedValue(new Error("Get failed"));

            await expect(
                findUserById("user-123")
            ).rejects.toThrow("Get failed");
        });
    });

    // createUser tests
    describe("createUser()", () => {
        test("should create a new user successfully", async () => {
            const user = {
                userId: "user-123",
                name: "Test User",
                email: "test@example.com"
            };

            docClient.send.mockResolvedValue({});

            const result = await createUser(user);

            expect(PutCommand).toHaveBeenCalledWith({
                TableName: "CineVaultUsers",
                Item: user,
                ConditionExpression: "attribute_not_exists(userId)"
            });

            expect(result).toEqual(user);
        });

        test("should propagate DynamoDB errors", async () => {
            const user = {
                userId: "user-123",
                email: "test@example.com"
            };

            docClient.send.mockRejectedValue(
                new Error("User already exists")
            );

            await expect(
                createUser(user)
            ).rejects.toThrow("User already exists");
        });
    });
});