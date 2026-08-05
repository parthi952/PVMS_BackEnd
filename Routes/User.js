const express = require("express")
const route = express.Router()
const { GetUserData, AddUser } = require("../Controller/UserController")

route.get("/", GetUserData)
route.post("/", AddUser)

module.exports = route