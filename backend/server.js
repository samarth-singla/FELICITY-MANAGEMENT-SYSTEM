const app = require('./app');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

const PORT = process.env.PORT;

// Create HTTP server
const server = http.createServer(app);



// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Make io accessible in routes
app.io = io;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join event-specific room
  socket.on('join:event', (eventId) => {
    socket.join(`event_${eventId}`);
    console.log(`Socket ${socket.id} joined event room: event_${eventId}`);
  });

  // Leave event room
  socket.on('leave:event', (eventId) => {
    socket.leave(`event_${eventId}`);
    console.log(`Socket ${socket.id} left event room: event_${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Debug email configuration
  console.log('Email Configuration:');
  console.log('- Provider: SendGrid');
  console.log('- API Key:', process.env.SENDGRID_API_KEY ? 'SET ✓' : 'NOT SET ✗');
  console.log('- From Email:', process.env.SENDGRID_FROM_EMAIL || 'NOT SET');
  console.log('- From Name:', process.env.EMAIL_FROM_NAME || 'Felicity Events');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
