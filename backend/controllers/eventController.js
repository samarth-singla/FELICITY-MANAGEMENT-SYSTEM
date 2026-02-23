const Event = require('../models/Event');
const Registration = require('../models/Registration');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { generateQRCode, generateTicketQRData } = require('../utils/qrCodeService');
const { sendTicketEmail } = require('../utils/emailService');
const https = require('https');

// Helper function to send Discord webhook notification
const sendDiscordWebhook = async (event) => {
  const webhookUrl = event.organizer.discordWebhookUrl;
  
  console.log('=== Discord Webhook Attempt ===');
  console.log('Event:', event.name);
  console.log('Organizer:', event.organizer.organizerName || event.organizer.firstName);
  console.log('Webhook URL exists:', !!webhookUrl);
  
  if (!webhookUrl) {
    console.log('No webhook URL configured - skipping notification');
    return;
  }
  
  console.log('Webhook URL:', webhookUrl.substring(0, 50) + '...');

  // Format dates
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const registrationDeadline = new Date(event.registrationDeadline);

  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  // Build Discord embed
  const embed = {
    title: `🎉 New Event Published: ${event.name}`,
    description: event.description || 'No description provided',
    color: 0x3b82f6, // Blue color
    fields: [
      {
        name: '📅 Event Dates',
        value: `**Start:** ${formatDate(startDate)}\\n**End:** ${formatDate(endDate)}`,
        inline: false
      },
      {
        name: '📝 Registration Deadline',
        value: formatDate(registrationDeadline),
        inline: false
      },
      {
        name: '💰 Registration Fee',
        value: event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free',
        inline: true
      },
      {
        name: '👥 Registration Limit',
        value: event.registrationLimit ? `${event.registrationLimit} participants` : 'Unlimited',
        inline: true
      },
      {
        name: '📍 Venue',
        value: event.venue || 'TBA',
        inline: true
      },
      {
        name: '🏷️ Category',
        value: event.category || 'Uncategorized',
        inline: true
      },
      {
        name: '🎫 Event Type',
        value: event.type === 'Merchandise' ? '🛍️ Merchandise' : '📋 Registration',
        inline: true
      }
    ],
    footer: {
      text: `Organized by ${event.organizer.organizerName || event.organizer.firstName + ' ' + event.organizer.lastName}`
    },
    timestamp: new Date().toISOString()
  };

  // Add event image if available
  if (event.imageUrl) {
    embed.thumbnail = {
      url: event.imageUrl
    };
  }

  // Add tags if available
  if (event.tags && event.tags.length > 0) {
    embed.fields.push({
      name: '🏷️ Tags',
      value: event.tags.join(', '),
      inline: false
    });
  }

  // Add event URL
  const eventUrl = `${process.env.FRONTEND_URL}/events/${event._id}`;
  embed.fields.push({
    name: '🔗 Register Now',
    value: `[Click here to view and register](${eventUrl})`,
    inline: false
  });

  // Prepare webhook payload
  const payload = JSON.stringify({
    content: `@everyone 🎉 **New Event Alert!**`,
    embeds: [embed]
  });

  // Parse webhook URL
  const url = new URL(webhookUrl);
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Discord webhook notification sent successfully for event: ${event.name}`);
          resolve();
        } else {
          console.error(`❌ Discord webhook failed with status ${res.statusCode}:`, data);
          reject(new Error(`Discord webhook failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Discord webhook request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Discord webhook request timed out'));
    });

    req.write(payload);
    req.end();
  });
};

