const express = require('express');
const {
  getWeatherData,
  getWeatherById,
  createWeatherData,
  updateWeatherData,
  deleteWeatherData,
  getWeatherByWard,
  getLatestWeather,
  getWeatherStats,
  bulkImportWeather
} = require('../controllers/weatherController');

const { protect, authorize } = require('../middleware/auth');
const { weatherValidation, idValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', queryValidation.pagination, getWeatherData);
router.get('/latest', getLatestWeather);
router.get('/ward/:wardId', getWeatherByWard);
router.get('/stats/:wardId', getWeatherStats);
router.get('/:id', idValidation, getWeatherById);

// Admin only routes
router.use(protect); // All routes below require authentication
router.use(authorize('admin')); // All routes below require admin role

router.post('/', weatherValidation.create, createWeatherData);
router.post('/bulk-import', bulkImportWeather);
router.put('/:id', idValidation, weatherValidation.update, updateWeatherData);
router.delete('/:id', idValidation, deleteWeatherData);

module.exports = router;