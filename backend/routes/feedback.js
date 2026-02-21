const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  submitFeedback,
  getEventFeedback,
  canSubmitFeedback,
  getMyFeedback,
  getFeedbackStats
} = require('../controllers/feedbackController');

const { protect } = require('../middleware/auth');

// Public route
router.route('/stats').get(getFeedbackStats);

// Protected routes
router.route('/can-submit').get(protect, canSubmitFeedback);
router.route('/my-feedback').get(protect, getMyFeedback);

router.route('/')
  .get(protect, getEventFeedback)
  .post(protect, submitFeedback);

module.exports = router;
