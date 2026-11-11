const {
    httpRequestCounter,
    httpRequestDuration
} = require("../config/metrics");

const metricsMiddleware = (req, res, next) => {
    // Do not record Prometheus scrape requests
    if (req.path === "/metrics") {
        return next();
    }

    const start = process.hrtime();

    res.on("finish", () => {
        const duration = process.hrtime(start);
        const responseTime = duration[0] + duration[1] / 1e9;

        // Use Express route patterns instead of raw URLs
        const route = req.route?.path
            ? `${req.baseUrl}${req.route.path}`
            : "unmatched";

        const labels = {
            method: req.method,
            route,
            status_code: String(res.statusCode)
        };

        httpRequestCounter.inc(labels);
        httpRequestDuration.observe(labels, responseTime);
    });

    next();
};

module.exports = metricsMiddleware;