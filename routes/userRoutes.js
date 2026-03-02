const express = require("express");
const {
  register,
  createAdminUser,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
} = require("../controllers/userController");

const { protect, authorize } = require("../middleware/auth");
const {
  userValidation,
  idValidation,
  queryValidation,
} = require("../middleware/validation");

const router = express.Router();

// Public routes
router.post("/register", userValidation.register, register);
router.post(
  "/login",
  (req, res, next) => {
    console.log(
      "[LOGIN] Request received:",
      req.method,
      req.url,
      "Body:",
      JSON.stringify(req.body),
    );
    next();
  },
  userValidation.login,
  login,
);

// Protected routes (require authentication)
router.use(protect); // All routes below require authentication

// User profile routes
router.get("/profile", getProfile);
router.put("/profile", userValidation.updateProfile, updateProfile);
router.put("/change-password", changePassword);

// Admin routes (SUPER_ADMIN xem tất cả; WARD_ADMIN xem/quản lý user của phường mình)
router.post(
  "/create-admin",
  authorize("SUPER_ADMIN", "WARD_ADMIN"),
  userValidation.register,
  createAdminUser,
);
router.get(
  "/",
  authorize("SUPER_ADMIN", "WARD_ADMIN"),
  queryValidation.pagination,
  getUsers,
);
router.get("/stats", authorize("SUPER_ADMIN", "WARD_ADMIN"), getUserStats);
router.get(
  "/:id",
  authorize("SUPER_ADMIN", "WARD_ADMIN"),
  idValidation,
  getUserById,
);
router.put(
  "/:id",
  authorize("SUPER_ADMIN", "WARD_ADMIN"),
  idValidation,
  updateUser,
);
router.delete(
  "/:id",
  authorize("SUPER_ADMIN", "WARD_ADMIN"),
  idValidation,
  deleteUser,
);

module.exports = router;
