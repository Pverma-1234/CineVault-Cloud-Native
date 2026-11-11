const express = require("express");
const cors = require("cors");
const { register } = require("./config/metrics");
const metricsMiddleware = require("./middleware/metricsMiddleware");

const watchlistRoutes = require("./routes/watchlistRoutes");
const movieRoutes = require("./routes/movieRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Disable Express technology fingerprinting
app.disable("x-powered-by");

// CORS configuration
const allowedOrigins = new Set([
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
]);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests without an Origin header (e.g. health checks)
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Prometheus HTTP metrics middleware
app.use(metricsMiddleware);

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CineVault backend is running!"
    });
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
    try {
        res.set("Content-Type", register.contentType);
        res.end(await register.metrics());
    } catch (error) {
        console.error("Error generating metrics:", error);
        res.status(500).end("Unable to generate metrics");
    }
});

// Movie APIs
app.use("/api/movies", movieRoutes);

// Authentication APIs
app.use("/api/auth", authRoutes);

// Watchlist APIs
app.use("/api/watchlist", watchlistRoutes);

module.exports = app;