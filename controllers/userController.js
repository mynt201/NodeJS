const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateToken } = require("../middleware/auth");

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
const register = async(req, res) => {
    try {
        const { username, email, password, fullName, phone, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmailOrUsername(email, username);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: existingUser.email === email ?
                    "Email already registered" : "Username already taken",
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            fullName,
            phone,
            address,
        });

        // Generate token
        const token = generateToken(user._id);

        // Update last login
        await user.updateLastLogin();

        // Return user data without password
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            phone: user.phone,
            address: user.address,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
        };

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: userResponse,
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            success: false,
            error: "Server error during registration",
        });
    }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const login = async(req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "Email and password are required",
            });
        }

        // Find user by email
        const user = await User.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password",
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: "Account is deactivated",
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

        // Generate token
        const token = generateToken(user._id);

        // Update last login
        await user.updateLastLogin();

        // Return user data without password
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            phone: user.phone,
            address: user.address,
            lastLogin: user.lastLogin,
            displayName: user.displayName,
        };

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: userResponse,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            error: "Server error during login",
        });
    }
};

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
const updateProfile = async(req, res) => {
    try {
        const { fullName, phone, address, email } = req.body;

        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (email !== undefined) updateData.email = email;

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
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                phone: user.phone,
                address: user.address,
                displayName: user.displayName,
            },
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            error: "Server error updating profile",
        });
    }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async(req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: "Current password and new password are required",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: "New password must be at least 6 characters long",
            });
        }

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

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedNewPassword;
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
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async(req, res) => {
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
};

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async(req, res) => {
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
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async(req, res) => {
    try {
        const { role, isActive, fullName, phone, address } = req.body;

        const updateData = {};
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (fullName !== undefined) updateData.fullName = fullName;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;

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
        console.error("Update user error:", error);
        res.status(500).json({
            success: false,
            error: "Server error updating user",
        });
    }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async(req, res) => {
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
};

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
const createAdminUser = async(req, res) => {
    try {
        const { username, email, password, fullName, phone, address } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: "Username, email, and password are required",
            });
        }

        // Check if user already exists
        const existingUser = await User.findByEmailOrUsername(email, username);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: existingUser.email === email ?
                    "Email already registered" : "Username already taken",
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            fullName,
            phone,
            address,
            role: 'admin', // Always set role to admin
        });

        // Return user data without password
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            phone: user.phone,
            address: user.address,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
        };

        res.status(201).json({
            success: true,
            message: "Admin user created successfully",
            user: userResponse,
        });
    } catch (error) {
        console.error("Create admin user error:", error);

        // Return appropriate error status based on error type
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: "Validation error",
                details: error.message,
            });
        }

        if (error.code === 11000) { // MongoDB duplicate key error
            return res.status(409).json({
                success: false,
                error: "User already exists",
            });
        }

        res.status(500).json({
            success: false,
            error: "Server error during user creation",
        });
    }
};

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