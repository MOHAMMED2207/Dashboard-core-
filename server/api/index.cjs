const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { v2: cloudinary } = require("cloudinary");
const errorHandler = require("./middlewares/errorHandler.cjs");

// / Import Routes
const AuthRouter = require("./Routes/Auth+User/Auth.cjs");
const UserRouter = require("./Routes/Auth+User/UserAccount.cjs");

const CompanyRouter = require("./Routes/All Business/Company.cjs");
const DashboardRouter = require("./Routes/Dashboard/Dashboard.cjs");
const AnalyticsRouter = require("./Routes/All Business/Analytics.cjs");
// const notificationRoutes = require("./Routes/Notification.cjs");
// const dashboardRoutes = require("./Routes/Dashboard.cjs");

// تهيئة إعدادات البيئة
dotenv.config();

cloudinary.config({
  cloud_name: process.env.Cloudinary_NAME,
  api_key: process.env.Cloudinary_API_KEY,
  api_secret: process.env.Cloudinary_API_SECRET,
});


const app = express();

// ✅ Middlewares الأساسية أولاً
app.use(bodyParser.json({ limit: "1gb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

// const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// };
// app.use(cors({
//   origin: 'http://localhost:3000',
//   credentials: true
// }));

   // مثال في Express.js
// API Routes
app.use("/api", AuthRouter); // Authentication routes
app.use("/api", UserRouter); // User routes
app.use("/api/companies", CompanyRouter); // Company routes
app.use("/api/dashboards", DashboardRouter); // Dashboard routes
app.use("/api/analytics", AnalyticsRouter); // Analytics routes
// app.use("/api/reports", ReportRouter); // Report routes
// app.use("/api/notifications", NotificationRouter); // Notification routes

// الاتصال بقاعدة البيانات
const URL = process.env.MONGOO_URL;
const connect = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(URL);
    console.log("connected to mongoDB");
  } catch (err) {
    console.log(err);
    process.exit();
  }
};
connect();

// تشغيل الخادم (server)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;






// ✅ errorHandler يجب أن يكون في النهاية (بعد كل الـ routes)
app.use(errorHandler);
