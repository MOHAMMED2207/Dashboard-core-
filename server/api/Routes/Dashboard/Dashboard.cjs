// server/api/Routes/Dashboard.cjs
const express = require("express");
const DashboardController = require("../../Controllers/Dashboard/DashboardController.cjs");
const authMiddleware = require("../../middlewares/authentication.cjs");
const permission = require("../../middlewares/permissions.cjs");

const router = express.Router();
// All routes require authentication
router.use(authMiddleware);

// Dashboard CRUD
router.post(
  "/",
  permission.canCreateDashboard,
  DashboardController.createDashboard
); // create dashboard ✅
router.get("/", DashboardController.getUserDashboards); // get all user dashboards ✅
router.get("/templates", DashboardController.getTemplates); // get dashboard templates by (?category=marketing) ✅
router.get(
  "/:dashboardId",
  permission.canAccessDashboard("view"),
  DashboardController.getDashboard
); // get single dashboard by (Id) ✅
router.put(
  "/:dashboardId",
  permission.canAccessDashboard("edit"),
  DashboardController.updateDashboard
); // update dashboard by (Id) ✅
router.delete(
  "/:dashboardId",
  permission.canAccessDashboard("delete"),
  DashboardController.deleteDashboard
); // ⌚

// Dashboard Sharing
router.post(
  "/:dashboardId/share",
  permission.canAccessDashboard("edit"),
  DashboardController.shareDashboard
); // share dashboard with user ✅
router.post(
  "/:dashboardId/clone",
  permission.canAccessDashboard("edit"),
  DashboardController.cloneDashboard
); // create new (clone) of existing dashboard ✅

// Widget Management

router.get(
  "/:dashboardId/widgets",
  permission.canAccessDashboard("view"),
  DashboardController.getWidgets
); // add widget to dashboard ✅
router.post(
  "/:dashboardId/widgets",
  permission.canAccessDashboard("edit"),
  DashboardController.addWidget
); // add widget to dashboard ✅
router.put(
  "/:dashboardId/widgets/:widgetId",
  permission.canAccessDashboard("edit"),
  DashboardController.updateWidget
); // update widget in dashboard ✅
router.delete(
  "/:dashboardId/widgets/:widgetId",
  permission.canAccessDashboard("edit"),
  DashboardController.removeWidget
);

module.exports = router;
