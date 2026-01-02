const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { v2: cloudinary } = require("cloudinary");
const errorHandler = require("./middlewares/errorHandler.cjs");


const AuthRouter = require("./Routes/Auth.cjs");
const UserRouter = require("./Routes/UserAccount.cjs");
// const notificationRoutes = require("./Routes/Notification.cjs");

// تهيئة إعدادات البيئة
dotenv.config();

cloudinary.config({
  cloud_name: process.env.Cloudinary_NAME,
  api_key: process.env.Cloudinary_API_KEY,
  api_secret: process.env.Cloudinary_API_SECRET,
});

// تهيئة Express
const app = express();

// المكونات الوسطى (middlewares)
// تحديد حد الحجم إلى 1GB
app.use(errorHandler);
app.use(bodyParser.json({ limit: "1gb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// إعداد المسارات (routes)
app.use("/api", AuthRouter); // Auth
app.use("/api", UserRouter); // User
// app.use("/api/notifications", notificationRoutes);

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
