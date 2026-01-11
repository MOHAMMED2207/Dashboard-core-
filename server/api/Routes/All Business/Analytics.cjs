const express = require("express");
const AnalyticsController = require("../../Controllers/All Business/AnalyticsController.cjs");
const authMiddleware = require("../../middlewares/authentication.cjs");
const { hasPermission } = require("../../middlewares/permissions.cjs");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * =========================
 * READ ANALYTICS
 * =========================
 */

// Overview
router.get(
  "/:companyId/overview",
  hasPermission("analytics.read"),
  AnalyticsController.getOverview
);

// KPIs
router.get(
  "/:companyId/kpis",
  hasPermission("analytics.read"),
  AnalyticsController.getKPIs
);

// Summary
router.get(
  "/:companyId/summary",
  hasPermission("analytics.read"),
  AnalyticsController.getAnalyticsSummary
);

// All Insights
router.get(
  "/:companyId/insights/all",
  hasPermission("analytics.read"),
  AnalyticsController.getInsights
);

// Comparison (must come before generic :type)
router.get(
  "/:companyId/:type/comparison",
  hasPermission("analytics.read"),
  AnalyticsController.getComparison
);

// Generic Analytics by Type (MUST be last)
router.get(
  "/:companyId/:type",
  hasPermission("analytics.read"),
  AnalyticsController.getAnalyticsByType
);

/**
 * =========================
 * WRITE / UPDATE ANALYTICS
 * =========================
 */

// Create Custom Analytics
router.post(
  "/:companyId/custom",
  hasPermission("analytics.create"),
  AnalyticsController.createCustomAnalytics
);

// Mark Insight as Viewed
router.put(
  "/:analyticsId/insights/:insightId/view",
  hasPermission("analytics.read"),
  AnalyticsController.markInsightViewed
);



/**
 * =========================
 * AI Insights / (GET || CREATE)
 * =========================
 */

// AI Insights
router.get(
  "/:companyId/ai/insights",
  hasPermission("analytics.read"),
  AnalyticsController.getAIInsights
);

router.post(
  "/:companyId/ai/insights",
  hasPermission("analytics.create"),
  AnalyticsController.generateAndSaveAIInsights
);


module.exports = router;
