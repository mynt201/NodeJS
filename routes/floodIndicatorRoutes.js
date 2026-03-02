const express = require("express");
const {
  getIndicators,
  getIndicatorById,
  createIndicator,
  updateIndicator,
  deleteIndicator,
} = require("../controllers/floodIndicatorController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", getIndicators);
router.get("/:id", getIndicatorById);

router.use(protect);
router.post("/", authorize("SUPER_ADMIN"), createIndicator);
router.put("/:id", authorize("SUPER_ADMIN"), updateIndicator);
router.delete("/:id", authorize("SUPER_ADMIN"), deleteIndicator);

module.exports = router;
