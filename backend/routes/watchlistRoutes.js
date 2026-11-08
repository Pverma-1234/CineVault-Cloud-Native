const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    addMovie,
    getWatchlist,
    removeMovie
} = require("../models/watchlistModel");

// POST /api/watchlist - Add movie
router.post("/", verifyToken, async (req, res) => {
    try {
        const movie = req.body;

        // Validate movie details
        if (
            !movie ||
            !Number.isSafeInteger(Number(movie.id)) ||
            Number(movie.id) <= 0 ||
            typeof movie.title !== "string" ||
            !movie.title.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid movie ID and title are required."
            });
        }

        const savedMovie = await addMovie(req.user.userId, {
            ...movie,
            title: movie.title.trim()
        });

        return res.status(201).json({
            success: true,
            message: "Movie added to watchlist!",
            movie: savedMovie
        });

    } catch (error) {
        if (error.name === "ConditionalCheckFailedException") {
            return res.status(409).json({
                success: false,
                message: "Movie already exists in your watchlist."
            });
        }

        console.error("Add watchlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add movie."
        });
    }
});


// GET /api/watchlist - Get user's watchlist
router.get("/", verifyToken, async (req, res) => {
    try {
        const movies = await getWatchlist(req.user.userId);

        return res.status(200).json({
            success: true,
            count: movies.length,
            movies: movies
        });

    } catch (error) {
        console.error("Get watchlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch watchlist."
        });
    }
});


// DELETE /api/watchlist/:movieId - Remove movie
router.delete("/:movieId", verifyToken, async (req, res) => {
    try {
        const movieId = Number(req.params.movieId);

        if (
            !Number.isSafeInteger(movieId) ||
            movieId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid movie ID."
            });
        }

        const deletedMovie = await removeMovie(
            req.user.userId,
            movieId
        );

        if (!deletedMovie) {
            return res.status(404).json({
                success: false,
                message: "Movie not found in your watchlist."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Movie removed from watchlist!"
        });

    } catch (error) {
        console.error("Remove watchlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove movie."
        });
    }
});

module.exports = router;