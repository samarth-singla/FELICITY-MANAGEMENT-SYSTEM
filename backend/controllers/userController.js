const User = require('../models/User');
const PasswordChangeRequest = require('../models/PasswordChangeRequest');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user details
// @route   PUT /api/users/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Update common fields
  if (req.body.firstName) user.firstName = req.body.firstName;
  if (req.body.lastName) user.lastName = req.body.lastName;
  if (req.body.email) user.email = req.body.email;

  // Update role-specific fields
  if (user.role === 'Participant') {
    if (req.body.collegeName) user.collegeName = req.body.collegeName;
    if (req.body.contactNumber) user.contactNumber = req.body.contactNumber;
    if (req.body.areasOfInterest) user.preferences.areasOfInterest = req.body.areasOfInterest;
    if (req.body.followedClubs) user.preferences.followedClubs = req.body.followedClubs;
  } else if (user.role === 'Organizer') {
    if (req.body.organizerName) user.organizerName = req.body.organizerName;
    if (req.body.category) user.category = req.body.category;
    if (req.body.description) user.description = req.body.description;
    if (req.body.contactEmail) user.contactEmail = req.body.contactEmail;
    if (req.body.contactNumber !== undefined) user.contactNumber = req.body.contactNumber;
    if (req.body.discordWebhookUrl !== undefined) user.discordWebhookUrl = req.body.discordWebhookUrl;
  }

  await user.save({ validateBeforeSave: true });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update password (Organizers must use password reset request)
// @route   PUT /api/users/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  // Organizers must use password reset request workflow (cannot set their own password)
  if (user.role === 'Organizer') {
    return next(new ErrorResponse(
      'Organizers cannot change password directly. Please submit a password reset request through the password reset workflow with a reason. Admin will review and generate a new password for you.',
      403
    ));
  }

  // For non-organizers (Participants/Admins), change password directly
  user.password = req.body.newPassword;
  await user.save();

  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    token,
  });
});

// @desc    Update participant preferences (interests and following)
// @route   PUT /api/users/preferences
// @access  Private (Participant only)
exports.updatePreferences = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Only Participants can update preferences
  if (user.role !== 'Participant') {
    return next(new ErrorResponse('Only Participants can update preferences', 403));
  }

  const { interests, following } = req.body;

  // Update interests if provided
  if (interests !== undefined) {
    if (!Array.isArray(interests)) {
      return next(new ErrorResponse('Interests must be an array', 400));
    }
    user.preferences.interests = interests;
  }

  // Update following if provided
  if (following !== undefined) {
    if (!Array.isArray(following)) {
      return next(new ErrorResponse('Following must be an array', 400));
    }
    
    // Verify all users in following array are Organizers
    if (following.length > 0) {
      const organizers = await User.find({
        _id: { $in: following },
        role: 'Organizer'
      });
      
      if (organizers.length !== following.length) {
        return next(new ErrorResponse('You can only follow Organizers', 400));
      }
    }
    
    user.preferences.following = following;
  }

  await user.save({ validateBeforeSave: true });

  // Populate following field with organizer details
  await user.populate('preferences.following', 'firstName lastName email organizerName category');

  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      interests: user.preferences.interests,
      following: user.preferences.following
    }
  });
});

// @desc    Get all active organizers (for participants to follow)
// @route   GET /api/users/organizers
// @access  Private (any authenticated user)
exports.getActiveOrganizers = asyncHandler(async (req, res, next) => {
  const organizers = await User.find({
    role: 'Organizer',
    accountStatus: 'active'
  }).select('firstName lastName email organizerName category description contactEmail createdAt');

  res.status(200).json({
    success: true,
    count: organizers.length,
    data: organizers
  });
});

// @desc    Get single organizer details with events
// @route   GET /api/users/organizer/:id
// @access  Private (any authenticated user)
exports.getOrganizerById = asyncHandler(async (req, res, next) => {
  const Event = require('../models/Event');
  
  const organizer = await User.findById(req.params.id)
    .select('firstName lastName email organizerName category description contactEmail createdAt');

  if (!organizer) {
    return next(new ErrorResponse('Organizer not found', 404));
  }

  if (organizer.role !== 'Organizer') {
    return next(new ErrorResponse('User is not an organizer', 400));
  }

  // Get organizer's events
  const events = await Event.find({ organizer: req.params.id })
    .select('title description category eventType startDate endDate location imageUrl registrationFee maxCapacity currentRegistrations')
    .sort({ startDate: -1 });

  // Count followers
  const followersCount = await User.countDocuments({
    role: 'Participant',
    'preferences.following': req.params.id
  });

  res.status(200).json({
    success: true,
    data: {
      organizer,
      events,
      followersCount
    }
  });
});

// @desc    Get organizer's password change request status
// @route   GET /api/users/password-change-request
// @access  Private (Organizer only)
exports.getPasswordChangeRequestStatus = asyncHandler(async (req, res, next) => {
  const request = await PasswordChangeRequest.findOne({
    organizer: req.user.id
  })
  .sort({ createdAt: -1 }) // Get the most recent request
  .populate('reviewedBy', 'firstName lastName email');

  res.status(200).json({
    success: true,
    data: request
  });
});
