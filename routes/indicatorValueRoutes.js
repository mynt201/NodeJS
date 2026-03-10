const express = require("express");
const multer = require("multer");
const {
  getValues,
  getValueById,
  getAvailableYears,
  createValue,
  updateValue,
  upsertValue,
  deleteValue,
  bulkUpsert,
  downloadTemplate,
  uploadCsv,
} = require("../controllers/indicatorValueController");
const { protect, authorize } = require("../middleware/auth");
const { validateYup } = require("../middleware/yupValidator");
const yup = require("yup");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const bulkUpsertSchema = yup.object().shape({
  items: yup
    .array()
    .of(
      yup.object().shape({
        unit_id: yup
          .string()
          .trim()
          .required("Đơn vị hành chính (unit_id) là bắt buộc"),
        indicator_id: yup
          .string()
          .trim()
          .required("Chỉ số (indicator_id) là bắt buộc"),
        data_year: yup
          .number()
          .typeError("Năm dữ liệu phải là số")
          .integer("Năm dữ liệu phải là số nguyên")
          .min(2000, "Năm dữ liệu phải từ 2000 trở lên")
          .max(2100, "Năm dữ liệu không hợp lệ")
          .required("Năm dữ liệu là bắt buộc"),
        raw_value: yup
          .number()
          .typeError("Giá trị thô phải là số")
          .required("Giá trị thô là bắt buộc"),
      }),
    )
    .min(1, "Danh sách items không được rỗng")
    .required("Danh sách items là bắt buộc"),
});

router.get("/", getValues);
router.get("/years", getAvailableYears);
router.get("/template", protect, authorize("SUPER_ADMIN", "WARD_ADMIN"), downloadTemplate);
router.get("/:id", getValueById);

router.use(protect);
router.post(
  "/upload-csv",
  authorize("SUPER_ADMIN", "WARD_ADMIN"),
  upload.single("file"),
  uploadCsv,
);
router.post(
  "/bulk-upsert",
  authorize("SUPER_ADMIN", "WARD_ADMIN"),
  validateYup(bulkUpsertSchema),
  bulkUpsert,
);
router.post("/upsert", authorize("SUPER_ADMIN", "WARD_ADMIN"), upsertValue);
router.post("/", authorize("SUPER_ADMIN", "WARD_ADMIN"), createValue);
router.put("/:id", authorize("SUPER_ADMIN", "WARD_ADMIN"), updateValue);
router.delete("/:id", authorize("SUPER_ADMIN", "WARD_ADMIN"), deleteValue);

module.exports = router;
