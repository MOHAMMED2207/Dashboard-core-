const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { v2: cloudinary } = require("cloudinary");
const http = require("http");
const { Server } = require("socket.io");

const errorHandler = require("./middlewares/errorHandler.cjs");
const updateUserActivity = require("./middlewares/updateUserActivity.cjs");
const authMiddleware = require("./middlewares/authentication.cjs");

// Routes
const AuthRouter = require("./Routes/Auth+User/Auth.cjs");
const UserRouter = require("./Routes/Auth+User/UserAccount.cjs");
const CompanyRouter = require("./Routes/All Business/Company.cjs");
const DashboardRouter = require("./Routes/Dashboard/Dashboard.cjs");
const AnalyticsRouter = require("./Routes/All Business/Analytics.cjs");

// Load env
dotenv.config();

// Cloudinary
cloudinary.config({
  cloud_name: process.env.Cloudinary_NAME,
  api_key: process.env.Cloudinary_API_KEY,
  api_secret: process.env.Cloudinary_API_SECRET,
});

const app = express();

// ===============================
// 🔴 SOCKET.IO SETUP
// ===============================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  },
});

app.set("io", io);
global.io = io;

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join-company", (companyId) => {
    socket.join(`company:${companyId}`);
    console.log(`🏢 Joined company room: ${companyId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// ===============================
// 🔹 MIDDLEWARES
// ===============================
app.use(bodyParser.json({ limit: "1gb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

app.use(authMiddleware);
app.use(updateUserActivity); // يحدث active/lastActive ويبث فورًا

// ===============================
// 🔹 ROUTES
// ===============================
app.use("/api", AuthRouter);
app.use("/api", UserRouter);
app.use("/api/companies", CompanyRouter);
app.use("/api/dashboards", DashboardRouter);
app.use("/api/analytics", AnalyticsRouter);

// ===============================
// 🔹 DATABASE
// ===============================
const URL = process.env.MONGOO_URL;

mongoose.set("strictQuery", false);
mongoose.connect(URL)
  .then(() => console.log("🟢 Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ===============================
// 🔹 SERVER START
// ===============================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ===============================
// 🔴 ERROR HANDLER (LAST)
// ===============================
app.use(errorHandler);

module.exports = { app, server, io };
