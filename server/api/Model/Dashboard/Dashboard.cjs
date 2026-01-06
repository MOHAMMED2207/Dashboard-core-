// server/api/Model/Dashboard.cjs
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WidgetSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      "kpi",
      "chart",
      "table",
      "map",
      "calendar",
      "progress",
      "list",
      "ai-insights",
      "notifications",
      "custom",
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  config: {
    chartType: String, // line, bar, pie, area, etc.
    dataSource: String, // API endpoint or data key
    refreshInterval: Number, // in seconds
    dateRange: String, // last7days, last30days, custom, etc.
    filters: [
      {
        field: String,
        operator: String,
        value: mongoose.Schema.Types.Mixed,
      },
    ],
    metrics: [String],
    dimensions: [String],
    colors: [String],
    showLegend: { type: Boolean, default: true },
    showGrid: { type: Boolean, default: true },
    showTooltip: { type: Boolean, default: true },
    customSettings: mongoose.Schema.Types.Mixed,
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    w: { type: Number, required: true, default: 4 },
    h: { type: Number, required: true, default: 3 },
  },
  minSize: {
    w: { type: Number, default: 2 },
    h: { type: Number, default: 2 },
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
});

const DashboardSchema = new Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    name: {
      type: String,
      required: true,
      default: "My Dashboard",
    },
    description: String,
    type: {
      type: String,
      enum: ["personal", "shared", "company"],
      default: "personal",
    },
    widgets: [WidgetSchema],
    layout: {
      cols: { type: Number, default: 12 },
      rowHeight: { type: Number, default: 100 },
      breakpoints: {
        lg: { type: Number, default: 1200 },
        md: { type: Number, default: 996 },
        sm: { type: Number, default: 768 },
        xs: { type: Number, default: 480 },
      },
    },
    theme: {
      mode: { type: String, enum: ["light", "dark"], default: "light" },
      primaryColor: { type: String, default: "#3b82f6" },
      backgroundColor: String,
    },
    sharedWith: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "auth",
        },
        permission: {
          type: String,
          enum: ["view", "edit"],
          default: "view",
        },
      },
    ],
    isDefault: {
      type: Boolean,
      default: false,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: [
        "sales",
        "marketing",
        "finance",
        "hr",
        "operations",
        "executive",
        "custom",
      ],
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    lastViewedAt: Date,
  },
  { timestamps: true }
);

// Indexes
DashboardSchema.index({ companyId: 1, userId: 1 });
DashboardSchema.index({ companyId: 1, isDefault: 1 });
DashboardSchema.index({ "sharedWith.userId": 1 });
DashboardSchema.index({ isTemplate: 1 });

// Method to add widget to dashboard ✅
DashboardSchema.methods.addWidget = function (widget) {
  this.widgets.push(widget);
  return this.save();
};

// Method to remove widget from dashboard ✅
DashboardSchema.methods.removeWidget = function (widgetId) {
  this.widgets = this.widgets.filter((w) => w.id !== widgetId);
  return this.save();
};

// Method to update widget in dashboard ✅
DashboardSchema.methods.updateWidget = function (widgetId, updates) {
  const widget = this.widgets.find((w) => w.id === widgetId);
  if (widget) {
    Object.assign(widget, updates);
    return this.save();
  }
  return Promise.resolve(this);
};

// method to check user permissions for a edit or delete task ✅
DashboardSchema.methods.CanDoIt = function (userId, task) {
  if (!userId || !task) return false;

  const isOwner = this.userId.toString() === userId;
  
  const sharedUser = this.sharedWith.find(
    (s) => s.userId.toString() === userId
  );
  const sharedUserCanEdit = sharedUser && sharedUser.permission === "edit";

  if (task === "edit") {
    return isOwner || sharedUserCanEdit;
  }
  return false;
};

module.exports = mongoose.model("Dashboard", DashboardSchema);
