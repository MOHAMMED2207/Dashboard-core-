// في ملف middlewares/updateUserActivity.cjs
const UserModel = require("../Model/Auth+User/Auth.cjs");
const cron = require("node-cron");

// ✅ Middleware: يحدث active و lastActive عند كل request
const updateUserActivity = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const userId = req.user._id || req.user.id;

    if (!userId) {
      return next();
    }

    await UserModel.findByIdAndUpdate(userId, {
      lastActive: new Date(),
      active: true,
    });

    console.log(
      `✅ User ${userId} is ACTIVE at ${new Date().toLocaleTimeString()}`
    );

    next();
  } catch (err) {
    console.error("❌ Error:", err.message);
    next();
  }
};

// ✅ Cron Job: يشتغل كل 10 ثواني (للاختبار السريع)
cron.schedule("*/10 * * * * *", async () => {
  try {
    // ✅ 30 ثانية للاختبار (بدلاً من 30 دقيقة)
    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 30 ثانية
    const inactiveThreshold = new Date(Date.now() - INACTIVITY_LIMIT);

    const result = await UserModel.updateMany(
      {
        lastActive: { $lt: inactiveThreshold },
        active: true,
      },
      {
        active: false,
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `🔴 ${
          result.modifiedCount
        } user(s) marked as INACTIVE at ${new Date().toLocaleTimeString()}`
      );
    } else {
      console.log(
        `⏰ Cron check at ${new Date().toLocaleTimeString()} - No inactive users`
      );
    }
  } catch (err) {
    console.error("❌ Cron error:", err.message);
  }
});

console.log(
  "⏰ Cron job started - checking every 10 seconds (30 sec inactivity limit)"
);

module.exports = updateUserActivity;
