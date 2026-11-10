require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`CineVault server running on port ${PORT}`);
});

module.exports = server;