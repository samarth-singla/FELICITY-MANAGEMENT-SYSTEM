const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const passwordChangeRequestSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentPassword: {
      type: String,
      required: true,
      select: false, // Don't return by default
    },
    newPasswordHash: {
      type: String,
      required: true,
      select: false, // Don't return by default
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionComment: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hash the new password before saving
passwordChangeRequestSchema.pre('save', async function (next) {
  if (!this.isModified('newPasswordHash')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.newPasswordHash = await bcrypt.hash(this.newPasswordHash, salt);
  next();
});

module.exports = mongoose.model('PasswordChangeRequest', passwordChangeRequestSchema);
