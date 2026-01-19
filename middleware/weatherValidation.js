const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const WeatherData = require('../models/WeatherData');
const Ward = require('../models/Ward');

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
const getWeatherDataValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('ward_id')
        .optional()
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid ward ID format');
            }
            return true;
        }),

    query('date_from')
        .optional()
        .isISO8601()
        .withMessage('date_from must be a valid ISO8601 date'),

    query('date_to')
        .optional()
        .isISO8601()
        .withMessage('date_to must be a valid ISO8601 date'),

    query('is_forecast')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('is_forecast must be true or false'),

    query('sort')
        .optional()
        .isIn(['date', 'temperature.current', 'rainfall', 'humidity', 'createdAt'])
        .withMessage('Invalid sort field'),

    query('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Order must be asc or desc')
];

const getWeatherByIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid weather data ID')
];

const createWeatherDataValidation = [
    body('ward_id')
        .notEmpty()
        .withMessage('Ward ID is required')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid ward ID format');
            }
            return true;
        })
        .custom(async (value) => {
            const ward = await Ward.findById(value);
            if (!ward) {
                throw new Error('Ward not found');
            }
            return true;
        }),

    body('date')
        .notEmpty()
        .withMessage('Date is required')
        .isISO8601()
        .withMessage('Date must be a valid ISO8601 date'),

    body('temperature.current')
        .optional()
        .isFloat({ min: -50, max: 60 })
        .withMessage('Current temperature must be between -50°C and 60°C'),

    body('temperature.min')
        .optional()
        .isFloat({ min: -50, max: 60 })
        .withMessage('Min temperature must be between -50°C and 60°C'),

    body('temperature.max')
        .optional()
        .isFloat({ min: -50, max: 60 })
        .withMessage('Max temperature must be between -50°C and 60°C'),

    body('temperature.feels_like')
        .optional()
        .isFloat({ min: -50, max: 60 })
        .withMessage('Feels like temperature must be between -50°C and 60°C'),

    body('humidity')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Humidity must be between 0% and 100%'),

    body('rainfall')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Rainfall cannot be negative'),

    body('wind_speed')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Wind speed cannot be negative'),

    body('wind_direction')
        .optional()
        .isFloat({ min: 0, max: 360 })
        .withMessage('Wind direction must be between 0-360 degrees'),

    body('wind_gust')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Wind gust cannot be negative'),

    body('pressure')
        .optional()
        .isFloat({ min: 800, max: 1200 })
        .withMessage('Pressure must be between 800-1200 hPa'),

    body('visibility')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Visibility cannot be negative'),

    body('weather_condition.main')
        .optional()
        .isIn(['Clear', 'Clouds', 'Rain', 'Drizzle', 'Thunderstorm', 'Snow', 'Mist', 'Fog'])
        .withMessage('Invalid weather condition'),

    body('weather_condition.description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Weather description cannot exceed 200 characters'),

    body('weather_condition.icon')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('Weather icon code cannot exceed 10 characters'),

    body('uv_index')
        .optional()
        .isFloat({ min: 0, max: 11 })
        .withMessage('UV index must be between 0-11'),

    body('aqi')
        .optional()
        .isFloat({ min: 0, max: 500 })
        .withMessage('AQI must be between 0-500'),

    body('data_source')
        .optional()
        .isIn(['weather_api', 'manual', 'sensor', 'forecast'])
        .withMessage('Invalid data source'),

    body('is_forecast')
        .optional()
        .isBoolean()
        .withMessage('is_forecast must be a boolean'),

    body('confidence_level')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Confidence level must be between 0-100')
];

const updateWeatherDataValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid weather data ID'),

    body('ward_id')
        .optional()
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid ward ID format');
            }
            return true;
        })
        .custom(async (value) => {
            const ward = await Ward.findById(value);
            if (!ward) {
                throw new Error('Ward not found');
            }
            return true;
        }),

    body('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be a valid ISO8601 date'),

    body('temperature.current')
        .optional()
        .isFloat({ min: -50, max: 60 })
        .withMessage('Current temperature must be between -50°C and 60°C'),

    body('temperature.min')
        .optional()
        .isFloat({ min: -50, max: 60 })
        .withMessage('Min temperature must be between -50°C and 60°C'),

    body('temperature.max')
        .optional()
        .isFloat({ min: -50, max: 60 })
        .withMessage('Max temperature must be between -50°C and 60°C'),

    body('temperature.feels_like')
        .optional()
        .isFloat({ min: -50, max: 60 })
        .withMessage('Feels like temperature must be between -50°C and 60°C'),

    body('humidity')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Humidity must be between 0% and 100%'),

    body('rainfall')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Rainfall cannot be negative'),

    body('wind_speed')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Wind speed cannot be negative'),

    body('wind_direction')
        .optional()
        .isFloat({ min: 0, max: 360 })
        .withMessage('Wind direction must be between 0-360 degrees'),

    body('wind_gust')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Wind gust cannot be negative'),

    body('pressure')
        .optional()
        .isFloat({ min: 800, max: 1200 })
        .withMessage('Pressure must be between 800-1200 hPa'),

    body('visibility')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Visibility cannot be negative'),

    body('weather_condition.main')
        .optional()
        .isIn(['Clear', 'Clouds', 'Rain', 'Drizzle', 'Thunderstorm', 'Snow', 'Mist', 'Fog'])
        .withMessage('Invalid weather condition'),

    body('weather_condition.description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Weather description cannot exceed 200 characters'),

    body('weather_condition.icon')
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage('Weather icon code cannot exceed 10 characters'),

    body('uv_index')
        .optional()
        .isFloat({ min: 0, max: 11 })
        .withMessage('UV index must be between 0-11'),

    body('aqi')
        .optional()
        .isFloat({ min: 0, max: 500 })
        .withMessage('AQI must be between 0-500'),

    body('data_source')
        .optional()
        .isIn(['weather_api', 'manual', 'sensor', 'forecast'])
        .withMessage('Invalid data source'),

    body('is_forecast')
        .optional()
        .isBoolean()
        .withMessage('is_forecast must be a boolean'),

    body('confidence_level')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Confidence level must be between 0-100')
];

const getWeatherByWardValidation = [
    param('wardId')
        .isMongoId()
        .withMessage('Invalid ward ID'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('date_from')
        .optional()
        .isISO8601()
        .withMessage('date_from must be a valid ISO8601 date'),

    query('date_to')
        .optional()
        .isISO8601()
        .withMessage('date_to must be a valid ISO8601 date')
];

const getWeatherStatsValidation = [
    param('wardId')
        .isMongoId()
        .withMessage('Invalid ward ID'),

    query('days')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Days must be between 1 and 365')
];

const bulkImportWeatherValidation = [
    body('weatherData')
        .isArray({ min: 1 })
        .withMessage('Weather data array is required and cannot be empty'),

    body('weatherData.*.ward_id')
        .notEmpty()
        .withMessage('Ward ID is required for each weather data item')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid ward ID format');
            }
            return true;
        }),

    body('weatherData.*.date')
        .notEmpty()
        .withMessage('Date is required for each weather data item')
        .isISO8601()
        .withMessage('Date must be a valid ISO8601 date')
];

// Common utility functions
const buildDateFilter = (dateFrom, dateTo) => {
    const filter = {};
    if (dateFrom || dateTo) {
        filter.date = {};
        if (dateFrom) {
            filter.date.$gte = new Date(dateFrom);
        }
        if (dateTo) {
            filter.date.$lte = new Date(dateTo);
        }
    }
    return filter;
};

const buildPagination = (page, limit) => {
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const skip = (pageNum - 1) * limitNum;
    return { page: pageNum, limit: limitNum, skip };
};

const buildSortOptions = (sort, order) => {
    const sortBy = sort || 'date';
    const sortOrder = order === 'asc' ? 1 : -1;
    return { [sortBy]: sortOrder };
};

const handleDatabaseError = (error, res, customMessage = 'Database operation failed') => {
    console.error(`${customMessage}:`, error);

    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors
        });
    }

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            error: 'Weather data for this ward and date already exists'
        });
    }

    res.status(500).json({
        success: false,
        error: customMessage
    });
};

const validateWardExists = async (wardId) => {
    const ward = await Ward.findById(wardId);
    if (!ward) {
        throw new Error('Ward not found');
    }
    return ward;
};

module.exports = {
    handleValidationErrors,
    getWeatherDataValidation,
    getWeatherByIdValidation,
    createWeatherDataValidation,
    updateWeatherDataValidation,
    getWeatherByWardValidation,
    getWeatherStatsValidation,
    bulkImportWeatherValidation,
    buildDateFilter,
    buildPagination,
    buildSortOptions,
    handleDatabaseError,
    validateWardExists
};
