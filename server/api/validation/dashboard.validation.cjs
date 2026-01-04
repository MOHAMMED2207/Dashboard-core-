// server/api/validation/dashboard.validation.cjs
const { z } = require("zod");

// Company Schemas
exports.createCompanySchema = z.object({
  name: z.string().min(2, "Company name is too short"),
  industry: z.enum([
    "Technology",
    "Healthcare",
    "Finance",
    "Retail",
    "Manufacturing",
    "Education",
    "Real Estate",
    "Other",
  ]),
  size: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]),
  email: z.string().email("Invalid email format"),
  website: z.string().url().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
});

exports.updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  industry: z
    .enum([
      "Technology",
      "Healthcare",
      "Finance",
      "Retail",
      "Manufacturing",
      "Education",
      "Real Estate",
      "Other",
    ])
    .optional(),
  size: z
    .enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"])
    .optional(),
  website: z.string().url().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  logo: z.string().optional(),
  settings: z.object({}).passthrough().optional(),
});

exports.addMemberSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z
    .enum(["owner", "admin", "manager", "employee", "viewer"])
    .default("employee"),
  permissions: z.array(z.string()).optional(),
});

// Dashboard Schemas
exports.createDashboardSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  name: z.string().min(1, "Dashboard name is required").optional(),
  description: z.string().optional(),
  type: z.enum(["personal", "shared", "company"]).default("personal"),
  category: z
    .enum([
      "sales",
      "marketing",
      "finance",
      "hr",
      "operations",
      "executive",
      "custom",
    ])
    .optional(),
  widgets: z.array(z.object({}).passthrough()).optional(),
});

exports.updateDashboardSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  widgets: z.array(z.object({}).passthrough()).optional(),
  layout: z.object({}).passthrough().optional(),
  theme: z.object({}).passthrough().optional(),
  isDefault: z.boolean().optional(),
});

// Widget Schemas
exports.widgetSchema = z.object({
  id: z.string().optional(),
  type: z.enum([
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
  ]),
  title: z.string().min(1, "Widget title is required"),
  config: z
    .object({
      chartType: z.string().optional(),
      dataSource: z.string().optional(),
      refreshInterval: z.number().optional(),
      dateRange: z.string().optional(),
      filters: z.array(z.object({}).passthrough()).optional(),
      metrics: z.array(z.string()).optional(),
      dimensions: z.array(z.string()).optional(),
      colors: z.array(z.string()).optional(),
      showLegend: z.boolean().optional(),
      showGrid: z.boolean().optional(),
      showTooltip: z.boolean().optional(),
    })
    .optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number().default(4),
    h: z.number().default(3),
  }),
  minSize: z
    .object({
      w: z.number().default(2),
      h: z.number().default(2),
    })
    .optional(),
  isVisible: z.boolean().default(true),
});

// Analytics Schemas
exports.createAnalyticsSchema = z.object({
  type: z
    .enum([
      "sales",
      "revenue",
      "users",
      "traffic",
      "conversion",
      "performance",
      "engagement",
      "custom",
    ])
    .optional(),
  category: z
    .enum(["daily", "weekly", "monthly", "quarterly", "yearly", "realtime"])
    .optional(),
  period: z
    .object({
      start: z.string().or(z.date()),
      end: z.string().or(z.date()),
    })
    .optional(),
  data: z.object({}).passthrough(),
});

// Share Dashboard Schema
exports.shareDashboardSchema = z.object({
  userIds: z.array(z.string()).min(1, "At least one user ID is required"),
  permission: z.enum(["view", "edit"]).default("view"),
});

// Clone Dashboard Schema
exports.cloneDashboardSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  name: z.string().optional(),
});