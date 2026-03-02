const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors: trả về key -> message cho FE dễ xử lý
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
      error: 'Dữ liệu không hợp lệ',
      errors: fieldErrors,
    });
  }
  next();
};

// User validation rules
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

    body('full_name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Họ tên là bắt buộc, từ 2 đến 100 ký tự'),

    body('role')
      .optional()
      .isIn(['SUPER_ADMIN', 'WARD_ADMIN'])
      .withMessage('Vai trò phải là SUPER_ADMIN hoặc WARD_ADMIN'),

    body('ward_id')
      .optional()
      .isMongoId()
      .withMessage('ward_id phải là ObjectId hợp lệ'),

    handleValidationErrors
  ],

  login: [
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),

    body('username')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Username cannot be empty'),

    body('password')
      .notEmpty()
      .withMessage('Password is required'),

    // Custom: require email OR username
    (req, res, next) => {
      if (!req.body.email && !req.body.username) {
        return res.status(400).json({
          success: false,
          error: 'Email or username is required',
        });
      }
      next();
    },

    handleValidationErrors
  ],

  updateProfile: [
    body('full_name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Họ tên không được vượt quá 100 ký tự'),

    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Email không hợp lệ'),

    handleValidationErrors
  ]
};

// Generic ID validation
const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid ID is required'),
  handleValidationErrors
];

// Settings validation rules
const settingsValidation = {
  update: [
    body('theme')
      .optional()
      .isIn(['light', 'dark', 'auto'])
      .withMessage('Theme must be light, dark, or auto'),

    body('language')
      .optional()
      .isIn(['vi', 'en'])
      .withMessage('Language must be vi or en'),

    body('dashboard.defaultView')
      .optional()
      .isIn(['map', 'dashboard', 'analytics'])
      .withMessage('Default view must be map, dashboard, or analytics'),

    body('dashboard.refreshInterval')
      .optional()
      .isInt({ min: 30, max: 3600 })
      .withMessage('Refresh interval must be between 30 and 3600 seconds'),

    body('riskThresholds.veryLow')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('Very low threshold must be between 0 and 10'),

    body('riskThresholds.low')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('Low threshold must be between 0 and 10'),

    body('riskThresholds.medium')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('Medium threshold must be between 0 and 10'),

    body('riskThresholds.high')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('High threshold must be between 0 and 10'),

    body('riskThresholds.veryHigh')
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage('Very high threshold must be between 0 and 10'),

    handleValidationErrors
  ],

  notifications: [
    body('type')
      .isIn(['email', 'browser', 'sms'])
      .withMessage('Notification type must be email, browser, or sms'),

    body('settings.enabled')
      .optional()
      .isBoolean()
      .withMessage('Enabled must be a boolean'),

    handleValidationErrors
  ]
};

// Query validation for pagination and filtering
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),

    query('sort')
      .optional()
      .matches(/^[-]?[a-zA-Z_]+$/)
      .withMessage('Invalid sort parameter'),

    handleValidationErrors
  ]
};

module.exports = {
  userValidation,
  settingsValidation,
  idValidation,
  queryValidation,
  handleValidationErrors,
};