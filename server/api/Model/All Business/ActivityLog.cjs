// server/api/Model/ActivityLog.cjs
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Enum for Activity Categories
 */
const ACTIVITY_CATEGORIES = {
  AUTH: "authentication",
  USER: "user",
  COMPANY: "company",
  DASHBOARD: "dashboard",
  REPORT: "report",
  ANALYTICS: "analytics",
  SETTINGS: "settings",
  SECURITY: "security",
  SYSTEM: "system",
};

/**
 * Enum for Activity Actions
 */
const ACTIVITY_ACTIONS = {
  // User actions
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",
  USER_REGISTER: "user.register",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",
  // Company actions
  COMPANY_CREATE: "company.create",
  COMPANY_UPDATE: "company.update",
  COMPANY_DELETE: "company.delete",
  COMPANY_MEMBER_ADD: "company.member.add",
  COMPANY_MEMBER_REMOVE: "company.member.remove",
  // Dashboard actions
  DASHBOARD_CREATE: "dashboard.create",
  DASHBOARD_UPDATE: "dashboard.update",
  DASHBOARD_DELETE: "dashboard.delete",
  DASHBOARD_VIEW: "dashboard.view",
  WIDGET_ADD: "widget.add",
  WIDGET_UPDATE: "widget.update",
  WIDGET_REMOVE: "widget.remove",
  // Report actions
  REPORT_CREATE: "report.create",
  REPORT_UPDATE: "report.update",
  REPORT_DELETE: "report.delete",
  REPORT_VIEW: "report.view",
  REPORT_DOWNLOAD: "report.download",
  REPORT_SHARE: "report.share",
  // Analytics actions
  ANALYTICS_VIEW: "analytics.view",
  ANALYTICS_CREATE: "analytics.create",
  ANALYTICS_EXPORT: "analytics.export",
  // Settings actions
  SETTINGS_UPDATE: "settings.update",
  SETTINGS_VIEW: "settings.view",
  // Other
  CUSTOM: "custom",
};

const ActivityLogSchema = new Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
      index: true,
    },
    // action: إيه اللي حصل
    action: {
      type: String,
      enum: Object.values(ACTIVITY_ACTIONS),
      required: true,
    },
    // category: حصل في أنهي جزء من السيستم
    category: {
      type: String,
      enum: Object.values(ACTIVITY_CATEGORIES),
      required: true,
    },
    details: {
      resource: String, // e.g., "dashboard", "report", "user"
      resourceId: String, // <-- غيرنا ObjectId لـ String
      description: String,
      changes: {
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed,
      },
      metadata: mongoose.Schema.Types.Mixed,
    },

    result: {
      type: String,
      enum: ["success", "failure", "pending"],
      default: "success",
    },
    errorMessage: String,
    ipAddress: String,
    userAgent: String,
    device: {
      deviceType: String, // Renamed from 'type' to avoid confusion with Mongoose 'type' keyword
      browser: String,
      os: String,
    },
    location: {
      country: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    duration: Number, // in milliseconds
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound indexes for optimized querying
ActivityLogSchema.index({ companyId: 1, createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ category: 1, createdAt: -1 });
ActivityLogSchema.index({ severity: 1, createdAt: -1 });

// TTL index - automatically delete logs older than 90 days
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Static method to log activity
ActivityLogSchema.statics.log = async function (data) {
  try {
    const log = new this(data);
    return await log.save();
  } catch (error) {
    console.error("Failed to log activity:", error);
    return null;
  }
};

// Static method to get recent activities
ActivityLogSchema.statics.getRecent = async function (
  companyId,
  limit = 50,
  filters = {}
) {
  const query = { companyId, ...filters };

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "username fullname ProfileImg")
    .lean();
};

// Static method to get user activity
ActivityLogSchema.statics.getUserActivity = async function (userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    userId,
    createdAt: { $gte: startDate },
  })
    .sort({ createdAt: -1 })
    .lean();
};

// Static method to get activity stats
ActivityLogSchema.statics.getStats = async function (companyId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        companyId: new mongoose.Types.ObjectId(companyId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ["$result", "success"] }, 1, 0] },
        },
        failureCount: {
          $sum: { $cond: [{ $eq: ["$result", "failure"] }, 1, 0] },
        },
      },
    },
  ]);

  return stats;
};

const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);
ActivityLog.CATEGORIES = ACTIVITY_CATEGORIES;
ActivityLog.ACTIONS = ACTIVITY_ACTIONS;

module.exports = ActivityLog;
