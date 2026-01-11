// server/api/services/ai/insightsGenerator.cjs
const Analytics = require("../../Model/All Business/Analytics.cjs");
const mongoose = require("mongoose"); // ← هنا

/**
 * AI Insights Generator
 * يولد رؤى ذكية تلقائياً من البيانات
 */

// ===================================
// 3️⃣ Helper Functions (العقل الرياضي)
// ===================================

/**
 * حساب معدل النمو
 */
const calculateGrowthRate = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * تحديد الاتجاه
 */
const determineTrend = (growthRate) => {
  if (growthRate > 10) return "strong_growth";
  if (growthRate > 5) return "moderate_growth";
  if (growthRate > 0) return "slight_growth";
  if (growthRate > -5) return "slight_decline";
  if (growthRate > -10) return "moderate_decline";
  return "strong_decline";
};

/**
 * تحديد مستوى الأولوية
 */
const determinePriority = (impact, urgency) => {
  if (impact >= 80 && urgency >= 80) return "critical";
  if (impact >= 60 || urgency >= 60) return "high";
  if (impact >= 40 || urgency >= 40) return "medium";
  return "low";
};

// ===================================
// Main Insight Generators
// ===================================

/* analyzeGrowth – توقع الأداء المستقبلي 📈*/
const analyzeGrowth = async (analytics) => {
  if (!analytics || !analytics.data?.metrics) return null;

  const { total, change, changeRate, growth, growthRate } =
    analytics.data.metrics;
  const insights = [];

  //✅ نمو قوي
  if (growthRate > 0.15 || changeRate > 0.15) {
    insights.push({
      type: "positive",
      category: "growth",
      title: "📈 نمو قوي ملحوظ",
      message: `مبيعاتك نمت بنسبة ${((growthRate || changeRate) * 100).toFixed(
        1
      )}%! هذا أداء ممتاز يستحق الاستثمار.`,
      priority: "high",
      confidence: 92,
      source: "ai",
      recommendations: [
        "استثمر في توسيع الإنتاج لمواكبة الطلب المتزايد",
        "زد من ميزانية التسويق للحفاظ على الزخم",
        "فكر في توظيف المزيد من الموظفين",
        "احتفظ بمخزون إضافي لتلبية الطلب المتوقع",
      ],
      actions: [
        {
          type: "view_details",
          label: "عرض تفاصيل النمو",
          url: `/analytics/${analytics.type}`,
        },
      ],
    });
  }

  // نمو متوسط
  else if (growthRate > 0.05 || changeRate > 0.05) {
    insights.push({
      type: "positive",
      category: "growth",
      title: "✅ نمو مستقر",
      message: `أداء جيد! نمو بنسبة ${(
        (growthRate || changeRate) * 100
      ).toFixed(1)}%. استمر على هذا النهج.`,
      priority: "medium",
      confidence: 88,
      source: "ai",
      recommendations: [
        "حافظ على الاستراتيجية الحالية",
        "ابحث عن فرص تحسين إضافية",
        "راقب المنافسين",
      ],
    });
  }

  // ⚠️ انخفاض حاد
  else if (growthRate < -0.1 || changeRate < -0.1) {
    insights.push({
      type: "negative",
      category: "decline",
      title: "⚠️ انخفاض يحتاج انتباه",
      message: `انخفاض بنسبة ${Math.abs(
        (growthRate || changeRate) * 100
      ).toFixed(1)}%. يجب اتخاذ إجراءات تصحيحية.`,
      priority: "critical",
      confidence: 90,
      source: "ai",
      recommendations: [
        "راجع استراتيجية التسويق فوراً",
        "تحقق من رضا العملاء",
        "حلل أسعار المنافسين",
        "قدم عروض خاصة لجذب العملاء",
      ],
      actions: [
        {
          type: "create_action_plan",
          label: "إنشاء خطة إنقاذ",
          url: "/recovery-plan",
        },
      ],
    });
  }

  return insights;
};

