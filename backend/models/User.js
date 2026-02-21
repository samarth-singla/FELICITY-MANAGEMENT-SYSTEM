const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Base User Schema with common fields
const baseOptions = {
  discriminatorKey: 'role',
  timestamps: true,
};

const baseUserSchema = new mongoose.Schema(
  {
    // Core fields for all roles
    firstName: {
      type: String,
      required: [true, 'Please provide your first name'],
      trim: true,
      maxlength: [50, 'First name cannot be more than 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Please provide your last name'],
      trim: true,
      maxlength: [50, 'Last name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: 'Please provide a valid email address',
      },
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    // Account status (for admin management)
    accountStatus: {
      type: String,
      enum: ['active', 'disabled', 'archived'],
      default: 'active',
    },
  },
  baseOptions
);

// Hash password before saving (only if password is modified)
baseUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password during login
baseUserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
baseUserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Create Base User Model
const User = mongoose.model('User', baseUserSchema);

// Participant Discriminator Schema
const participantSchema = new mongoose.Schema({
  participantType: {
    type: String,
    enum: {
      values: ['IIIT', 'Non-IIIT'],
      message: 'Participant type must be either IIIT or Non-IIIT',
    },
    required: [true, 'Participant type is required'],
  },
  collegeName: {
    type: String,
    trim: true,
    required: [true, 'College name is required'],
  },
  contactNumber: {
    type: String,
    trim: true,
    required: [true, 'Contact number is required'],
  },
  preferences: {
    areasOfInterest: {
      type: [String],
      default: [],
    },
    followedClubs: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Club',
      default: [],
    },
    interests: {
      type: [String],
      default: [],
      enum: {
        values: ['Technical', 'Cultural', 'Sports', 'Literary', 'Art', 'Music', 'Dance', 'Photography', 'Gaming', 'Other'],
        message: 'Interest must be a valid category'
      }
    },
    following: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
  },
});

// Additional validation for IIIT participant email
participantSchema.pre('validate', function (next) {
  if (this.participantType === 'IIIT' && !this.email.endsWith('iiit.ac.in')) {
    this.invalidate('email', 'IIIT participants must use an @iiit.ac.in email address');
  }
  next();
});

// Organizer Discriminator Schema
const organizerSchema = new mongoose.Schema({
  organizerName: {
    type: String,
    trim: true,
    required: [true, 'Organizer name is required'],
  },
  category: {
    type: String,
    trim: true,
    required: [true, 'Category is required'],
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'Description is required'],
  },
  contactEmail: {
    type: String,
    lowercase: true,
    trim: true,
    required: [true, 'Contact email is required'],
    validate: {
      validator: function (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: 'Please provide a valid contact email address',
    },
  },
  contactNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function (phone) {
        if (!phone) return true; // Allow empty
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
        return phoneRegex.test(phone);
      },
      message: 'Please provide a valid contact number',
    },
  },
  discordWebhookUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function (url) {
        if (!url) return true; // Allow empty
        const urlRegex = /^https:\/\/discord(app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/;
        return urlRegex.test(url);
      },
      message: 'Please provide a valid Discord webhook URL',
    },
  },
});

// Admin Discriminator Schema (for future use)
const adminSchema = new mongoose.Schema({
  // Admin-specific fields can be added here if needed
});

// Create Discriminators
const Participant = User.discriminator('Participant', participantSchema);
const Organizer = User.discriminator('Organizer', organizerSchema);
const Admin = User.discriminator('Admin', adminSchema);

// Export models
module.exports = User;
module.exports.Participant = Participant;
module.exports.Organizer = Organizer;
module.exports.Admin = Admin;
