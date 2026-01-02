const UserModel = require("../Model/Auth.cjs");
const bcrypt = require("bcrypt");
const { v2: cloudinary } = require("cloudinary");
const AppError = require("../utils/AppError.cjs");
const { updateUserSchema } = require("../validation/user.validation.cjs");

// Get user profile
exports.getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await UserModel.findOne({ username }).select("-Password");
    if (!user) return next(new AppError("User not found", 404));

    res.status(200).json(user);
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const data = updateUserSchema.parse(req.body); // Validate input
    const userId = req.user.id;

    let user = await UserModel.findById(userId);
    if (!user) return next(new AppError("User not found", 404));

    // Handle password update
    if (data.currentPassword || data.newPassword) {
      if (!data.currentPassword || !data.newPassword)
        return next(new AppError("Provide both current and new password", 400));

      const isMatch = await bcrypt.compare(data.currentPassword, user.Password);
      if (!isMatch) throw new AppError("Current password incorrect", 400);

      // Optional: enforce strong password
      const hasUpper = /[A-Z]/.test(data.newPassword);
      const hasLower = /[a-z]/.test(data.newPassword);
      if (!hasUpper || !hasLower || data.newPassword.length < 8)
        throw new AppError(
          "Password must be at least 8 characters and include uppercase & lowercase letters",
          400
        );

      user.Password = await bcrypt.hash(data.newPassword, 10);
    }

    // Handle cloudinary uploads
    if (data.profileImg) {
      try {
        if (user.ProfileImg)
          await cloudinary.uploader.destroy(
            user.ProfileImg.split("/").pop().split(".")[0]
          );
        const upload = await cloudinary.uploader.upload(data.profileImg);
        user.ProfileImg = upload.secure_url;
      } catch (err) {
        console.error("Profile image upload failed", err);
      }
    }

    if (data.coverImg) {
      try {
        if (user.CoverImg)
          await cloudinary.uploader.destroy(
            user.CoverImg.split("/").pop().split(".")[0]
          );
        const upload = await cloudinary.uploader.upload(data.coverImg);
        user.CoverImg = upload.secure_url;
      } catch (err) {
        console.error("Cover image upload failed", err);
      }
    }

    // Update other fields
    const fields = ["fullname", "email", "username", "bio", "link"];
    fields.forEach((field) => {
      if (data[field]) user[field] = data[field];
    });

    await user.save();

    const responseUser = user.toObject();
    delete responseUser.Password; // never return password

    res.status(200).json(responseUser);
  } catch (err) {
    next(err);
  }
};
