const Analytics = require("../Model/All Business/Analytics.cjs");

/**
 * Calculate date range based on days
 */
exports.calculateDateRange = (days) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));
  return { startDate, endDate };
};

/**
 * Fetch analytics with fallback to older data
 */
exports.fetchAnalyticsWithFallback = async (query, includeOld = "true") => {
  let data = await Analytics.findOne({
    ...query,
    status: "completed",
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!data && includeOld === "true") {
    const { "period.start": _, ...baseQuery } = query;
    data = await Analytics.findOne({
      ...baseQuery,
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  return data;
};

/**
 * Format overview analytics data
 */
exports.formatOverviewData = (analyticsResult) => {
  if (!analyticsResult) return null;

  return {
    current: analyticsResult.data?.metrics?.total || 0,
    change: analyticsResult.data?.metrics?.change || 0,
    changeRate: analyticsResult.data?.metrics?.changeRate || 0,
    trend: analyticsResult.predictions?.trend || "stable",
    lastUpdated: analyticsResult.updatedAt || analyticsResult.createdAt,
    period: {
      start: analyticsResult.period.start,
      end: analyticsResult.period.end,
    },
  };
};

/**
 * Count insights (total / unviewed)
 */
exports.countInsights = (analyticsResults, userId) => {
  let total = 0;
  let unviewed = 0;

  analyticsResults.forEach((a) => {
    if (!a?.insights) return;

    total += a.insights.length;

    unviewed += a.insights.filter(
      (i) => !i.viewedBy?.some((v) => v.userId.toString() === userId.toString())
    ).length;
  });

  return { totalInsights: total, unviewedInsights: unviewed };
};