/*  analyzeBreakdown – تحليل التركيز والمخاطر 🎯 */
const analyzeBreakdown = async (analytics) => {
  if (!analytics?.data?.breakdown || analytics.data.breakdown.length === 0) {
    return null;
  }

  const insights = [];
  const breakdown = analytics.data.breakdown;

  // ترتيب حسب القيمة
  const sorted = [...breakdown].sort((a, b) => b.value - a.value);

  // المنتج الأكثر مبيعاً
  const topProduct = sorted[0];
  if (topProduct.percentage >= 40) {
    insights.push({
      type: "info",
      category: "concentration",
      title: "🎯 تركيز عالي على منتج واحد",
      message: `${topProduct.label} يمثل ${topProduct.percentage.toFixed(
        1
      )}% من مبيعاتك. هذا تركيز عالي قد يكون مخاطرة.`,
      priority: "medium",
      confidence: 95,
      source: "ai",
      recommendations: [
        "نوّع مصادر الدخل لتقليل المخاطر",
        "طور منتجات إضافية",
        "لا تعتمد بشكل كامل على منتج واحد",
      ],
    });
  }

  // أفضل ثلاث منتجات
  const topThree = sorted.slice(0, 3);
  const topThreePercentage = topThree.reduce((sum, p) => sum + p.percentage, 0);

  insights.push({
    type: "positive",
    category: "performance",
    title: "🏆 المنتجات الأكثر نجاحاً",
    message: `أفضل 3 منتجات (${topThree
      .map((p) => p.label)
      .join(", ")}) تمثل ${topThreePercentage.toFixed(1)}% من إجمالي المبيعات.`,
    priority: "medium",
    confidence: 98,
    source: "ai",
    recommendations: [
      `ركز التسويق على: ${topThree[0].label}`,
      "تأكد من توفر مخزون كافي",
      "قدم عروض bundle للمنتجات الناجحة",
    ],
  });

  // المنتجات ذات الأداء الضعيف
  const weakProducts = sorted.filter((p) => p.percentage < 5);
  if (weakProducts.length > 0) {
    insights.push({
      type: "warning",
      category: "underperformance",
      title: "📉 منتجات تحتاج تحسين",
      message: `${weakProducts.length} منتج يحقق أقل من 5% من المبيعات. فكر في استراتيجية تحسين.`,
      priority: "low",
      confidence: 85,
      source: "ai",
      recommendations: [
        "حلل سبب ضعف الأداء",
        "فكر في خصومات أو عروض",
        "أعد تقييم جدوى هذه المنتجات",
      ],
    });
  }

  return insights;
};

