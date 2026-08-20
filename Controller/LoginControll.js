const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../Models/UserDB");

const generateAccessToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.Accses_Token || process.env.ACCESS_TOKEN || "secret123",
        { expiresIn: "1d" }
    );
};

const generateRefreshToken = (id) => {
    return jwt.sign(
        { id },
        process.env.Ref_Token || process.env.REFRESH_TOKEN || "refreshsecret123",
        { expiresIn: "7d" }
    );
};

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("Please provide email and password");
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const cleanPassword = String(password).trim();

    const user = await User.findOne({
        $or: [
            { email: normalizedEmail },
            { email: new RegExp(`^${normalizedEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, "i") }
        ]
    });

    console.log(`[LOGIN ATTEMPT] Email: "${normalizedEmail}" | User Found: ${!!user} | DB Role: ${user?.role}`);

    const isPasswordValid = user ? await user.matchPassword(cleanPassword) : false;

    if (user && isPasswordValid) {
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            accessToken,
            refreshToken
        });
    } else {
        if (!user) {
            console.warn(`[LOGIN FAILED] No user found for email: "${normalizedEmail}"`);
        } else {
            console.warn(`[LOGIN FAILED] Invalid password for email: "${normalizedEmail}"`);
        }
        res.status(401).json({ message: "Invalid email or password" });
    }
});

module.exports = { login, generateAccessToken, generateRefreshToken };
