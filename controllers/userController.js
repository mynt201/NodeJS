const bcrypt = require("bcryptjs");
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
    handleDatabaseError
} = require("../middleware/userValidation");

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
const register = [
    ...registerValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const { username, email, password, fullName, phone, address } = req.body;

            // Check if user already exists
            const existingError = await checkUserExists(email, username);
            if (existingError) {
                return res.status(400).json({
                    success: false,
                    error: existingError,
                });
            }

            // Hash password and create user
            const hashedPassword = await hashPassword(password);
            const user = await User.create({
                username,
                email,
                password: hashedPassword,
                fullName,
                phone,
                address,
            });

            // Generate token and update last login
            const token = generateToken(user._id);
            await user.updateLastLogin();

            res.status(201).json({
                success: true,
                message: "User registered successfully",
                token,
                user: formatUserResponse(user, true),
            });
        } catch (error) {
            handleDatabaseError(error, res, "Server error during registration");
        }
    }
];

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const login = [
    ...loginValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const { email, password } = req.body;

            // Find user by email
            const user = await User.findOne({
                email: email.toLowerCase().trim(),
            });

            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    error: !user ? "Invalid email or password" : "Account is deactivated",
                });
            }

            // Check password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid email or password",
                });
            }

            // Generate token and update last login
            const token = generateToken(user._id);
            await user.updateLastLogin();

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
    }
];

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async(req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        res.json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                phone: user.phone,
                address: user.address,
                avatar: user.avatar,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                displayName: user.displayName,
                isActive: user.isActive,
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

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = [
    ...updateProfileValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const { fullName, phone, address, email } = req.body;

            const updateData = buildUpdateData(['fullName', 'phone', 'address'], req.body);

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
            }).select("-password");

            res.json({
                success: true,
                message: "Profile updated successfully",
                user: formatUserResponse(user),
            });
        } catch (error) {
            handleDatabaseError(error, res, "Server error updating profile");
        }
    }
];

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = [
    ...changePasswordValidation,
    handleValidationErrors,
    async(req, res) => {
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

            // Check current password
            const isCurrentPasswordValid = await bcrypt.compare(
                currentPassword,
                user.password,
            );
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    error: "Current password is incorrect",
                });
            }

            // Hash and update password
            user.password = await hashPassword(newPassword);
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
    }
];

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = [
    ...getUsersValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
            const skip = (page - 1) * limit;

            const sortBy = req.query.sort || "createdAt";
            const sortOrder = req.query.order === "asc" ? 1 : -1;

            // Build filter object
            const filter = {};

            // Role filter - chỉ filter khi có giá trị cụ thể
            if (req.query.role && req.query.role !== 'all') {
                const roles = req.query.role.split(',').map(r => r.trim()).filter(r => r);
                if (roles.length === 1) {
                    // Single role: admin hoặc user
                    filter.role = roles[0];
                } else if (roles.length > 1) {
                    // Multiple roles (comma separated)
                    filter.role = { $in: roles };
                }
            } else {
                console.log('No role filter applied (all roles)');
            }

            // Active status filter - chỉ filter khi có giá trị cụ thể
            if (req.query.isActive !== undefined && req.query.isActive !== 'all') {
                const isActive = req.query.isActive === "true";
                filter.isActive = isActive;
                console.log(`Filtering by active status: ${isActive}`);
            } else {
                console.log('No active status filter applied (all statuses)');
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

            if (req.query.lastLoginFrom || req.query.lastLoginTo) {
                filter.lastLogin = {};
                if (req.query.lastLoginFrom) {
                    const date = new Date(req.query.lastLoginFrom);
                    if (!isNaN(date.getTime())) {
                        filter.lastLogin.$gte = date;
                    }
                }
                if (req.query.lastLoginTo) {
                    const date = new Date(req.query.lastLoginTo);
                    if (!isNaN(date.getTime())) {
                        filter.lastLogin.$lte = date;
                    }
                }
            }

            // Advanced search - search in multiple fields with better matching
            if (req.query.search && req.query.search.trim()) {
                const searchTerm = req.query.search.trim();
                const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

                filter.$or = [
                    // Exact match for username (highest priority)
                    { username: new RegExp(`^${searchTerm}$`, 'i') },
                    // Partial match for username
                    { username: searchRegex },
                    // Email search (prioritize if contains @)
                    { email: searchRegex },
                    // Full name search
                    { fullName: searchRegex },
                    // Phone search
                    { phone: searchRegex },
                    // Address search
                    { address: searchRegex }
                ];

                // If search term contains @, prioritize email search
                if (searchTerm.includes('@')) {
                    filter.$or.unshift({ email: new RegExp(`^${searchTerm}$`, 'i') });
                }
            }

            // Build sort object
            const sortOptions = {};
            if (sortBy === 'name') {
                // Sort by displayName (fullName or username)
                sortOptions.fullName = sortOrder;
                sortOptions.username = sortOrder;
            } else if (sortBy === 'lastLogin') {
                // Sort by lastLogin, nulls last
                sortOptions.lastLogin = sortOrder;
            } else {
                sortOptions[sortBy] = sortOrder;
            }

            // Execute query with aggregation for better performance and computed fields
            const aggregationPipeline = [
                { $match: filter },
                {
                    $addFields: {
                        displayName: {
                            $ifNull: ['$fullName', '$username']
                        }
                    }
                },
                { $sort: sortOptions },
                { $skip: skip },
                { $limit: limit },
                {
                    $project: {
                        password: 0, // Exclude password
                        __v: 0, // Exclude version
                    }
                }
            ];

            const users = await User.aggregate(aggregationPipeline);

            // Get total count for pagination
            const totalResult = await User.aggregate([
                { $match: filter },
                { $count: "total" }
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
                    createdFrom: req.query.createdFrom || null,
                    createdTo: req.query.createdTo || null,
                    lastLoginFrom: req.query.lastLoginFrom || null,
                    lastLoginTo: req.query.lastLoginTo || null,
                },
                sort: {
                    by: sortBy,
                    order: req.query.order || 'desc',
                },
            });
        } catch (error) {
            console.error("Get users error:", error);
            res.status(500).json({
                success: false,
                error: "Server error retrieving users",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }
    }
];

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = [
    ...getUserByIdValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const user = await User.findById(req.params.id).select("-password");

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                });
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
    }
];

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = [
    ...updateUserValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const updateData = buildUpdateData(['role', 'isActive', 'fullName', 'phone', 'address'], req.body);

            const user = await User.findByIdAndUpdate(req.params.id, updateData, {
                new: true,
                runValidators: true,
            }).select("-password");

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                });
            }

            res.json({
                success: true,
                message: "User updated successfully",
                user,
            });
        } catch (error) {
            handleDatabaseError(error, res, "Server error updating user");
        }
    }
];

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = [
    ...deleteUserValidation,
    handleValidationErrors,
    async(req, res) => {
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
    }
];

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = async(req, res) => {
    try {
        const stats = await User.aggregate([{
            $group: {
                _id: null,
                totalUsers: {
                    $sum: 1,
                },
                activeUsers: {
                    $sum: {
                        $cond: ["$isActive", 1, 0],
                    },
                },
                adminUsers: {
                    $sum: {
                        $cond: [{
                                $eq: ["$role", "admin"],
                            },
                            1,
                            0,
                        ],
                    },
                },
                recentUsers: {
                    $sum: {
                        $cond: [{
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
        }, ]);

        res.json({
            success: true,
            stats: stats[0] || {
                totalUsers: 0,
                activeUsers: 0,
                adminUsers: 0,
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

// @desc    Create admin user (Admin only)
// @route   POST /api/users/create-admin
// @access  Private/Admin
const createAdminUser = [
    ...createAdminValidation,
    handleValidationErrors,
    async(req, res) => {
        try {
            const { username, email, password, fullName, phone, address } = req.body;

            // Check if user already exists
            const existingError = await checkUserExists(email, username);
            if (existingError) {
                return res.status(409).json({
                    success: false,
                    error: existingError,
                });
            }

            // Hash password and create admin user
            const hashedPassword = await hashPassword(password);
            const user = await User.create({
                username,
                email,
                password: hashedPassword,
                fullName,
                phone,
                address,
                role: 'admin', // Always set role to admin
            });

            res.status(201).json({
                success: true,
                message: "Admin user created successfully",
                user: formatUserResponse(user, true),
            });
        } catch (error) {
            handleDatabaseError(error, res, "Server error during user creation");
        }
    }
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