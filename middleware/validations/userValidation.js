const { body } = require('express-validator');
const yup = require('yup');

// Yup validation schemas
const loginSchema = yup.object().shape({
    email: yup
        .string()
        .required('Email là bắt buộc')
        .email('Email không hợp lệ'),
    password: yup
        .string()
        .required('Mật khẩu là bắt buộc')
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
});

const registerSchema = yup.object().shape({
    username: yup
        .string()
        .required('Tên đăng nhập là bắt buộc')
        .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
        .max(50, 'Tên đăng nhập không được vượt quá 50 ký tự')
        .matches(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'),
    email: yup
        .string()
        .required('Email là bắt buộc')
        .email('Email không hợp lệ'),
    password: yup
        .string()
        .required('Mật khẩu là bắt buộc')
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    fullName: yup
        .string()
        .optional()
        .max(100, 'Họ tên không được vượt quá 100 ký tự'),
    phone: yup
        .string()
        .optional()
        .matches(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ'),
    address: yup
        .string()
        .optional()
        .max(200, 'Địa chỉ không được vượt quá 200 ký tự')
});

const updateProfileSchema = yup.object().shape({
    fullName: yup
        .string()
        .optional()
        .max(100, 'Họ tên không được vượt quá 100 ký tự'),
    phone: yup
        .string()
        .optional()
        .matches(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ'),
    address: yup
        .string()
        .optional()
        .max(200, 'Địa chỉ không được vượt quá 200 ký tự'),
    email: yup
        .string()
        .optional()
        .email('Email không hợp lệ')
});

// Express-validator schemas
const userValidation = {
    register: [
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
            .withMessage('Password must be at least 6 characters long'),

        body('fullName')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Full name cannot exceed 100 characters'),

        body('phone')
            .optional()
            .matches(/^[0-9+\-\s()]+$/)
            .withMessage('Please provide a valid phone number'),
    ],

    login: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),

        body('password')
            .notEmpty()
            .withMessage('Password is required'),
    ],

    updateProfile: [
        body('fullName')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Full name cannot exceed 100 characters'),

        body('phone')
            .optional()
            .matches(/^[0-9+\-\s()]+$/)
            .withMessage('Please provide a valid phone number'),

        body('address')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('Address cannot exceed 200 characters'),

        body('email')
            .optional()
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email'),
    ]
};

module.exports = userValidation;