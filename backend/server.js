const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const watchlistRoutes = require("./routes/watchlistRoutes");

const movieRoutes = require("./routes/movieRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CineVault backend is running!"
    });
});

// Movie APIs
app.use("/api/movies", movieRoutes);

// Authentication APIs
app.use("/api/auth", authRoutes);

app.use("/api/watchlist", watchlistRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`CineVault server running on port ${PORT}`);
});