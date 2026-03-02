const express = require("express");
const {
  getValues,
  getValueById,
  createValue,
  updateValue,
  upsertValue,
  deleteValue,
  bulkUpsert,
} = require("../controllers/indicatorValueController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", getValues);
router.get("/:id", getValueById);

router.use(protect);
router.post("/bulk-upsert", authorize("SUPER_ADMIN", "WARD_ADMIN"), bulkUpsert);
router.post("/upsert", authorize("SUPER_ADMIN", "WARD_ADMIN"), upsertValue);
router.post("/", authorize("SUPER_ADMIN", "WARD_ADMIN"), createValue);
router.put("/:id", authorize("SUPER_ADMIN", "WARD_ADMIN"), updateValue);
router.delete("/:id", authorize("SUPER_ADMIN", "WARD_ADMIN"), deleteValue);

module.exports = router;
