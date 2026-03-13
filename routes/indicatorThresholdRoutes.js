const express = require("express");
const router = express.Router();
const controller = require("../controllers/indicatorThresholdController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", controller.getList);
router.get("/:id", controller.getById);

router.use(protect);
router.post("/", authorize("SUPER_ADMIN"), controller.create);
router.put("/:id", authorize("SUPER_ADMIN"), controller.update);
router.delete("/:id", authorize("SUPER_ADMIN"), controller.remove);

module.exports = router;
