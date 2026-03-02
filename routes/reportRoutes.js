const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getDashboardData, getCompareYears, exportExcel, exportPDF } = require('../controllers/reportController');

const router = express.Router();

router.use(protect);
router.use(authorize('SUPER_ADMIN', 'WARD_ADMIN'));

router.get('/dashboard', getDashboardData);
router.get('/compare', getCompareYears);
router.get('/export/excel', exportExcel);
router.get('/export/pdf', exportPDF);

module.exports = router;
