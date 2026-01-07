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

const router = express.Router();

// Public routes
router.get('/defaults', getDefaults);

// Protected routes (require authentication)
router.use(protect);

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/reset', resetSettings);
router.put('/notifications', updateNotifications);

// Admin only routes
router.get('/stats', authorize('admin'), getSystemStats);

module.exports = router;