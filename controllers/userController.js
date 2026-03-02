const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const { generateToken } = require("../middleware/auth");
const {
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
} = require("../middleware/userValidation");

const register = [
  ...registerValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { username, email, password, full_name, role, ward_id } = req.body;

      const existingError = await checkUserExists(email, username);
      if (existingError) {
        return res.status(400).json({
          success: false,
          error: existingError,
        });
      }

      const password_hash = await hashPassword(password);
      const user = await User.create({
        username,
        email,
        password_hash,
        full_name: full_name,
        role: role || "WARD_ADMIN",
        ward_id: ward_id || null,
      });

      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: formatUserResponse(user, true),
      });
    } catch (error) {
      handleDatabaseError(error, res, "Server error during registration");
    }
  },
];

const login = [
  ...loginValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, username, password } = req.body;

      // Tìm user theo email hoặc username
      const query = email
        ? {
            email: email.toLowerCase().trim(),
          }
        : {
            username: (username || "").trim(),
          };
      const user = await User.findOne(query);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Invalid email/username or password",
        });
      }

      const hashToCheck = user.password_hash || user.password;
      if (!hashToCheck) {
        return res.status(401).json({
          success: false,
          error: "Invalid email/username or password",
        });
      }
      const isPasswordValid = await bcrypt.compare(password, hashToCheck);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: "Invalid email/username or password",
        });
      }

      const token = generateToken(user._id);

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: formatUserResponse(user),
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: "Server error during login",
      });
    }
  },
];

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password_hash");

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        ward_id: user.ward_id,
        created_at: user.createdAt,
        is_active: user.is_active,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Server error retrieving profile",
    });
  }
};

const updateProfile = [
  ...updateProfileValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { full_name, email } = req.body;

      const updateData = buildUpdateData(["full_name"], req.body);

      // If email is being updated, check if it's already taken
      if (email && email !== req.user.email) {
        const existingUser = await User.findOne({
          email: email.toLowerCase(),
        });
        if (
          existingUser &&
          existingUser._id.toString() !== req.user._id.toString()
        ) {
          return res.status(400).json({
            success: false,
            error: "Email already registered",
          });
        }
        updateData.email = email.toLowerCase();
      }

      const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password_hash");

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: formatUserResponse(user),
      });
    } catch (error) {
      handleDatabaseError(error, res, "Server error updating profile");
    }
  },
];

const changePassword = [
  ...changePasswordValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password_hash,
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: "Current password is incorrect",
        });
      }

      user.password_hash = await hashPassword(newPassword);
      await user.save();

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        error: "Server error changing password",
      });
    }
  },
];

