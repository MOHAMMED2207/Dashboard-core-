// server/api/Controllers/DashboardController.cjs
const Dashboard = require("./../../Model/Dashboard/Dashboard.cjs");
const Company = require("../../Model/All Business/Company.cjs");
const ActivityLog = require("../../Model/All Business/ActivityLog.cjs");
const AppError = require("./../../utils/AppError.cjs");

// Create New Dashboard ✅
exports.createDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { companyId, name, description, type, category, widgets } = req.body;

    // Create dashboard
    const dashboard = await Dashboard.create({
      companyId,
      userId,
      name: name || "My Dashboard",
      description,
      type: type || "personal",
      category,
      widgets: widgets || [],
    });

    // Log activity
    await ActivityLog.log({
      companyId,
      userId,
      action: "dashboard.create",
      category: "dashboard",
      details: {
        resource: "dashboard",
        resourceId: dashboard._id,
        description: `Created dashboard: ${dashboard.name}`,
      },
    });

    res.status(201).json({
      message: "Dashboard created successfully",
      // dashboard,
    });
  } catch (error) {
    next(error);
  }
};

// Get All User Dashboards ✅
exports.getUserDashboards = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.query;
    const query = { userId };

    if (companyId) query.companyId = companyId;
    const dashboards = await Dashboard.find({
      $or: [{ userId }, { "sharedWith.userId": userId }],
    })
      .sort({ isDefault: -1, lastViewedAt: -1 })
      .lean()
      .skip(0)
      .limit(100);

    res.status(200).json({
      dashboards,
      count: dashboards.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get Dashboard by ID ✅
exports.getDashboard = async (req, res, next) => {
  try {
    const dashboard = req.dashboard; // جاية من middleware
    const userId = req.user.id;

    // Update view count and last viewed
    dashboard.viewCount += 1;
    dashboard.lastViewedAt = new Date();
    await dashboard.save();

    // Log activity
    await ActivityLog.log({
      companyId: dashboard.companyId,
      userId,
      action: "dashboard.view",
      category: "dashboard",
      details: {
        resource: "dashboard",
        resourceId: dashboard._id,
        description: `Viewed dashboard: ${dashboard.name}`,
      },
    });

    res.status(200).json(dashboard);
  } catch (error) {
    next(error);
  }
};

// Update Dashboard
exports.updateDashboard = async (req, res, next) => {
  try {
    const dashboard = req.dashboard;
    const userId = req.user.id;
    const updates = req.body;

    // Update allowed fields
    const allowedFields = [
      "name",
      "description",
      "widgets",
      "layout",
      "theme",
      "isDefault",
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        dashboard[field] = updates[field];
      }
    });

    await dashboard.save();

    // Log activity
    await ActivityLog.log({
      companyId: dashboard.companyId,
      userId,
      action: "dashboard.update",
      category: "dashboard",
      details: {
        resource: "dashboard",
        resourceId: dashboard._id,
        description: `Updated dashboard: ${dashboard.name}`,
      },
    });

    res.status(200).json({
      message: "Dashboard updated successfully",
      dashboard,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Dashboard ✅
exports.deleteDashboard = async (req, res, next) => {
  try {
    const dashboard = req.dashboard;
    const userId = req.user.id;

    // Delete dashboard
    await dashboard.deleteOne();

    // Log activity
    await ActivityLog.log({
      companyId: dashboard.companyId,
      userId,
      action: "dashboard.delete",
      category: "dashboard",
      details: {
        resource: "dashboard",
        resourceId: dashboard._id,
        description: `Deleted dashboard: ${dashboard.name}`,
      },
    });

    res.status(200).json({
      message: "Dashboard deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Add Widget to Dashboard
exports.addWidget = async (req, res, next) => {
  try {
    const dashboard = req.dashboard; // Middleware verified access
    const userId = req.user.id;
    const widget = req.body;

    if (!widget.id) {
      widget.id = `widget-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    }

    await dashboard.addWidget(widget);

    await ActivityLog.log({
      companyId: dashboard.companyId,
      userId,
      action: "widget.add",
      category: "dashboard",
      details: {
        resource: "widget",
        resourceId: widget.id,
        description: `Added widget: ${widget.title}`,
        metadata: { dashboardId: dashboard._id, widgetType: widget.type },
      },
    });

    res.status(200).json({
      message: "Widget added successfully",
      widget,
    });
  } catch (error) {
    next(error);
  }
};

// get all Widgets ✅
exports.getWidgets = async (req, res, next) => {
  try {
    const dashboard = req.dashboard;
    const userId = req.user.id;

    res.status(200).json({
      name: dashboard.name,
      widget: dashboard.widgets || [],
      count: dashboard.widgets.length || 0,
    });
  } catch (error) {
    next(error);
  }
};

// Update Widget ✅
exports.updateWidget = async (req, res, next) => {
  try {
    const { widgetId } = req.params;
    const userId = req.user.id;
    const updates = req.body;
    const dashboard = req.dashboard;

    // Update widget // تحديث الودجت
    await dashboard.updateWidget(widgetId, updates);

    // Log activity
    await ActivityLog.log({
      companyId: dashboard.companyId,
      userId,
      action: "widget.update",
      category: "dashboard",
      details: {
        resource: "widget",
        resourceId: widgetId,
        description: "Updated widget",
        metadata: { dashboardId: dashboard._id },
      },
    });

    res.status(200).json({
      message: "Widget updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Remove Widget from Dashboard ✅
exports.removeWidget = async (req, res, next) => {
  try {
    const dashboard = req.dashboard;
    const { widgetId } = req.params;
    const userId = req.user.id;

    // Remove widget
    await dashboard.removeWidget(widgetId);

    // Log activity
    await ActivityLog.log({
      companyId: dashboard.companyId,
      userId,
      action: "widget.remove",
      category: "dashboard",
      details: {
        resource: "widget",
        resourceId: widgetId,
        description: "Removed widget",
        metadata: { dashboardId },
      },
    });

    res.status(200).json({
      message: "Widget removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Share Dashboard with Users ✅
exports.shareDashboard = async (req, res, next) => {
  try {
    const dashboard = req.dashboard;
    const { userIds, permission } = req.body;

    // Add users to sharedWith
    userIds.forEach((uid) => {
      const alreadyShared = dashboard.sharedWith.find(
        (s) => s.userId.toString() === uid
      );
      if (!alreadyShared) {
        dashboard.sharedWith.push({
          userId: uid,
          permission: permission || "view",
        });
      }
    });

    await dashboard.save();

    res.status(200).json({
      message: "Dashboard shared successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get Dashboard Templates ✅ // use query { category = optional }
exports.getTemplates = async (req, res, next) => {
  // query { category = optional } // تصفية حسب الفئة
  try {
    const { category } = req.query;

    const query = { isTemplate: true }; // جلب القوالب فقط
    if (category) query.category = category; // تصفية حسب الفئة إذا تم توفيرها

    // get templates with selected fields only for performance
    const templates = await Dashboard.find(query)
      .select("name description category widgets preview")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      templates,
      count: templates.length,
    });
  } catch (error) {
    next(error);
  }
};

// create new (clone) of existing dashboard ✅
exports.cloneDashboard = async (req, res, next) => {
  try {
    const dashboard = req.dashboard;
    const { companyId, name } = req.body;
    const userId = req.user.id;

    // Clone dashboard
    const newDashboard = new Dashboard({
      ...dashboard.toObject(),
      _id: undefined,
      companyId,
      userId,
      name: name || `${dashboard.name} (Copy)`,
      isTemplate: false,
      isDefault: false,
      viewCount: 0,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await newDashboard.save();

    res.status(201).json({
      message: "Dashboard cloned successfully",
      dashboard: newDashboard,
    });
  } catch (error) {
    next(error);
  }
};
