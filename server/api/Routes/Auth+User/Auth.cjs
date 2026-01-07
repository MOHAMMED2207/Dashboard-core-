const express = require("express");
const AuthController = require("../../Controllers/Auth+User/AuthControllr.cjs");
const authMiddleware = require("../../middlewares/authentication.cjs");

const router = express.Router();

// PUBLIC ROUTES
router.post("/auth/register", AuthController.register); // ✅
router.post("/auth/login", AuthController.login); // ✅

router.post("/auth/logout",authMiddleware, AuthController.logout); // ✅

// PRIVATE ROUTES
router.get("/auth/me", authMiddleware, AuthController.getMe); // ✅
router.get("/users", authMiddleware, AuthController.GetAllUser); // ✅
router.get("/users/:id", authMiddleware, AuthController.GetUserProfile); // ✅

module.exports = router;
