const ForumMessage = require('../models/ForumMessage');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all forum messages for an event
// @route   GET /api/events/:eventId/forum
// @access  Public (but will check if event is public or user is registered)
exports.getForumMessages = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  // Get messages (excluding deleted ones for non-organizers)
  let query = { event: eventId };
  
  // Only show deleted messages to organizers
  const isOrganizer = req.user && event.organizer.toString() === req.user.id;
  if (!isOrganizer) {
    query.isDeleted = false;
  }

  const messages = await ForumMessage.find(query)
    .populate('author', 'firstName lastName email role')
    .populate({
      path: 'parentMessage',
      populate: {
        path: 'author',
        select: 'firstName lastName'
      }
    })
    .populate('reactions.user', 'firstName lastName')
    .sort({ isPinned: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Create a new forum message
// @route   POST /api/events/:eventId/forum
// @access  Private (Registered participants or organizer)
exports.createForumMessage = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const { content, messageType, parentMessageId } = req.body;

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  // Check if user is organizer or registered participant
  const isOrganizer = event.organizer.toString() === req.user.id;
  let authorRole = 'participant';

  if (!isOrganizer) {
    const registration = await Registration.findOne({
      event: eventId,
      participant: req.user.id,
      status: { $ne: 'cancelled' }
    });

    if (!registration) {
      return next(new ErrorResponse('Only registered participants can post in the forum', 403));
    }
  } else {
    authorRole = 'organizer';
  }

  // Only organizers can post announcements
  if (messageType === 'announcement' && !isOrganizer) {
    return next(new ErrorResponse('Only organizers can post announcements', 403));
  }

  // If it's a reply, check parent message exists
  let parentMessage = null;
  if (parentMessageId) {
    parentMessage = await ForumMessage.findById(parentMessageId);
    if (!parentMessage || parentMessage.event.toString() !== eventId) {
      return next(new ErrorResponse('Parent message not found', 404));
    }
  }

  // Create message
  const message = await ForumMessage.create({
    event: eventId,
    author: req.user.id,
    authorRole,
    content,
    messageType: messageType || 'message',
    parentMessage: parentMessageId || null
  });

  // If it's a reply, add to parent's replies array
  if (parentMessage) {
    await parentMessage.addReply(message._id);
  }

  // Populate author info
  await message.populate('author', 'firstName lastName email role');

  // Emit socket event for real-time update
  if (req.app.io) {
    req.app.io.to(`event_${eventId}`).emit('forum:newMessage', {
      message,
      eventId
    });
  }

  res.status(201).json({
    success: true,
    data: message
  });
});

// @desc    Pin/Unpin a forum message
// @route   PUT /api/events/:eventId/forum/:messageId/pin
// @access  Private (Organizer only)
exports.togglePinMessage = asyncHandler(async (req, res, next) => {
  const { eventId, messageId } = req.params;

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  // Check if user is organizer
  if (event.organizer.toString() !== req.user.id) {
    return next(new ErrorResponse('Only organizers can pin messages', 403));
  }

  const message = await ForumMessage.findOne({ _id: messageId, event: eventId });
  if (!message) {
    return next(new ErrorResponse('Message not found', 404));
  }

  message.isPinned = !message.isPinned;
  await message.save();

  // Emit socket event
  if (req.app.io) {
    req.app.io.to(`event_${eventId}`).emit('forum:messageUpdated', {
      messageId,
      isPinned: message.isPinned,
      eventId
    });
  }

  res.status(200).json({
    success: true,
    data: message
  });
});

// @desc    Delete a forum message
// @route   DELETE /api/events/:eventId/forum/:messageId
// @access  Private (Organizer or message author)
exports.deleteForumMessage = asyncHandler(async (req, res, next) => {
  const { eventId, messageId } = req.params;

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  const message = await ForumMessage.findOne({ _id: messageId, event: eventId });
  if (!message) {
    return next(new ErrorResponse('Message not found', 404));
  }

  // Check authorization - organizer or message author
  const isOrganizer = event.organizer.toString() === req.user.id;
  const isAuthor = message.author.toString() === req.user.id;

  if (!isOrganizer && !isAuthor) {
    return next(new ErrorResponse('Not authorized to delete this message', 403));
  }

  // Soft delete
  message.isDeleted = true;
  await message.save();

  // Emit socket event
  if (req.app.io) {
    req.app.io.to(`event_${eventId}`).emit('forum:messageDeleted', {
      messageId,
      eventId
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add/Remove reaction to a message
// @route   POST /api/events/:eventId/forum/:messageId/react
// @access  Private (Registered participants or organizer)
exports.toggleReaction = asyncHandler(async (req, res, next) => {
  const { eventId, messageId } = req.params;
  const { reactionType } = req.body;

  if (!['like', 'love', 'helpful', 'celebrate'].includes(reactionType)) {
    return next(new ErrorResponse('Invalid reaction type', 400));
  }

  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return next(new ErrorResponse('Event not found', 404));
  }

  // Check if user is organizer or registered participant
  const isOrganizer = event.organizer.toString() === req.user.id;
  if (!isOrganizer) {
    const registration = await Registration.findOne({
      event: eventId,
      participant: req.user.id,
      status: { $ne: 'cancelled' }
    });

    if (!registration) {
      return next(new ErrorResponse('Only registered participants can react to messages', 403));
    }
  }

  const message = await ForumMessage.findOne({ _id: messageId, event: eventId });
  if (!message) {
    return next(new ErrorResponse('Message not found', 404));
  }

  const result = await message.toggleReaction(req.user.id, reactionType);
  await message.populate('reactions.user', 'firstName lastName');

  // Emit socket event
  if (req.app.io) {
    req.app.io.to(`event_${eventId}`).emit('forum:reactionUpdated', {
      messageId,
      reactions: message.reactions,
      eventId
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...result,
      reactions: message.reactions
    }
  });
});
