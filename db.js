require("dotenv").config();
const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

const connectDB = async () => {
    try {
        // Ensure MONGO_URL is defined
        if (!process.env.MONGODB_URL) {
            console.error("❌ MONGODB_URL is missing in .env file");
            throw new Error("MONGODB_URL is required but not found");
        }

        console.log("🔄 Connecting to MongoDB...");

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("✅ MongoDB Connected Successfully!");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);

        // Retry connection after 5 seconds if it fails
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;
