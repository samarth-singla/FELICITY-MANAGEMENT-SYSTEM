import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import FeedbackForm from '../components/FeedbackForm';
import {
  Calendar,
  MapPin,
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Package,
  User,
  ExternalLink,
  TrendingUp,
  Users,
  MessageSquare,
} from 'lucide-react';

const ParticipantDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, normal, merchandise, completed, cancelled
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (user?.role !== 'Participant') {
      navigate('/dashboard');
      return;
    }
    fetchRegistrations();
  }, [user, navigate]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/registrations/me');
      setRegistrations(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch registrations');
      setLoading(false);
    }
  };

  const handleOpenFeedback = (event) => {
    setSelectedEvent(event);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSuccess = () => {
    setShowFeedbackModal(false);
    setSelectedEvent(null);
    fetchRegistrations(); // Refresh to update any status
  };

  // Filter upcoming events
  const upcomingEvents = registrations.filter((reg) => {
    const eventDate = new Date(reg.event.startDate);
    const now = new Date();
    return eventDate >= now && reg.status !== 'cancelled';
  });

  // Filter registrations based on active tab
  const getFilteredRegistrations = () => {
    switch (activeTab) {
      case 'normal':
        return registrations.filter((reg) => reg.event.type !== 'Merchandise');
      case 'merchandise':
        return registrations.filter((reg) => reg.event.type === 'Merchandise');
      case 'completed':
        return registrations.filter((reg) => reg.status === 'attended');
      case 'cancelled':
        return registrations.filter((reg) => reg.status === 'cancelled');
      default:
        return registrations;
    }
  };

  const filteredRegistrations = getFilteredRegistrations();

  const getStatusBadge = (status) => {
    const styles = {
      registered: { bg: '#d4edda', color: '#155724', icon: CheckCircle, text: 'Registered' },
      attended: { bg: '#cce5ff', color: '#004085', icon: CheckCircle, text: 'Completed' },
      cancelled: { bg: '#f8d7da', color: '#721c24', icon: XCircle, text: 'Cancelled/Rejected' },
    };

    const config = styles[status] || styles.registered;
    const Icon = config.icon;

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 12px',
          backgroundColor: config.bg,
          color: config.color,
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
        }}
      >
        <Icon size={14} />
        {config.text}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    return (
      <span
        style={{
          padding: '4px 12px',
          backgroundColor: type === 'Merchandise' ? '#e9d5ff' : '#dbeafe',
          color: type === 'Merchandise' ? '#6b21a8' : '#1e40af',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
        }}
      >
        {type === 'Merchandise' ? '🛍️ Merchandise' : '📅 Activity/Workshop'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabStyle = (tabName) => ({
    padding: '10px 20px',
    backgroundColor: activeTab === tabName ? '#007bff' : 'white',
    color: activeTab === tabName ? 'white' : '#374151',
    border: '1px solid #d1d5db',
    borderBottom: activeTab === tabName ? '1px solid #007bff' : '1px solid #d1d5db',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: activeTab === tabName ? '600' : '500',
    transition: 'all 0.2s',
  });

  if (loading) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Loader
            style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: '#007bff' }}
            size={48}
          />
          <p style={{ color: '#6b7280' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <AlertCircle style={{ margin: '0 auto 1rem', color: '#dc3545' }} size={48} />
          <p style={{ color: '#dc3545', fontWeight: '500' }}>{error}</p>
          <button
            onClick={fetchRegistrations}
            style={{
              marginTop: '1rem',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
              My Events Dashboard
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1rem' }}>
              Welcome back, {user?.firstName}! Here's your event activity.
            </p>
          </div>
          
          {/* View Tickets Button */}
          <button
            onClick={() => navigate('/participant/registrations')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5a67d8';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#667eea';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(102, 126, 234, 0.3)';
            }}
          >
            <Ticket size={20} />
            View All My Tickets & QR Codes
          </button>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>Total Events</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{registrations.length}</p>
              </div>
              <Calendar size={40} style={{ color: '#007bff', opacity: 0.6 }} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>Upcoming</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{upcomingEvents.length}</p>
              </div>
              <TrendingUp size={40} style={{ color: '#28a745', opacity: 0.6 }} />
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>Completed</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
                  {registrations.filter((r) => r.status === 'attended').length}
                </p>
              </div>
              <CheckCircle size={40} style={{ color: '#17a2b8', opacity: 0.6 }} />
            </div>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Clock size={24} color="#007bff" />
            Upcoming Events
          </h2>

          {upcomingEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No upcoming events. Browse events to register!</p>
              <button
                onClick={() => navigate('/events')}
                style={{
                  marginTop: '1rem',
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Browse Events
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {upcomingEvents.map((reg) => (
                <div
                  key={reg._id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                        {reg.event.name}
                      </h3>
                      {getTypeBadge(reg.event.type)}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '14px', color: '#6b7280' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={16} />
                        {reg.event.organizer?.organizerName || 'N/A'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={16} />
                        {formatDate(reg.event.startDate)}
                      </span>
                      {reg.teamName && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={16} />
                          Team: {reg.teamName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {getStatusBadge(reg.status)}
                    <button
                      onClick={() => navigate(`/events/${reg.event._id}`)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      View <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Participation History Section */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              padding: '1.5rem',
              margin: 0,
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            Participation History
          </h2>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #d1d5db' }}>
            <button onClick={() => setActiveTab('all')} style={tabStyle('all')}>
              All ({registrations.length})
            </button>
            <button onClick={() => setActiveTab('normal')} style={tabStyle('normal')}>
              Normal ({registrations.filter((r) => r.event.type !== 'Merchandise').length})
            </button>
            <button onClick={() => setActiveTab('merchandise')} style={tabStyle('merchandise')}>
              Merchandise ({registrations.filter((r) => r.event.type === 'Merchandise').length})
            </button>
            <button onClick={() => setActiveTab('completed')} style={tabStyle('completed')}>
              Completed ({registrations.filter((r) => r.status === 'attended').length})
            </button>
            <button onClick={() => setActiveTab('cancelled')} style={tabStyle('cancelled')}>
              Cancelled/Rejected ({registrations.filter((r) => r.status === 'cancelled').length})
            </button>
          </div>

          {/* Event Records Table */}
          <div style={{ padding: '1.5rem' }}>
            {filteredRegistrations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>No events found in this category.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Event Name
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Organizer
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Status
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Team Name
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Ticket ID
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px', color: '#111827', fontWeight: '500' }}>{reg.event.name}</td>
                        <td style={{ padding: '12px' }}>{getTypeBadge(reg.event.type)}</td>
                        <td style={{ padding: '12px', color: '#6b7280' }}>
                          {reg.event.organizer?.organizerName || 'N/A'}
                        </td>
                        <td style={{ padding: '12px' }}>{getStatusBadge(reg.status)}</td>
                        <td style={{ padding: '12px', color: '#6b7280' }}>{reg.teamName || 'N/A'}</td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => navigate(`/events/${reg.event._id}`)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              backgroundColor: '#e7f3ff',
                              color: '#007bff',
                              border: '1px solid #007bff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                            }}
                          >
                            <Ticket size={14} />
                            {reg.ticketId || reg._id.slice(-8)}
                          </button>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {reg.status === 'attended' && (
                            <button
                              onClick={() => handleOpenFeedback(reg.event)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                backgroundColor: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                              }}
                            >
                              <MessageSquare size={14} />
                              Feedback
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedEvent && (
        <div
          onClick={() => setShowFeedbackModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h2 style={{ margin: 0, color: '#111827', fontSize: '1.5rem', fontWeight: '700' }}>
                  Event Feedback
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                  {selectedEvent.name}
                </p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            <FeedbackForm
              eventId={selectedEvent._id}
              eventName={selectedEvent.name}
              onSuccess={handleFeedbackSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantDashboard;
