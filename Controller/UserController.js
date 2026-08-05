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
};

// New Emp Create
const AddUser = asyncHandler(async (req, res) => {
    try {
        const { name, email, password, role, employeeId } = req.body;

        const generatedId = employeeId || await IdGenarator(role);

        const user = await User.create({
            name,
            email,
            password,
            role,
            employeeId: generatedId
        });
        res.status(201).json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: error.message || "Failed to create user" });
    }
});

module.exports = { GetUserData, AddUser };