// @desc    Create new event with type-specific validation
// @route   POST /api/events
// @access  Private (Organizer/Admin)
exports.createEvent = asyncHandler(async (req, res, next) => {
  // Ensure only Organizers or Admins can create events
  if (req.user.role !== 'Organizer' && req.user.role !== 'Admin') {
    return next(new ErrorResponse('Only Organizers and Admins can create events', 403));
  }

  // Add organizer to req.body
  req.body.organizer = req.user.id;

  // Validate type field
  if (!req.body.type || !['Normal', 'Merchandise'].includes(req.body.type)) {
    return next(new ErrorResponse('Please provide a valid type (Normal or Merchandise)', 400));
  }

  // Validate type-specific required fields
  if (req.body.type === 'Merchandise') {
    // Check for required Merchandise fields
    if (req.body.stockQuantity === undefined || req.body.stockQuantity === null) {
      return next(new ErrorResponse('stockQuantity is required for Merchandise events', 400));
    }
    
    if (!req.body.purchaseLimitPerParticipant) {
      return next(new ErrorResponse('purchaseLimitPerParticipant is required for Merchandise events', 400));
    }

    if (!req.body.itemDetails || 
        (!req.body.itemDetails.size?.length && 
         !req.body.itemDetails.color?.length && 
         !req.body.itemDetails.variants?.length)) {
      return next(new ErrorResponse('itemDetails (size, color, or variants) are required for Merchandise events', 400));
    }
  }

  // Create event (will be saved as draft by default: isPublished: false)
  let event = await Event.create(req.body);

  // Populate organizer details with Discord webhook URL
  event = await Event.findById(event._id)
    .populate('organizer', 'firstName lastName organizerName email category contactEmail discordWebhookUrl');

  // Send Discord webhook notification if event is being published
  if (event.isPublished && event.organizer.discordWebhookUrl) {
    console.log('🔔 New event being published - attempting Discord webhook notification...');
    try {
      await sendDiscordWebhook(event);
    } catch (webhookError) {
      // Log error but don't fail the creation
      console.error('❌ Discord webhook notification failed:', webhookError.message);
    }
  } else {
    if (!event.isPublished) {
      console.log('ℹ️ Event created as draft - no Discord notification sent');
    }
    if (event.isPublished && !event.organizer.discordWebhookUrl) {
      console.log('ℹ️ No Discord webhook URL configured for this organizer');
    }
  }

  res.status(201).json({
    success: true,
    message: `${req.body.type} event created successfully${event.isPublished ? ' and published' : ' as draft'}`,
    data: event,
  });
});

// @desc    Get organizer's events (all events for logged-in organizer)
// @route   GET /api/events/organizer/my-events
// @access  Private (Organizer)
exports.getOrganizerEvents = asyncHandler(async (req, res, next) => {
  // Ensure only Organizers can access
  if (req.user.role !== 'Organizer') {
    return next(new ErrorResponse('Only Organizers can access this route', 403));
  }

  // Fetch all events where organizer matches req.user.id
  const events = await Event.find({ organizer: req.user.id })
    .populate('organizer', 'firstName lastName organizerName email category')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

// @desc    Get public events (only published) with fuzzy search
// @route   GET /api/events/public
// @access  Public
exports.getPublicEvents = asyncHandler(async (req, res, next) => {
  const { search, type, category, startDate, endDate } = req.query;

  // Build query object - only published events
  let query = { isPublished: true };

  // Fuzzy search on event name (case-insensitive)
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  // Filter by type
  if (type && ['Normal', 'Merchandise'].includes(type)) {
    query.type = type;
  }

  // Filter by category
  if (category) {
    query.category = category;
  }

  // Filter by date range
  if (startDate) {
    query.startDate = query.startDate || {};
    query.startDate.$gte = new Date(startDate);
  }
  if (endDate) {
    query.startDate = query.startDate || {};
    query.startDate.$lte = new Date(endDate);
  }

  const events = await Event.find(query)
    .populate('organizer', 'firstName lastName organizerName email category')
    .sort('startDate');

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id)
    .populate('organizer', 'firstName lastName organizerName email category');

  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: event,
  });
});

