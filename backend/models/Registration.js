const mongoose = require('mongoose');
const crypto = require('crypto');

const registrationSchema = new mongoose.Schema(
  {
    // References
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Participant is required'],
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
    },

    // Dynamic Data - stores custom form responses or merchandise selections
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Unique Ticket ID
    ticketId: {
      type: String,
      unique: true,
      default: function () {
        return crypto.randomBytes(6).toString('hex').toUpperCase();
      },
    },

    // Registration Status
    status: {
      type: String,
      enum: {
        values: ['registered', 'attended', 'cancelled'],
        message: 'Status must be registered, attended, or cancelled',
      },
      default: 'registered',
    },

    // Additional metadata
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    attendanceDate: {
      type: Date,
      default: null,
    },
    cancellationDate: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },

    // Payment information (for paid events)
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentReceipt: {
      type: String, // URL or base64 of payment receipt image
      default: null,
    },

    // QR Code data URL
    qrCode: {
      type: String,
      default: null,
    },

    // Email sent status
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
// Partial unique index: only prevent duplicates for non-cancelled registrations
registrationSchema.index(
  { participant: 1, event: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { status: { $ne: 'cancelled' } }
  }
);
registrationSchema.index({ ticketId: 1 });
registrationSchema.index({ participant: 1, status: 1 });
registrationSchema.index({ event: 1, status: 1 });

// Method to mark as attended
registrationSchema.methods.markAttended = async function () {
  this.status = 'attended';
  this.attendanceDate = new Date();
  return await this.save();
};

// Method to cancel registration
registrationSchema.methods.cancelRegistration = async function (reason) {
  this.status = 'cancelled';
  this.cancellationDate = new Date();
  this.cancellationReason = reason || 'Cancelled by participant';
  return await this.save();
};

// Static method to get registrations by participant
registrationSchema.statics.getParticipantRegistrations = function (
  participantId,
  status = null
) {
  const query = { participant: participantId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('event', 'name description type category startDate endDate venue imageUrl registrationFee')
    .populate('participant', 'firstName lastName email')
    .sort('-createdAt');
};

// Static method to get registrations by event
registrationSchema.statics.getEventRegistrations = function (eventId, status = null) {
  const query = { event: eventId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('participant', 'firstName lastName email collegeName contactNumber')
    .sort('-createdAt');
};

// Static method to check if user is already registered
registrationSchema.statics.isRegistered = async function (participantId, eventId) {
  const registration = await this.findOne({
    participant: participantId,
    event: eventId,
    status: { $ne: 'cancelled' },
  });
  return !!registration;
};

// Virtual for checking if registration is active
registrationSchema.virtual('isActive').get(function () {
  return this.status === 'registered' || this.status === 'attended';
});

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
