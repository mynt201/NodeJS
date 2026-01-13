const express = require('express');
const {
  getRiskIndexData,
  getRiskById,
  createRiskIndexData,
  updateRiskIndexData,
  deleteRiskIndexData,
  getRiskHistoryByWard,
  getCurrentRiskLevels,
  recalculateRisk,
  getRiskTrend,
  bulkImportRisk
} = require('../controllers/riskController');

const { protect, authorize } = require('../middleware/auth');
const { idValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', queryValidation.pagination, getRiskIndexData);
router.get('/current', getCurrentRiskLevels);
router.get('/ward/:wardId', getRiskHistoryByWard);
router.get('/trend/:wardId', getRiskTrend);
router.get('/:id', idValidation, getRiskById);

// Admin only routes
router.use(protect);
router.use(authorize('admin'));

router.post('/', createRiskIndexData);
router.post('/bulk-import', bulkImportRisk);
router.put('/:id', idValidation, updateRiskIndexData);
router.delete('/:id', idValidation, deleteRiskIndexData);
router.post('/:id/recalculate', idValidation, recalculateRisk);

module.exports = router;