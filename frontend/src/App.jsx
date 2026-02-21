import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ParticipantDashboard from './pages/ParticipantDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotAuthorized from './pages/NotAuthorized';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import CreateEvent from './pages/CreateEvent';
import BrowseEvents from './pages/BrowseEvents';
import EventDetails from './pages/EventDetails';
import MyRegistrations from './pages/MyRegistrations';
import OrganizersList from './pages/OrganizersList';
import OrganizerDetail from './pages/OrganizerDetail';
import EventRegistrations from './pages/EventRegistrations';
import OrganizerProfile from './pages/OrganizerProfile';
import OngoingEvents from './pages/OngoingEvents';
import EditEvent from './pages/EditEvent';
import OrganizerEventView from './pages/OrganizerEventView';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/events" element={<BrowseEvents />} />
          <Route path="/events/:id" element={<EventDetails />} />
          
          {/* Not Authorized Page */}
          <Route path="/not-authorized" element={<NotAuthorized />} />

          {/* Onboarding - Participant Only */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Participant Only */}
          <Route
            path="/participant/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <ParticipantDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/participant/profile"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/participant/registrations"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <MyRegistrations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizers"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <OrganizersList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizers/:id"
            element={
              <ProtectedRoute allowedRoles={['Participant']}>
                <OrganizerDetail />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Organizer Only */}
          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/create-event"
            element={
              <ProtectedRoute allowedRoles={['Organizer']}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/edit-event/:id"
            element={
              <ProtectedRoute allowedRoles={['Organizer']}>
                <EditEvent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/event/:eventId"
            element={
              <ProtectedRoute allowedRoles={['Organizer']}>
                <OrganizerEventView />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/event/:eventId/registrations"
            element={
              <ProtectedRoute allowedRoles={['Organizer']}>
                <EventRegistrations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/profile"
            element={
              <ProtectedRoute allowedRoles={['Organizer']}>
                <OrganizerProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/ongoing-events"
            element={
              <ProtectedRoute allowedRoles={['Organizer']}>
                <OngoingEvents />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes - Admin Only */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/manage-clubs"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/password-requests"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <div style={{ padding: '20px' }}>
                  <h1>Password Reset Requests</h1>
                  <p>Password reset request management coming soon...</p>
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/stats"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default Route - Redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 - Redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
