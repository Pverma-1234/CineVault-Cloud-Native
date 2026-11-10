require("dotenv").config();

const {
    CreateTableCommand,
    DescribeTableCommand,
    UpdateTableCommand
} = require("@aws-sdk/client-dynamodb");

const { client } = require("../config/dynamodb");

const TABLE_NAME = "CineVaultUsers";
const INDEX_NAME = "EmailIndex";

async function waitForTableActive() {
    while (true) {
        const result = await client.send(
            new DescribeTableCommand({
                TableName: TABLE_NAME
            })
        );

        if (result.Table.TableStatus === "ACTIVE") {
            console.log(`${TABLE_NAME} table is ACTIVE!`);
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function createUsersTable() {
    try {
        let tableExists = true;

        try {
            await client.send(
                new DescribeTableCommand({
                    TableName: TABLE_NAME
                })
            );

            console.log(`${TABLE_NAME} already exists.`);
        } catch (error) {
            if (error.name === "ResourceNotFoundException") {
                tableExists = false;
            } else {
                throw error;
            }
        }

        // Create table if it does not exist.
        if (!tableExists) {
            await client.send(
                new CreateTableCommand({
                    TableName: TABLE_NAME,

                    KeySchema: [
                        {
                            AttributeName: "userId",
                            KeyType: "HASH"
                        }
                    ],

                    AttributeDefinitions: [
                        {
                            AttributeName: "userId",
                            AttributeType: "S"
                        },
                        {
                            AttributeName: "email",
                            AttributeType: "S"
                        }
                    ],

                    GlobalSecondaryIndexes: [
                        {
                            IndexName: INDEX_NAME,

                            KeySchema: [
                                {
                                    AttributeName: "email",
                                    KeyType: "HASH"
                                }
                            ],

                            Projection: {
                                ProjectionType: "ALL"
                            }
                        }
                    ],

                    BillingMode: "PAY_PER_REQUEST"
                })
            );

            console.log("CineVaultUsers table creation initiated.");
        } else {
            // Check whether EmailIndex already exists.
            const description = await client.send(
                new DescribeTableCommand({
                    TableName: TABLE_NAME
                })
            );

            const indexes =
                description.Table.GlobalSecondaryIndexes || [];

            const indexExists = indexes.some(
                index => index.IndexName === INDEX_NAME
            );

            if (!indexExists) {
                console.log("Adding EmailIndex to existing table...");

                await client.send(
                    new UpdateTableCommand({
                        TableName: TABLE_NAME,

                        AttributeDefinitions: [
                            {
                                AttributeName: "email",
                                AttributeType: "S"
                            }
                        ],

                        GlobalSecondaryIndexUpdates: [
                            {
                                Create: {
                                    IndexName: INDEX_NAME,

                                    KeySchema: [
                                        {
                                            AttributeName: "email",
                                            KeyType: "HASH"
                                        }
                                    ],

                                    Projection: {
                                        ProjectionType: "ALL"
                                    }
                                }
                            }
                        ]
                    })
                );

                console.log("EmailIndex creation initiated.");
            } else {
                console.log("EmailIndex already exists.");
            }
        }

        await waitForTableActive();

        console.log("Database setup completed successfully!");

    } catch (error) {
        console.error("Database setup failed:", error);
    }
}

// Export functions for unit testing
module.exports = {
    createUsersTable,
    waitForTableActive
};

// Execute setup only when this file is run directly
if (require.main === module) {
    createUsersTable().catch((error) => {
        console.error("Unexpected error during users table setup:", error);
        process.exitCode = 1;
    });
}