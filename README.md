# Felicity Event Management System

A comprehensive full-stack event management platform built with MERN stack, featuring role-based access control, real-time discussion forums, QR-based attendance tracking, payment approval workflows, and anonymous feedback system.

---
## ✨ Features

### Core Features
- **Multi-Role Authentication System**: Admin, Organizer, and Participant roles with JWT-based authentication
- **Event Management**: Create, publish, and manage Normal and Merchandise events
- **Dynamic Registration Forms**: Custom form builder for event-specific registration fields
- **QR Code Ticket Generation**: Automatic QR code generation for registered participants
- **QR Scanner & Attendance Tracking**: Built-in QR scanner with device camera/file upload support
- **Email Notifications**: SendGrid integration for ticket delivery with embedded QR codes
- **Real-Time Discussion Forums**: Socket.IO-powered live messaging with reactions and moderation
- **Merchandise Payment Approval**: Payment proof upload with admin review workflow
- **Anonymous Feedback System**: Star ratings and comments for completed events
- **Password Reset Workflow**: Admin-controlled password reset for organizer accounts
- **Browse & Filter Events**: Advanced search with category, date range, eligibility, and type filters
- **Participant Onboarding**: Interest-based onboarding with organizer following system
- **Profile Management**: Comprehensive profile editing for all user roles
- **Admin Dashboard**: User management, organizer provisioning, and system statistics

---

## 🎯 Advanced Features Summary

This project implements the following advanced features from the assignment requirements:

### Tier A: Core Advanced Features 
✅ **Option 2: Merchandise Payment Approval Workflow**
- Payment proof upload by participants
- Three-state approval workflow (Pending/Approved/Rejected)
- Organizer review dashboard with payment proofs
- Stock decremented only on approval
- QR code & email sent only for approved orders

✅ **Option 3: QR Scanner & Attendance Tracking**
- Built-in QR scanner using device camera or file upload
- Client-side QR decoding with jsQR library
- Duplicate scan prevention with timestamps
- Live attendance dashboard with analytics
- Manual ticket ID entry fallback
- Real-time attendance rate calculation

### Tier B: Real-time & Communication Features 
✅ **Option 1: Real-Time Discussion Forum**
- Socket.IO-powered live messaging
- Event-based message rooms with persistence
- Organizer moderation (pin/delete messages)
- Message reactions (👍, ❤️, 💡, ✨)
- Reply threading support
- Live new message notifications

✅ **Option 2: Organizer Password Reset Workflow**
- Request submission with reason explanation
- Admin review dashboard with all requests
- Approve/reject workflow with comments
- Auto-generated secure passwords on approval
- Request status tracking (Pending/Approved/Rejected)
- Complete password reset history

### Tier C: Integration & Enhancement Features
✅ **Option 1: Anonymous Feedback System**
- Star rating (1-5) with visual hover effects
- Optional text comments
- True anonymity (no participant ID stored)
- Organizer view with average rating
- Filter feedback by star rating
- Attendance-verified submissions only

**Total Advanced Features Score: 30 Marks**

---

## � Database Models & Additional Attributes

### Participant Model

**Additional Attributes Added (with justification):**

| Attribute | Type | Justification |
|-----------|------|---------------|
| `interests` | Array of Strings | Stores participant's selected interests from onboarding (Technical, Cultural, Sports, etc.). Enables personalized event recommendations and filtering events by followed clubs. |
| `followedClubs` | Array of ObjectIds | References to organizers the participant follows. Powers the "Followed Clubs Only" filter in Browse Events page, allowing participants to see events only from their preferred organizers. |
| `areasOfInterest` | Array of Strings | Additional custom interests entered during onboarding. Provides flexibility for participants to add specific interests beyond predefined categories. |
| `following` | Array of ObjectIds | References to other users being followed. Future-proofing for social features like activity feeds and peer recommendations. |
| `createdAt` | Date | Timestamp of account creation. Useful for analytics and account age verification. |
| `updatedAt` | Date | Timestamp of last profile update. Tracks account activity and data freshness. |

### Organizer Model

**Additional Attributes Added (with justification):**

