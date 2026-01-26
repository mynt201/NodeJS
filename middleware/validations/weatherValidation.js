const { body } = require('express-validator');

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

        body('pressure')
            .optional()
            .isFloat({ min: 800, max: 1200 })
            .withMessage('Pressure must be between 800 hPa and 1200 hPa'),
    ],

    bulkImport: [
        body('weatherData')
            .isArray({ min: 1, max: 1000 })
            .withMessage('Weather data must be an array with 1-1000 items'),

        body('weatherData.*.ward_id')
            .isMongoId()
            .withMessage('Valid ward ID is required for all items'),

        body('weatherData.*.date')
            .isISO8601()
            .withMessage('Valid date is required for all items'),

        body('weatherData.*.temperature.current')
            .optional()
            .isFloat({ min: -50, max: 60 })
            .withMessage('Temperature must be between -50°C and 60°C for all items'),

        body('weatherData.*.humidity')
            .isFloat({ min: 0, max: 100 })
            .withMessage('Humidity must be between 0% and 100% for all items'),

        body('weatherData.*.rainfall')
            .isFloat({ min: 0 })
            .withMessage('Rainfall must be a positive number for all items'),
    ]
};

module.exports = weatherValidation;
};