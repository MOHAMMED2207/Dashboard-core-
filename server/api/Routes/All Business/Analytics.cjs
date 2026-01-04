// server/api/Routes/Analytics.cjs
const express = require("express");
const AnalyticsController = require("../../Controllers/All Business/AnalyticsController.cjs");
const authMiddleware = require("../../middlewares/authentication.cjs");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// ⚠️ IMPORTANT: More specific routes MUST come before generic routes

// Overview & KPIs (specific routes first)
router.get("/:companyId/overview", AnalyticsController.getOverview);
router.get("/:companyId/kpis", AnalyticsController.getKPIs);
router.get("/:companyId/summary", AnalyticsController.getAnalyticsSummary);

// Insights (specific route)
router.get("/:companyId/insights/all", AnalyticsController.getInsights);

// Custom Analytics (POST before GET to avoid conflicts)
router.post("/:companyId/custom", AnalyticsController.createCustomAnalytics);

// Comparison (must come before generic :type route)
router.get(
  "/:companyId/:type/comparison",
  AnalyticsController.getComparison
);

// Mark Insight as Viewed
router.put(
  "/:analyticsId/insights/:insightId/view",
  AnalyticsController.markInsightViewed
);

// Generic Analytics by Type (MUST be last to avoid catching other routes)
router.get("/:companyId/:type", AnalyticsController.getAnalyticsByType);

module.exports = router;