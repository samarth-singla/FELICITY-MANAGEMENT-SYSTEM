const PasswordResetRequest = require('../models/PasswordResetRequest');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Request password reset (Organizer)
// @route   POST /api/auth/request-password-reset
// @access  Private (Organizer)
exports.requestPasswordReset = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    return next(new ErrorResponse('Please provide a reason for password reset', 400));
  }

  // Check if user already has a pending request
  const existingRequest = await PasswordResetRequest.findOne({
    user: req.user.id,
    status: 'pending',
  });

  if (existingRequest) {
    return next(new ErrorResponse('You already have a pending password reset request', 400));
  }

  // Create reset request
  const resetRequest = await PasswordResetRequest.create({
    user: req.user.id,
    reason,
  });

  res.status(201).json({
    success: true,
    message: 'Password reset request submitted. Admin will review your request.',
    data: resetRequest,
  });
});

// @desc    Get my password reset requests
// @route   GET /api/auth/my-reset-requests
// @access  Private
exports.getMyResetRequests = asyncHandler(async (req, res, next) => {
  const resetRequests = await PasswordResetRequest.find({ user: req.user.id })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: resetRequests.length,
    data: resetRequests,
  });
});

module.exports = {
  requestPasswordReset: exports.requestPasswordReset,
  getMyResetRequests: exports.getMyResetRequests,
};
