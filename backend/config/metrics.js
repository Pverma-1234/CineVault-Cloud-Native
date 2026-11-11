const client = require("prom-client");

// Create a dedicated metrics registry
const register = new client.Registry();

// Collect default Node.js metrics
client.collectDefaultMetrics({
    register,
    prefix: "cinevault_"
});

// HTTP request counter
const httpRequestCounter = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status_code"],
    registers: [register]
});

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.1, 0.3, 0.5, 1, 2, 5],
    registers: [register]
});

module.exports = {
    register,
    httpRequestCounter,
    httpRequestDuration
};