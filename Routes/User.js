const express = require("express")
const route = express.Router()
const { GetUserData, AddUser } = require("../Controller/UserController")
const { protect, authorize } = require("../Middleware/AuthMiddleware")

route.get("/", protect, authorize("admin", "receptionist", "employee"), GetUserData)
route.post("/", protect, authorize("admin"), AddUser)

module.exports = route