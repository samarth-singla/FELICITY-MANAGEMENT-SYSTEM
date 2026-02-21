const express = require('express');
const {
  getMe,
  updateDetails,
  updatePassword,
  updatePreferences,
  getActiveOrganizers,
  getOrganizerById,
  getPasswordChangeRequestStatus,
} = require('../controllers/userController');

const router = express.Router();

const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.get('/me', verifyToken, getMe);
router.put('/updatedetails', verifyToken, updateDetails);
router.put('/updatepassword', verifyToken, updatePassword);
router.put('/change-password', verifyToken, updatePassword);
router.put('/preferences', verifyToken, updatePreferences);
router.get('/organizers', verifyToken, getActiveOrganizers);
router.get('/organizer/:id', verifyToken, getOrganizerById);
router.get('/password-change-request', verifyToken, getPasswordChangeRequestStatus);

module.exports = router;
