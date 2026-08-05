const express = require("express")
const route = express.Router()
const {GetUserData} = require("../Controller/UserController")

route.get("/",GetUserData)

module.exports = route