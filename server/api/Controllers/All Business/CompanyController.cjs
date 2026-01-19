// server/api/Controllers/CompanyController.cjs
const Company = require("../../Model/All Business/Company.cjs");
const User = require("../../Model/Auth+User/Auth.cjs");
const ActivityLog = require("../../Model/All Business/ActivityLog.cjs");
const AppError = require("../../utils/AppError.cjs");
const Dashboard = require("../../Model/Dashboard/Dashboard.cjs");
const Report = require("../../Model/Report.cjs");
const Analytics = require("../../Model/All Business/Analytics.cjs");
const { v2: cloudinary } = require("cloudinary");
const { formatTimeSince } = require("../../helpers/formatTimeSince.cjs");

// Create Company ✅
exports.createCompany = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, industry, size, email, website, country, city, phone } =
      req.body;

    const newUser = await User.findById(userId);

    if (!newUser) {
      return next(new AppError("User not found", 404));
    }

    // Check if user already owns a company
    const existingCompany = await Company.findOne({ owner: newUser._id });
    if (existingCompany) {
      return next(
        new AppError("You already own a company. Please contact support.", 400)
      );
    }

    // Check if email is already used
    const emailExists = await Company.findOne({ email });
    if (emailExists) {
      return next(new AppError("Company email already registered", 400));
    }

    // Create company
    const company = await Company.create({
      name,
      industry,
      size,
      email,
      website,
      country,
      city,
      phone,
      owner: newUser._id,
      members: [
        {
          userId: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: "owner",
          permissions: ["*"], // Full permissions
        },
      ],
    });

    // Log activity
    await ActivityLog.log({
      companyId: company._id,
      userId,
      action: "company.create",
      category: "company",
      details: {
        resource: "company",
        resourceId: company._id,
        description: `Created company: ${name}`,
      },
    });

    return res.status(201).json({
      message: "Company created successfully",
      company,
    });
  } catch (error) {
    next(error);
  }
};

// Get Company Details ✅
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.company._id).populate(
      "members.userId",
      "username fullname email ProfileImg"
    );

    res.status(200).json(company);
  } catch (error) {
    next(error);
  }
};

// Update Company ✅
exports.updateCompany = async (req, res, next) => {
  try {
    const company = req.company;
    const userId = req.user.id;
    const updates = req.body;

    // Handle logo upload // cloudinary
    if (updates.logo) {
      try {
        if (company.logo) {
          const publicId = company.logo.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }
        const upload = await cloudinary.uploader.upload(updates.logo);
        company.logo = upload.secure_url;
      } catch (error) {
        console.error("Logo upload failed:", error);
      }
    }

    const allowedFields = [
      "name",
      "industry",
      "size",
      "website",
      "country",
      "city",
      "address",
      "phone",
      "settings",
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        company[field] = updates[field];
      }
    });

    await company.save();

    // Log activity
    await ActivityLog.log({
      companyId: company._id,
      userId,
      action: "company.update",
      category: "company",
      details: {
        resource: "company",
        resourceId: company._id,
        description: "Updated company information",
      },
    });

    res.status(200).json({
      message: "Company updated successfully",
      company,
    });
  } catch (error) {
    next(error);
  }
};

// get Member to Company ✅
// GET /api/company/:id/members?page=&pageSize=&filter=

exports.getMember = async (req, res, next) => {
  try {
    const companyId = req.params.companyId;
    const page = parseInt(req.query.page) || 0;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const filter = req.query.filter || "";

    // 1️⃣ جلب الشركة + populate كل الأعضاء
    const company = await Company.findById(companyId)
      .populate({
        path: "members.userId",
        select: "fullname username email ProfileImg CoverImg active lastActive",
      })
      .lean();

    if (!company) return next(new AppError("Company not found", 404));

    // 2️⃣ تحويل بيانات الأعضاء
    let members = company.members
      .filter((m) => m.userId) // نتأكد إن العضو موجود
      .map((m) => {
        const user = m.userId;

        const timeSinceLastActive = user.lastActive
          ? Math.floor(
              (Date.now() - new Date(user.lastActive).getTime()) / 60000
            ) // بالدقائق
          : null;

        return {
          id: user._id,
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          profileImg: user.ProfileImg || null,
          coverImg: user.CoverImg || null,
          role: m.role,
          active: user.active,
          lastActive: user.lastActive,
          timeSinceLastActive: formatTimeSince(timeSinceLastActive),
          joinedAt: m.joinedAt,
        };
      });

    // 3️⃣ الفلترة
    if (filter) {
      const filterLower = filter.toLowerCase();
      members = members.filter(
        (m) =>
          (m.username || "").toLowerCase().includes(filterLower) ||
          (m.email || "").toLowerCase().includes(filterLower)
      );
    }

    // 4️⃣ الباجينيشن
    const total = members.length;
    const start = page * pageSize;
    const paginatedMembers = members.slice(start, start + pageSize);

    // 5️⃣ الرد
    res.json({ data: paginatedMembers, total });
  } catch (err) {
    next(err);
  }
};

