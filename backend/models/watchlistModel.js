const {
    PutCommand,
    QueryCommand,
    DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const { docClient } = require("../config/dynamodb");

const TABLE_NAME = "CineVaultWatchlist";

// Add movie to watchlist
async function addMovie(userId, movie) {
    const item = {
        userId: userId,
        movieId: Number(movie.id),
        title: movie.title,
        posterPath: movie.poster_path || null,
        rating: movie.vote_average || 0,
        releaseDate: movie.release_date || null,
        overview: movie.overview || "",
        addedAt: new Date().toISOString()
    };

    await docClient.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
            ConditionExpression:
                "attribute_not_exists(userId) AND attribute_not_exists(movieId)"
        })
    );

    return item;
}

// Get user's watchlist
async function getWatchlist(userId) {
    const result = await docClient.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            }
        })
    );

    return result.Items || [];
}

// Remove movie from watchlist
async function removeMovie(userId, movieId) {
    const result = await docClient.send(
        new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                userId: userId,
                movieId: Number(movieId)
            },
            ReturnValues: "ALL_OLD"
        })
    );

    return result.Attributes || null;
}

module.exports = {
    addMovie,
    getWatchlist,
    removeMovie
};