| Attribute | Type | Justification |
|-----------|------|---------------|
| `firstName` | String | Personal first name of organizer admin. Used for personalized communication and profile display. |
| `lastName` | String | Personal last name of organizer admin. Completes identity information for admin purposes. |
| `email` | String (unique) | Login email for organizer account. Separate from contactEmail to distinguish between login credentials and public contact information. |
| `password` | String (hashed) | Bcrypt hashed password for authentication. Required for secure login and account protection. |
| `contactNumber` | String | Phone number for urgent communication. Provides alternative contact method beyond email. |
| `discordWebhookUrl` | String | Discord webhook URL for event announcements. **NOTE: This was removed from advanced features as it was replaced with other Tier B features, but kept in model for future integration.** Allows automated event notifications to Discord communities. 

---

## �🛠 Technology Stack

### Frontend

| Library/Framework | Version | Justification |
|-------------------|---------|---------------|
| **React** | 18.3.1 | Component-based architecture for building interactive UIs with excellent ecosystem support |
| **React Router DOM** | 7.0.2 | Client-side routing with protected routes for role-based access control |
| **Axios** | 1.7.9 | Promise-based HTTP client with interceptors for centralized error handling and request management |
| **Vite** | 6.0.1 | Lightning-fast build tool with Hot Module Replacement (HMR) for superior developer experience |
| **Lucide React** | 0.468.0 | Modern, customizable icon library with tree-shaking support for smaller bundle sizes |
| **jsQR** | 1.4.0 | Pure JavaScript QR code decoding library for scanning participant tickets without external dependencies |
| **Socket.IO Client** | 4.8.3 | Real-time bidirectional communication for live discussion forums and instant message delivery |

**Frontend Technology Justification:**
- **React**: Chosen for its virtual DOM efficiency, large ecosystem, and component reusability
- **Vite**: Selected over Create React App for faster builds (~10-100x faster) and better development experience
- **No UI Framework Used**: Deliberately avoided Material-UI, Bootstrap, Tailwind CSS, or Chakra UI
- **Inline Styles Approach**: All components use React inline styles for complete control over styling, zero unused CSS, no class name conflicts, and component-scoped styles without external dependencies
- **Why No UI Library?**: Provides learning opportunity for custom component design, eliminates bundle bloat from unused components, ensures consistent custom design system, and avoids framework lock-in
- **Axios**: Preferred over Fetch API for automatic JSON transformation, request/response interceptors, and better error handling
- **Lucide React**: Minimal icon library (tree-shakeable) chosen over Font Awesome for smaller bundle size
- **jsQR**: Lightweight QR decoding library (10KB minified) with no dependencies
- **Socket.IO Client**: Industry-standard for real-time communication with automatic reconnection and fallback mechanisms

### Backend

| Library/Framework | Version | Justification |
|-------------------|---------|---------------|
| **Node.js** | Latest LTS | JavaScript runtime for building scalable server-side applications |
| **Express.js** | 4.21.2 | Minimal and flexible web framework for building RESTful APIs |
| **MongoDB** | Latest | NoSQL database for flexible schema design using discriminators for user roles |
| **Mongoose** | 8.9.4 | ODM for MongoDB with schema validation, middleware hooks, and query building |
| **JWT (jsonwebtoken)** | 9.0.2 | Stateless authentication with role-based access control |
| **bcryptjs** | 2.4.3 | Password hashing with salt rounds for secure credential storage |
| **@sendgrid/mail** | 8.1.0 | Enterprise email service for reliable ticket delivery with inline image support |
| **qrcode** | 1.5.4 | QR code generation for event tickets and attendance tracking |
| **Socket.IO** | 4.8.3 | Real-time WebSocket server for bidirectional event-based communication in discussion forums |
| **dotenv** | 16.4.7 | Environment variable management for secure configuration |

**Backend Technology Justification:**
- **Express.js**: Lightweight framework allowing custom architecture without opinionated structure
- **MongoDB + Mongoose**: NoSQL flexibility for handling different user types (Admin, Organizer, Participant) using discriminators
- **SendGrid**: Switched from SMTP due to Render deployment network restrictions; provides better deliverability and inline image support for QR codes
- **JWT**: Stateless authentication suitable for scalable microservices architecture
- **Socket.IO**: Enables real-time features (discussion forums) with automatic reconnection and room-based messaging
- **jsQR**: Client-side QR scanning eliminates need for server-side image processing, improving privacy and performance
- **bcryptjs**: Industry-standard password hashing with configurable computational cost

