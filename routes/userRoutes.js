const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');
const { userValidation, idValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', userValidation.register, register);
router.post('/login', userValidation.login, login);

// Protected routes (require authentication)
router.use(protect); // All routes below require authentication

// User profile routes
router.get('/profile', getProfile);
router.put('/profile', userValidation.updateProfile, updateProfile);
router.put('/change-password', changePassword);

// Admin only routes
router.get('/', authorize('admin'), queryValidation.pagination, getUsers);
router.get('/stats', authorize('admin'), getUserStats);
router.get('/:id', authorize('admin'), idValidation, getUserById);
router.put('/:id', authorize('admin'), idValidation, updateUser);
router.delete('/:id', authorize('admin'), idValidation, deleteUser);

module.exports = router;