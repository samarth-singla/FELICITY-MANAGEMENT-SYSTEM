const mongoose = require('mongoose');

const ForumMessageSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorRole: {
    type: String,
    enum: ['participant', 'organizer'],
    required: true
  },
  content: {
    type: String,
    required: [true, 'Please provide message content'],
    maxlength: [2000, 'Message cannot be more than 2000 characters']
  },
  messageType: {
    type: String,
    enum: ['message', 'announcement'],
    default: 'message'
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumMessage',
    default: null
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'helpful', 'celebrate'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumMessage'
  }]
}, {
  timestamps: true
});

// Index for faster queries
ForumMessageSchema.index({ event: 1, createdAt: -1 });
ForumMessageSchema.index({ event: 1, isPinned: -1, createdAt: -1 });

// Method to add reply reference
ForumMessageSchema.methods.addReply = async function(replyId) {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
    await this.save();
  }
};

// Method to toggle reaction
ForumMessageSchema.methods.toggleReaction = async function(userId, reactionType) {
  const existingReactionIndex = this.reactions.findIndex(
    r => r.user.toString() === userId.toString() && r.type === reactionType
  );

  if (existingReactionIndex > -1) {
    // Remove reaction if already exists
    this.reactions.splice(existingReactionIndex, 1);
    await this.save();
    return { action: 'removed', reaction: reactionType };
  } else {
    // Add new reaction
    this.reactions.push({ user: userId, type: reactionType });
    await this.save();
    return { action: 'added', reaction: reactionType };
  }
};

module.exports = mongoose.model('ForumMessage', ForumMessageSchema);
