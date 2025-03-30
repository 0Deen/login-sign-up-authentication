require("dotenv").config();
const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URL) {
            throw new Error("❌ MONGO_URL is not defined in .env file");
        }

        console.log("🔄 Connecting to MongoDB...");

        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("✅ MongoDB Connected Successfully!");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