// @desc    Update event with draft/published restrictions
// @route   PUT /api/events/:id
// @access  Private (Organizer/Admin)
exports.updateEvent = asyncHandler(async (req, res, next) => {
  let event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is event organizer or admin
  if (event.organizer.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new ErrorResponse('Not authorized to update this event', 403));
  }

  // Determine event status
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  let eventStatus = 'draft';
  if (!event.isPublished) {
    eventStatus = 'draft';
  } else if (startDate > now) {
    eventStatus = 'published';
  } else if (startDate <= now && endDate >= now) {
    eventStatus = 'ongoing';
  } else {
    eventStatus = 'completed';
  }

  // Check if event has any registrations (for form locking)
  const hasRegistrations = event.currentRegistrations > 0;

  // Determine allowed fields based on event status
  let allowedFields = {};
  const providedFields = Object.keys(req.body);

  if (eventStatus === 'draft') {
    // DRAFT STATUS: Allow free editing of all fields
    allowedFields = { ...req.body };
    
    // EXCEPTION: Lock custom form if registrations exist
    if (hasRegistrations && req.body.customForm) {
      return next(new ErrorResponse('Cannot modify custom form after registrations have been received', 400));
    }
    
    // Validate type-specific fields if type is being changed or updated
    const newType = req.body.type || event.type;
    
    if (newType === 'Merchandise') {
      const stockQuantity = req.body.stockQuantity !== undefined ? req.body.stockQuantity : event.stockQuantity;
      const purchaseLimit = req.body.purchaseLimitPerParticipant || event.purchaseLimitPerParticipant;
      const itemDetails = req.body.itemDetails || event.itemDetails;

      if (stockQuantity === undefined || stockQuantity === null) {
        return next(new ErrorResponse('stockQuantity is required for Merchandise events', 400));
      }
      
      if (!purchaseLimit) {
        return next(new ErrorResponse('purchaseLimitPerParticipant is required for Merchandise events', 400));
      }

      if (!itemDetails || 
          (!itemDetails.size?.length && !itemDetails.color?.length && !itemDetails.variants?.length)) {
        return next(new ErrorResponse('itemDetails (size, color, or variants) are required for Merchandise events', 400));
      }
    }
  } else if (eventStatus === 'published') {
    // PUBLISHED STATUS: Restrict edits to specific fields only
    const editableFields = [
      'description',
      'registrationDeadline',
      'registrationLimit'
    ];

    // Check if trying to modify restricted fields
    const restrictedFieldsAttempted = providedFields.filter(field => 
      !editableFields.includes(field) && field !== 'isPublished'
    );

    if (restrictedFieldsAttempted.length > 0) {
      return next(new ErrorResponse(
        `Published events can only update: ${editableFields.join(', ')}. Cannot modify: ${restrictedFieldsAttempted.join(', ')}`,
        400
      ));
    }

    // Only copy allowed editable fields
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        allowedFields[field] = req.body[field];
      }
    });

    // Allow unpublishing (status change to draft)
    if (req.body.isPublished !== undefined) {
      allowedFields.isPublished = req.body.isPublished;
    }

    if (Object.keys(allowedFields).length === 0) {
      return next(new ErrorResponse(
        `Published events can only update: ${editableFields.join(', ')}`,
        400
      ));
    }
  } else if (eventStatus === 'ongoing' || eventStatus === 'completed') {
    // ONGOING/COMPLETED STATUS: Lock all fields except status toggle
    // Only allow changing isPublished (to mark as completed/closed)
    if (providedFields.length === 1 && req.body.isPublished !== undefined) {
      allowedFields.isPublished = req.body.isPublished;
    } else {
      return next(new ErrorResponse(
        `${eventStatus === 'ongoing' ? 'Ongoing' : 'Completed'} events cannot be edited. Only status can be toggled.`,
        400
      ));
    }
  }

  // Prevent organizer field from being changed
  delete allowedFields.organizer;
  
  // Prevent currentRegistrations from being manually changed
  delete allowedFields.currentRegistrations;

  // Check if event is being published (Draft → Published)
  const wasUnpublished = !event.isPublished;
  const willBePublished = allowedFields.isPublished === true;
  const isBeingPublished = wasUnpublished && willBePublished;

  // Update the event with allowed fields
  event = await Event.findByIdAndUpdate(req.params.id, allowedFields, {
    new: true,
    runValidators: false, // Disable validators on update to avoid date validation issues
  }).populate('organizer', 'firstName lastName organizerName email category contactEmail discordWebhookUrl');

  // Send Discord webhook notification if event is being published
  if (isBeingPublished && event.organizer.discordWebhookUrl) {
    console.log('🔔 Event being published - attempting Discord webhook notification...');
    try {
      await sendDiscordWebhook(event);
    } catch (webhookError) {
      // Log error but don't fail the update
      console.error('❌ Discord webhook notification failed:', webhookError.message);
    }
  } else {
    if (!isBeingPublished) {
      console.log('ℹ️ Event not being published (wasUnpublished:', wasUnpublished, ', willBePublished:', willBePublished, ')');
    }
    if (!event.organizer.discordWebhookUrl) {
      console.log('ℹ️ No Discord webhook URL configured for this organizer');
    }
  }

  res.status(200).json({
    success: true,
    message: 'Event updated successfully',
    data: event,
  });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Organizer/Admin)
