const express = require("express");
const { getFloodRiskGeoJSON, getUnitDetail } = require("../controllers/mapController");

const router = express.Router();

router.get("/flood-risk", getFloodRiskGeoJSON);
router.get("/unit/:id/detail", getUnitDetail);

module.exports = router;
