// server/api/Controllers/AnalyticsController.cjs
const Analytics = require("../../Model/All Business/Analytics.cjs");
const Company = require("../../Model/All Business/Company.cjs");
const ActivityLog = require("../../Model/All Business/ActivityLog.cjs");
const AppError = require("../../utils/AppError.cjs");
const {
  calculateDateRange,
  fetchAnalyticsWithFallback,
  formatOverviewData,
  countInsights,
} = require("../../helpers/analytics.helpers.cjs");

/**
 * Get Analytics Overview ✅
 * GET /api/analytics/:companyId/overview ✅
 */
exports.getOverview = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    const { days = 365, includeOld = "true" } = req.query;

    // Calculate date range
    const { startDate, endDate } = calculateDateRange(days);

    // Analytics types to fetch
    const analyticsTypes = [
      "sales",
      "revenue",
      "users",
      "traffic",
      "conversion",
      "performance",
    ];

    // Fetch all analytics in parallel // get data Analytics
    const analyticsPromises = analyticsTypes.map((type) =>
      fetchAnalyticsWithFallback(
        {
          companyId,
          type,
          "period.start": { $gte: startDate },
        },
        includeOld
      )
    );

    const analyticsResults = await Promise.all(analyticsPromises);

    // Format overview data
    const overview = {};
    analyticsTypes.forEach((type, index) => {
      overview[type] = formatOverviewData(analyticsResults[index], userId);
    });

    // { type === [ "sales", "revenue", "users", "traffic", "conversion", "performance",]
    // overview[type]
    //   overview{
    //     | "sales": {
    //     |            "current": 250000,
    //     |            "change": 65000,
    //     |            "changeRate": 0.35,
    //     |            "trend": "stable",
    //     |          },
    //     | "revenue": {ويحط البيانات},
    //     | "users":   {ويحط البيانات},
    //     | "traffic": {ويحط البيانات},
    // }

    // Count insights
    const { totalInsights, unviewedInsights } = countInsights(
      analyticsResults,
      userId
    );

    // Check if we have any data
    const hasData = Object.values(overview).some((v) => v !== null);
    const dataCount = analyticsResults.filter((a) => a !== null).length;

    res.status(200).json({
      overview,
      period: { start: startDate, end: endDate },
      totalInsights,
      unviewedInsights,
      hasData,
      dataCount,
      availableTypes: Object.keys(overview).filter((k) => overview[k] !== null),
      missingTypes: Object.keys(overview).filter((k) => overview[k] === null),
      lastUpdated: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Analytics by Specific Type ✅
 * GET /api/analytics/:companyId/:type ✅
 */
exports.getAnalyticsByType = async (req, res, next) => {
  try {
    const { companyId, type } = req.params;
    const userId = req.user.id;
    const { days = 365, includeOld = "true", limit = 50 } = req.query;

    // Calculate date range
    const { startDate, endDate } = calculateDateRange(days);

    // Build query
    const baseQuery = {
      companyId,
      type,
      status: "completed",
    };

    // Fetch analytics with date range
    let analytics = await Analytics.find({
      ...baseQuery,
      "period.start": { $gte: startDate },
    })
      .sort({ "period.start": 1 })
      .limit(parseInt(limit))
      .lean();

    // Fallback: get all available data if nothing found in range
    if ((!analytics || analytics.length === 0) && includeOld === "true") {
      console.log(
        `No data in last ${days} days, fetching all available data for type: ${type}`
      );
      analytics = await Analytics.find(baseQuery)
        .sort({ "period.start": 1 })
        .limit(parseInt(limit))
        .lean();
    }

    console.log(
      `Found ${analytics?.length || 0} analytics records for type: ${type}`
    );

    // If still no data found
    if (!analytics || analytics.length === 0) {
      return res.status(200).json({
        type,
        data: [],
        timeSeries: [],
        message: "No analytics data available for this type",
        suggestion: `Create analytics data using: POST /api/analytics/${companyId}/custom`,
        searchedRange: {
          start: startDate,
          end: endDate,
          days: parseInt(days),
        },
      });
    }

    // Extract time series data
    const timeSeries = analytics.flatMap((a) => {
      if (a.data?.timeSeries?.length > 0) {
        return a.data.timeSeries.map((ts) => ({
          timestamp: ts.timestamp,
          value: ts.value || 0,
          metadata: ts.metadata,
        }));
      } else {
        return [
          {
            timestamp: a.period.start,
            value: a.data?.metrics?.total || 0,
            period: a.period,
          },
        ];
      }
    });

    // Get latest record
    const latest = analytics[analytics.length - 1];

    // Calculate aggregate metrics
    const totalValue = analytics.reduce(
      (sum, a) => sum + (a.data?.metrics?.total || 0),
      0
    );
    const avgValue = totalValue / analytics.length;

    // Collect all insights
    const allInsights = analytics.flatMap((a) => a.insights || []);

    // Response
    res.status(200).json({
      type,
      timeSeries: timeSeries.slice(0, 100),
      current: latest.data?.metrics || {},
      breakdown: latest.data?.breakdown || [],
      segments: latest.data?.segments || [],
      insights: allInsights.slice(0, 20),
      predictions: latest.predictions || {},
      anomalies: latest.anomalies || [],
      summary: {
        totalRecords: analytics.length,
        totalValue,
        averageValue: avgValue,
        dateRange: {
          start: analytics[0]?.period.start,
          end: latest?.period.end,
        },
        lastUpdated: latest?.updatedAt || latest?.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in getAnalyticsByType:", error);
    next(error);
  }
};

/**
 * Get KPIs (Key Performance Indicators) ✅
 * GET /api/analytics/:companyId/kpis ✅
 */
exports.getKPIs = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;

    // Fetch latest analytics for each KPI type
    const analyticsTypes = ["sales", "revenue", "users", "conversion"];

    const analyticsResults = await Promise.all(
      analyticsTypes.map((type) =>
        Analytics.findOne({
          companyId,
          type,
          status: "completed",
        })
          .sort({ createdAt: -1 })
          .lean()
      )
    );

    // destructuring
    const [sales, revenue, users, conversion] = analyticsResults;

    console.log("KPIs data availability:", {
      sales: !!sales,
      revenue: !!revenue,
      users: !!users,
      conversion: !!conversion,
    });

    // Format KPIs
    const kpis = [
      {
        id: "total_sales",
        name: "Total Sales",
        value: sales?.data?.metrics?.total || 0,
        change: (sales?.data?.metrics?.changeRate || 0) * 100,
        trend: sales?.predictions?.trend || "stable",
        icon: "shopping-cart",
        color: "blue",
        lastUpdated: sales?.updatedAt || sales?.createdAt || null,
        period: sales?.period || null,
      },
      {
        id: "revenue",
        name: "Revenue",
        value: revenue?.data?.metrics?.total || 0,
        change: (revenue?.data?.metrics?.changeRate || 0) * 100,
        trend: revenue?.predictions?.trend || "stable",
        icon: "dollar-sign",
        color: "green",
        prefix: "$",
        lastUpdated: revenue?.updatedAt || revenue?.createdAt || null,
        period: revenue?.period || null,
      },
      {
        id: "active_users",
        name: "Active Users",
        value: users?.data?.metrics?.total || 0,
        change: (users?.data?.metrics?.changeRate || 0) * 100,
        trend: users?.predictions?.trend || "stable",
        icon: "users",
        color: "purple",
        lastUpdated: users?.updatedAt || users?.createdAt || null,
        period: users?.period || null,
      },
      {
        id: "conversion_rate",
        name: "Conversion Rate",
        value: conversion?.data?.metrics?.average || 0,
        change: (conversion?.data?.metrics?.changeRate || 0) * 100,
        trend: conversion?.predictions?.trend || "stable",
        icon: "trending-up",
        color: "orange",
        suffix: "%",
        lastUpdated: conversion?.updatedAt || conversion?.createdAt || null,
        period: conversion?.period || null,
      },
    ];

    const hasData = kpis.some((kpi) => kpi.value > 0);

    res.status(200).json({
      kpis,
      hasData,
      message: hasData
        ? "KPIs loaded successfully"
        : "No KPI data available. Create analytics data first.",
    });
  } catch (error) {
    console.error("Error in getKPIs:", error);
    next(error);
  }
};

/**
 * Get Analytics Summary ✅
 * GET /api/analytics/:companyId/summary ✅
 **/
exports.getAnalyticsSummary = async (req, res, next) => {
  try {
    const company = req.company;
    const companyId = company._id;
    // console.log(companyId);

    const analyticsTypes = [
      "sales",
      "revenue",
      "users",
      "traffic",
      "conversion",
      "performance",
    ];

    // Get summary for each type
    const summaryPromises = analyticsTypes.map(async (type) => {
      const count = await Analytics.countDocuments({
        companyId,
        type,
        status: "completed",
      });

      const latest = await Analytics.findOne({
        companyId,
        type,
        status: "completed",
      })
        .sort({ createdAt: -1 })
        .select("createdAt updatedAt period data.metrics.total")
        .lean();

      return {
        type,
        count,
        hasData: count > 0,
        latestValue: latest?.data?.metrics?.total || 0,
        lastUpdated: latest?.updatedAt || latest?.createdAt || null,
        period: latest?.period || null,
      };
    });

    const summary = await Promise.all(summaryPromises);

    // Calculate total insights
    const totalInsights = await Analytics.aggregate([
      {
        $match: {
          companyId,
          status: "completed",
        },
      },
      {
        $project: {
          insightCount: { $size: { $ifNull: ["$insights", []] } },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$insightCount" },
        },
      },
    ]);

    res.status(200).json({
      summary,
      totalAnalytics: summary.reduce((sum, s) => sum + s.count, 0),
      totalInsights: totalInsights[0]?.total || 0,
      availableTypes: summary.filter((s) => s.hasData).map((s) => s.type),
      missingTypes: summary.filter((s) => !s.hasData).map((s) => s.type),
      companyId,
    });
  } catch (error) {
    console.error("Error in getAnalyticsSummary:", error);
    next(error);
  }
};

/**
 * Get Insights ✅
 * GET /api/analytics/:companyId/insights/all ✅
 */
exports.getInsights = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    const { priority, type, limit = 10 } = req.query;

    // Fetch analytics with insights
    const analytics = await Analytics.find({
      companyId,
      status: "completed",
      "insights.0": { $exists: true },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Extract and flatten insights
    let allInsights = [];
    analytics.forEach((a) => {
      a.insights.forEach((insight) => {
        allInsights.push({
          ...insight,
          analyticsType: a.type,
          analyticsId: a._id,
        });
      });
    });

    // Apply filters select between ["low", "medium", "high", "critical"]
    // exempel (type) [ "sales", "revenue" ]
    if (priority || type) {
      allInsights = allInsights.filter((i) => i.priority === priority);
      allInsights = allInsights.filter((i) => i.type === type);
    }

    // Sort by priority and date
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    allInsights.sort((a, b) => {
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Limit results
    allInsights = allInsights.slice(0, parseInt(limit));

    // Count unviewed insights
    const unviewedCount = allInsights.filter(
      (i) => !i.viewedBy?.some((v) => v.userId.toString() === userId.toString())
    ).length;

    res.status(200).json({
      insights: allInsights,
      total: allInsights.length,
      unviewed: unviewedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Custom Analytics ✅
 * POST /api/analytics/:companyId/custom ✅
 */
exports.createCustomAnalytics = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    const { type, category, period, data, insights, predictions } = req.body;

    // Create analytics record
    const analytics = await Analytics.create({
      companyId,
      type: type || "custom",
      category: category || "daily",
      period: period || {
        start: new Date(),
        end: new Date(),
      },
      data,
      insights: insights || [],
      predictions: predictions || {},
      status: "completed",
    });

    // Log activity
    await ActivityLog.log({
      companyId,
      userId,
      action: "analytics.create",
      category: "analytics",
      details: {
        resource: "analytics",
        resourceId: analytics._id,
        description: `Created analytics: ${type || "custom"}`,
      },
    });

    res.status(201).json({
      message: "Analytics created successfully",
      analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Analytics Comparison between (2) => date ✅
 * GET /api/analytics/:companyId/:type/comparison ✅
 */
exports.getComparison = async (req, res, next) => {
  try {
    const { type } = req.params;

    const company = req.company;
    const companyId = company._id;
    const { period1, period2 } = req.query;

    // Validate periods
    if (!period1 || !period2) {
      return next(
        new AppError(
          "Both period1 and period2 are required with start and end dates",
          400
        )
      );
    }

    // Fetch analytics for both periods

    const data1Array = await Analytics.find({
      companyId,
      type,
      status: "completed",
      "period.start": { $lte: new Date(period1.end) },
      "period.end": { $gte: new Date(period1.start) },
    }).lean();

    const data2Array = await Analytics.find({
      companyId,
      type,
      status: "completed",
      "period.start": { $lte: new Date(period2.end) },
      "period.end": { $gte: new Date(period2.start) },
      _id: { $nin: data1Array.map((d) => d._id) },
    }).lean();

    if (!data1Array || !data2Array) {
      return next(
        new AppError("Analytics data not found for one or both periods", 404)
      );
    }

    // Calculate comparison
    // دالة لحساب مجموع الـ total من كل السجلات
    const sumValue = (data) =>
      data.reduce((sum, a) => sum + (a.data?.metrics?.total || 0), 0);

    const value1 = sumValue(data1Array); // مجموع total لكل السجلات في period1
    const value2 = sumValue(data2Array); // مجموع total لكل السجلات في period2

    // The difference between the values ​​of the two analyses
    // Increase or decrease
    const difference = value2 - value1;
    const percentageChange = value2 !== 0 ? (difference / value2) * 100 : 0;

    res.status(200).json({
      comparison: {
        period1: { value: value1, data: data1Array },
        period2: { value: value2, data: data2Array },
        difference,
        percentageChange: Math.round(percentageChange * 100) / 100,
        trend: difference > 0 ? "up" : difference < 0 ? "down" : "stable",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark Insight as Viewed (تحليل_ai_) ✅
 * PUT /api/analytics/:analyticsId/insights/:insightId/view ✅
 */
exports.markInsightViewed = async (req, res, next) => {
  try {
    const { analyticsId, insightId } = req.params;
    const userId = req.user.id;

    // Find analytics
    const analytics = await Analytics.findById(analyticsId);
    if (!analytics) {
      return next(new AppError("Analytics not found", 404));
    }

    // Find specific insight
    const insight = analytics.insights.id(insightId);
    if (!insight) {
      return next(new AppError("Insight not found", 404));
    }

    // Check if already viewed
    const alreadyViewed = insight.viewedBy?.some(
      (v) => v.userId.toString() === userId.toString()
    );

    if (!alreadyViewed) {
      insight.viewedBy.push({
        userId,
        viewedAt: new Date(),
      });
      await analytics.save();
    }

    res.status(200).json({
      message: "Insight marked as viewed",
      insight: {
        id: insight._id,
        viewedBy: insight.viewedBy.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
