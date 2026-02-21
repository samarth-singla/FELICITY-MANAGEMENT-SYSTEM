import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  Eye,
  Activity,
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

const OngoingEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOngoingEvents();
  }, []);

  const fetchOngoingEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/events/organizer/my-events');
      const allEvents = response.data.data;
      
      // Filter for ongoing events
      const now = new Date();
      const ongoing = allEvents.filter(event => {
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        return startDate <= now && endDate >= now && event.isPublished;
      });

      setEvents(ongoing);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching ongoing events:', err);
      setError(err.response?.data?.error || 'Failed to fetch ongoing events');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    }
    return `${hours}h remaining`;
  };

  return (
    <div style={{ padding: '30px 20px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', color: '#111827', marginBottom: '8px', fontWeight: '700' }}>
            Ongoing Events
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
            Manage your currently active events
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#991b1b'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: '#6b7280' }}>Loading ongoing events...</p>
          </div>
        ) : events.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '60px 20px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '2px dashed #e5e7eb'
          }}>
            <Activity size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', color: '#111827', marginBottom: '8px' }}>
              No Ongoing Events
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              You don't have any events currently in progress
            </p>
            <button
              onClick={() => navigate('/organizer/dashboard')}
              style={{
                padding: '10px 24px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              View All Events
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '24px'
          }}>
            {events.map(event => (
              <div
                key={event._id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '2px solid #10b981',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/events/${event._id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
              >
                {/* Ongoing Badge */}
                <div style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={18} />
                    <span>LIVE NOW</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Clock size={14} />
                    <span>{getTimeRemaining(event.endDate)}</span>
                  </div>
                </div>

                {/* Event Image */}
                {event.imageUrl ? (
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '64px'
                  }}>
                    📅
                  </div>
                )}

                {/* Event Content */}
                <div style={{ padding: '24px' }}>
                  {/* Event Type Badges */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {event.type}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: '#ede9fe',
                      color: '#7c3aed',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {event.category}
                    </span>
                  </div>

                  {/* Event Name */}
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 16px 0',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {event.name}
                  </h3>

                  {/* Event Details */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      <Calendar size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div><strong>Started:</strong> {formatDate(event.startDate)}</div>
                        <div><strong>Ends:</strong> {formatDate(event.endDate)}</div>
                      </div>
                    </div>

                    {event.location && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#6b7280',
                        fontSize: '14px'
                      }}>
                        <MapPin size={16} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.location}
                        </span>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      <Users size={16} style={{ flexShrink: 0 }} />
                      <span>
                        <strong>{event.currentRegistrations || 0}</strong> / {event.maxCapacity || '∞'} registered
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#6b7280',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      <DollarSign size={16} style={{ flexShrink: 0 }} />
                      <span>{event.registrationFee > 0 ? formatCurrency(event.registrationFee) : 'Free Entry'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    paddingTop: '20px',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/organizer/event/${event._id}`);
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                      <Eye size={16} />
                      View & Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OngoingEvents;
