const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { generateQRCode, generateTicketQRData } = require('../utils/qrCodeService');
const { sendTicketEmail, sendPaymentApprovedEmail } = require('../utils/emailService');

// @desc    Get current user's registrations
// @route   GET /api/registrations/me
// @access  Private (Participant)
exports.getMyRegistrations = asyncHandler(async (req, res, next) => {
  const { status, upcoming, past } = req.query;

  // Build query
  let query = { participant: req.user.id };

  // Filter by status if provided
  if (status && ['registered', 'attended', 'cancelled'].includes(status)) {
    query.status = status;
  }

  // Get registrations
  let registrations = await Registration.find(query)
    .populate({
      path: 'event',
      select: 'name description type category startDate endDate venue imageUrl registrationFee currentRegistrations stockQuantity',
    })
    .sort('-createdAt');

  // Filter by upcoming or past if requested
  if (upcoming || past) {
    const now = new Date();
    registrations = registrations.filter((reg) => {
      const eventDate = new Date(reg.event.startDate);
      if (upcoming) {
        return eventDate >= now;
      } else if (past) {
        return eventDate < now;
      }
      return true;
    });
  }

  res.status(200).json({
    success: true,
    count: registrations.length,
    data: registrations,
  });
});

// @desc    Get single registration details
// @route   GET /api/registrations/:id
// @access  Private (Participant)
exports.getRegistration = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id)
    .populate({
      path: 'event',
      select: 'name description type category startDate endDate venue imageUrl registrationFee organizer',
      populate: {
        path: 'organizer',
        select: 'firstName lastName email',
      },
    })
    .populate('participant', 'firstName lastName email collegeName contactNumber');

  if (!registration) {
    return next(new ErrorResponse('Registration not found', 404));
  }

  // Ensure user can only view their own registration
  if (registration.participant._id.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new ErrorResponse('Not authorized to access this registration', 403));
  }

  res.status(200).json({
    success: true,
    data: registration,
  });
});

// @desc    Cancel a registration
// @route   PUT /api/registrations/:id/cancel
// @access  Private (Participant)
exports.cancelRegistration = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id).populate('event');

  if (!registration) {
    return next(new ErrorResponse('Registration not found', 404));
  }

  // Ensure user can only cancel their own registration
  if (registration.participant.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to cancel this registration', 403));
  }

  // Check if already cancelled
  if (registration.status === 'cancelled') {
    return next(new ErrorResponse('Registration is already cancelled', 400));
  }

  // Check if event has already started
  const now = new Date();
  const eventStartDate = new Date(registration.event.startDate);
  if (eventStartDate <= now) {
    return next(new ErrorResponse('Cannot cancel registration for an event that has already started', 400));
  }

  // Decrement event registration count
  await registration.event.decrementRegistrations();

  // Delete the registration completely from database
  await Registration.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Registration cancelled and removed successfully',
    data: {},
  });
});

// @desc    Get registrations for an event (Organizer/Admin)
// @route   GET /api/registrations/event/:eventId
// @access  Private (Organizer, Admin)
exports.getEventRegistrations = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.eventId);

  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  // Check authorization - only event organizer or admin can view
  if (event.organizer.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new ErrorResponse('Not authorized to view event registrations', 403));
  }

  const { status } = req.query;
  const registrations = await Registration.getEventRegistrations(req.params.eventId, status);

  res.status(200).json({
    success: true,
    count: registrations.length,
    data: registrations,
  });
});

// @desc    Verify ticket by ticketId (for QR scanning)
// @route   GET /api/registrations/verify/:ticketId
// @access  Private (Organizer, Admin)
exports.verifyTicket = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findOne({ ticketId: req.params.ticketId })
    .populate('event', 'name startDate endDate venue')
    .populate('participant', 'firstName lastName email collegeName');

  if (!registration) {
    return next(new ErrorResponse('Invalid ticket ID', 404));
  }

  res.status(200).json({
    success: true,
    data: registration,
  });
});

// @desc    Mark attendance by ticketId
// @route   PUT /api/registrations/attend/:ticketId
// @access  Private (Organizer, Admin)
exports.markAttendance = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findOne({ ticketId: req.params.ticketId }).populate('event');

  if (!registration) {
    return next(new ErrorResponse('Invalid ticket ID', 404));
  }

  // Check authorization - only event organizer or admin can mark attendance
  if (registration.event.organizer.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new ErrorResponse('Not authorized to mark attendance for this event', 403));
  }

  // Check if already attended
  if (registration.status === 'attended') {
    return next(new ErrorResponse('Attendance already marked for this registration', 400));
  }

  // Check if cancelled
  if (registration.status === 'cancelled') {
    return next(new ErrorResponse('Cannot mark attendance for a cancelled registration', 400));
  }

  // Mark as attended
  await registration.markAttended();

  res.status(200).json({
    success: true,
    message: 'Attendance marked successfully',
    data: registration,
  });
});

// @desc    Approve payment for registration
// @route   PUT /api/registrations/:id/approve-payment
// @access  Private (Organizer, Admin)
exports.approvePayment = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id)
    .populate('event')
    .populate('participant', 'firstName lastName email collegeName');

  if (!registration) {
    return next(new ErrorResponse('Registration not found', 404));
  }

  // Check authorization - only event organizer or admin can approve payment
  if (registration.event.organizer.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new ErrorResponse('Not authorized to approve payment for this event', 403));
  }

  // Check if already approved
  if (registration.paymentStatus === 'completed') {
    return next(new ErrorResponse('Payment already approved', 400));
  }

  // Update payment status
  registration.paymentStatus = 'completed';
  await registration.save();

  // Generate QR code if not exists
  if (!registration.qrCode) {
    const qrData = generateTicketQRData(registration, registration.event, registration.participant);
    const qrCodeDataUrl = await generateQRCode(qrData);
    registration.qrCode = qrCodeDataUrl;
    await registration.save();
  }

  // Send payment approved email
  try {
    await sendPaymentApprovedEmail(
      registration,
      registration.event,
      registration.participant,
      registration.qrCode
    );
    registration.emailSent = true;
    registration.emailSentAt = new Date();
    await registration.save();
  } catch (emailError) {
    console.error('Error sending payment approved email:', emailError);
    // Don't fail the request if email fails
  }

  res.status(200).json({
    success: true,
    message: 'Payment approved and confirmation email sent',
    data: registration,
  });
});
