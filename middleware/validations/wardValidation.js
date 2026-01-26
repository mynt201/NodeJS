const { body } = require('express-validator');

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
    ]
};

module.exports = wardValidation;