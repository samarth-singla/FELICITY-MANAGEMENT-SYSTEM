const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    // Common Fields for All Events
    name: {
      type: String,
      required: [true, 'Please provide event name'],
      trim: true,
      maxlength: [200, 'Event name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide event description'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['Normal', 'Merchandise'],
        message: 'Event type must be either Normal or Merchandise',
      },
      required: [true, 'Please specify event type'],
    },
    category: {
      type: String,
      required: [true, 'Please specify event category'],
      enum: {
        values: ['Technical', 'Cultural', 'Sports', 'Literary', 'Art', 'Music', 'Dance', 'Photography', 'Gaming', 'Other'],
        message: 'Please select a valid category',
      },
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide event start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide event end date'],
      validate: {
        validator: function (value) {
          return value >= this.startDate;
        },
        message: 'End date must be after or equal to start date',
      },
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Please provide registration deadline'],
      validate: {
        validator: function (value) {
          return value <= this.startDate;
        },
        message: 'Registration deadline must be before or equal to event start date',
      },
    },
    registrationFee: {
      type: Number,
      default: 0,
      min: [0, 'Registration fee cannot be negative'],
    },
    registrationLimit: {
      type: Number,
      default: null,
      min: [1, 'Registration limit must be at least 1'],
      validate: {
        validator: function (value) {
          return value === null || value > 0;
        },
        message: 'Registration limit must be a positive number or null for unlimited',
      },
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event must have an organizer'],
    },

    // Normal Event Fields (Custom Form Builder)
    customForm: {
      type: [
        {
          fieldLabel: {
            type: String,
            required: true,
            trim: true,
          },
          fieldType: {
            type: String,
            required: true,
            enum: ['text', 'textarea', 'email', 'number', 'tel', 'date', 'select', 'radio', 'checkbox'],
          },
          isRequired: {
            type: Boolean,
            default: false,
          },
          options: {
            type: [String],
            default: [],
          },
          placeholder: {
            type: String,
            default: '',
          },
          validation: {
            min: Number,
            max: Number,
            pattern: String,
            minLength: Number,
            maxLength: Number,
          },
        },
      ],
      default: undefined,
    },

    // Merchandise Event Fields
    itemDetails: {
      size: {
        type: [String],
        default: undefined,
      },
      color: {
        type: [String],
        default: undefined,
      },
      variants: {
        type: [
          {
            name: String,
            price: Number,
            description: String,
          },
        ],
        default: undefined,
      },
    },
    stockQuantity: {
      type: Number,
      default: undefined,
      min: [0, 'Stock quantity cannot be negative'],
    },
    purchaseLimitPerParticipant: {
      type: Number,
      default: undefined,
      min: [1, 'Purchase limit must be at least 1'],
    },

    // Status and Publishing (Draft/Publish workflow)
    isPublished: {
      type: Boolean,
      default: false,
    },

    // Registration tracking
    currentRegistrations: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Additional metadata
    imageUrl: {
      type: String,
      default: null,
    },
    venue: {
      type: String,
      trim: true,
      maxlength: [200, 'Venue cannot exceed 200 characters'],
    },
    tags: {
      type: [String],
      default: [],
    },
    eligibility: {
      type: String,
      enum: {
        values: ['All', 'IIIT', 'Non-IIIT'],
        message: 'Eligibility must be one of: All, IIIT, Non-IIIT',
      },
      default: 'All',
    },
  },
  {
    timestamps: true,
  }
);

// Validation: Ensure Normal events have customForm (can be empty)
eventSchema.pre('validate', function (next) {
  if (this.type === 'Normal') {
    if (!this.customForm) {
      this.customForm = []; // Allow empty customForm for Normal events
    }
  }
  next();
});

// Validation: Ensure Merchandise events have required merchandise fields
eventSchema.pre('validate', function (next) {
  if (this.type === 'Merchandise') {
    if (this.stockQuantity === undefined || this.stockQuantity === null) {
      this.invalidate('stockQuantity', 'Stock quantity is required for Merchandise events');
    }
    if (!this.purchaseLimitPerParticipant) {
      this.invalidate('purchaseLimitPerParticipant', 'Purchase limit per participant is required for Merchandise events');
    }
    if (!this.itemDetails || 
        (!this.itemDetails.size?.length && !this.itemDetails.color?.length && !this.itemDetails.variants?.length)) {
      this.invalidate('itemDetails', 'At least one item detail (size, color, or variant) is required for Merchandise events');
    }
  }
  next();
});

// Indexes for efficient queries
eventSchema.index({ organizer: 1, isPublished: 1 });
eventSchema.index({ category: 1, isPublished: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ type: 1, isPublished: 1 });

// Virtual for checking if registration is open
eventSchema.virtual('isRegistrationOpen').get(function () {
  const now = new Date();
  return (
    this.isPublished &&
    now <= this.registrationDeadline &&
    (this.registrationLimit === null || this.currentRegistrations < this.registrationLimit)
  );
});

// Virtual for checking if event is full
eventSchema.virtual('isFull').get(function () {
  if (this.registrationLimit === null) {
    return false;
  }
  return this.currentRegistrations >= this.registrationLimit;
});

// Method to increment registration count
eventSchema.methods.incrementRegistrations = async function () {
  this.currentRegistrations += 1;
  return await this.save();
};

// Method to decrement registration count
eventSchema.methods.decrementRegistrations = async function () {
  if (this.currentRegistrations > 0) {
    this.currentRegistrations -= 1;
    return await this.save();
  }
  return this;
};

// Static method to get published events
eventSchema.statics.getPublishedEvents = function (filter = {}) {
  return this.find({ ...filter, isPublished: true })
    .populate('organizer', 'firstName lastName organizerName email category')
    .sort({ startDate: 1 });
};

// Static method to get events by organizer
eventSchema.statics.getEventsByOrganizer = function (organizerId, includeUnpublished = true) {
  const filter = { organizer: organizerId };
  if (!includeUnpublished) {
    filter.isPublished = true;
  }
  return this.find(filter).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Event', eventSchema);
