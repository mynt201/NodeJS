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
    bulkImportWeather,
    syncWeatherFromAPI,
    syncWeatherForWard
} = require('../controllers/weatherController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getWeatherData);
router.get('/latest', getLatestWeather);
router.get('/ward/:wardId', getWeatherByWard);
router.get('/stats/:wardId', getWeatherStats);
router.get('/:id', getWeatherById);

// Admin only routes
router.use(protect); // All routes below require authentication
router.use(authorize('admin')); // All routes below require admin role

router.post('/', createWeatherData);
router.post('/bulk-import', bulkImportWeather);
router.post('/sync', syncWeatherFromAPI);
router.post('/sync/:wardId', syncWeatherForWard);
router.put('/:id', updateWeatherData);
router.delete('/:id', deleteWeatherData);

module.exports = router;