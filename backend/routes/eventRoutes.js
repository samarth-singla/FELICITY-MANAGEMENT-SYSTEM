const express = require('express');
const {
  createEvent,
  getOrganizerEvents,
  getPublicEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  togglePublishEvent,
  registerForEvent,
} = require('../controllers/eventController');

const router = express.Router();

const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Import forum routes
const forumRoutes = require('./forum');
const feedbackRoutes = require('./feedback');

// Re-route into forum routes
router.use('/:eventId/forum', forumRoutes);

// Re-route into feedback routes
router.use('/:eventId/feedback', feedbackRoutes);

// Public routes
router.get('/public', getPublicEvents);
router.get('/:id', getEvent);

// Organizer-specific routes
router.get('/organizer/my-events', verifyToken, authorizeRoles('Organizer'), getOrganizerEvents);

// Protected routes (Organizer/Admin)
router.post('/', verifyToken, authorizeRoles('Organizer', 'Admin'), createEvent);
router.put('/:id', verifyToken, authorizeRoles('Organizer', 'Admin'), updateEvent);
router.delete('/:id', verifyToken, authorizeRoles('Organizer', 'Admin'), deleteEvent);
router.put('/:id/publish', verifyToken, authorizeRoles('Organizer', 'Admin'), togglePublishEvent);

// Registration route (Participant)
router.post('/:id/register', verifyToken, registerForEvent);

module.exports = router;