exports.deleteEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is event organizer or admin
  if (event.organizer.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new ErrorResponse('Not authorized to delete this event', 403));
  }

  // Optionally: Prevent deletion of published events with registrations
  if (event.isPublished && event.currentRegistrations > 0) {
    return next(new ErrorResponse('Cannot delete events with existing registrations', 400));
  }

  await event.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Event deleted successfully',
    data: {},
  });
});

// @desc    Publish/Unpublish event (toggle isPublished)
// @route   PUT /api/events/:id/publish
// @access  Private (Organizer/Admin)
exports.togglePublishEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is event organizer or admin
  if (event.organizer.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new ErrorResponse('Not authorized to publish this event', 403));
  }

  // Toggle isPublished
  event.isPublished = !event.isPublished;
  await event.save();

  res.status(200).json({
    success: true,
    message: `Event ${event.isPublished ? 'published' : 'unpublished'} successfully`,
    data: event,
  });
});

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private (Participant)
exports.registerForEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404));
  }

  // Check if event is published
  if (!event.isPublished) {
    return next(new ErrorResponse('This event is not open for registration', 400));
  }

  // Check registration deadline
  if (new Date() > new Date(event.registrationDeadline)) {
    return next(new ErrorResponse('Registration deadline has passed', 400));
  }

  // Check registration limit
  if (event.registrationLimit && event.currentRegistrations >= event.registrationLimit) {
    return next(new ErrorResponse('Event is at full capacity', 400));
  }

  // Check if already registered
  const existingRegistration = await Registration.isRegistered(req.user.id, event._id);
  if (existingRegistration) {
    return next(new ErrorResponse('You are already registered for this event', 400));
  }

  // Handle Normal Events with custom form
  if (event.type === 'Normal') {
    const customFormData = req.body.customFormData;
    const paymentReceipt = req.body.paymentReceipt; // Base64 or URL of receipt

    // Validate custom form if exists
    if (event.customForm && event.customForm.length > 0) {
      if (!customFormData) {
        return next(new ErrorResponse('Please provide custom form data', 400));
      }

      // Validate required fields
      for (const field of event.customForm) {
        if (field.isRequired && !customFormData[field.fieldLabel]) {
          return next(new ErrorResponse(`${field.fieldLabel} is required`, 400));
        }
      }
    }

    // For paid events, require payment receipt
    const isPaidEvent = event.registrationFee > 0;
    if (isPaidEvent && !paymentReceipt) {
      return next(new ErrorResponse('Please upload payment receipt', 400));
    }

    // Create Registration
    const registration = await Registration.create({
      participant: req.user.id,
      event: event._id,
      formData: customFormData || {},
      paymentStatus: isPaidEvent ? 'pending' : 'completed',
      paymentAmount: event.registrationFee || 0,
      paymentReceipt: paymentReceipt || null,
    });

    // Populate participant details
    await registration.populate('participant', 'firstName lastName email collegeName');

    // For FREE events: Generate QR and send email immediately
    if (!isPaidEvent) {
      console.log('🆓 Free event - generating QR code immediately for:', registration.ticketId);
      // Generate QR code
      const qrData = generateTicketQRData(registration, event, registration.participant);
      console.log('📊 QR Data:', qrData);
      
      try {
        const qrCodeDataUrl = await generateQRCode(qrData);
        console.log('✅ QR code generated, length:', qrCodeDataUrl ? qrCodeDataUrl.length : 0);
        registration.qrCode = qrCodeDataUrl;
        await registration.save();
        console.log('💾 QR code saved to registration');

        // Send ticket email
        try {
          const emailResult = await sendTicketEmail(registration, event, registration.participant, qrCodeDataUrl);
          if (emailResult.success) {
            registration.emailSent = true;
            registration.emailSentAt = new Date();
            await registration.save();
            console.log('✅ Ticket email sent successfully');
          } else {
            console.error('❌ Email sending failed:', emailResult.error);
          }
        } catch (emailError) {
          console.error('❌ Error sending ticket email:', emailError);
          // Don't fail the registration if email fails
        }
      } catch (qrError) {
        console.error('❌ Error generating QR code:', qrError);
        // Don't fail the registration if QR fails
      }
    }
    // For PAID events: Don't generate QR or send email yet (wait for organizer approval)

    // Increment registration count
    await event.incrementRegistrations();

    const message = isPaidEvent 
      ? 'Registration submitted! Your payment is under review. You will receive your ticket once the organizer approves your payment.'
      : 'Successfully registered for the event. Check your email for the ticket.';

    res.status(200).json({
      success: true,
      message,
      data: {
        event,
        registration,
        ticketId: isPaidEvent ? null : registration.ticketId, // Only show ticket for free events
        isPaidEvent,
        paymentStatus: registration.paymentStatus,
      },
    });
  }
  // Handle Merchandise Events with stock management
  else if (event.type === 'Merchandise') {
    const { quantity, selectedVariant, selectedSize, selectedColor, paymentReceipt } = req.body;

    // Check stock availability
    if (event.stockQuantity <= 0) {
      return next(new ErrorResponse('Merchandise is out of stock', 400));
    }

    const purchaseQuantity = quantity || 1;

    // Check purchase limit
    if (purchaseQuantity > event.purchaseLimitPerParticipant) {
      return next(
        new ErrorResponse(
          `Cannot purchase more than ${event.purchaseLimitPerParticipant} items`,
          400
        )
      );
    }

    // Check if enough stock available
    if (event.stockQuantity < purchaseQuantity) {
      return next(
        new ErrorResponse(
          `Only ${event.stockQuantity} items available`,
          400
        )
      );
    }

    const isPaidEvent = event.registrationFee > 0;
    if (isPaidEvent && !paymentReceipt) {
      return next(new ErrorResponse('Please upload payment receipt', 400));
    }

    // Create Registration/Purchase
    const registration = await Registration.create({
      participant: req.user.id,
      event: event._id,
      formData: {
        quantity: purchaseQuantity,
        selectedVariant,
        selectedSize,
        selectedColor,
      },
      paymentStatus: isPaidEvent ? 'pending' : 'completed',
      paymentAmount: (event.registrationFee || 0) * purchaseQuantity,
      paymentReceipt: paymentReceipt || null,
    });

    // Populate participant details
    await registration.populate('participant', 'firstName lastName email collegeName');

    // For FREE events: Generate QR and send email immediately
    if (!isPaidEvent) {
      console.log('🆓 Free merchandise event - generating QR code immediately for:', registration.ticketId);
      // Generate QR code
      const qrData = generateTicketQRData(registration, event, registration.participant);
      console.log('📊 QR Data:', qrData);
      
      try {
        const qrCodeDataUrl = await generateQRCode(qrData);
        console.log('✅ QR code generated, length:', qrCodeDataUrl ? qrCodeDataUrl.length : 0);
        registration.qrCode = qrCodeDataUrl;
        await registration.save();
        console.log('💾 QR code saved to registration');

        // Send ticket email
        try {
          const emailResult = await sendTicketEmail(registration, event, registration.participant, qrCodeDataUrl);
          if (emailResult.success) {
            registration.emailSent = true;
            registration.emailSentAt = new Date();
            await registration.save();
            console.log('✅ Ticket email sent successfully');
          } else {
            console.error('❌ Email sending failed:', emailResult.error);
          }
        } catch (emailError) {
          console.error('❌ Error sending ticket email:', emailError);
          // Don't fail the registration if email fails
        }
      } catch (qrError) {
        console.error('❌ Error generating QR code:', qrError);
        // Don't fail the registration if QR fails
      }
    }
    // For PAID events: Don't generate QR or send email yet
    
    // Decrement stock quantity only for FREE merchandise events
    // For PAID merchandise, stock will be decremented when organizer approves payment
    if (!isPaidEvent) {
      event.stockQuantity -= purchaseQuantity;
    }
    await event.incrementRegistrations();

    const message = isPaidEvent 
      ? 'Purchase submitted! Your payment is under review. You will receive your confirmation once the organizer approves your payment.'
      : 'Merchandise purchased successfully. Check your email for the confirmation.';

    res.status(200).json({
      success: true,
      message,
      data: {
        event,
        registration,
        ticketId: isPaidEvent ? null : registration.ticketId,
        isPaidEvent,
        paymentStatus: registration.paymentStatus,
      },
      purchaseDetails: {
        quantity: purchaseQuantity,
        remainingStock: event.stockQuantity,
      },
    });
  }
});
