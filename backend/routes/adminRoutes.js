const express = require('express');
const {
  provisionOrganizer,
  getOrganizers,
  getOrganizer,
  toggleOrganizerStatus,
  updateOrganizer,
  deleteOrganizer,
  getPasswordResetRequests,
  approvePasswordResetRequest,
  rejectPasswordResetRequest,
  getPasswordChangeRequests,
  approvePasswordChangeRequest,
  rejectPasswordChangeRequest,
  getAdminStats,
} = require('../controllers/adminController');

const router = express.Router();

const { verifyToken, authorizeRoles } = require('../middleware/auth');

// All routes require Admin authentication
router.use(verifyToken);
router.use(authorizeRoles('Admin'));

// Admin statistics
router.get('/stats', getAdminStats);

// Organizer provisioning
router.post('/provision-organizer', provisionOrganizer);

// Organizer management
router.route('/organizers')
  .get(getOrganizers);

router.route('/organizers/:id')
  .get(getOrganizer)
  .put(updateOrganizer)
  .delete(deleteOrganizer);

router.put('/organizers/:id/status', toggleOrganizerStatus);

// Password reset request management
router.get('/reset-requests', getPasswordResetRequests);
router.put('/reset-requests/:id/approve', approvePasswordResetRequest);
router.put('/reset-requests/:id/reject', rejectPasswordResetRequest);

// Password change request management (for organizers)
router.get('/password-change-requests', getPasswordChangeRequests);
router.put('/password-change-requests/:id/approve', approvePasswordChangeRequest);
router.put('/password-change-requests/:id/reject', rejectPasswordChangeRequest);

module.exports = router;
