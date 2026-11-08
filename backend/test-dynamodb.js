require("dotenv").config();

const { ListTablesCommand } = require("@aws-sdk/client-dynamodb");
const { client } = require("./config/dynamodb");

async function testConnection() {
    try {
        const response = await client.send(
            new ListTablesCommand({})
        );

        console.log("DynamoDB connection successful!");
        console.log("Available tables:", response.TableNames);

    } catch (error) {
        console.error("DynamoDB connection failed:", error);
    }
}

testConnection().catch((error) => {
    console.error("Unexpected error during DynamoDB connection test:", error);
    process.exitCode = 1;
});