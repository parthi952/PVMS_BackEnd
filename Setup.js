const express = require("express")
const dotenv = require("dotenv")
const errorHandler = require("./Middleware/ErrorHandle")
const { connactionDB } = require("./DB_Connaction")


dotenv.config()

connactionDB()
const app = express()
const PORT = process.env.PORT


// Api End Points
app.use(express.json())
app.use("/api/users", require("./Routes/User"))
app.use("/api/visitors", require("./Routes/Visitors"))


app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
