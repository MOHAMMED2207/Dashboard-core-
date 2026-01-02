const Notification = require("../Model/Notification.cjs");
const AppError = require("../utils/AppError.cjs");
const { paginateResults } = require("../utils/pagination");

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { page = 1, limit = 20 } = req.query;

    const notificationsQuery = Notification.find({ to: userId })
      .sort({ createdAt: -1 })
      .populate("from", "username fullname ProfileImg") // فقط الحقول المهمة
      .populate({
        path: "post",
        select: "title user", // اختصر الحقول
        populate: {
          path: "user",
          select: "username ProfileImg",
          model: "auth",
        },
      });

    const notifications = await paginateResults(notificationsQuery, page, limit);

    res.status(200).json(notifications);
  } catch (err) {
    next(new AppError("Failed to fetch notifications", 500));
  }
};

exports.readNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // أفضل طريقة لو العدد كبير: queue أو batch
    await Notification.updateMany({ to: userId, read: false }, { read: true });

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    next(new AppError("Failed to mark notifications as read", 500));
  }
};

exports.getLatestUnreadNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const notification = await Notification.findOne({ to: userId, read: false })
      .sort({ createdAt: -1 })
      .populate("from", "username fullname ProfileImg")
      .populate({
        path: "post",
        select: "title user",
        populate: { path: "user", select: "username ProfileImg", model: "auth" },
      });

    if (!notification) return next(new AppError("No unread notifications", 404));

    res.status(200).json(notification);
  } catch (err) {
    next(new AppError("Failed to fetch latest unread notification", 500));
  }
};

exports.deleteNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Soft delete ممكن بدل hard delete في مشروع حقيقي
    await Notification.deleteMany({ to: userId });

    res.status(200).json({ message: "Notifications deleted successfully" });
  } catch (err) {
    next(new AppError("Failed to delete notifications", 500));
  }
};

exports.deletePostNotifications = async (req, res, next) => {
  try {
    const { postId } = req.params;

    await Notification.deleteMany({ post: postId });

    res.status(200).json({ message: "Post notifications deleted successfully" });
  } catch (err) {
    next(new AppError("Failed to delete post notifications", 500));
  }
};
