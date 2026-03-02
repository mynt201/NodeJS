const { body, param, query, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Middleware to handle validation errors - trả về key -> message
const handleValidationErrors = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const fieldErrors = {};
    result.array().forEach((err) => {
      if (err.path && !fieldErrors[err.path]) {
        fieldErrors[err.path] = err.msg;
      }
    });

    return res.status(400).json({
      success: false,
      error: "Dữ liệu không hợp lệ",
      errors: fieldErrors,
    });
  }
  next();
};

// Validation schemas
const registerValidation = [
  body("username")
    .trim()
    .isLength({
      min: 3,
      max: 50,
    })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .isLength({
      min: 6,
    })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  body("fullName")
    .optional()
    .trim()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Full name must be between 2 and 100 characters"),
];

const loginValidation = [
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("username")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Username cannot be empty"),

  body("password").notEmpty().withMessage("Password is required"),

  body()
    .custom((val, { req }) => {
      if (!req.body.email && !req.body.username) {
        throw new Error("Email or username is required");
      }
      return true;
    }),
];

const updateProfileValidation = [
  body("full_name")
    .optional()
    .trim()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Họ tên phải từ 2 đến 100 ký tự"),

  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Email không hợp lệ"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({
      min: 6,
    })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
];

const createAdminValidation = [
  body("username")
    .trim()
    .isLength({
      min: 3,
      max: 50,
    })
    .withMessage("Username must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .isLength({
      min: 6,
    })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  body("full_name")
    .optional()
    .trim()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Họ tên phải từ 2 đến 100 ký tự"),

  body("fullName")
    .optional()
    .trim()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Họ tên phải từ 2 đến 100 ký tự"),

  body("role")
    .optional()
    .isIn(["SUPER_ADMIN", "WARD_ADMIN"])
    .withMessage("Vai trò phải là SUPER_ADMIN hoặc WARD_ADMIN"),

  body("ward_id")
    .optional()
    .isMongoId()
    .withMessage("ward_id phải là ObjectId hợp lệ"),

  body().custom((_, { req }) => {
    if (!req.body.full_name && !req.body.fullName) {
      throw new Error("Họ tên là bắt buộc (full_name hoặc fullName)");
    }
    return true;
  }),
];

const updateUserValidation = [
  param("id").isMongoId().withMessage("Invalid user ID"),

  body("role")
    .optional()
    .isIn(["SUPER_ADMIN", "WARD_ADMIN"])
    .withMessage("Vai trò phải là SUPER_ADMIN hoặc WARD_ADMIN"),

  body("is_active")
    .optional()
    .isBoolean()
    .withMessage("is_active phải là boolean"),

  body("full_name")
    .optional()
    .trim()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Họ tên phải từ 2 đến 100 ký tự"),

  body("ward_id")
    .optional()
    .isMongoId()
    .withMessage("ward_id phải là ObjectId hợp lệ"),
];

const getUserByIdValidation = [
  param("id").isMongoId().withMessage("Invalid user ID"),
];

const deleteUserValidation = [
  param("id").isMongoId().withMessage("Invalid user ID"),
];

const getUsersValidation = [
  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage("Limit must be between 1 and 100"),

  query("role")
    .optional()
    .custom((value) => {
      if (value === "all") return true;
      const roles = value.split(",").map((r) => r.trim());
      const validRoles = ["SUPER_ADMIN", "WARD_ADMIN"];
      return roles.every((role) => validRoles.includes(role));
    })
    .withMessage("Role must be admin, user, or all"),

  query("isActive")
    .optional()
    .custom((value) => {
      return value === "all" || value === "true" || value === "false";
    })
    .withMessage("isActive must be true, false, or all"),

  query("createdFrom")
    .optional()
    .isISO8601()
    .withMessage("createdFrom must be a valid date"),

  query("createdTo")
    .optional()
    .isISO8601()
    .withMessage("createdTo must be a valid date"),

  query("lastLoginFrom")
    .optional()
    .isISO8601()
    .withMessage("lastLoginFrom must be a valid date"),

  query("lastLoginTo")
    .optional()
    .isISO8601()
    .withMessage("lastLoginTo must be a valid date"),

  query("ward_id")
    .optional()
    .isMongoId()
    .withMessage("ward_id phải là ObjectId hợp lệ"),

  query("search")
    .optional()
    .trim()
    .isLength({
      min: 1,
      max: 100,
    })
    .withMessage("Search term must be between 1 and 100 characters"),

  query("sort")
    .optional()
    .isIn(["createdAt", "lastLogin", "username", "email", "name"])
    .withMessage(
      "Sort must be one of: createdAt, lastLogin, username, email, name",
    ),

  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Order must be asc or desc"),
];

// Common utility functions
const buildUpdateData = (fields, data) => {
  const updateData = {};
  fields.forEach((field) => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });
  return updateData;
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const formatUserResponse = (user, includeSensitive = false) => {
  const baseResponse = {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    ward_id: user.ward_id,
    displayName: user.full_name || user.username,
  };

  if (includeSensitive) {
    baseResponse.created_at = user.createdAt;
    baseResponse.is_active = user.is_active;
  }

  return baseResponse;
};

const checkUserExists = async (email, username) => {
  const existingUser = await User.findByEmailOrUsername(email, username);
  if (existingUser) {
    return existingUser.email === email
      ? "Email already registered"
      : "Username already taken";
  }
  return null;
};

const handleDatabaseError = (
  error,
  res,
  customMessage = "Database operation failed",
) => {
  console.error(`${customMessage}:`, error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      error: "Duplicate key error",
    });
  }

  res.status(500).json({
    success: false,
    error: customMessage,
  });
};

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  createAdminValidation,
  updateUserValidation,
  getUserByIdValidation,
  deleteUserValidation,
  getUsersValidation,
  buildUpdateData,
  hashPassword,
  formatUserResponse,
  checkUserExists,
  handleDatabaseError,
};
