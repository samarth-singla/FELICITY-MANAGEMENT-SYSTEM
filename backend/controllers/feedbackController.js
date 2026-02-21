const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Submit feedback for an event
// @route   POST /api/events/:eventId/feedback
// @access  Private (Participant who attended)
exports.submitFeedback = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const { rating, comment } = req.body;

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  // Check if user attended the event
  const registration = await Registration.findOne({
    event: eventId,
    participant: req.user.id,
    status: 'attended'
  });

  if (!registration) {
    return next(new ErrorResponse('Only participants who attended can submit feedback', 403));
  }

  // Check if feedback already exists
  const existingFeedback = await Feedback.findOne({
    event: eventId,
    participant: req.user.id
  });

  if (existingFeedback) {
    return next(new ErrorResponse('You have already submitted feedback for this event', 400));
  }

  // Create feedback
  const feedback = await Feedback.create({
    event: eventId,
    participant: req.user.id,
    registration: registration._id,
    rating,
    comment
  });

  res.status(201).json({
    success: true,
    data: feedback
  });
});

// @desc    Get feedback for an event (Organizer view - can see all)
// @route   GET /api/events/:eventId/feedback
// @access  Private (Organizer)
exports.getEventFeedback = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const { rating } = req.query;

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  // Check if user is organizer
  if (event.organizer.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new ErrorResponse('Not authorized to view feedback for this event', 403));
  }

  // Build query
  let query = { event: eventId };
  if (rating && !isNaN(rating)) {
    query.rating = parseInt(rating);
  }

  // Get feedbacks (anonymous - don't populate participant details)
  const feedbacks = await Feedback.find(query)
    .select('-participant')
    .sort({ createdAt: -1 });

  // Get aggregated statistics
  const stats = await Feedback.getAverageRating(eventId);

  res.status(200).json({
    success: true,
    count: feedbacks.length,
    stats,
    data: feedbacks
  });
});

// @desc    Check if user can submit feedback for an event
// @route   GET /api/events/:eventId/feedback/can-submit
// @access  Private (Participant)
exports.canSubmitFeedback = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  // Check if user attended the event
  const registration = await Registration.findOne({
    event: eventId,
    participant: req.user.id,
    status: 'attended'
  });

  if (!registration) {
    return res.status(200).json({
      success: true,
      canSubmit: false,
      reason: 'You have not attended this event'
    });
  }

  // Check if feedback already exists
  const existingFeedback = await Feedback.findOne({
    event: eventId,
    participant: req.user.id
  });

  if (existingFeedback) {
    return res.status(200).json({
      success: true,
      canSubmit: false,
      reason: 'You have already submitted feedback',
      feedback: existingFeedback
    });
  }

  res.status(200).json({
    success: true,
    canSubmit: true
  });
});

// @desc    Get my feedback for an event
// @route   GET /api/events/:eventId/feedback/my-feedback
// @access  Private (Participant)
exports.getMyFeedback = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const feedback = await Feedback.findOne({
    event: eventId,
    participant: req.user.id
  });

  if (!feedback) {
    return next(new ErrorResponse('No feedback found', 404));
  }

  res.status(200).json({
    success: true,
    data: feedback
  });
});

// @desc    Get feedback statistics for an event (public)
// @route   GET /api/events/:eventId/feedback/stats
// @access  Public
exports.getFeedbackStats = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  const stats = await Feedback.getAverageRating(eventId);

  res.status(200).json({
    success: true,
    data: stats
  });
});