---

## 🏆 Advanced Features Implementation

### Tier A: Core Advanced Features 

#### Feature 1: Merchandise Payment Approval Workflow [8 Marks]

**Problem Solved:** Traditional event systems immediately confirm merchandise orders, leading to stock management issues and fraudulent purchases. This feature implements a payment verification system ensuring legitimate transactions.

**Technical Implementation:**
1. **Three-State Workflow**: Orders transition through `Pending Approval` → `Successful` (approved) or `Rejected`
2. **Payment Proof Upload**: Participants upload payment proof images after placing merchandise orders
3. **Organizer Review Interface**: Dedicated "Participants" tab showing all registrations with uploaded payment proofs
4. **Conditional Stock Management**: Stock decremented only upon payment approval (not on order placement)
5. **QR Code Generation**: Tickets with QR codes generated only for approved orders
6. **Email Notifications**: Confirmation emails with embedded QR codes sent only upon approval

**Design Choices:**
- Payment proof stored as URLs in MongoDB for scalability and CDN integration
- Optimistic UI updates for better user experience during approval/rejection
- Comprehensive audit logging for all payment state transitions
- Separated merchandise and normal event logic using event type discriminators

**Key Files:**
- [controllers/registrationController.js](backend/controllers/registrationController.js) - Payment approval/rejection logic
- [pages/EventDetails.jsx](frontend/src/pages/EventDetails.jsx) - Payment proof upload interface
- [pages/OrganizerEventView.jsx](frontend/src/pages/OrganizerEventView.jsx) - Payment review dashboard
- [models/Registration.js](backend/models/Registration.js) - Payment workflow states

**Technical Decisions:**
- **Why client-side image upload?** Allows participants to preview before submission, reduces server I/O
- **Why separate payment status field?** Provides clear audit trail and prevents stock manipulation
- **Why email on approval only?** Prevents spam and ensures only verified purchases receive tickets
- **Why three states?** Provides transparency to participants about rejection reasons

---

#### Feature 2: QR Scanner & Attendance Tracking

**Problem Solved:** Manual attendance tracking is error-prone and time-consuming. Automated QR scanning validates tickets instantly and provides real-time attendance analytics.

**Technical Implementation:**
1. **Device Camera & File Upload Support**: Organizers can scan QR codes via device camera or upload QR code images
2. **Client-Side QR Decoding**: Using jsQR library for instant QR code extraction without server processing
3. **Duplicate Scan Prevention**: Backend validates and rejects duplicate scans for same ticket
4. **Timestamp Recording**: Each attendance marked with exact timestamp
5. **Live Attendance Dashboard**: Real-time statistics showing scanned vs. pending participants
6. **Manual Override**: Text input for manual ticket ID entry as fallback
7. **Attendance Analytics**: Attendance rate calculation and visual progress tracking

**Design Choices:**
- Client-side QR decoding using jsQR library (privacy-preserving, no image upload to server)
- Fallback manual entry for damaged/unreadable QR codes
- Real-time dashboard updates after each scan
- Attendance status persisted in registration model with timestamp

**Key Implementation:**
```javascript
// QR Image Upload Handler
const handleQRImageUpload = async (e) => {
  const file = e.target.files[0];
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Load and draw image to canvas
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
  // Decode QR code
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  if (code && code.data) {
    setQrInput(code.data); // Extracted ticket ID
    handleMarkAttendance(); // Auto-mark attendance
  }
};
```

**Key Files:**
- [pages/OrganizerEventView.jsx](frontend/src/pages/OrganizerEventView.jsx) - QR scanner interface and attendance dashboard
- [controllers/registrationController.js](backend/controllers/registrationController.js) - Attendance marking logic with duplicate prevention
- [models/Registration.js](backend/models/Registration.js) - Attendance status and timestamp fields

**Technical Decisions:**
- **Why jsQR library?** Pure JavaScript, no external dependencies, works offline
- **Why client-side decoding?** Participant privacy (images never leave device), faster processing
- **Why duplicate prevention?** Prevents attendance fraud and data corruption
- **Why timestamp recording?** Provides audit trail and enables late-entry tracking
- **Why manual override?** Handles edge cases (damaged QR, print quality issues)

---

### Tier B: Real-time & Communication Features

#### Feature 1: Real-Time Discussion Forum 

