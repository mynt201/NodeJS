const express = require('express');
const {
  getWards,
  getWardById,
  getWardByName,
  createWard,
  updateWard,
  deleteWard,
  calculateRisk,
  getWardsByRiskLevel,
  getWardStats,
  bulkImportWards
} = require('../controllers/wardController');

const { protect, authorize } = require('../middleware/auth');
const { wardValidation, idValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', queryValidation.pagination, getWards);
router.get('/stats', getWardStats);
router.get('/risk/:level', getWardsByRiskLevel);
router.get('/name/:name', getWardByName);
router.get('/:id', idValidation, getWardById);

// Admin only routes
router.use(protect); // All routes below require authentication
router.use(authorize('admin')); // All routes below require admin role

router.post('/', wardValidation.create, createWard);
router.post('/bulk-import', bulkImportWards);
router.put('/:id', idValidation, wardValidation.update, updateWard);
router.delete('/:id', idValidation, deleteWard);
router.post('/:id/calculate-risk', idValidation, calculateRisk);

module.exports = router;