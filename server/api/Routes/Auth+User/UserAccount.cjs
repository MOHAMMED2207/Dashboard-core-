const Express = require("express");
const UserControllr = require("../../Controllers/Auth+User/UserControllrr.cjs"); // Controller
const AUTH_MIDDLEWARES = require("../../middlewares/authentication.cjs"); // Routes
const router = Express.Router();
// ------------------------------------------------------------------------------------
router.get(
  "/user/profile/:username",
  AUTH_MIDDLEWARES,
  UserControllr.getUserProfile
); // ✅
// router.get(
//   "/searchUsers/:username",
//   AUTH_MIDDLEWARES,
//   UserControllr.searchUsers
// );

// ------------------------------------------------------------------------------------
router.post("/user/update", AUTH_MIDDLEWARES, UserControllr.updateUser); // ✅f
// ------------------------------------------------------------------------------------

module.exports = router; //  Exports
