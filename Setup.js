const express = require("express")
const dotenv = require("dotenv")
const errorHandler = require("./Middleware/ErrorHandle")
const { connactionDB } = require("./DB_Connaction")

dotenv.config()

connactionDB()
const app = express()
const PORT = process.env.PORT || 5000


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://modernpvms.netlify.app")
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
    if (req.method === "OPTIONS") {
        return res.sendStatus(200)
    }
    next()
})

app.use(express.json())

app.use("/api/users", require("./Routes/User"))
app.use("/api/visitors", require("./Routes/Visitors"))
app.use("/api/login", require("./Routes/Login"))

app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
