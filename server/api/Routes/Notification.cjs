const Express = require("express");
const NotificationControllr = require("../Controllers/NotificationController.cjs");
const AUTH_MIDDLEWARES = require("../middlewares/authentication.cjs"); // Routes

const router = Express.Router();

router.get("/", AUTH_MIDDLEWARES, NotificationControllr.getNotifications);
router.get("/Read", AUTH_MIDDLEWARES, NotificationControllr.readNotifications);
router.get("/latest-unread", AUTH_MIDDLEWARES, NotificationControllr.getLatestUnreadNotification);
router.delete("/", AUTH_MIDDLEWARES, NotificationControllr.deleteNotifications);
router.delete("/delete-post-notifications/:postId", AUTH_MIDDLEWARES, NotificationControllr.deletePostNotifications);
module.exports = router;