**Problem Solved:** Participants need a platform to ask questions, share updates, and interact before/during events. Static comment sections lack real-time interaction and moderation capabilities.

**Technical Implementation:**
1. **WebSocket Communication**: Socket.IO for bidirectional real-time messaging
2. **Event-Based Rooms**: Each event has isolated discussion room (join on page load)
3. **Message Types**: Regular messages and announcements (organizer-only)
4. **Organizer Moderation**: Pin important messages, delete inappropriate content
5. **Reaction System**: Participants can react with emojis (👍, ❤️, 💡, ✨)
6. **Message Threading**: Reply-to functionality for organized discussions
7. **Live Notifications**: Visual indicators for new messages

**Design Choices:**
- Socket.IO rooms isolate event discussions (participants only join relevant events)
- Message persistence in MongoDB (history available to new joiners)
- Real-time updates via WebSocket, fallback to polling if WebSocket unavailable
- Reactions stored as arrays with user IDs to prevent duplicate reactions

**Key Implementation:**
```javascript
// Socket.IO Room Management
socketRef.current = io(BACKEND_URL);
socketRef.current.emit('join:event', eventId);

// Real-time message handlers
socketRef.current.on('forum:newMessage', ({ message }) => {
  setMessages(prev => [message, ...prev]);
  setNewMessageNotification(true);
});

socketRef.current.on('forum:reactionUpdated', ({ messageId, reactions }) => {
  setMessages(prev => prev.map(msg => 
    msg._id === messageId ? { ...msg, reactions } : msg
  ));
});
```

**Key Files:**
- [components/EventForum.jsx](frontend/src/components/EventForum.jsx) - Real-time forum UI and Socket.IO integration
- [controllers/forumController.js](backend/controllers/forumController.js) - Forum message CRUD and WebSocket event emission
- [models/ForumMessage.js](backend/models/ForumMessage.js) - Message schema with reactions and threading
- [server.js](backend/server.js) - Socket.IO server setup

**Technical Decisions:**
- **Why Socket.IO over native WebSocket?** Automatic reconnection, room support, fallback to polling
- **Why event-based rooms?** Scalability - users only receive relevant messages
- **Why store reactions?** Enables analytics and prevents duplicate reactions
- **Why pin functionality?** Organizers can highlight important announcements/FAQs

---

#### Feature 2: Organizer Password Reset Workflow 

**Problem Solved:** Organizers who forget passwords need secure, admin-controlled reset process. Self-service password reset poses security risks for organizer accounts with elevated privileges.

**Technical Implementation:**
1. **Request Submission**: Organizers submit password reset requests with reason explanation
2. **Admin Review Dashboard**: Admins view all pending requests with organizer details, submission date, and reason
3. **Approval/Rejection Workflow**: Admin can approve (auto-generates new password) or reject (with comment)
4. **Auto-Generated Passwords**: System generates secure random passwords on approval
5. **Request Status Tracking**: Three states - Pending, Approved, Rejected
6. **Password History**: All reset requests stored with timestamps and admin actions
7. **Notification System**: Request status shown in organizer profile

**Design Choices:**
- Admin-controlled workflow ensures security for privileged accounts
- Auto-generated passwords eliminate weak password risks
- Request history provides audit trail for security compliance
- Rejection comments allow communication with organizers

**Key Implementation:**
```javascript
// Password Reset Request Model
const passwordResetRequestSchema = new mongoose.Schema({
  organizer: { type: ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: ObjectId, ref: 'User' }, // Admin who reviewed
  reviewedAt: { type: Date },
  newPassword: { type: String, select: false }, // Only shown to admin on approval
  rejectionComment: { type: String }
});
```

**Key Files:**
- [pages/OrganizerProfile.jsx](frontend/src/pages/OrganizerProfile.jsx) - Password reset request submission and status display
- [pages/AdminDashboard.jsx](frontend/src/pages/AdminDashboard.jsx) - Admin review interface with approve/reject actions
- [controllers/passwordResetController.js](backend/controllers/passwordResetController.js) - Request processing and password generation
- [models/PasswordResetRequest.js](backend/models/PasswordResetRequest.js) - Request workflow state management

