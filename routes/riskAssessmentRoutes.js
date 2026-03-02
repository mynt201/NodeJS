const express = require("express");
const {
  getAssessments,
  getByYear,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  upsertAssessment,
  bulkUpsert,
  getStats,
  refreshAssessments,
} = require("../controllers/riskAssessmentController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/stats", getStats);
router.get("/year/:year", getByYear);
router.get("/", getAssessments);
router.get("/:id", getAssessmentById);

router.use(protect);
router.post("/refresh", authorize("SUPER_ADMIN", "WARD_ADMIN"), refreshAssessments);
router.post("/bulk-upsert", authorize("SUPER_ADMIN", "WARD_ADMIN"), bulkUpsert);
router.post(
  "/upsert",
  authorize("SUPER_ADMIN", "WARD_ADMIN"),
  upsertAssessment,
);
router.post("/", authorize("SUPER_ADMIN", "WARD_ADMIN"), createAssessment);
router.put("/:id", authorize("SUPER_ADMIN", "WARD_ADMIN"), updateAssessment);
router.delete("/:id", authorize("SUPER_ADMIN", "WARD_ADMIN"), deleteAssessment);

module.exports = router;
