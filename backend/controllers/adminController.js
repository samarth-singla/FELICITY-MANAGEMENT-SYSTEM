const crypto = require('crypto');
const User = require('../models/User');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const PasswordChangeRequest = require('../models/PasswordChangeRequest');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Provision a new Organizer (Admin only)
// @route   POST /api/admin/provision-organizer
// @access  Private/Admin
exports.provisionOrganizer = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, organizerName, category, description, contactEmail } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !organizerName || !category) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  // Generate random temporary password (12 characters)
  const tempPassword = crypto.randomBytes(6).toString('hex'); // Generates 12 char hex string

  // Create organizer with generated password
  const organizer = await User.create({
    firstName,
    lastName,
    email,
    password: tempPassword, // Will be hashed by pre-save hook
    role: 'Organizer',
    organizerName,
    category,
    participantType: 'IIIT', // Required by Section 6.2 
    collegeName: 'IIIT Hyderabad', // Required by Section 6.2
    description: description || `${organizerName} - ${category}`,
    contactEmail: contactEmail || email,
    accountStatus: 'active',
  });

  res.status(201).json({
    success: true,
    message: 'Organizer provisioned successfully',
    credentials: {
      email: organizer.email,
      temporaryPassword: tempPassword,
      note: 'Please share these credentials securely with the organizer. They should change the password upon first login.',
    },
    organizer: {
      id: organizer._id,
      firstName: organizer.firstName,
      lastName: organizer.lastName,
      email: organizer.email,
      organizerName: organizer.organizerName,
      category: organizer.category,
      role: organizer.role,
    },
  });
});

// @desc    Get all organizers
// @route   GET /api/admin/organizers
// @access  Private/Admin
exports.getOrganizers = asyncHandler(async (req, res, next) => {
  const { status, search } = req.query;

  // Build query
  let query = { role: 'Organizer' };

  // Filter by account status
  if (status) {
    query.accountStatus = status;
  }

  // Search by name or category
  if (search) {
    query.$or = [
      { organizerName: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const organizers = await User.find(query)
    .select('-password')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: organizers.length,
    data: organizers,
  });
});

// @desc    Get single organizer details
// @route   GET /api/admin/organizers/:id
// @access  Private/Admin
exports.getOrganizer = asyncHandler(async (req, res, next) => {
  const organizer = await User.findById(req.params.id).select('-password');

  if (!organizer || organizer.role !== 'Organizer') {
    return next(new ErrorResponse('Organizer not found', 404));
  }

  res.status(200).json({
    success: true,
    data: organizer,
  });
});

// @desc    Toggle organizer account status (disable/enable/archive)
// @route   PUT /api/admin/organizers/:id/status
// @access  Private/Admin
exports.toggleOrganizerStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  // Validate status
  if (!status || !['active', 'disabled', 'archived'].includes(status)) {
    return next(new ErrorResponse('Please provide a valid status (active, disabled, archived)', 400));
  }

  const organizer = await User.findById(req.params.id);

  if (!organizer || organizer.role !== 'Organizer') {
    return next(new ErrorResponse('Organizer not found', 404));
  }

  // Update status
  organizer.accountStatus = status;
  await organizer.save();

  res.status(200).json({
    success: true,
    message: `Organizer account ${status}`,
    data: {
      id: organizer._id,
      organizerName: organizer.organizerName,
      email: organizer.email,
      accountStatus: organizer.accountStatus,
    },
  });
});

// @desc    Update organizer details
// @route   PUT /api/admin/organizers/:id
// @access  Private/Admin
exports.updateOrganizer = asyncHandler(async (req, res, next) => {
  const organizer = await User.findById(req.params.id);

  if (!organizer || organizer.role !== 'Organizer') {
    return next(new ErrorResponse('Organizer not found', 404));
  }

  // Update allowed fields
  const allowedFields = ['firstName', 'lastName', 'organizerName', 'category', 'description', 'contactEmail'];
  
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      organizer[field] = req.body[field];
    }
  });

  await organizer.save();

  res.status(200).json({
    success: true,
    message: 'Organizer updated successfully',
    data: organizer,
  });
});

// @desc    Delete organizer
// @route   DELETE /api/admin/organizers/:id
// @access  Private/Admin
exports.deleteOrganizer = asyncHandler(async (req, res, next) => {
  const organizer = await User.findById(req.params.id);

  if (!organizer || organizer.role !== 'Organizer') {
    return next(new ErrorResponse('Organizer not found', 404));
  }

  await organizer.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Organizer deleted successfully',
    data: {},
  });
});

// @desc    Get all password reset requests
// @route   GET /api/admin/reset-requests
// @access  Private/Admin
exports.getPasswordResetRequests = asyncHandler(async (req, res, next) => {
  const { status } = req.query;

  let query = {};
  if (status) {
    query.status = status;
  }

  const resetRequests = await PasswordResetRequest.find(query)
    .populate('user', 'firstName lastName email organizerName category role')
    .populate('approvedBy', 'firstName lastName email')
    .populate('rejectedBy', 'firstName lastName email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: resetRequests.length,
    data: resetRequests,
  });
});

