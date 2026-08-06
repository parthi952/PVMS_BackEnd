const asyncHandler = require("express-async-handler");
const User = require("../Models/UserDB");

// Get All Users
const GetUserData = asyncHandler(async (req, res) => {
    const users = await User.find();
    res.status(200).json(users);
});

// Auto id Create
const IdGenarator = async (role) => {
    const prefix = role || "employee";
    for (let i = 1; i <= 1000; i++) {
        const id = `${prefix}${i}`;
        const user = await User.findOne({ employeeId: id });
        if (!user) {
            return id;
        }
    }
    return `${prefix}${Date.now().toString().slice(-4)}`;
};

// New Emp Create
const AddUser = asyncHandler(async (req, res) => {
    try {
        const { name, email, password, role, employeeId } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please provide name, email, and password" });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        const generatedId = employeeId || await IdGenarator(role);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            role: role || "receptionist",
            employeeId: generatedId
        });
        res.status(201).json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(400).json({ message: error.message || "Failed to create user" });
    }
});

module.exports = { GetUserData, AddUser };