# Event Management System - Backend

A Node.js and Express backend following the MVC pattern for an Event Management System.

## Folder Structure

```
backend/
├── config/              # Configuration files
│   ├── database.js     # Database connection
│   └── config.env      # Environment variables
├── controllers/         # Business logic
│   ├── eventController.js
│   └── userController.js
├── models/             # Mongoose models
│   ├── Event.js
│   └── User.js
├── routes/             # API routes
│   ├── eventRoutes.js
│   └── userRoutes.js
├── middleware/         # Custom middleware
│   ├── auth.js
│   └── errorHandler.js
├── utils/              # Utility functions
│   ├── asyncHandler.js
│   └── errorResponse.js
├── app.js              # Express app configuration
├── server.js           # Server entry point
└── package.json        # Dependencies
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Copy `.env.example` to `config/config.env`
- Update the values in `config/config.env`

3. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Users
- POST `/api/users/register` - Register a new user
- POST `/api/users/login` - Login user
- GET `/api/users/me` - Get current user (Protected)
- PUT `/api/users/updatedetails` - Update user details (Protected)
- PUT `/api/users/updatepassword` - Update password (Protected)

### Events
- GET `/api/events` - Get all events
- GET `/api/events/:id` - Get single event
- POST `/api/events` - Create event (Protected, Organizer/Admin)
- PUT `/api/events/:id` - Update event (Protected, Organizer/Admin)
- DELETE `/api/events/:id` - Delete event (Protected, Organizer/Admin)
- POST `/api/events/:id/register` - Register for event (Protected)

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT for authentication
- bcryptjs for password hashing
