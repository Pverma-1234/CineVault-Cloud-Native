const mockServer = { close: jest.fn() };
const mockListen = jest.fn((port, callback) => {
    callback();
    return mockServer;
});


jest.mock("../app", () => ({
    listen: mockListen
}));

jest.mock("dotenv", () => ({
    config: jest.fn()
}));

describe("server.js", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation(() => {});
        delete process.env.PORT;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetModules();
    });

    test("should start server on default port 5000", () => {
        let server;

        jest.isolateModules(() => {
            server = require("../server");
        });

        expect(mockListen).toHaveBeenCalledWith(
            5000,
            expect.any(Function)
        );

        expect(server).toBe(mockServer);
        expect(console.log).toHaveBeenCalledWith(
            "CineVault server running on port 5000"
        );
    });

    test("should start server on configured PORT", () => {
        process.env.PORT = "6000";

        jest.isolateModules(() => {
            require("../server");
        });

        expect(mockListen).toHaveBeenCalledWith(
            "6000",
            expect.any(Function)
        );
    });
});