const getUsers = [
  ...getUsersValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
      const skip = (page - 1) * limit;

      const sortBy = req.query.sort || "createdAt";
      const sortOrder = req.query.order === "asc" ? 1 : -1;

      // Build filter object
      let filter = {};
      let wardCondition = null;

      // WARD_ADMIN chỉ thấy user của phường mình; SUPER_ADMIN thấy tất cả
      if (req.user.role === "WARD_ADMIN" && req.user.ward_id) {
        filter.ward_id = req.user.ward_id;
      } else if (req.query.ward_id && req.query.ward_id !== "all" && req.user.role === "SUPER_ADMIN") {
        // SUPER_ADMIN filter theo phường: dùng đúng ward_id từ query (không dùng req.user.ward_id)
        const rawWardId = req.query.ward_id;
        const wardIdStr = String(Array.isArray(rawWardId) ? rawWardId[0] : rawWardId).trim();
        if (wardIdStr && mongoose.Types.ObjectId.isValid(wardIdStr)) {
          const wardObjectId = new mongoose.Types.ObjectId(wardIdStr);
          wardCondition = {
            $or: [
              { ward_id: wardObjectId },
              { role: "SUPER_ADMIN" },
            ],
          };
        }
      }

      // Role filter - chỉ filter khi có giá trị cụ thể
      if (req.query.role && req.query.role !== "all") {
        const roles = req.query.role
          .split(",")
          .map((r) => r.trim())
          .filter((r) => r);
        if (roles.length === 1) {
          // Single role: admin hoặc user
          filter.role = roles[0];
        } else if (roles.length > 1) {
          // Multiple roles (comma separated)
          filter.role = {
            $in: roles,
          };
        }
      } else {
        console.log("No role filter applied (all roles)");
      }

      if (req.query.isActive !== undefined && req.query.isActive !== "all") {
        const isActive = req.query.isActive === "true";
        filter.is_active = isActive;
        console.log(`Filtering by active status: ${isActive}`);
      } else {
        console.log("No active status filter applied (all statuses)");
      }

      // Date range filters
      if (req.query.createdFrom || req.query.createdTo) {
        filter.createdAt = {};
        if (req.query.createdFrom) {
          const date = new Date(req.query.createdFrom);
          if (!isNaN(date.getTime())) {
            filter.createdAt.$gte = date;
          }
        }
        if (req.query.createdTo) {
          const date = new Date(req.query.createdTo);
          if (!isNaN(date.getTime())) {
            filter.createdAt.$lte = date;
          }
        }
      }

      // Advanced search - search in multiple fields with better matching
      if (req.query.search && req.query.search.trim()) {
        const searchTerm = req.query.search.trim();
        const searchRegex = new RegExp(
          searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i",
        );

        filter.$or = [
          {
            username: new RegExp(`^${searchTerm}$`, "i"),
          },
          {
            username: searchRegex,
          },
          {
            email: searchRegex,
          },
          {
            full_name: searchRegex,
          },
        ];

        // If search term contains @, prioritize email search
        if (searchTerm.includes("@")) {
          filter.$or.unshift({
            email: new RegExp(`^${searchTerm}$`, "i"),
          });
        }
      }

      // Kết hợp wardCondition với filter (tránh bị search $or ghi đè)
      if (wardCondition) {
        const restFilter = {};
        if (filter.role) restFilter.role = filter.role;
        if (filter.is_active !== undefined) restFilter.is_active = filter.is_active;
        if (filter.createdAt) restFilter.createdAt = filter.createdAt;
        if (filter.$or) restFilter.$or = filter.$or;
        const andConditions = [wardCondition];
        if (Object.keys(restFilter).length > 0) andConditions.push(restFilter);
        filter = andConditions.length > 1 ? { $and: andConditions } : wardCondition;
      }

      const sortOptions = {};
      if (sortBy === "name") {
        sortOptions.full_name = sortOrder;
        sortOptions.username = sortOrder;
      } else {
        const field = sortBy === "createdAt" ? "createdAt" : sortBy;
        sortOptions[field] = sortOrder;
      }

      // Execute query with aggregation for better performance and computed fields
      const aggregationPipeline = [
        {
          $match: filter,
        },
        {
          $addFields: {
            displayName: {
              $ifNull: ["$full_name", "$username"],
            },
          },
        },
        {
          $sort: sortOptions,
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $project: {
            password_hash: 0,
            __v: 0,
          },
        },
      ];

      const users = await User.aggregate(aggregationPipeline);

      // Get total count for pagination
      const totalResult = await User.aggregate([
        {
          $match: filter,
        },
        {
          $count: "total",
        },
      ]);

      const total = totalResult.length > 0 ? totalResult[0].total : 0;

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        users,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null,
        },
        filters: {
          search: req.query.search || null,
          role: req.query.role || null,
          isActive: req.query.isActive || null,
          ward_id: req.query.ward_id || null,
          createdFrom: req.query.createdFrom || null,
          createdTo: req.query.createdTo || null,
        },
        sort: {
          by: sortBy,
          order: req.query.order || "desc",
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({
        success: false,
        error: "Server error retrieving users",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
];

const getUserById = [
  ...getUserByIdValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password_hash");

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // WARD_ADMIN chỉ được xem user cùng phường
      if (req.user.role === "WARD_ADMIN") {
        const targetWard = user.ward_id?.toString() || null;
        const myWard = req.user.ward_id?.toString() || null;
        if (targetWard !== myWard) {
          return res.status(403).json({
            success: false,
            error: "Bạn không có quyền xem người dùng này",
          });
        }
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Get user by ID error:", error);
      res.status(500).json({
        success: false,
        error: "Server error retrieving user",
      });
    }
  },
];

const updateUser = [
  ...updateUserValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const existingUser = await User.findById(req.params.id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // WARD_ADMIN chỉ được sửa user cùng phường; không được đổi ward_id hoặc role sang SUPER_ADMIN
      if (req.user.role === "WARD_ADMIN") {
        const targetWard = existingUser.ward_id?.toString() || null;
        const myWard = req.user.ward_id?.toString() || null;
        if (targetWard !== myWard) {
          return res.status(403).json({
            success: false,
            error: "Bạn không có quyền cập nhật người dùng này",
          });
        }
        // Không cho WARD_ADMIN set role SUPER_ADMIN hoặc đổi ward_id
        if (req.body.role === "SUPER_ADMIN") delete req.body.role;
        if (req.body.ward_id && req.body.ward_id !== myWard) delete req.body.ward_id;
      }

      const updateData = buildUpdateData(
        ["role", "is_active", "full_name", "ward_id"],
        req.body,
      );

      const user = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password_hash");

      res.json({
        success: true,
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      handleDatabaseError(error, res, "Server error updating user");
    }
  },
];

const deleteUser = [
  ...deleteUserValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Prevent admin from deleting themselves
      if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete your own account",
        });
      }

      // WARD_ADMIN chỉ được xóa user cùng phường
      if (req.user.role === "WARD_ADMIN") {
        const targetWard = user.ward_id?.toString() || null;
        const myWard = req.user.ward_id?.toString() || null;
        if (targetWard !== myWard) {
          return res.status(403).json({
            success: false,
            error: "Bạn không có quyền xóa người dùng này",
          });
        }
      }

      await User.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        success: false,
        error: "Server error deleting user",
      });
    }
  },
];

