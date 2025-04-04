require("dotenv").config(); // Auto-load .env
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const express = require("express");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const { errorHandler } = require("./middlewares/errorMiddleware");
const userRoutes = require("./routes/userRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const User = require("./models/userModel");

const app = express();
const server = http.createServer(app);

// Set the origin based on environment
const origin = process.env.NODE_ENV === "production"
    ? "https://real-estate-frontend-z0wx.onrender.com"
    : "http://localhost:5173";

const corsOptions = {
    origin,
    methods: ["GET", "POST"],
    credentials: true,
};

const io = socketIo(server, { cors: corsOptions });
const onlineUsers = {};

console.log("Environment:", process.env.NODE_ENV);
console.log("MongoDB URL:", process.env.MONGO_URL);

// Middleware
app.use(cors(corsOptions));
app.use(fileUpload());
app.use(express.json());
app.use(errorHandler);

// Socket.io Connection
io.on("connection", async (socket) => {
    console.log("New user connected:", socket.id);

    const token = socket.handshake.auth?.token;
    if (!token) {
        console.log("No token provided.");
        return;
    }

    try {
        const loggedUser = await getUserId(token);
        if (loggedUser && loggedUser._id) {
            onlineUsers[loggedUser._id] = socket.id;
            console.log("Online Users:", onlineUsers);
            io.emit("userConnected", loggedUser.username);
        }
    } catch (err) {
        console.log("Error verifying user:", err.message);
    }

    socket.on("disconnect", () => {
        console.log("User disconnected...");
    });
});

// Helper Function: Get User ID from JWT
async function getUserId(token) {
    try {
        const { userId } = jwt.verify(token, process.env.JWT_SECRET);
        return await User.findById(userId).select("isAdmin username");
    } catch (error) {
        console.log("JWT verification error:", error.message);
        return null;
    }
}

// API Routes
app.use("/api/v1", userRoutes);
app.use("/api/v1", propertyRoutes);

// Start the server
async function runServer() {
    try {
        await connectDB();
        console.log("✅ Connected to MongoDB...");

        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Server Error:", error.message);
        process.exit(1);
    }
}

runServer();

module.exports = io;



