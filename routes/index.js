const express = require('express');
const router = express.Router();

// Import all route modules
const userRoutes = require('./userRoutes');
const wardRoutes = require('./wardRoutes');
const weatherRoutes = require('./weatherRoutes');
const drainageRoutes = require('./drainageRoutes');
const riskRoutes = require('./riskRoutes');
const roadBridgeRoutes = require('./roadBridgeRoutes');
const settingsRoutes = require('./settingsRoutes');

// Mount routes with /api prefix
router.use('/users', userRoutes);
router.use('/wards', wardRoutes);
router.use('/weather', weatherRoutes);
router.use('/drainage', drainageRoutes);
router.use('/risk', riskRoutes);
router.use('/road-bridge', roadBridgeRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;