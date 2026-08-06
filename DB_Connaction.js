const mongoose = require("mongoose");

const connactionDB = async () => {
    try {
        const connaction = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Database Connected: ${connaction.connection.host}`);
    } catch (err) {
        console.error("MongoDB Connection Error:", err.message);
        console.error("Please check your MongoDB Atlas IP Whitelist (0.0.0.0/0) or Internet connection.");
    }
};

module.exports = { connactionDB };