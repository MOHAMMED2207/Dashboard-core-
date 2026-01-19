// const UserModel = require("../Model/Auth+User/Auth.cjs");

// /**
//  * تحديث آخر نشاط للمستخدم (heartbeat)
//  * @param {String} userId - ID المستخدم
//  */
// async function updateUserActivity(userId) {
//   if (!userId) return;

//   try {
//     await UserModel.findByIdAndUpdate(userId, {
//       lastActive: new Date(),
//       active: true,
//     });

//     console.log(
//       `✅ User ${userId} activity updated at ${new Date().toLocaleTimeString()}`
//     );
//   } catch (err) {
//     console.error(`❌ Failed to update activity for user ${userId}:`, err.message);
//   }
// }

// module.exports = { updateUserActivity };
