const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const passwordResetRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Please provide a reason for password reset'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    generatedPassword: {
      type: String,
      select: false, // Don't return by default for security
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    adminComments: {
      type: String,
      trim: true,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash generated password
passwordResetRequestSchema.pre('save', async function (next) {
  // Only hash the generatedPassword if it has been modified (or is new)
  if (!this.isModified('generatedPassword') || !this.generatedPassword) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.generatedPassword = await bcrypt.hash(this.generatedPassword, salt);
  next();
});

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
