// server/api/Model/Analytics.cjs
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AnalyticsSchema = new Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "sales", //عدد الطلبات
        "revenue", // الفلوس
        "users", // المستخدمين
        "traffic", // الزيارات
        "conversion", // مين الي زار => هل اشتري
        "performance",
        "engagement",
        "custom",
      ],
      required: true,
      index: true,
    },
    // ظظمستوى التجميع (Aggregation Level)
    category: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly", "yearly", "realtime"],
      required: true,
    },
    // الفترة اللي البيانات اتحللت عليها
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    data: {
      // Flexible data structure
      // دي الأرقام العليا (KPIs)
      metrics: {
        total: Number,
        average: Number,
        min: Number,
        max: Number,
        growth: Number,
        growthRate: Number,
        change: Number,
        changeRate: Number,
        custom: mongoose.Schema.Types.Mixed,
      },
      breakdown: [
        {
          label: String,
          value: Number,
          percentage: Number,
          change: Number,
        },
      ],
      // ده اللي بيرسم Charts // كل يوم وقيمته
      timeSeries: [
        {
          timestamp: Date,
          value: Number,
          metadata: mongoose.Schema.Types.Mixed,
        },
      ],
      segments: [
        {
          name: String,
          count: Number,
          value: Number,
          percentage: Number,
        },
      ],
      // مقارنة فترة بفترة
      // الشهر ده vs اللي فات
      //  “هل الأداء اتحسن ولا ساء؟”
      comparison: {
        previous: Number,
        current: Number,
        difference: Number,
        differenceRate: Number,
      },
    },
    // هنا بيعرفك المبياعات (قلت) و نسبتها اي (20%)
    insights: [
      {
        type: {
          type: String,
          enum: ["positive", "negative", "neutral", "warning", "info"],
        },
        category: String,
        title: String,
        message: String,
        priority: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
        confidence: Number, // 0-100
        source: {
          type: String,
          enum: ["ai", "rule", "manual"],
          default: "ai",
        },
        recommendations: [String],
        createdAt: {
          type: Date,
          default: Date.now,
        },
        viewedBy: [
          {
            userId: mongoose.Schema.Types.ObjectId,
            viewedAt: Date,
          },
        ],
        actions: [
          {
            type: String,
            label: String,
            url: String,
          },
        ],
      },
    ],
    // المتوقع الشهر الجاي: 15k // confidence: 82%
    predictions: {
      nextPeriod: {
        value: Number,
        confidence: Number,
        range: {
          min: Number,
          max: Number,
        },
      },
      trend: {
        type: String,
        enum: ["up", "down", "stable", "volatile"],
      },
      factors: [
        {
          name: String,
          impact: Number, // -100 to 100
          description: String,
        },
      ],
    },
    // فجأة المبيعات نزلت 70% في ساعة
    anomalies: [
      {
        timestamp: Date,
        value: Number,
        expectedValue: Number,
        deviation: Number,
        severity: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        description: String,
        possibleCauses: [String],
      },
    ],
    metadata: {
      source: String,
      processedBy: String,
      processingTime: Number, // milliseconds
      version: String,
      tags: [String],
    },
    status: {
      type: String,
      enum: ["processing", "completed", "failed", "archived"],
      default: "completed",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound indexes for better query performance
AnalyticsSchema.index({ companyId: 1, type: 1, category: 1 });
AnalyticsSchema.index({ companyId: 1, "period.start": 1, "period.end": 1 });
AnalyticsSchema.index({ createdAt: -1 });
AnalyticsSchema.index({ status: 1 });

// Method to add insight
AnalyticsSchema.methods.addInsight = function (insight) {
  this.insights.push(insight);
  return this.save();
};

// Method to get unviewed insights
AnalyticsSchema.methods.getUnviewedInsights = function (userId) {
  return this.insights.filter(
    (insight) =>
      !insight.viewedBy.some(
        (view) => view.userId.toString() === userId.toString()
      )
  );
};

// Static method to get analytics summary
AnalyticsSchema.statics.getSummary = async function (companyId, type, days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    companyId,
    type,
    "period.start": { $gte: startDate },
    status: "completed",
  })
    .sort({ "period.start": 1 })
    .lean();
};

module.exports = mongoose.model("Analytics", AnalyticsSchema);
