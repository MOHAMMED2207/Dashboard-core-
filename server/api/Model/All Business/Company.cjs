// server/api/Model/Company.cjs
const Dashboard = require("./../../Model/Dashboard/Dashboard.cjs");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CompanySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    industry: {
      type: String,
      // this is a predefined list of industries
      enum: [
        "Technology",
        "Healthcare",
        "Finance",
        "Retail",
        "Manufacturing",
        "Education",
        "Real Estate",
        "Other",
      ],
      required: true,
    },
    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
      required: true,
    },

    subscription: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    subscriptionExpiry: {
      type: Date,
      default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    logo: String,
    website: String,
    country: String,
    city: String,
    address: String,
    phone: String,
    email: {
      type: String,
      required: true,
      unique: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    settings: {
      currency: { type: String, default: "USD" },
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
      dateFormat: { type: String, default: "DD/MM/YYYY" },
      fiscalYearStart: { type: Number, default: 1 }, // 1 = January
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      aiFeatures: {
        predictiveAnalytics: { type: Boolean, default: false },
        anomalyDetection: { type: Boolean, default: false },
        smartRecommendations: { type: Boolean, default: false },
        autoReports: { type: Boolean, default: false },
      },
    },
    // payment and billing info
    billing: {
      plan: String,
      amount: Number,
      billingCycle: { type: String, enum: ["monthly", "yearly"] },
      nextBillingDate: Date,
      paymentMethod: String,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "auth",
        },
        username: {
          type: String,
          ref: "auth",
        },
        email: {
          type: String,
          ref: "auth",
        },
        role: {
          type: String,
          enum: ["owner", "admin", "manager", "employee", "viewer"],
          default: "employee",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        permissions: [String],
      },
    ],
    statistics: {
      totalUsers: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      activeProjects: { type: Number, default: 0 },
      completedTasks: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verifiedAt: Date,
  },
  { timestamps: true }
);

// Indexes for better performance
CompanySchema.index({ owner: 1 });
CompanySchema.index({ email: 1 });
CompanySchema.index({ "members.userId": 1 });
CompanySchema.index({ createdAt: -1 });

// check if subscription is active or not ✅
CompanySchema.virtual("isSubscriptionActive").get(function () {
  return this.subscriptionExpiry > new Date();
});

// Method to check if user is member of company ✅
CompanySchema.methods.isMember = function (userId) {
  return this.members.some((member) => {
    const memberId = member.userId._id
      ? member.userId._id.toString()
      : member.userId.toString();
    return memberId === userId.toString();
  });
};

// Method to get user role in company ✅
CompanySchema.methods.getUserRole = function (userId) {
  const member = this.members.find(
    (m) => m.userId.toString() === userId.toString()
  );
  return member ? member.role : null;
};

// Method to check if company can create more dashboards based on subscription plan ✅
const DASHBOARD_LIMITS = {
  free: 5,
  pro: 50,
  enterprise: Infinity,
};

// Method to check if company can create more dashboards based on subscription plan  ✅
CompanySchema.methods.canCreateDashboard = async function () {
  if (!this.isSubscriptionActive) return false;

  const limit = DASHBOARD_LIMITS[this.subscription] ?? 0;
  if (limit === Infinity) return true;

  const count = await Dashboard.countDocuments({
    companyId: this._id,
  });

  return count < limit;
};

module.exports = mongoose.model("Company", CompanySchema);
