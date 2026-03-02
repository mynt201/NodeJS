const express = require("express");
const { getFloodRiskGeoJSON } = require("../controllers/mapController");

const router = express.Router();

router.get("/flood-risk", getFloodRiskGeoJSON);

module.exports = router;
