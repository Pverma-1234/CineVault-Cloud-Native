const express = require("express");
const router = express.Router();
const tmdb = require("../config/tmdb");

// Get trending movies
router.get("/trending", async (req, res) => {
    try {
        const response = await tmdb.get("/trending/movie/week");

        res.status(200).json({
            success: true,
            results: response.data.results
        });

    } catch (error) {
        console.error("TMDB Error:", error.response?.data || error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch trending movies"
        });
    }
});

// Get popular movies
router.get("/popular", async (req, res) => {
    try {
        const response = await tmdb.get("/movie/popular");

        res.status(200).json({
            success: true,
            results: response.data.results
        });

    } catch (error) {
        console.error("TMDB Error:", error.response?.data || error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch popular movies"
        });
    }
});

module.exports = router;