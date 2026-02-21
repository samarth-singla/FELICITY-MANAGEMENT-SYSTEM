const express = require('express');
const router = express.Router();
const {
  getMyRegistrations,
  getRegistration,
  cancelRegistration,
  getEventRegistrations,
  verifyTicket,
  markAttendance,
  approvePayment,
} = require('../controllers/registrationController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Participant routes
router.get('/me', verifyToken, authorizeRoles('Participant'), getMyRegistrations);
router.get('/:id', verifyToken, getRegistration);
router.put('/:id/cancel', verifyToken, authorizeRoles('Participant'), cancelRegistration);

// Organizer/Admin routes
router.get('/event/:eventId', verifyToken, authorizeRoles('Organizer', 'Admin'), getEventRegistrations);
router.get('/verify/:ticketId', verifyToken, authorizeRoles('Organizer', 'Admin'), verifyTicket);
router.put('/attend/:ticketId', verifyToken, authorizeRoles('Organizer', 'Admin'), markAttendance);
router.put('/:id/approve-payment', verifyToken, authorizeRoles('Organizer', 'Admin'), approvePayment);

module.exports = router;
