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
/*
 * This is a process for registering a new user ✅
 */
exports.register = async (req, res, next) => {
  try {
    // 1️⃣ Validate input
    const data = registerSchema.parse(req.body);

    // 2️⃣ Check for duplicates
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

    // 3️⃣ Hash the user's password
    const hashedPassword = await bcrypt.hash(data.Password, 12);

    // 4️⃣ Create the user first
    const user = await UserModel.create({
      ...data,
      Password: hashedPassword,
      role: "employee",
      isActive: true,
      joinedAt: new Date(),
    });

    // 5️⃣ Find existing company
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

      // سجل إنشاء الشركة في ActivityLog
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

    // 7️⃣ Add user to company members
    company.members.push({
      userId: user._id,
      role: company.owner.equals(user._id) ? "owner" : "employee",
      joinedAt: new Date(),
    });

    await company.save();

    // 8️⃣ Update user's companyId
    user.companyId = company._id;
    await user.save();

    // 9️⃣ Activity logs
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

    await ActivityLog.log({
      companyId: company._id,
      userId: user._id,
      action: "company.member.add",
      category: "company",
      details: {
        resource: "company",
        resourceId: company._id,
        description: `User ${user.email} added to company as member`,
      },
    });

    const message = isNewCompany
      ? `User registered successfully and created new company: ${company.name}`
      : "User registered successfully";

    res.status(201).json({
      message: message,
      user: {
        id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        company: company.name,
        role: company.owner.equals(user._id) ? "owner" : "employee",
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

    // JWT minimal payload
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const company = await Company.findOne({ "members.userId": user._id });

    const companyId = company ? company._id : null; // company.id // user found in members company
    const UserIsOwner = company.owner === user._id ? true : false;

    //
    if (!companyId && !UserIsOwner) {
      return next(new AppError("user dont have any company", 404));
    }

    // 🔥 Activity Log
    await ActivityLog.log({
      companyId: companyId,
      userId: user._id,
      action: "user.login",
      category: "authentication",
      result: "success",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: {
        resource: "auth",
        description: "User logged in successfully",
      },
      severity: "low",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      company: {
        name: company.name,
        email: company.email,
        subscription: company.subscription,
        members: company.members,
      },
      count: company.length,
    });
  } catch (error) {
    next(error);
  }
};
/*
 * logout process ✅
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) throw new AppError("Invalid credentials", 400);

    const company = await Company.findOne({ "members.userId": userId._id });
    const companyId = company ? company._id : null; // company.id // user found in members company

    await ActivityLog.log({
      companyId: companyId,
      userId: user._id,
      action: "user.logout",
      category: "authentication",
      result: "success",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: {
        resource: "auth",
        description: "User Logged out successfully",
      },
      severity: "low",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
/*
 * Get all users ✅
 */
exports.GetAllUser = async (req, res) => {
  try {
    let FilterUser = await UserModel.find(); // find user in database
    return res.json({
      // return res.json
      Message: "Data is Succesfully", //msg
      status: 200, // story is succesd
      user: FilterUser, // data from user
    });
  } catch (err) {
    console.log(err); // log error
    return res.status(400).send({ Message: err }); //  status(400) is a bad request , send msg
  }
};
/*
 * Get user profiles ✅
 */
exports.GetUserProfile = async (req, res) => {
  let userId = req.params.id;
  try {
    let user = await UserModel.findOne({ _id: userId }).select("-Password"); // find user in database
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      // return res.json
      Message: "Data is Succesfully", //msg
      status: 200, // story is succesd
      user: user, // data from user
    });
  } catch (err) {
    console.log(err); // log error
    return res.status(400).send({ Message: err }); //  status(400) is a bad request , send msg
  }
};
/*
 * Get the current user's profile ✅
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-Password");
    if (!user) throw new AppError("User not found", 404);

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
