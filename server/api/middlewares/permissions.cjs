// server/api/middlewares/permissions.cjs
const Company = require("../Model/All Business/Company.cjs");
const AppError = require("../utils/AppError.cjs");

// Permission definitions by role
const PERMISSIONS = {
  owner: [
    "*", // All permissions
  ],
  admin: [
    "company.read",
    "company.update",
    "company.members.add",
    "company.members.remove",
    "dashboard.create",
    "dashboard.read",
    "dashboard.update",
    "dashboard.delete",
    "analytics.read",
    "analytics.create",
    "report.create",
    "report.read",
    "report.update",
    "report.delete",
    "settings.update",
  ],
  manager: [
    "company.read",
    "dashboard.create",
    "dashboard.read",
    "dashboard.update",
    "analytics.read",
    "report.create",
    "report.read",
    "report.update",
  ],
  employee: [
    "company.read",
    "dashboard.create",
    "dashboard.read",
    "dashboard.update.own",
    "analytics.read",
    "report.read",
  ],
  viewer: ["company.read", "dashboard.read", "analytics.read", "report.read"],
};

// Check if user has permission
exports.hasPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { companyId } = req.params;

      if (!companyId) {
        return next(new AppError("Company ID is required", 400));
      }

      // Get company and check membership
      const company = await Company.findById(companyId);

      if (!company) {
        return next(new AppError("Company not found", 404));
      }

      if (!company.isMember(userId)) {
        return next(new AppError("You are not a member of this company", 403));
      }

      // Get user role
      const userRole = company.getUserRole(userId);
      const userPermissions = PERMISSIONS[userRole] || [];

      // Check if user has the required permission
      const hasAccess =
        userPermissions.includes("*") ||
        userPermissions.includes(requiredPermission);

      if (!hasAccess) {
        return next(
          new AppError(
            `You don't have permission to perform this action. Required: ${requiredPermission}`,
            403
          )
        );
      }

      // Store role in request for later use
      req.userRole = userRole;
      req.company = company;

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has any of the specified permissions
exports.hasAnyPermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { companyId } = req.params;

      if (!companyId) {
        return next(new AppError("Company ID is required", 400));
      }

      const company = await Company.findById(companyId);

      if (!company) {
        return next(new AppError("Company not found", 404));
      }

      if (!company.isMember(userId)) {
        return next(new AppError("You are not a member of this company", 403));
      }

      const userRole = company.getUserRole(userId);
      const userPermissions = PERMISSIONS[userRole] || [];

      // Check if user has any of the required permissions
      const hasAccess =
        userPermissions.includes("*") ||
        requiredPermissions.some((perm) => userPermissions.includes(perm));

      if (!hasAccess) {
        return next(
          new AppError(
            `You don't have permission to perform this action. Required one of: ${requiredPermissions.join(
              ", "
            )}`,
            403
          )
        );
      }

      req.userRole = userRole;
      req.company = company;

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user has all specified permissions
exports.hasAllPermissions = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { companyId } = req.params;

      if (!companyId) {
        return next(new AppError("Company ID is required", 400));
      }

      const company = await Company.findById(companyId);

      if (!company) {
        return next(new AppError("Company not found", 404));
      }

      if (!company.isMember(userId)) {
        return next(new AppError("You are not a member of this company", 403));
      }

      const userRole = company.getUserRole(userId);
      const userPermissions = PERMISSIONS[userRole] || [];

      // Check if user has all required permissions
      const hasAccess =
        userPermissions.includes("*") ||
        requiredPermissions.every((perm) => userPermissions.includes(perm));

      if (!hasAccess) {
        return next(
          new AppError(
            `You don't have all required permissions. Required: ${requiredPermissions.join(
              ", "
            )}`,
            403
          )
        );
      }

      req.userRole = userRole;
      req.company = company;

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user is owner or admin
exports.isOwnerOrAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.params;

    if (!companyId) {
      return next(new AppError("Company ID is required", 400));
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const userRole = company.getUserRole(userId);

    if (!["owner", "admin"].includes(userRole)) {
      return next(new AppError("Owner or Admin access required", 403));
    }

    req.userRole = userRole;
    req.company = company;

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is owner
exports.isOwner = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.params;

    if (!companyId) {
      return next(new AppError("Company ID is required", 400));
    }

    const company = await Company.findById(companyId);

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const userRole = company.getUserRole(userId);

    if (userRole !== "owner") {
      return next(new AppError("Owner access required", 403));
    }

    req.userRole = userRole;
    req.company = company;

    next();
  } catch (error) {
    next(error);
  }
};

// Check subscription status
exports.checkSubscription = (requiredPlan) => {
  return async (req, res, next) => {
    try {
      const { companyId } = req.params;

      const company = await Company.findById(companyId);

      if (!company) {
        return next(new AppError("Company not found", 404));
      }

      // Check if subscription is active
      if (!company.isSubscriptionActive) {
        return next(
          new AppError(
            "Your subscription has expired. Please renew to continue.",
            403
          )
        );
      }

      // Check plan level
      const planLevels = { free: 1, pro: 2, enterprise: 3 };
      const userPlanLevel = planLevels[company.subscription] || 0;
      const requiredPlanLevel = planLevels[requiredPlan] || 0;

      if (userPlanLevel < requiredPlanLevel) {
        return next(
          new AppError(
            `This feature requires ${requiredPlan} plan or higher`,
            403
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = exports;