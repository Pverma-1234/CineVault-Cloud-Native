const {
    PutCommand,
    GetCommand,
    QueryCommand
} = require("@aws-sdk/lib-dynamodb");

const { docClient } = require("../config/dynamodb");

const TABLE_NAME = "CineVaultUsers";

// Find user using email
async function findUserByEmail(email) {
    const result = await docClient.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            IndexName: "EmailIndex",
            KeyConditionExpression: "email = :email",
            ExpressionAttributeValues: {
                ":email": email
            }
        })
    );

    return result.Items?.[0] || null;
}

// Find user using userId
async function findUserById(userId) {
    const result = await docClient.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: { userId }
        })
    );

    return result.Item || null;
}

// Create new user
async function createUser(user) {
    await docClient.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: user,
            ConditionExpression: "attribute_not_exists(userId)"
        })
    );

    return user;
}

module.exports = {
    findUserByEmail,
    findUserById,
    createUser
};