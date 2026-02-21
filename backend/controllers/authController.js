const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Register user (Participant or Organizer)
// @route   POST /api/auth/register
// @access  Public (for Participants) / Admin (for Organizers - to be implemented separately)
exports.registerUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password || !role) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  // Prepare user data based on role
  let userData = {
    firstName,
    lastName,
    email,
    password,
    role,
  };

  // Add role-specific fields
  if (role === 'Participant') {
    const { participantType, collegeName, contactNumber } = req.body;
    
    if (!participantType || !collegeName || !contactNumber) {
      return next(new ErrorResponse('Please provide participantType, collegeName, and contactNumber for Participants', 400));
    }

    // Validate IIIT email requirement
    if (participantType === 'IIIT' && !email.endsWith('iiit.ac.in')) {
      return next(new ErrorResponse('IIIT participants must use an @iiit.ac.in email address', 400));
    }

    userData = {
      ...userData,
      participantType,
      collegeName,
      contactNumber,
      preferences: {
        areasOfInterest: req.body.areasOfInterest || [],
        followedClubs: req.body.followedClubs || [],
      },
    };
  } else if (role === 'Organizer') {
    const { organizerName, category, description, contactEmail } = req.body;
    
    if (!organizerName || !category || !description || !contactEmail) {
      return next(new ErrorResponse('Please provide organizerName, category, description, and contactEmail for Organizers', 400));
    }

    userData = {
      ...userData,
      organizerName,
      category,
      description,
      contactEmail,
    };
  } else if (role === 'Admin') {
    // Admin registration should be handled separately with special authorization
    return next(new ErrorResponse('Admin registration requires special authorization', 403));
  }

  // Create user (password will be hashed automatically by pre-save hook)
  const user = await User.create(userData);

  // Generate JWT token
  const token = user.getSignedJwtToken();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      ...(user.role === 'Participant' && {
        participantType: user.participantType,
        collegeName: user.collegeName,
      }),
      ...(user.role === 'Organizer' && {
        organizerName: user.organizerName,
        category: user.category,
      }),
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Verify password using comparePassword method
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Generate JWT token
  const token = user.getSignedJwtToken();

  // Return token and user details (excluding password)
  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      ...(user.role === 'Participant' && {
        participantType: user.participantType,
        collegeName: user.collegeName,
        contactNumber: user.contactNumber,
        preferences: user.preferences,
      }),
      ...(user.role === 'Organizer' && {
        organizerName: user.organizerName,
        category: user.category,
        description: user.description,
        contactEmail: user.contactEmail,
      }),
    },
  });
});

// @desc    Register Organizer (Admin only)
// @route   POST /api/auth/register-organizer
// @access  Private/Admin
exports.registerOrganizer = asyncHandler(async (req, res, next) => {
  // This endpoint should only be accessible by Admin users
  // The verifyToken and authorizeRoles middleware will handle authorization
  
  const { firstName, lastName, email, password, organizerName, category, description, contactEmail } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password || !organizerName || !category || !description || !contactEmail) {
    return next(new ErrorResponse('Please provide all required fields for Organizer registration', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  // Create organizer
  const organizer = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: 'Organizer',
    organizerName,
    category,
    description,
    contactEmail,
  });

  res.status(201).json({
    success: true,
    message: 'Organizer registered successfully by Admin',
    user: {
      id: organizer._id,
      firstName: organizer.firstName,
      lastName: organizer.lastName,
      email: organizer.email,
      role: organizer.role,
      organizerName: organizer.organizerName,
      category: organizer.category,
    },
  });
});
