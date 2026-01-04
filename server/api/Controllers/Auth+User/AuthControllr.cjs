const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../../Model/Auth+User/Auth.cjs");
const {
  registerSchema,
  loginSchema,
} = require("../../validation/user.validation.cjs");
const AppError = require("../../utils/AppError.cjs");

exports.register = async (req, res, next) => {
  try {
    // 1️⃣ Zod validation
    const data = registerSchema.parse(req.body);

    // 2️⃣ Check if email, username, or phone already exists
    const exists = await UserModel.findOne({
      $or: [
        { email: data.email },
        { username: data.username },
        { Phone: data.Phone },
      ],
    });
    // duplicate check
    if (exists) {
      if (exists.email === data.email)
        return next(new AppError("Email already exists", 400));

      if (exists.username === data.username)
        return next(new AppError("Username already exists", 400));

      if (exists.Phone === data.Phone)
        return next(new AppError("Phone already exists", 400));
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(data.Password, 10);

    // 4️⃣ Create user
    const user = await UserModel.create({
      ...data,
      Password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------------------------------------------------------------
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
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

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
// --------------------------------------------------------------------------------------------------------
exports.getMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-Password");
    if (!user) throw new AppError("User not found", 404);

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------------------------------------------------------------
