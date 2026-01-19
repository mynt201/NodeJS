const { body, param, query, validationResult } = require('express-validator');
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

// Validation schemas
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),

    body('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),

    body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be between 5 and 200 characters')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),

    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const updateProfileValidation = [
    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),

    body('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),

    body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be between 5 and 200 characters'),

    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
];

const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),

    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const createAdminValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),

    body('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),

    body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be between 5 and 200 characters')
];

const updateUserValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID'),

    body('role')
        .optional()
        .isIn(['admin', 'user'])
        .withMessage('Role must be either admin or user'),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),

    body('fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),

    body('phone')
        .optional()
        .trim()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),

    body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be between 5 and 200 characters')
];

const getUserByIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID')
];

const deleteUserValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID')
];

const getUsersValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('role')
        .optional()
        .custom((value) => {
            if (value === 'all') return true;
            const roles = value.split(',').map(r => r.trim());
            const validRoles = ['admin', 'user'];
            return roles.every(role => validRoles.includes(role));
        })
        .withMessage('Role must be admin, user, or all'),

    query('isActive')
        .optional()
        .custom((value) => {
            return value === 'all' || value === 'true' || value === 'false';
        })
        .withMessage('isActive must be true, false, or all'),

    query('createdFrom')
        .optional()
        .isISO8601()
        .withMessage('createdFrom must be a valid date'),

    query('createdTo')
        .optional()
        .isISO8601()
        .withMessage('createdTo must be a valid date'),

    query('lastLoginFrom')
        .optional()
        .isISO8601()
        .withMessage('lastLoginFrom must be a valid date'),

    query('lastLoginTo')
        .optional()
        .isISO8601()
        .withMessage('lastLoginTo must be a valid date'),

    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),

    query('sort')
        .optional()
        .isIn(['createdAt', 'lastLogin', 'username', 'email', 'name'])
        .withMessage('Sort must be one of: createdAt, lastLogin, username, email, name'),

    query('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Order must be asc or desc')
];

// Common utility functions
const buildUpdateData = (fields, data) => {
    const updateData = {};
    fields.forEach(field => {
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
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        displayName: user.displayName,
    };

    if (includeSensitive) {
        baseResponse.createdAt = user.createdAt;
        baseResponse.lastLogin = user.lastLogin;
        baseResponse.isActive = user.isActive;
        baseResponse.avatar = user.avatar;
    }

    return baseResponse;
};

const checkUserExists = async (email, username) => {
    const existingUser = await User.findByEmailOrUsername(email, username);
    if (existingUser) {
        return existingUser.email === email ?
            "Email already registered" : "Username already taken";
    }
    return null;
};

const handleDatabaseError = (error, res, customMessage = "Database operation failed") => {
    console.error(`${customMessage}:`, error);

    if (error.name === 'ValidationError') {
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
    handleDatabaseError
};