const express = require("express")
const dotenv = require("dotenv")
const errorHandler = require("./Middleware/ErrorHandle")


dotenv.config()

const app = express()
const PORT = process.env.PORT

app.use(express.json())
app.use("api",require("./Routes/User"))
app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
