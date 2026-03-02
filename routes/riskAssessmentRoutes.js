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
const { validateYup } = require("../middleware/yupValidator");
const yup = require("yup");

const router = express.Router();

const refreshSchema = yup.object().shape({
  year: yup
    .number()
    .typeError("Năm phải là số")
    .integer("Năm phải là số nguyên")
    .min(2000, "Năm phải từ 2000 trở lên")
    .max(2100, "Năm không hợp lệ")
    .optional(),
});

const upsertAssessmentSchema = yup.object().shape({
  unit_id: yup
    .string()
    .trim()
    .required("Đơn vị hành chính (unit_id) là bắt buộc"),
  year: yup
    .number()
    .typeError("Năm phải là số")
    .integer("Năm phải là số nguyên")
    .min(2000, "Năm phải từ 2000 trở lên")
    .max(2100, "Năm không hợp lệ")
    .required("Năm là bắt buộc"),
  total_score: yup
    .number()
    .typeError("Điểm rủi ro phải là số")
    .min(0, "Điểm rủi ro không được âm")
    .max(1, "Điểm rủi ro tối đa là 1")
    .optional(),
  risk_score: yup
    .number()
    .typeError("Điểm rủi ro phải là số")
    .min(0, "Điểm rủi ro không được âm")
    .max(1, "Điểm rủi ro tối đa là 1")
    .optional(),
  risk_level: yup
    .string()
    .oneOf(["Thấp", "Trung bình", "Cao"], "Mức độ rủi ro không hợp lệ")
    .required("Mức độ rủi ro là bắt buộc"),
});

const bulkUpsertAssessmentSchema = yup.object().shape({
  items: yup
    .array()
    .of(upsertAssessmentSchema)
    .min(1, "Danh sách đánh giá không được rỗng")
    .required("Danh sách đánh giá là bắt buộc"),
});

router.use(protect);
router.use(authorize("SUPER_ADMIN", "WARD_ADMIN"));

router.get("/stats", getStats);
router.get("/year/:year", getByYear);
router.get("/", getAssessments);
router.get("/:id", getAssessmentById);
router.post("/refresh", validateYup(refreshSchema, "query"), refreshAssessments);
router.post(
  "/bulk-upsert",
  validateYup(bulkUpsertAssessmentSchema),
  bulkUpsert,
);
router.post("/upsert", validateYup(upsertAssessmentSchema), upsertAssessment);
router.post("/", validateYup(upsertAssessmentSchema), createAssessment);
router.put("/:id", validateYup(upsertAssessmentSchema), updateAssessment);
router.delete("/:id", deleteAssessment);

module.exports = router;
