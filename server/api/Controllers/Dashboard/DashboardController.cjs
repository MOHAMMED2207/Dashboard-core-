// server/api/Controllers/DashboardController.cjs
const Dashboard = require("./../../Model/Dashboard/Dashboard.cjs");
const Company = require("../../Model/All Business/Company.cjs");
const ActivityLog = require("../../Model/All Business/ActivityLog.cjs");
const AppError = require("./../../utils/AppError.cjs");

// Create Dashboard
exports.createDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { companyId, name, description, type, category, widgets } = req.body;

    // Verify company membership
    const company = await Company.findById(companyId);
    if (!company || !company.isMember(userId)) {
      return next(new AppError("Access denied", 403));
    }

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
      dashboard,
    });
  } catch (error) {
    next(error);
  }
};

// Get User Dashboards
exports.getUserDashboards = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.query;

    const query = { userId };
    if (companyId) query.companyId = companyId;

    const dashboards = await Dashboard.find(query)
      .sort({ isDefault: -1, lastViewedAt: -1 })
      .lean();

    res.status(200).json({
      dashboards,
      count: dashboards.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get Dashboard by ID
exports.getDashboard = async (req, res, next) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user.id;

    const dashboard = await Dashboard.findById(dashboardId);

    if (!dashboard) {
      return next(new AppError("Dashboard not found", 404));
    }

    // Check access
    const hasAccess =
      dashboard.userId.toString() === userId ||
      dashboard.type === "company" ||
      dashboard.sharedWith.some((s) => s.userId.toString() === userId);

    if (!hasAccess) {
      return next(new AppError("Access denied", 403));
    }

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
    const { dashboardId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const dashboard = await Dashboard.findById(dashboardId);

    if (!dashboard) {
      return next(new AppError("Dashboard not found", 404));
    }

    // Check if user can edit
    const canEdit =
      dashboard.userId.toString() === userId ||
      dashboard.sharedWith.some(
        (s) => s.userId.toString() === userId && s.permission === "edit"
      );

    if (!canEdit) {
      return next(new AppError("You don't have edit permission", 403));
    }

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

// Delete Dashboard
exports.deleteDashboard = async (req, res, next) => {
  try {
    const { dashboardId } = req.params;
    const userId = req.user.id;

    const dashboard = await Dashboard.findById(dashboardId);

    if (!dashboard) {
      return next(new AppError("Dashboard not found", 404));
    }

    // Only owner can delete
    if (dashboard.userId.toString() !== userId) {
      return next(new AppError("Only owner can delete dashboard", 403));
    }

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
    const { dashboardId } = req.params;
    const userId = req.user.id;
    const widget = req.body;

    const dashboard = await Dashboard.findById(dashboardId);

    if (!dashboard) {
      return next(new AppError("Dashboard not found", 404));
    }

    // Check edit permission
    const canEdit =
      dashboard.userId.toString() === userId ||
      dashboard.sharedWith.some(
        (s) => s.userId.toString() === userId && s.permission === "edit"
      );

    if (!canEdit) {
      return next(new AppError("Edit permission required", 403));
    }

    // Generate widget ID if not provided
    if (!widget.id) {
      widget.id = `widget-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
    }

    // Add widget
    await dashboard.addWidget(widget);

    // Log activity
    await ActivityLog.log({
      companyId: dashboard.companyId,
      userId,
      action: "widget.add",
      category: "dashboard",
      details: {
        resource: "widget",
        resourceId: widget.id,
        description: `Added widget: ${widget.title}`,
        metadata: { dashboardId, widgetType: widget.type },
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

// Update Widget
exports.updateWidget = async (req, res, next) => {
  try {
    const { dashboardId, widgetId } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const dashboard = await Dashboard.findById(dashboardId);

    if (!dashboard) {
      return next(new AppError("Dashboard not found", 404));
    }

    // Check edit permission
    const canEdit =
      dashboard.userId.toString() === userId ||
      dashboard.sharedWith.some(
        (s) => s.userId.toString() === userId && s.permission === "edit"
      );

    if (!canEdit) {
      return next(new AppError("Edit permission required", 403));
    }

    // Update widget
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
        metadata: { dashboardId },
      },
    });

    res.status(200).json({
      message: "Widget updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Remove Widget
exports.removeWidget = async (req, res, next) => {
  try {
    const { dashboardId, widgetId } = req.params;
    const userId = req.user.id;

    const dashboard = await Dashboard.findById(dashboardId);

    if (!dashboard) {
      return next(new AppError("Dashboard not found", 404));
    }

    // Check edit permission
    const canEdit =
      dashboard.userId.toString() === userId ||
      dashboard.sharedWith.some(
        (s) => s.userId.toString() === userId && s.permission === "edit"
      );

    if (!canEdit) {
      return next(new AppError("Edit permission required", 403));
    }

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

// Share Dashboard
exports.shareDashboard = async (req, res, next) => {
  try {
    const { dashboardId } = req.params;
    const { userIds, permission } = req.body;
    const userId = req.user.id;

    const dashboard = await Dashboard.findById(dashboardId);

    if (!dashboard) {
      return next(new AppError("Dashboard not found", 404));
    }

    // Only owner can share
    if (dashboard.userId.toString() !== userId) {
      return next(new AppError("Only owner can share dashboard", 403));
    }

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

// Get Dashboard Templates
exports.getTemplates = async (req, res, next) => {
  try {
    const { category } = req.query;

    const query = { isTemplate: true };
    if (category) query.category = category;

    const templates = await Dashboard.find(query)
      .select("name description category widgets preview")
      .lean();

    res.status(200).json({
      templates,
      count: templates.length,
    });
  } catch (error) {
    next(error);
  }
};

// Clone Dashboard from Template
exports.cloneDashboard = async (req, res, next) => {
  try {
    const { dashboardId } = req.params;
    const { companyId, name } = req.body;
    const userId = req.user.id;

    const template = await Dashboard.findById(dashboardId);

    if (!template) {
      return next(new AppError("Template not found", 404));
    }

    // Verify company membership
    const company = await Company.findById(companyId);
    if (!company || !company.isMember(userId)) {
      return next(new AppError("Access denied", 403));
    }

    // Clone dashboard
    const newDashboard = new Dashboard({
      ...template.toObject(),
      _id: undefined,
      companyId,
      userId,
      name: name || `${template.name} (Copy)`,
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
