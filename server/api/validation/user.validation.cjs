// validation/auth.validation.js
const { z } = require("zod");

//  Password rules
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter");

// Register Schema
exports.registerSchema = z.object({
  fullname: z.string().min(3, "Full name is too short"),
  username: z.string().min(3, "Username is too short"),
  email: z.string().email("Invalid email format"),
  Password: passwordSchema,
  Phone: z
    .string()
    .min(11, "Invalid phone number")
    .max(11, "Invalid phone number"),
});

// login schema
exports.loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  Password: passwordSchema,
});







exports.resetPasswordSchema = z.object({
  email: z.string().email(),
});

// update password
exports.updatePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8),
});

// update user profile
exports.updateUserSchema = z.object({
  fullname: z.string().min(3).optional(),
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  bio: z.string().optional(),
  link: z.string().url().optional(),
  profileImg: z.string().optional(),
  coverImg: z.string().optional(),
});
exports.changeRoleSchema = z.object({
  role: z.enum(["User", "Admin", "Moderator"]),
});
// --------------------------------------------------------------------------------------------------------
// End of file
