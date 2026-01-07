const express = require('express');
const {
  getDrainageData,
  getDrainageById,
  createDrainageData,
  updateDrainageData,
  deleteDrainageData,
  getDrainageByWard,
  getDrainageStats,
  getMaintenanceNeeded
} = require('../controllers/drainageController');

const { protect, authorize } = require('../middleware/auth');
const { idValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', queryValidation.pagination, getDrainageData);
router.get('/stats', getDrainageStats);
router.get('/maintenance-needed', getMaintenanceNeeded);
router.get('/ward/:wardId', getDrainageByWard);
router.get('/:id', idValidation, getDrainageById);

// Admin only routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', createDrainageData);
router.put('/:id', idValidation, updateDrainageData);
router.delete('/:id', idValidation, deleteDrainageData);

module.exports = router;