/* analyzeSeasonality – تحليل التوقيت ⏱️ */
const analyzeSeasonality = async (analytics) => {
  if (!analytics?.data?.timeSeries || analytics.data.timeSeries.length < 7) {
    return null;
  }

  const insights = [];
  const timeSeries = analytics.data.timeSeries;

  // اكتشاف الأنماط الأسبوعية
  const byDayOfWeek = {};
  timeSeries.forEach((point) => {
    const date = new Date(point.timestamp);
    const day = date.getDay(); // 0 = Sunday
    if (!byDayOfWeek[day]) byDayOfWeek[day] = [];
    byDayOfWeek[day].push(point.value);
  });

  // حساب المتوسط لكل يوم
  const avgByDay = {};
  Object.keys(byDayOfWeek).forEach((day) => {
    const values = byDayOfWeek[day];
    avgByDay[day] = values.reduce((sum, v) => sum + v, 0) / values.length;
  });

  // إيجاد أفضل وأسوأ يوم
  const days = [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  const dayEntries = Object.entries(avgByDay).map(([day, avg]) => ({
    day: parseInt(day),
    name: days[parseInt(day)],
    avg,
  }));

  const sortedDays = dayEntries.sort((a, b) => b.avg - a.avg);
  const bestDay = sortedDays[0];
  const worstDay = sortedDays[sortedDays.length - 1];

  if (bestDay && worstDay && bestDay.avg > worstDay.avg * 1.2) {
    insights.push({
      type: "info",
      category: "timing",
      title: "📅 نمط أسبوعي واضح",
      message: `${bestDay.name} هو أفضل يوم في الأسبوع (${bestDay.avg.toFixed(
        0
      )} وحدة في المتوسط)، بينما ${worstDay.name} الأضعف.`,
      priority: "medium",
      confidence: 88,
      source: "ai",
      recommendations: [
        `خطط للعروض الخاصة يوم ${bestDay.name}`,
        `زد من الإعلانات قبل ${bestDay.name}`,
        `حسّن الأداء يوم ${worstDay.name} بعروض مميزة`,
      ],
    });
  }

  return insights;
};

/* analyzeRisks – مخاطر الشركة 🚨 */
const analyzeRisks = async (companyId, allAnalytics) => {
  const insights = [];

  // التبعية على مصدر واحد
  const revenue = allAnalytics.find((a) => a.type === "revenue");
  if (revenue?.data?.breakdown) {
    const topSource = revenue.data.breakdown[0];
    if (topSource?.percentage >= 60) {
      insights.push({
        type: "warning",
        category: "risk",
        title: "⚠️ خطر: اعتماد كبير على مصدر واحد",
        message: `${topSource.percentage.toFixed(
          1
        )}% من إيراداتك من مصدر واحد (${topSource.label}). هذا يشكل مخاطرة.`,
        priority: "high",
        confidence: 92,
        source: "ai",
        recommendations: [
          "نوّع مصادر الدخل فوراً",
          "ابحث عن قنوات بيع إضافية",
          "طور منتجات أو خدمات جديدة",
        ],
      });
    }
  }

  // انخفاض المستخدمين النشطين
  const users = allAnalytics.find((a) => a.type === "users");
  if (users?.data?.metrics?.changeRate < -0.15) {
    insights.push({
      type: "negative",
      category: "risk",
      title: "🚨 تحذير: انخفاض حاد في المستخدمين",
      message: `انخفض عدد المستخدمين النشطين بنسبة ${Math.abs(
        users.data.metrics.changeRate * 100
      ).toFixed(1)}%. هذا يتطلب تدخلاً عاجلاً.`,
      priority: "critical",
      confidence: 95,
      source: "ai",
      recommendations: [
        "حلل أسباب المغادرة (Exit Survey)",
        "قدم حوافز للعودة",
        "حسّن تجربة المستخدم",
        "تواصل مع المستخدمين المهمين شخصياً",
      ],
      actions: [
        {
          type: "retention_campaign",
          label: "إطلاق حملة استرجاع",
          url: "/campaigns/retention",
        },
      ],
    });
  }

  return insights;
};

/**
 * اكتشاف الفرص
 */
const discoverOpportunities = async (companyId, allAnalytics) => {
  const insights = [];

  // فرصة: معدل تحويل منخفض
  const conversion = allAnalytics.find((a) => a.type === "conversion");
  if (conversion?.data?.metrics?.average < 3) {
    insights.push({
      type: "info",
      category: "opportunity",
      title: "💡 فرصة: تحسين معدل التحويل",
      message: `معدل التحويل الحالي ${conversion.data.metrics.average.toFixed(
        2
      )}% منخفض. تحسينه سيضاعف إيراداتك.`,
      priority: "high",
      confidence: 88,
      source: "ai",
      recommendations: [
        "حسّن صفحات الهبوط",
        "سهّل عملية الشراء",
        "أضف شهادات العملاء",
        "قدم ضمان استرداد الأموال",
      ],
      actions: [
        {
          type: "cro_guide",
          label: "دليل تحسين التحويل",
          url: "/guides/conversion-optimization",
        },
      ],
    });
  }

  // فرصة: نمو في قطاع معين
  const sales = allAnalytics.find((a) => a.type === "sales");
  if (sales?.data?.breakdown) {
    const growingSegments = sales.data.breakdown
      .filter((b) => b.change && b.change > 20)
      .sort((a, b) => b.change - a.change);

    if (growingSegments.length > 0) {
      const topGrower = growingSegments[0];
      insights.push({
        type: "positive",
        category: "opportunity",
        title: "🚀 فرصة: قطاع سريع النمو",
        message: `${topGrower.label} ينمو بنسبة ${topGrower.change.toFixed(
          1
        )}%! استثمر فيه بقوة.`,
        priority: "high",
        confidence: 93,
        source: "ai",
        recommendations: [
          `زد من التركيز على ${topGrower.label}`,
          "خصص ميزانية تسويق إضافية",
          "وسّع هذا القطاع بمنتجات جديدة",
        ],
      });
    }
  }

  return insights;
};

// ===================================
// Main Generator Function
// ===================================

/**
 * يولد جميع الرؤى الذكية
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
        (insight.category === "risk" ||
          insight.category === "opportunity")
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