const getUserStats = async (req, res) => {
  try {
    const matchStage = {};
    if (req.user.role === "WARD_ADMIN" && req.user.ward_id) {
      matchStage.ward_id = req.user.ward_id;
    }

    const pipeline = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    pipeline.push({
      $group: {
          _id: null,
          totalUsers: {
            $sum: 1,
          },
          activeUsers: {
            $sum: {
              $cond: ["$is_active", 1, 0],
            },
          },
          superAdminUsers: {
            $sum: {
              $cond: [
                {
                  $eq: ["$role", "SUPER_ADMIN"],
                },
                1,
                0,
              ],
            },
          },
          recentUsers: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$createdAt",
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      });

    const stats = await User.aggregate(pipeline);

    res.json({
      success: true,
      stats: (stats.length > 0 ? stats[0] : null) || {
        totalUsers: 0,
        activeUsers: 0,
        superAdminUsers: 0,
        recentUsers: 0,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      error: "Server error retrieving user statistics",
    });
  }
};

const createAdminUser = [
  ...createAdminValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      let { username, email, password, full_name, fullName, role, ward_id } = req.body;
      full_name = full_name || fullName;

      // WARD_ADMIN chỉ tạo được user cùng phường, role luôn là WARD_ADMIN
      if (req.user.role === "WARD_ADMIN") {
        role = "WARD_ADMIN";
        ward_id = req.user.ward_id;
      }

      const existingError = await checkUserExists(email, username);
      if (existingError) {
        return res.status(409).json({
          success: false,
          error: existingError,
        });
      }

      const password_hash = await hashPassword(password);
      const user = await User.create({
        username,
        email,
        password_hash,
        full_name: full_name,
        role: role || "WARD_ADMIN",
        ward_id: role === "SUPER_ADMIN" ? null : ward_id || null,
      });

      res.status(201).json({
        success: true,
        message: "Admin user created successfully",
        user: formatUserResponse(user, true),
      });
    } catch (error) {
      handleDatabaseError(error, res, "Server error during user creation");
    }
  },
];

module.exports = {
  register,
  createAdminUser,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
};
