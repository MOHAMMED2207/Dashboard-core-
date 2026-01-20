const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../../Model/Auth+User/Auth.cjs");
const {
  registerSchema,
  loginSchema,
} = require("../../validation/user.validation.cjs");
const AppError = require("../../utils/AppError.cjs");
const ActivityLog = require("../../Model/All Business/ActivityLog.cjs");
const Company = require("../../Model/All Business/Company.cjs");
const { formatTimeSince } = require("../../helpers/formatTimeSince.cjs");

/*
 * This is a process for registering a new user ✅
 */
exports.register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check for duplicates
    const existingUser = await UserModel.findOne({
      $or: [
        { email: data.email },
        { username: data.username },
        { Phone: data.Phone },
      ],
    });
    if (existingUser) {
      if (existingUser.email === data.email)
        return next(new AppError("Email already exists", 400));
      if (existingUser.username === data.username)
        return next(new AppError("Username already exists", 400));
      if (existingUser.Phone === data.Phone)
        return next(new AppError("Phone already exists", 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.Password, 12);

    // Create user
    const user = await UserModel.create({
      ...data,
      Password: hashedPassword,
      role: "employee",
    });

    // Find or create company
    let company = await Company.findOne({ email: data.companyEmail });
    let isNewCompany = false;

    if (!company) {
      isNewCompany = true;
      company = await Company.create({
        name: data.companyName || data.companyEmail.split("@")[0],
        email: data.companyEmail,
        members: [],
        industry: "Other",
        size: "1-10",
        subscription: "free",
        isActive: true,
        statistics: {},
        settings: {},
        owner: user._id,
      });

      await ActivityLog.log({
        companyId: company._id,
        userId: user._id,
        action: "company.create",
        category: "company",
        details: {
          resource: "company",
          resourceId: company._id,
          description: `Created company: ${company.name} by ${user.email}`,
        },
      });
    }

    // Add user to members
    company.members.push({
      userId: user._id,
      role: company.owner.equals(user._id) ? "owner" : "employee",
      joinedAt: new Date(),
      permissions: ["*"],
    });
    await company.save();

    // Update user's companyId
    user.companyId = company._id;
    await user.save();

    // Activity logs
    await ActivityLog.log({
      companyId: company._id,
      userId: user._id,
      action: "user.register",
      category: "authentication",
      details: {
        resource: "user",
        resourceId: user._id,
        description: `User ${user.email} registered and joined company ${company.name}`,
      },
    });

    // JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send response
    res.status(201).json({
      message: isNewCompany
        ? `User registered successfully and created new company: ${company.name}`
        : "User registered successfully",
      user: {
        id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        role: user.role,

        company: {
          id: company._id,
          name: company.name,
          membersCount: company.members.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
 * This is a user login process ✅
 */
exports.login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await UserModel.findOne({ email: data.email });
    if (!user) throw new AppError("Invalid credentials", 400);

    const isMatch = await bcrypt.compare(data.Password, user.Password);
    if (!isMatch) throw new AppError("Invalid credentials", 400);

    // JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const company = await Company.findOne({ "members.userId": user._id });
    const companyId = company ? company._id : null;
    const UserIsOwner = company?.owner.equals(user._id) || false;

    if (!companyId && !UserIsOwner) {
      return next(new AppError("User doesn't belong to any company", 404));
    }

    // Activity Log
    await ActivityLog.log({
      companyId: company._id,
      userId: user._id,
      action: "user.login",
      category: "authentication",
      result: "success",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: {
        resource: "auth",
        resourceId: user._id,
        description: "User logged in successfully",
      },
      severity: "low",
    });

    // ✅ تفعيل المستخدم وتحديث آخر نشاط
    user.active = true;
    user.lastActive = new Date();
    await user.save();

    const io = req.app.get("io");

if (company?._id) {
  io.to(`company:${company._id}`).emit("member:status-updated", {
    userId: user._id,
    active: true,
    lastActive: user.lastActive,
  });
}

    // Response
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        phone: user.Phone,
        role: user.role,
        profileImg: user.ProfileImg || null,
        coverImg: user.CoverImg || null,
        active: user.active, // ✅ حالة النشاط
        lastActive: user.lastActive, // ✅ آخر نشاط
      },
      company: {
        name: company.name,
        email: company.email,
        subscription: company.subscription,
        members: company.members,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
 * logout process ✅
 */
exports.logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);
    if (!user) throw new AppError("Invalid credentials", 401);

    const company = await Company.findOne({ "members.userId": user._id });

    // ✅ تعطيل النشاط عند الخروج (اختياري)
    user.active = false;
    await user.save();

    const io = req.app.get("io");

if (company?._id) {
  io.to(`company:${company._id}`).emit("member:status-updated", {
    userId: user._id,
    active: false,
    lastActive: user.lastActive,
  });
}

    // مسح الكوكي
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    await ActivityLog.log({
      companyId: company?._id || null,
      userId: user._id,
      action: "user.logout",
      category: "authentication",
      result: "success",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: {
        resource: "auth",
        resourceId: user._id,
        description: "User logged out successfully",
      },
      severity: "low",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/*
 * Get all users ✅
 */

exports.GetAllUser = async (req, res) => {
  try {
    const users = await UserModel.find().select("-Password");

    const usersWithActivity = users.map((user) => {
      const minutesSinceLastActive = user.lastActive
        ? Math.floor((Date.now() - new Date(user.lastActive).getTime()) / 60000)
        : null;

      return {
        ...user.toObject(),
        timeSinceLastActive: formatTimeSince(minutesSinceLastActive),
      };
    });

    return res.json({
      Message: "Data fetched successfully",
      status: 200,
      user: usersWithActivity,
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ Message: err.message });
  }
};

/*
 * Get user profiles ✅
 */
exports.GetUserProfile = async (req, res) => {
  let userId = req.params.id;
  try {
    let user = await UserModel.findOne({ _id: userId }).select("-Password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ حساب الوقت من آخر نشاط
    const timeSinceLastActive = user.lastActive
      ? Math.floor((Date.now() - new Date(user.lastActive).getTime()) / 60000) // بالدقائق
      : null;

    return res.json({
      Message: "Data is Successfully",
      status: 200,
      user: {
        ...user.toObject(),
        active: user.active, // ✅ حالة النشاط
        lastActive: user.lastActive, // ✅ آخر نشاط
        timeSinceLastActive: formatTimeSince(timeSinceLastActive), // ✅ الوقت بالدقائق
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ Message: err });
  }
};

/*
 * Get the current user's profile ✅
 */
exports.getMe = async (req, res, next) => {
  try {
    // 1️⃣ جلب بيانات المستخدم
    const user = await UserModel.findById(req.user.id)
      .select("-Password")
      .lean();

    if (!user) throw new AppError("User not found", 404);

    let companyData = null;

    if (user.companyId) {
      // 2️⃣ جلب بيانات الشركة + populate جميع الأعضاء
      const company = await Company.findById(user.companyId)
        .populate({
          path: "members.userId",
          select:
            "fullname username email ProfileImg CoverImg role active lastActive", // ✅ ضفت active و lastActive
        })
        .lean();

      if (company) {
        const members = company.members
          .filter((m) => m.userId)
          .map((m) => {
            // ✅ حساب الوقت من آخر نشاط
            const timeSinceLastActive = m.userId.lastActive
              ? Math.floor(
                  (Date.now() - new Date(m.userId.lastActive).getTime()) / 60000
                ) // بالدقائق
              : null;

            return {
              id: m.userId._id,
              fullname: m.userId.fullname,
              username: m.userId.username,
              email: m.userId.email,
              role: m.role,
              profileImg: m.userId.ProfileImg || null,
              coverImg: m.userId.CoverImg || null,
              active: m.userId.active, // ✅ حالة النشاط
              lastActive: m.userId.lastActive, // ✅ آخر نشاط
              timeSinceLastActive: formatTimeSince(timeSinceLastActive), // ✅ الوقت بالدقائق
              joinedAt: m.joinedAt,
            };
          });

        const totalMembers = members.length;

        companyData = {
          id: company._id,
          name: company.name,
          email: company.email,
          industry: company.industry,
          size: company.size,
          subscription: company.subscription,
          userRole: user.role,
          membersCount: totalMembers,
          members,
        };
      }
    }

    // ✅ حساب الوقت من آخر نشاط للمستخدم الحالي
    const timeSinceLastActive = user.lastActive
      ? Math.floor((Date.now() - new Date(user.lastActive).getTime()) / 60000) // بالدقائق
      : null;

    // 3️⃣ رد البيانات كاملة
    return res.json({
      Message: "Data fetched successfully",
      status: 200,
      user: {
        id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        phone: user.Phone,
        role: user.role,
        profileImg: user.ProfileImg || null,
        coverImg: user.CoverImg || null,
        active: user.active, // ✅ حالة النشاط
        lastActive: user.lastActive, // ✅ آخر نشاط
        timeSinceLastActive: formatTimeSince(timeSinceLastActive), // ✅ الوقت بالدقائق
        company: companyData,
      },
    });
  } catch (err) {
    return res.status(400).json({ Message: err.message });
  }
};