// Add Member to Company ✅
exports.addMember = async (req, res, next) => {
  try {
    const company = req.company;
    const { email, role, permissions } = req.body;
    const userRole = req.userRole; // من middleware

    const newMember = await User.findOne({ email });
    if (!newMember) return next(new AppError("User not found", 404));

    // تحقق من عدم وجود العضو مسبقًا
    if (company.isMember(newMember._id))
      return next(new AppError("User is already a member", 400));

    // القواعد حسب الدور
    if (userRole === "member" && ["owner", "admin"].includes(role)) {
      return next(
        new AppError("Members cannot add users with Owner or Admin role", 403)
      );
    }

    company.members.push({
      userId: newMember._id,
      role: company.owner.equals(newMember._id) ? "owner" : "employee",
      joinedAt: new Date(),
      permissions: permissions || [],
    });

    await company.save();

    await ActivityLog.log({
      companyId: company._id,
      userId: req.user.id,
      action: "company.member.add",
      category: "company",
      details: {
        resource: "member",
        resourceId: newMember._id,
        description: `Added ${newMember.username} as ${role}`,
      },
    });

    res.status(200).json({
      message: "Member added successfully",
      member: {
        userId: newMember._id,
        username: newMember.username,
        email: newMember.email,
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove Member from Company ✅
exports.removeMember = async (req, res, next) => {
  try {
    const company = req.company;
    const { memberId } = req.params;
    const userId = req.user.id;

    // Can't remove owner
    const memberToRemove = company.members.find(
      (m) => m.userId.toString() === memberId
    );
    // Check if member exists // التحقق من وجود العضو // لا يمكن إزالة المالك
    if (memberToRemove && memberToRemove.role === "owner") {
      return next(new AppError("Cannot remove company owner", 400));
    }

    // Remove member // إزالة العضو // حفظ التغييرات
    company.members = company.members.filter(
      (m) => m.userId.toString() !== memberId
    );

    await company.save();

    // Log activity
    await ActivityLog.log({
      companyId: company._id,
      userId,
      action: "company.member.remove",
      category: "company",
      details: {
        resource: "member",
        resourceId: memberId,
        description: "Removed member from company",
      },
    });

    res.status(200).json({
      message: "Member removed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get Company Statistics ✅
exports.getStatistics = async (req, res, next) => {
  try {
    const company = req.company;
    const companyId = company._id;

    const [dashboardCount, reportCount, analyticsCount, recentActivity] =
      await Promise.all([
        // عدد الداشبوردات والتقارير والتحليلات المكتملة
        Dashboard.countDocuments({ companyId }),
        Report.countDocuments({ companyId, status: "completed" }),
        Analytics.countDocuments({ companyId, status: "completed" }),
        // اخر 10 أنشطة في الشركة
        ActivityLog.getRecent(companyId, 10),
      ]);

    res.status(200).json({
      statistics: {
        ...company.statistics,
        dashboards: dashboardCount,
        reports: reportCount,
        analytics: analyticsCount,
        members: company.members.length,
      },
      recentActivity,
      subscription: {
        plan: company.subscription,
        isActive: company.isSubscriptionActive,
        expiresAt: company.subscriptionExpiry,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get User's Companies ✅
exports.getUserCompanies = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const companies = await Company.find({ "members.userId": userId })
      .select("name logo industry size subscription members statistics")
      .lean();

    const companiesWithRole = companies.map((company) => {
      const member = company.members.find(
        (m) => m.userId.toString() === userId
      );
      return { ...company, userRole: member ? member.role : null };
    });

    res
      .status(200)
      .json({ companies: companiesWithRole, count: companies.length });
  } catch (error) {
    next(error);
  }
};
