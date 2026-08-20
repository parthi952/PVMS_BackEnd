const mongoose = require("mongoose");
const dns = require("dns");

// Configure Node.js DNS resolution to prevent querySrv ECONNREFUSED on Windows
try {
    dns.setDefaultResultOrder("ipv4first");
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (err) {
    console.warn("DNS resolution setup notice:", err.message);
}

const connactionDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        const connaction = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
            family: 4
        });
        console.log(`Database Connected: ${connaction.connection.host}`);
    } catch (err) {
        console.error("MongoDB Connection Error:", err.message);
        console.error("Please check your MongoDB Atlas IP Whitelist (0.0.0.0/0) or Internet connection.");
    }
};

module.exports = { connactionDB };