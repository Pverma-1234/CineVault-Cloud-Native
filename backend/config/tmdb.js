const https = require("https");

const BASE_URL = "https://api.themoviedb.org/3";

function makeRequest(endpoint, attempt = 1) {
    return new Promise((resolve, reject) => {
        const url = new URL(
            endpoint.replace(/^\/+/, ""),
            BASE_URL + "/"
        );

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: "GET",
            family: 4,
            minVersion: "TLSv1.2",
            headers: {
                Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
                Accept: "application/json",
                "User-Agent": "CineVault/1.0"
            }
        };

        const request = https.request(options, response => {
            let data = "";

            response.on("data", chunk => {
                data += chunk;
            });

            response.on("end", () => {
                let responseData;

                try {
                    responseData = JSON.parse(data);
                } catch (error) {
                    reject(new Error(
                        `Invalid TMDB response. HTTP ${response.statusCode}`
                    ));
                    return;
                }

                if (response.statusCode < 200 || response.statusCode >= 300) {
                    const error = new Error(
                        responseData.status_message || "TMDB request failed"
                    );

                    error.response = {
                        status: response.statusCode,
                        data: responseData
                    };

                    reject(error);
                    return;
                }

                resolve({
                    status: response.statusCode,
                    data: responseData
                });
            });
        });

        request.on("error", reject);

        request.setTimeout(20000, () => {
            request.destroy(new Error("TMDB request timed out"));
        });

        request.end();
    });
}

async function get(endpoint) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`TMDB request: ${endpoint} (attempt ${attempt})`);

            return await makeRequest(endpoint);
        } catch (error) {
            const retryable =
                ["ECONNRESET", "ETIMEDOUT", "EPIPE", "ECONNREFUSED"].includes(error.code) ||
                error.message.includes("timed out");

            if (!retryable || attempt === maxAttempts) {
                throw error;
            }

            const delay = attempt * 1000;

            console.log(`TMDB connection failed. Retrying in ${delay}ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

module.exports = { get };