// @desc    Approve password reset request
// @route   PUT /api/admin/reset-requests/:id/approve
// @access  Private/Admin
exports.approvePasswordResetRequest = asyncHandler(async (req, res, next) => {
  const { adminComments } = req.body;
  
  const resetRequest = await PasswordResetRequest.findById(req.params.id).populate('user');

  if (!resetRequest) {
    return next(new ErrorResponse('Reset request not found', 404));
  }

  if (resetRequest.status !== 'pending') {
    return next(new ErrorResponse('This request has already been processed', 400));
  }

  // Generate new secure temporary password (8 characters: letters + numbers)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let newTempPassword = '';
  for (let i = 0; i < 8; i++) {
    newTempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Update user's password
  const user = await User.findById(resetRequest.user._id).select('+password');
  user.password = newTempPassword;
  await user.save();

  // Store the plain password temporarily in resetRequest before it gets hashed
  const plainPassword = newTempPassword;
  
  // Update reset request status
  resetRequest.status = 'approved';
  resetRequest.approvedBy = req.user.id;
  resetRequest.approvedAt = Date.now();
  resetRequest.generatedPassword = plainPassword; // Will be hashed by pre-save hook
  if (adminComments) {
    resetRequest.adminComments = adminComments;
  }
  await resetRequest.save();

  res.status(200).json({
    success: true,
    message: 'Password reset request approved',
    credentials: {
      email: user.email,
      organizerName: user.organizerName || `${user.firstName} ${user.lastName}`,
      temporaryPassword: plainPassword,
      note: 'Share these credentials securely with the organizer. They should change this password after first login.',
    },
    data: resetRequest,
  });
});

// @desc    Reject password reset request
// @route   PUT /api/admin/reset-requests/:id/reject
// @access  Private/Admin
exports.rejectPasswordResetRequest = asyncHandler(async (req, res, next) => {
  const { adminComments } = req.body;

  if (!adminComments) {
    return next(new ErrorResponse('Please provide admin comments for rejection', 400));
  }

  const resetRequest = await PasswordResetRequest.findById(req.params.id);

  if (!resetRequest) {
    return next(new ErrorResponse('Reset request not found', 404));
  }

  if (resetRequest.status !== 'pending') {
    return next(new ErrorResponse('This request has already been processed', 400));
  }

  // Update reset request status
  resetRequest.status = 'rejected';
  resetRequest.rejectedBy = req.user.id;
  resetRequest.rejectedAt = Date.now();
  resetRequest.adminComments = adminComments;
  await resetRequest.save();

  res.status(200).json({
    success: true,
    message: 'Password reset request rejected',
    data: resetRequest,
  });
});

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getAdminStats = asyncHandler(async (req, res, next) => {
  const totalOrganizers = await User.countDocuments({ role: 'Organizer' });
  const activeOrganizers = await User.countDocuments({ role: 'Organizer', accountStatus: 'active' });
  const disabledOrganizers = await User.countDocuments({ role: 'Organizer', accountStatus: 'disabled' });
  const totalParticipants = await User.countDocuments({ role: 'Participant' });
  const pendingResetRequests = await PasswordResetRequest.countDocuments({ status: 'pending' });
  const pendingPasswordChangeRequests = await PasswordChangeRequest.countDocuments({ status: 'pending' });

  res.status(200).json({
    success: true,
    data: {
      organizers: {
        total: totalOrganizers,
        active: activeOrganizers,
        disabled: disabledOrganizers,
      },
      participants: totalParticipants,
      passwordResetRequests: {
        pending: pendingResetRequests,
      },
      passwordChangeRequests: {
        pending: pendingPasswordChangeRequests,
      },
    },
  });
});

// @desc    Get all password change requests
// @route   GET /api/admin/password-change-requests
// @access  Private/Admin
exports.getPasswordChangeRequests = asyncHandler(async (req, res, next) => {
  const { status } = req.query;

  let filter = {};
  if (status) {
    filter.status = status;
  }

  const requests = await PasswordChangeRequest.find(filter)
    .populate('organizer', 'firstName lastName email organizerName category')
    .populate('reviewedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests,
  });
});

// @desc    Approve password change request
// @route   PUT /api/admin/password-change-requests/:id/approve
// @access  Private/Admin
exports.approvePasswordChangeRequest = asyncHandler(async (req, res, next) => {
  const request = await PasswordChangeRequest.findById(req.params.id)
    .select('+newPasswordHash')
    .populate('organizer');

  if (!request) {
    return next(new ErrorResponse('Password change request not found', 404));
  }

  if (request.status !== 'pending') {
    return next(new ErrorResponse(`This request has already been ${request.status}`, 400));
  }

  // Update the organizer's password directly in database (bypass pre-save hook to avoid double hashing)
  await User.findByIdAndUpdate(
    request.organizer._id,
    { password: request.newPasswordHash },
    { new: true }
  );

  // Update request status
  request.status = 'approved';
  request.reviewedBy = req.user.id;
  request.reviewedAt = Date.now();
  await request.save();

  res.status(200).json({
    success: true,
    message: 'Password change request approved and password updated successfully',
    data: request,
  });
});

// @desc    Reject password change request
// @route   PUT /api/admin/password-change-requests/:id/reject
// @access  Private/Admin
exports.rejectPasswordChangeRequest = asyncHandler(async (req, res, next) => {
  const { rejectionComment } = req.body;

  if (!rejectionComment) {
    return next(new ErrorResponse('Please provide a rejection comment', 400));
  }

  const request = await PasswordChangeRequest.findById(req.params.id);

  if (!request) {
    return next(new ErrorResponse('Password change request not found', 404));
  }

  if (request.status !== 'pending') {
    return next(new ErrorResponse(`This request has already been ${request.status}`, 400));
  }

  // Update request status
  request.status = 'rejected';
  request.reviewedBy = req.user.id;
  request.reviewedAt = Date.now();
  request.rejectionComment = rejectionComment;
  await request.save();

  res.status(200).json({
    success: true,
    message: 'Password change request rejected',
    data: request,
  });
});
