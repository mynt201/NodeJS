const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
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

    body('fullName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Full name cannot exceed 100 characters'),

    body('phone')
      .optional()
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage('Please provide a valid phone number'),

    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),

    body('password')
      .notEmpty()
      .withMessage('Password is required'),

    handleValidationErrors
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

    handleValidationErrors
  ]
};

// Ward validation rules
const wardValidation = {
  create: [
    body('ward_name')
      .trim()
      .notEmpty()
      .withMessage('Ward name is required')
      .isLength({ max: 100 })
      .withMessage('Ward name cannot exceed 100 characters'),

    body('district')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('District name cannot exceed 100 characters'),

    body('province')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Province name cannot exceed 100 characters'),

    body('geometry.type')
      .isIn(['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'])
      .withMessage('Invalid geometry type'),

    body('population_density')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Population density must be a positive number'),

    body('rainfall')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Rainfall must be a positive number'),

    body('low_elevation')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Low elevation must be a positive number'),

    body('urban_land')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Urban land percentage must be between 0 and 100'),

    body('drainage_capacity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Drainage capacity must be a positive number'),

    handleValidationErrors
  ],

  update: [
    body('ward_name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Ward name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Ward name cannot exceed 100 characters'),

    body('district')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('District name cannot exceed 100 characters'),

    body('population_density')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Population density must be a positive number'),

    body('rainfall')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Rainfall must be a positive number'),

    body('low_elevation')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Low elevation must be a positive number'),

    body('urban_land')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Urban land percentage must be between 0 and 100'),

    body('drainage_capacity')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Drainage capacity must be a positive number'),

    handleValidationErrors
  ]
};

// Weather data validation rules
const weatherValidation = {
  create: [
    body('ward_id')
      .isMongoId()
      .withMessage('Valid ward ID is required'),

    body('date')
      .isISO8601()
      .withMessage('Valid date is required'),

    body('temperature.current')
      .optional()
      .isFloat({ min: -50, max: 60 })
      .withMessage('Temperature must be between -50°C and 60°C'),

    body('humidity')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Humidity must be between 0% and 100%'),

    body('rainfall')
      .isFloat({ min: 0 })
      .withMessage('Rainfall must be a positive number'),

    body('wind_speed')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Wind speed must be a positive number'),

    body('wind_direction')
      .optional()
      .isFloat({ min: 0, max: 360 })
      .withMessage('Wind direction must be between 0° and 360°'),

    body('pressure')
      .optional()
      .isFloat({ min: 800, max: 1200 })
      .withMessage('Pressure must be between 800 hPa and 1200 hPa'),

    handleValidationErrors
  ],

  update: [
    body('temperature.current')
      .optional()
      .isFloat({ min: -50, max: 60 })
      .withMessage('Temperature must be between -50°C and 60°C'),

    body('humidity')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Humidity must be between 0% and 100%'),

    body('rainfall')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Rainfall must be a positive number'),

    body('wind_speed')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Wind speed must be a positive number'),

    body('wind_direction')
      .optional()
      .isFloat({ min: 0, max: 360 })
      .withMessage('Wind direction must be between 0° and 360°'),

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
  wardValidation,
  weatherValidation,
  settingsValidation,
  idValidation,
  queryValidation,
  handleValidationErrors
};