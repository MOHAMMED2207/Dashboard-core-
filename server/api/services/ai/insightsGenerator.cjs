// server/api/services/ai/insightsGenerator.cjs
const {
  analyzeGrowth,
  analyzeBreakdown,
  analyzeSeasonality,
  analyzeRisks,
  discoverOpportunities,
} = require("../../helpers/Ai.helper.cjs");
const Analytics = require("../../Model/All Business/Analytics.cjs");
const mongoose = require("mongoose"); // ← هنا

/**
 * AI Insights Generator
 * يولد رؤى ذكية تلقائياً من البيانات
 */

exports.generateAllInsights = async ({ allAnalytics, companyId }) => {
  try {
    console.log(`🤖 Generating AI insights for company: ${companyId}`);

    if (!allAnalytics || allAnalytics.length === 0) {
      console.log("⚠️ No analytics data found");
      return [];
    }

    const allInsights = [];

    // تحليل كل نوع من Analytics
    for (const analytics of allAnalytics) {
      // تحليل النمو
      const growthInsights = await analyzeGrowth(analytics);
      if (growthInsights) allInsights.push(...growthInsights);

      // تحليل التوزيع
      const breakdownInsights = await analyzeBreakdown(analytics);
      if (breakdownInsights) allInsights.push(...breakdownInsights);

      // تحليل الموسمية
      const seasonalityInsights = await analyzeSeasonality(analytics);
      if (seasonalityInsights) allInsights.push(...seasonalityInsights);
    }

    // تحليل المخاطر (على مستوى الشركة)
    const riskInsights = await analyzeRisks(companyId, allAnalytics);
    if (riskInsights) allInsights.push(...riskInsights);

    // اكتشاف الفرص (على مستوى الشركة)
    const opportunityInsights = await discoverOpportunities(
      companyId,
      allAnalytics
    );
    if (opportunityInsights) allInsights.push(...opportunityInsights);

    // ترتيب حسب الأولوية
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    allInsights.sort((a, b) => {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    console.log(`✅ Generated ${allInsights.length} insights`);
    return allInsights;
  } catch (error) {
    console.error("❌ Error generating insights:", error);
    throw error;
  }
};

/**
 * يولد رؤية واحدة وإضافتها للـ Analytics
 */
exports.addInsightToAnalytics = async (analyticsId, insight) => {
  const analytics = await Analytics.findById(analyticsId);
  if (!analytics) return false;

  // منع التكرار (اختياري لكن مهم)
  const exists = analytics.insights?.some(
    (i) => i.title === insight.title && i.source === "ai"
  );
  if (exists) return false;

  await analytics.addInsight(insight);
  return true;
};

/**
 * تحديث جميع Analytics بالرؤى
 */
exports.updateAnalyticsWithInsights = async ({ companyId, allAnalytics }) => {
  try {
    // 1️⃣ توليد جميع الرؤى (AI فقط – بدون حفظ)
    const insights = await exports.generateAllInsights({
      allAnalytics,
      companyId,
    });

    if (!insights || insights.length === 0) {
      return { updated: 0, insights: [] };
    }

    // 2️⃣ جلب أحدث Analytics لكل type مرة واحدة
    const latestByType = await Analytics.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          status: "completed",
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$type",
          analyticsId: { $first: "$_id" },
        },
      },
    ]);

    if (!latestByType.length) {
      return { updated: 0, insights: [] };
    }

    // Map: type → analyticsId
    const analyticsMap = new Map();
    latestByType.forEach((item) => {
      analyticsMap.set(item._id, item.analyticsId.toString());
    });

    // 3️⃣ توزيع الرؤى على الـ Analytics المناسبة
    let updated = 0;

    for (const insight of insights) {
      let targetAnalyticsId = null;

      // 🔹 Insight مرتبط بنوع Analytics مباشر
      if (analyticsMap.has(insight.category)) {
        targetAnalyticsId = analyticsMap.get(insight.category);
      }

      // 🔹 Insights عامة (risk / opportunity)
      if (
        !targetAnalyticsId &&
        (insight.category === "risk" || insight.category === "opportunity")
      ) {
        // وزّعها على كل الأنواع
        for (const analyticsId of analyticsMap.values()) {
          const saved = await exports.addInsightToAnalytics(
            analyticsId,
            insight
          );
          if (saved) updated++;
        }
        continue;
      }

      // 🔹 إضافة Insight عادي
      if (targetAnalyticsId) {
        const saved = await exports.addInsightToAnalytics(
          targetAnalyticsId,
          insight
        );
        if (saved) updated++;
      }
    }

    return { updated, insights };
  } catch (error) {
    console.error("❌ Error updating analytics with insights:", error);
    throw error;
  }
};

module.exports = exports;
