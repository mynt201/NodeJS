const express = require('express');
const { getWards } = require('../controllers/wardController');

const router = express.Router();
router.get('/', getWards);

module.exports = router;
