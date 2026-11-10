const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const config = {
    region: process.env.AWS_REGION || "ap-south-1"
};

// Local development: connect to DynamoDB Local.
if (process.env.DYNAMODB_ENDPOINT) {
    config.endpoint = process.env.DYNAMODB_ENDPOINT;

    config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local"
    };
}

// AWS deployment: use the default AWS credential provider chain.
// EKS Pod Identity supplies temporary credentials automatically.

const client = new DynamoDBClient(config);

const docClient = DynamoDBDocumentClient.from(client);

module.exports = {
    client,
    docClient
};