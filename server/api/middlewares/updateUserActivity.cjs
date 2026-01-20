const UserModel = require("../Model/Auth+User/Auth.cjs");
const cron = require("node-cron");

// 🔹 وقت عدم النشاط قبل وضع المستخدم غير نشط (مثال: 30 ثانية للاختبار)
const INACTIVITY_LIMIT_MS = 30 * 1000; // 30 ثانية

const updateUserActivity = async (req, res, next) => {
  try {
    if (!req.user) return next();

    const userId = req.user._id || req.user.id;

    if (!userId) return next();

    const now = new Date();

    // تحديث آخر نشاط وحالة المستخدم
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        lastActive: now,
        active: true,
      },
      { new: true }
    );

    // 🔴 بث مباشر للـ clients في نفس الشركة
    if (global.io && updatedUser.companyId) {
      global.io.to(`company:${updatedUser.companyId}`).emit("member:presence", {
        userId: updatedUser._id.toString(),
        active: true,
        lastActive: now,
      });
    }

    next();
  } catch (err) {
    console.error("❌ Error in updateUserActivity:", err);
    next();
  }
};

// ==========================
// 🔹 Cron job: تحديث inactive
// ==========================
cron.schedule("*/5 * * * * *", async () => {
  try {
    const now = new Date();
    const inactiveThreshold = new Date(now - INACTIVITY_LIMIT_MS);

    const inactiveUsers = await UserModel.find({
      active: true,
      lastActive: { $lt: inactiveThreshold },
    });

    if (inactiveUsers.length > 0) {
      for (const user of inactiveUsers) {
        user.active = false;
        await user.save();

        // 🔴 بث مباشر
        if (global.io && user.companyId) {
          global.io.to(`company:${user.companyId}`).emit("member:presence", {
            userId: user._id.toString(),
            active: false,
            lastActive: user.lastActive,
          });
        }
      }

      console.log(
        `🔴 ${inactiveUsers.length} user(s) marked as INACTIVE at ${new Date().toLocaleTimeString()}`
      );
    }
  } catch (err) {
    console.error("❌ Cron error:", err);
  }
});

console.log("⏰ Cron job started - checking every 5 seconds");

module.exports = updateUserActivity;
