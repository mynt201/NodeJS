const express = require("express");
const {
  getUnits,
  getAllUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
} = require("../controllers/administrativeUnitController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/all", getAllUnits);
router.get("/", getUnits);
router.get("/:id", getUnitById);

router.use(protect);
router.post("/", authorize("SUPER_ADMIN"), createUnit);
router.put("/:id", authorize("SUPER_ADMIN"), updateUnit);
router.delete("/:id", authorize("SUPER_ADMIN"), deleteUnit);

module.exports = router;
