// server/api/Model/Report.cjs
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReportSchema = new Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      enum: [
        "sales",
        "financial",
        "performance",
        "marketing",
        "operational",
        "executive",
        "custom",
      ],
      required: true,
    },
    format: {
      type: String,
      enum: ["pdf", "excel", "csv", "json", "html"],
      default: "pdf",
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    frequency: {
      type: String,
      enum: ["once", "daily", "weekly", "monthly", "quarterly", "yearly"],
      default: "once",
    },
    schedule: {
      enabled: { type: Boolean, default: false },
      nextRun: Date,
      lastRun: Date,
      timezone: String,
      recipients: [String], // email addresses
    },
    data: {
      summary: {
        keyMetrics: [
          {
            name: String,
            value: mongoose.Schema.Types.Mixed,
            change: Number,
            trend: String,
          },
        ],
        overview: String,
        highlights: [String],
      },
      sections: [
        {
          title: String,
          type: String, // chart, table, text, image
          content: mongoose.Schema.Types.Mixed,
          order: Number,
        },
      ],
      charts: [
        {
          id: String,
          title: String,
          type: String,
          data: mongoose.Schema.Types.Mixed,
        },
      ],
      tables: [
        {
          id: String,
          title: String,
          headers: [String],
          rows: [[mongoose.Schema.Types.Mixed]],
        },
      ],
      rawData: mongoose.Schema.Types.Mixed,
    },
    aiSummary: {
      executive: String, // Executive summary
      detailed: String, // Detailed analysis
      keyFindings: [String],
      trends: [
        {
          type: String,
          description: String,
          impact: String,
        },
      ],
      generatedAt: Date,
      confidence: Number,
    },
    recommendations: [
      {
        title: String,
        description: String,
        priority: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
        },
        category: String,
        impact: String,
        effort: String,
        expectedOutcome: String,
        actionItems: [String],
        relatedMetrics: [String],
      },
    ],
    filters: {
      departments: [String],
      teams: [String],
      products: [String],
      regions: [String],
      custom: mongoose.Schema.Types.Mixed,
    },
    visualization: {
      theme: String,
      layout: String,
      colors: [String],
    },
    metadata: {
      fileSize: Number,
      pageCount: Number,
      version: { type: Number, default: 1 },
      tags: [String],
      category: String,
    },
    file: {
      url: String,
      cloudinaryId: String,
      fileName: String,
      fileType: String,
    },
    status: {
      type: String,
      enum: ["draft", "processing", "completed", "failed", "archived"],
      default: "draft",
    },
    access: {
      visibility: {
        type: String,
        enum: ["private", "team", "company", "public"],
        default: "private",
      },
      sharedWith: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "auth",
          },
          permission: {
            type: String,
            enum: ["view", "edit", "download"],
            default: "view",
          },
          sharedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      password: String, // For password protected reports
    },
    analytics: {
      views: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      lastViewedAt: Date,
      lastDownloadedAt: Date,
      viewedBy: [
        {
          userId: mongoose.Schema.Types.ObjectId,
          viewedAt: Date,
          duration: Number, // seconds
        },
      ],
    },
    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "auth",
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        replies: [
          {
            userId: mongoose.Schema.Types.ObjectId,
            text: String,
            createdAt: Date,
          },
        ],
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: Date,
    expiresAt: Date, // For temporary reports
  },
  { timestamps: true }
);

// Indexes
ReportSchema.index({ companyId: 1, type: 1 });
ReportSchema.index({ generatedBy: 1 });
ReportSchema.index({ "period.start": 1, "period.end": 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ "access.sharedWith.userId": 1 });

// Virtual for checking if report is expired
ReportSchema.virtual("isExpired").get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

// Method to increment view count
ReportSchema.methods.recordView = function (userId) {
  this.analytics.views += 1;
  this.analytics.lastViewedAt = new Date();
  this.analytics.viewedBy.push({
    userId,
    viewedAt: new Date(),
  });
  return this.save();
};

// Method to increment download count
ReportSchema.methods.recordDownload = function () {
  this.analytics.downloads += 1;
  this.analytics.lastDownloadedAt = new Date();
  return this.save();
};

// Static method to get popular reports
ReportSchema.statics.getPopular = async function (companyId, limit = 5) {
  return this.find({
    companyId,
    status: "completed",
    isArchived: false,
  })
    .sort({ "analytics.views": -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model("Report", ReportSchema);