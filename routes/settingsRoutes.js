const express = require('express');
const {
  getSettings,
  updateSettings,
  resetSettings,
  updateNotifications,
  getSystemStats,
  getDefaults
} = require('../controllers/settingsController');

const { protect, authorize } = require('../middleware/auth');
const { settingsValidation } = require('../middleware/validation');

const router = express.Router();

// All settings routes require authentication
router.use(protect);

// User settings routes
router.get('/', getSettings);
router.put('/', settingsValidation.update, updateSettings);
router.post('/reset', resetSettings);
router.put('/notifications', settingsValidation.notifications, updateNotifications);

// Admin only routes
router.get('/stats', authorize('admin'), getSystemStats);

// Public routes
router.get('/defaults', getDefaults);

module.exports = router;