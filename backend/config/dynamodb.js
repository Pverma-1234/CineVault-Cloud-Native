const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",

    endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",

    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local"
    }
});

const docClient = DynamoDBDocumentClient.from(client);

module.exports = {
    client,
    docClient
};