const verifyToken = require("../middleware/authMiddleware");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");

const router = express.Router();

const {
    findUserByEmail,
    findUserById,
    createUser
} = require("../models/userModel");
function isValidEmail(email) {
    if (typeof email !== "string" || email.length > 254) {
        return false;
    }

    const normalizedEmail = email.trim();

    const atIndex = normalizedEmail.indexOf("@");
    const lastAtIndex = normalizedEmail.lastIndexOf("@");
    const lastDotIndex = normalizedEmail.lastIndexOf(".");

    return (
        atIndex > 0 &&
        atIndex === lastAtIndex &&
        lastDotIndex > atIndex + 1 &&
        lastDotIndex < normalizedEmail.length - 1 &&
        !normalizedEmail.includes(" ")
    );
}

// USER REGISTRATION
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });
        }

if (typeof email !== "string") {
    return res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
    });
}

const normalizedEmail = email.trim().toLowerCase();

if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({
        success: false,
        message: "Please provide a valid email address."
    });
}

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        // Check existing user
        const existingUser = await findUserByEmail(normalizedEmail);

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = {
            userId: crypto.randomUUID(),
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        await createUser(user);

        return res.status(201).json({
            success: true,
            message: "Registration successful!",
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed. Please try again."
        });
    }
});
// POST /login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // 2. Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // 3. Find user in DynamoDB
        const user = await findUserByEmail(normalizedEmail);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // 4. Compare entered password with hashed password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // 5. Check JWT secret
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured.");
        }

        // 6. Generate JWT token
        const token = jwt.sign(
            {
                userId: user.userId,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
                issuer: "cinevault-api"
            }
        );

        // 7. Send successful response
        return res.status(200).json({
            success: true,
            message: "Login successful!",
            token: token,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
});
// GET /profile - Protected route
router.get("/profile", verifyToken, async (req, res) => {
    try {
        // const { findUserById } = require("../models/userModel");

        const user = await findUserById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully!",
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error("Profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch profile."
        });
    }
});
module.exports = router;