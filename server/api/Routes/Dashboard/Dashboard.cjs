// server/api/Routes/Dashboard.cjs
const express = require("express");
const DashboardController = require("../../Controllers/Dashboard/DashboardController.cjs");
const authMiddleware = require("../../middlewares/authentication.cjs");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Dashboard CRUD
router.post("/", DashboardController.createDashboard);
router.get("/", DashboardController.getUserDashboards);
router.get("/templates", DashboardController.getTemplates);
router.get("/:dashboardId", DashboardController.getDashboard);
router.put("/:dashboardId", DashboardController.updateDashboard);
router.delete("/:dashboardId", DashboardController.deleteDashboard);

// Dashboard Sharing
router.post("/:dashboardId/share", DashboardController.shareDashboard);
router.post("/:dashboardId/clone", DashboardController.cloneDashboard);

// Widget Management
router.post("/:dashboardId/widgets", DashboardController.addWidget);
router.put("/:dashboardId/widgets/:widgetId", DashboardController.updateWidget);
router.delete(
  "/:dashboardId/widgets/:widgetId",
  DashboardController.removeWidget
);

module.exports = router;
