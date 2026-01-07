// server/api/Routes/Dashboard.cjs
const express = require("express");
const DashboardController = require("../../Controllers/Dashboard/DashboardController.cjs");
const authMiddleware = require("../../middlewares/authentication.cjs");

const router = express.Router();
// All routes require authentication
router.use(authMiddleware);

// Dashboard CRUD
router.post("/", DashboardController.createDashboard); // create dashboard ✅
router.get("/", DashboardController.getUserDashboards); // get all user dashboards ✅
router.get("/templates", DashboardController.getTemplates); // get dashboard templates by (?category=marketing) ✅
router.get("/:dashboardId", DashboardController.getDashboard); // get single dashboard by (Id) ✅
router.put("/:dashboardId", DashboardController.updateDashboard); // update dashboard by (Id) ✅
router.delete("/:dashboardId", DashboardController.deleteDashboard); // ⌚

// Dashboard Sharing
router.post("/:dashboardId/share", DashboardController.shareDashboard); // share dashboard with user ✅
router.post("/:dashboardId/clone", DashboardController.cloneDashboard); // create new (clone) of existing dashboard ✅

// Widget Management

router.get("/:dashboardId/widgets", DashboardController.getWidgets); // add widget to dashboard ✅
router.post("/:dashboardId/widgets", DashboardController.addWidget); // add widget to dashboard ✅
router.put("/:dashboardId/widgets/:widgetId", DashboardController.updateWidget); // update widget in dashboard ✅
router.delete(
  "/:dashboardId/widgets/:widgetId",
  DashboardController.removeWidget
);

module.exports = router;
