const express = require('express');
const {
  registerUser,
  loginUser,
  registerOrganizer,
} = require('../controllers/authController');

const {
  requestPasswordReset,
  getMyResetRequests,
} = require('../controllers/passwordResetController');

const router = express.Router();

const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Admin-only route to register Organizers
router.post('/register-organizer', verifyToken, authorizeRoles('Admin'), registerOrganizer);

// Password reset routes
router.post('/request-password-reset', verifyToken, requestPasswordReset);
router.get('/my-reset-requests', verifyToken, getMyResetRequests);

module.exports = router;
