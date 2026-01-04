// server/api/Model/ActivityLog.cjs
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
    action: {
      type: String,
      enum: [
        // User actions
        "user.login",
        "user.logout",
        "user.register",
        "user.update",
        "user.delete",
        // Company actions
        "company.create",
        "company.update",
        "company.delete",
        "company.member.add",
        "company.member.remove",
        // Dashboard actions
        "dashboard.create",
        "dashboard.update",
        "dashboard.delete",
        "dashboard.view",
        "widget.add",
        "widget.update",
        "widget.remove",
        // Report actions
        "report.create",
        "report.update",
        "report.delete",
        "report.view",
        "report.download",
        "report.share",
        // Analytics actions
        "analytics.view",
        "analytics.export",
        // Settings actions
        "settings.update",
        "settings.view",
        // Other
        "custom",
      ],
      required: true,
    },
    category: {
      type: String,
      enum: [
        "authentication",
        "user",
        "company",
        "dashboard",
        "report",
        "analytics",
        "settings",
        "security",
        "system",
      ],
      required: true,
    },
    details: {
      resource: String, // e.g., "dashboard", "report", "user"
      resourceId: mongoose.Schema.Types.ObjectId,
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
      type: String,
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

// Compound indexes
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
    await log.save();
    return log;
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
ActivityLogSchema.statics.getUserActivity = async function (
  userId,
  days = 30
) {
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
        companyId: mongoose.Types.ObjectId(companyId),
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

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);