**Technical Decisions:**
- **Why admin approval required?** Organizer accounts have elevated privileges (event management)
- **Why auto-generated passwords?** Eliminates weak passwords and ensures security standards
- **Why reason field?** Helps admins verify legitimate requests and detect potential account compromises
- **Why rejection comments?** Provides feedback to organizers without direct communication overhead
- **Why password history?** Audit compliance and security incident investigation

---

### Tier C: Integration & Enhancement Features

#### Feature 1: Anonymous Feedback System

**Problem Solved:** Participants hesitate to provide honest feedback when identifiable. Anonymous feedback encourages candid responses and helps organizers improve events.

**Technical Implementation:**
1. **Star Rating System**: 1-5 star rating with visual hover effects
2. **Text Comments**: Optional detailed feedback in addition to rating
3. **Anonymity Guarantee**: Backend doesn't store participant IDs with feedback
4. **Aggregated View**: Organizers see average rating and all feedback without author information
5. **Filter by Rating**: Organizers can filter feedback by star rating (1-5 stars)
6. **Attendance Verification**: Only participants who attended can submit feedback

**Design Choices:**
- Feedback submission only available after event completion
- Star rating required, text comment optional
- Frontend prevents showing author information to organizers
- Average rating calculated server-side for accuracy

**Key Implementation:**
```javascript
// Anonymous Feedback Model
const feedbackSchema = new mongoose.Schema({
  event: { type: ObjectId, ref: 'Event', required: true },
  // NO participant field - ensures anonymity
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

// Prevent duplicate feedback (use session/cookie tracking, not user ID)
feedbackSchema.index({ event: 1, sessionId: 1 }, { unique: true });
```

**Key Files:**
- [components/FeedbackForm.jsx](frontend/src/components/FeedbackForm.jsx) - Anonymous feedback submission interface
- [components/EventFeedbackView.jsx](frontend/src/components/EventFeedbackView.jsx) - Organizer feedback dashboard with filtering
- [pages/ParticipantDashboard.jsx](frontend/src/pages/ParticipantDashboard.jsx) - Feedback form modal for completed events
- [controllers/feedbackController.js](backend/controllers/feedbackController.js) - Feedback submission and aggregation
- [models/Feedback.js](backend/models/Feedback.js) - Feedback schema without participant reference

**Technical Decisions:**
- **Why no participant ID?** Guarantees true anonymity - data forensics cannot reveal authors
- **Why require rating?** Ensures all feedback has quantifiable metric
- **Why optional comment?** Some participants prefer quick rating without writing
- **Why filter by rating?** Helps organizers identify patterns and prioritize improvements
- **Why attendance check?** Prevents spam and ensures feedback is from actual attendees

---

## 🚀 Setup and Installation

