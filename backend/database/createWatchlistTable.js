require("dotenv").config();

const {
    CreateTableCommand,
    DescribeTableCommand
} = require("@aws-sdk/client-dynamodb");

const { client } = require("../config/dynamodb");

const TABLE_NAME = "CineVaultWatchlist";

async function createWatchlistTable() {
    try {
        // Check whether table already exists
        try {
            await client.send(
                new DescribeTableCommand({
                    TableName: TABLE_NAME
                })
            );

            console.log(`${TABLE_NAME} already exists.`);
            return;

        } catch (error) {
            if (error.name !== "ResourceNotFoundException") {
                throw error;
            }
        }

        // Create watchlist table
        await client.send(
            new CreateTableCommand({
                TableName: TABLE_NAME,

                KeySchema: [
                    {
                        AttributeName: "userId",
                        KeyType: "HASH"
                    },
                    {
                        AttributeName: "movieId",
                        KeyType: "RANGE"
                    }
                ],

                AttributeDefinitions: [
                    {
                        AttributeName: "userId",
                        AttributeType: "S"
                    },
                    {
                        AttributeName: "movieId",
                        AttributeType: "N"
                    }
                ],

                BillingMode: "PAY_PER_REQUEST"
            })
        );

        console.log("Watchlist table creation initiated.");

        // Wait until table becomes active
        while (true) {
            const result = await client.send(
                new DescribeTableCommand({
                    TableName: TABLE_NAME
                })
            );

            if (result.Table.TableStatus === "ACTIVE") {
                console.log(`${TABLE_NAME} is ACTIVE!`);
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log("Watchlist database setup completed!");

    } catch (error) {
        console.error("Watchlist table creation failed:", error);
    }
}

// Export function for unit testing
module.exports = {
    createWatchlistTable
};

// Execute setup only when this file is run directly
if (require.main === module) {
    createWatchlistTable().catch((error) => {
        console.error("Unexpected error during watchlist setup:", error);
        process.exitCode = 1;
    });
}