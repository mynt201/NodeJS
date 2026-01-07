const express = require('express');
const {
  getRoadBridgeData,
  getRoadBridgeById,
  createRoadBridgeData,
  updateRoadBridgeData,
  deleteRoadBridgeData,
  getRoadBridgeByWard,
  getHighRiskInfrastructure,
  getInspectionNeeded
} = require('../controllers/roadBridgeController');

const { protect, authorize } = require('../middleware/auth');
const { idValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', queryValidation.pagination, getRoadBridgeData);
router.get('/high-risk', getHighRiskInfrastructure);
router.get('/inspection-needed', getInspectionNeeded);
router.get('/ward/:wardId', getRoadBridgeByWard);
router.get('/:id', idValidation, getRoadBridgeById);

// Admin only routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', createRoadBridgeData);
router.put('/:id', idValidation, updateRoadBridgeData);
router.delete('/:id', idValidation, deleteRoadBridgeData);

module.exports = router;