### Prerequisites
- **Node.js**: v18.x or higher
- **MongoDB**: Local installation or MongoDB Atlas account
- **npm**: v9.x or higher

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   Create a `.env` file in the `backend` directory (or rename `config.env` to `.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/event-management
   # OR use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/event-management
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   
   # SendGrid Email (Required for ticket sending)
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_verified_sender@example.com
   EMAIL_FROM_NAME=Felicity Events
   ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Application will run on `http://localhost:5173`

### Initial Admin Setup

The system requires an admin account to be created manually in the database:

1. **Connect to MongoDB:**
   ```bash
   mongosh
   use event-management
   ```

2. **Create admin user:**
   ```javascript
   db.users.insertOne({
     firstName: "Admin",
     lastName: "User",
     email: "admin@example.com",
     password: "$2a$10$hashedPasswordHere", // Use bcrypt to hash your password
     role: "Admin",
     __t: "Admin",
     accountStatus: "active",
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

   Or use the backend to create via API/seed script.

### Production Deployment

**Backend (Render/Heroku/Railway):**
- Set all environment variables in platform settings
- Ensure MongoDB Atlas IP whitelist includes platform IPs (or use 0.0.0.0/0)
- Set `NODE_ENV=production`

**Frontend (Vercel/Netlify):**
- Set `VITE_API_URL` to your deployed backend URL
- Configure build command: `npm run build`
- Configure output directory: `dist`

---

## 📁 Project Structure

```
DASS ASSIGNMENT/
├── backend/
│   ├── config/
│   │   ├── config.env          # Environment variables
│   │   ├── database.js         # MongoDB connection
│   │   └── db.js              # Database utilities
│   ├── controllers/
│   │   ├── adminController.js      # Admin operations
│   │   ├── authController.js       # Authentication logic
│   │   ├── eventController.js      # Event CRUD operations
│   │   ├── feedbackController.js   # Anonymous feedback submission & aggregation
│   │   ├── forumController.js      # Real-time forum messaging
│   │   ├── passwordResetController.js # Organizer password reset workflow
│   │   ├── registrationController.js # Payment approval & attendance tracking
│   │   └── userController.js       # User profile management
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication + role check
│   │   └── errorHandler.js    # Global error handling
│   ├── models/
│   │   ├── Event.js           # Event model (Normal/Merchandise discriminator)
│   │   ├── Feedback.js        # Anonymous feedback with ratings
│   │   ├── ForumMessage.js    # Forum messages with reactions & threading
│   │   ├── PasswordChangeRequest.js # Password change workflow (unused)
│   │   ├── PasswordResetRequest.js # Organizer password reset requests
│   │   ├── Registration.js    # Registration with payment & attendance workflow
│   │   └── User.js            # User base model with discriminators
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── feedback.js
│   │   ├── forum.js
│   │   ├── registrationRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   ├── asyncHandler.js    # Async error wrapper
│   │   ├── emailService.js    # SendGrid integration
│   │   ├── errorResponse.js   # Custom error class
│   │   └── qrCodeService.js   # QR code generation
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point + Socket.IO setup
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── EventFeedbackView.jsx
│   │   │   ├── EventForum.jsx
│   │   │   ├── FeedbackForm.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx  # Admin panel with password reset approval
│   │   │   ├── BrowseEvents.jsx    # Event discovery with filters
│   │   │   ├── CreateEvent.jsx     # Event creation form
│   │   │   ├── EditEvent.jsx       # State-based event editing
│   │   │   ├── EventDetails.jsx    # Event view + registration + forum
│   │   │   ├── EventRegistrations.jsx # Organizer registration view
│   │   │   ├── Login.jsx
│   │   │   ├── MyRegistrations.jsx # Participant tickets with QR codes
│   │   │   ├── Onboarding.jsx      # Interest selection
│   │   │   ├── OrganizerDashboard.jsx
│   │   │   ├── OrganizerDetail.jsx
│   │   │   ├── OrganizerProfile.jsx # Password reset request submission
│   │   │   ├── OrganizerEventView.jsx # QR scanner + attendance + forum
│   │   │   ├── OrganizersList.jsx   # Organizers directory
│   │   │   ├── ParticipantDashboard.jsx # Feedback submission
│   │   │   ├── Profile.jsx
│   │   │   └── Signup.jsx
│   │   ├── utils/
│   │   │   └── axios.js           # Axios configuration
│   │   ├── App.jsx                # Route definitions
│   │   ├── main.jsx               # React entry point
│   │   └── App.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🔐 Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/event-management` |
| `JWT_SECRET` | JWT signing secret | `your_secure_secret_key` |
| `JWT_EXPIRE` | JWT token expiration | `7d` |
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxxxxxxxxxxxx` |
| `SENDGRID_FROM_EMAIL` | Verified sender email | `noreply@yourdomain.com` |
| `EMAIL_FROM_NAME` | Email sender name | `Felicity Events` |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new participant | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| POST | `/api/auth/logout` | Logout user | Private |

### Event Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/events/public` | Get published events | Public |
| GET | `/api/events/:id` | Get single event | Public |
| POST | `/api/events` | Create event | Organizer/Admin |
| PUT | `/api/events/:id` | Update event (state-based) | Organizer/Admin |
| DELETE | `/api/events/:id` | Delete event | Organizer/Admin |
| GET | `/api/events/organizer/my-events` | Get organizer's events | Organizer |

### Registration Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/registrations/:eventId` | Register for event | Participant |
| GET | `/api/registrations/my-registrations` | Get user's registrations | Participant |
| PUT | `/api/registrations/:id/approve` | Approve payment | Organizer |
| PUT | `/api/registrations/:id/reject` | Reject payment | Organizer |

### Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/admin/organizers` | Provision organizer | Admin |
| GET | `/api/admin/organizers` | Get all organizers | Admin |
| PUT | `/api/admin/organizers/:id/status` | Update organizer status | Admin |
| GET | `/api/admin/stats` | Get system statistics | Admin |

---

