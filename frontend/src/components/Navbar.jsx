import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Users, 
  PlusCircle, 
  QrCode, 
  UserCircle, 
  ClipboardList, 
  BarChart3, 
  Key, 
  LogOut,
  Building2
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  // Don't show navbar on login/signup pages or for Admin users
  if (!isAuthenticated() || 
      location.pathname === '/login' || 
      location.pathname === '/signup' ||
      user?.role === 'Admin' ||
      location.pathname.startsWith('/admin')) {
    return null;
  }

  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    textDecoration: 'none',
    color: isActive(path) ? '#007bff' : '#333',
    backgroundColor: isActive(path) ? '#e7f3ff' : 'transparent',
    borderRadius: '4px',
    transition: 'all 0.2s',
    fontWeight: isActive(path) ? '600' : '400',
  });

  return (
    <nav style={{
      backgroundColor: '#fff',
      borderBottom: '2px solid #e9ecef',
      padding: '12px 24px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        {/* Logo/Brand */}
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#007bff',
        }}>
          Felicity Events
        </div>

        {/* Navigation Links */}
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          {/* Participant Links */}
          {user?.role === 'Participant' && (
            <>
              <Link to="/participant/dashboard" style={linkStyle('/participant/dashboard')}>
                <BarChart3 size={18} />
                Dashboard
              </Link>
              <Link to="/events" style={linkStyle('/events')}>
                <Calendar size={18} />
                Browse Events
              </Link>
              <Link to="/organizers" style={linkStyle('/organizers')}>
                <Building2 size={18} />
                Clubs/Organizers
              </Link>
              <Link to="/participant/profile" style={linkStyle('/participant/profile')}>
                <UserCircle size={18} />
                Profile
              </Link>
            </>
          )}

          {/* Organizer Links */}
          {user?.role === 'Organizer' && (
            <>
              <Link to="/organizer/dashboard" style={linkStyle('/organizer/dashboard')}>
                <BarChart3 size={18} />
                Dashboard
              </Link>
              <Link to="/organizer/create-event" style={linkStyle('/organizer/create-event')}>
                <PlusCircle size={18} />
                Create Event
              </Link>
              <Link to="/organizer/ongoing-events" style={linkStyle('/organizer/ongoing-events')}>
                <Calendar size={18} />
                Ongoing Events
              </Link>
              <Link to="/organizer/profile" style={linkStyle('/organizer/profile')}>
                <UserCircle size={18} />
                Profile
              </Link>
            </>
          )}

          {/* Admin Links */}
          {user?.role === 'Admin' && (
            <>
              <Link to="/admin/manage-clubs" style={linkStyle('/admin/manage-clubs')}>
                <Users size={18} />
                Manage Clubs
              </Link>
              <Link to="/admin/password-requests" style={linkStyle('/admin/password-requests')}>
                <Key size={18} />
                Password Requests
              </Link>
              <Link to="/admin/stats" style={linkStyle('/admin/stats')}>
                <BarChart3 size={18} />
                Stats
              </Link>
            </>
          )}

          {/* User Info & Logout */}
          <div style={{
            marginLeft: '16px',
            paddingLeft: '16px',
            borderLeft: '2px solid #e9ecef',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              fontSize: '14px',
              color: '#666',
            }}>
              <div style={{ fontWeight: '600', color: '#333' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: '12px' }}>
                {user?.role}
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
