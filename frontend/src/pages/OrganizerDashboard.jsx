import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Eye,
  Activity,
  BarChart3,
  Edit
} from 'lucide-react';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalRegistrations: 0,
    totalAttendees: 0,
    publishedEvents: 0,
    draftEvents: 0,
    ongoingEvents: 0,
    completedEvents: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setEventsLoading(true);
      
      // Fetch events
      const eventsResponse = await axios.get('/api/events/organizer/my-events');
      const eventsData = eventsResponse.data.data;
      setEvents(eventsData);

      // Fetch all registrations for organizer's events
      const allRegistrations = [];
      for (const event of eventsData) {
        try {
          const regResponse = await axios.get(`/api/registrations/event/${event._id}`);
          allRegistrations.push(...regResponse.data.data);
        } catch (err) {
          console.error(`Error fetching registrations for event ${event._id}:`, err);
        }
      }
      setRegistrations(allRegistrations);

      // Calculate analytics
      calculateAnalytics(eventsData, allRegistrations);
      
      setEventsLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setEventsLoading(false);
    }
  };

  const calculateAnalytics = (eventsData, registrationsData) => {
    const now = new Date();
    
    let totalRevenue = 0;
    let totalRegistrations = registrationsData.length;
    let totalAttendees = 0;
    let publishedEvents = 0;
    let draftEvents = 0;
    let ongoingEvents = 0;
    let completedEvents = 0;

    // Calculate from registrations
    registrationsData.forEach(reg => {
      if (reg.paymentStatus === 'completed') {
        totalRevenue += reg.paymentAmount || 0;
      }
      if (reg.status === 'attended') {
        totalAttendees += 1;
      }
    });

    // Count event statuses
    eventsData.forEach(event => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      if (event.isPublished) {
        publishedEvents += 1;
      } else {
        draftEvents += 1;
      }

      // Check if ongoing or completed
      if (startDate <= now && endDate >= now && event.isPublished) {
        ongoingEvents += 1;
      } else if (endDate < now && event.isPublished) {
        completedEvents += 1;
      }
    });

    setAnalytics({
      totalRevenue,
      totalRegistrations,
      totalAttendees,
      publishedEvents,
      draftEvents,
      ongoingEvents,
      completedEvents
    });
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (!event.isPublished) {
      return { label: 'Draft', color: '#fbbf24', bgColor: '#fef3c7' };
    }
    
    if (startDate > now) {
      return { label: 'Published', color: '#3b82f6', bgColor: '#dbeafe' };
    } else if (startDate <= now && endDate >= now) {
      return { label: 'Ongoing', color: '#10b981', bgColor: '#d1fae5' };
    } else {
      return { label: 'Closed', color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ padding: '30px 20px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', color: '#111827', marginBottom: '8px', fontWeight: '700' }}>
            Welcome back, {user?.organizerName || `${user?.firstName} ${user?.lastName}`}!
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
            Here's what's happening with your events today
          </p>
        </div>

        {/* Analytics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Total Revenue */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0', fontWeight: '500' }}>
                  Total Revenue
                </p>
                <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  {formatCurrency(analytics.totalRevenue)}
                </h3>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={24} style={{ color: '#16a34a' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#059669' }}>
              <TrendingUp size={14} />
              <span>From {analytics.totalRegistrations} registrations</span>
            </div>
          </div>

          {/* Total Registrations */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0', fontWeight: '500' }}>
                  Total Registrations
                </p>
                <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  {analytics.totalRegistrations}
                </h3>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={24} style={{ color: '#2563eb' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#2563eb' }}>
              <Activity size={14} />
              <span>{analytics.totalAttendees} attended</span>
            </div>
          </div>

          {/* Ongoing Events */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0', fontWeight: '500' }}>
                  Ongoing Events
                </p>
                <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  {analytics.ongoingEvents}
                </h3>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity size={24} style={{ color: '#10b981' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#10b981' }}>
              <Clock size={14} />
              <span>{analytics.publishedEvents} published total</span>
            </div>
          </div>

          {/* Completed Events */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0', fontWeight: '500' }}>
                  Completed Events
                </p>
                <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  {analytics.completedEvents}
                </h3>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={24} style={{ color: '#6b7280' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#6b7280' }}>
              <BarChart3 size={14} />
              <span>{analytics.draftEvents} drafts</span>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ margin: 0, color: '#111827', fontSize: '20px', fontWeight: '600' }}>
              Your Events
            </h2>
            <button
              onClick={() => navigate('/organizer/create-event')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              <Calendar size={16} />
              Create New Event
            </button>
          </div>

          {eventsLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid #e5e7eb',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite'
              }} />
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '2px dashed #e5e7eb'
            }}>
              <Calendar size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', color: '#111827', marginBottom: '8px' }}>
                No events yet
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                Create your first event to get started
              </p>
              <button
                onClick={() => navigate('/organizer/create-event')}
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
                Create Event
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px'
            }}>
              {events.map(event => {
                const status = getEventStatus(event);
                
                return (
                  <div
                    key={event._id}
                    onClick={() => navigate(`/events/${event._id}`)}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      backgroundColor: 'white',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Event Image */}
                    {event.imageUrl ? (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          style={{
                            width: '100%',
                            height: '180px',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '180px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '56px'
                      }}>
                        📅
                      </div>
                    )}

                    {/* Event Content */}
                    <div style={{ padding: '20px' }}>
                      {/* Badges */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: '4px 10px',
                          backgroundColor: status.bgColor,
                          color: status.color,
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {status.label}
                        </span>
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
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 12px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4'
                      }}>
                        {event.name}
                      </h3>

                      {/* Event Details */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#6b7280',
                          fontSize: '14px'
                        }}>
                          <Calendar size={16} />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#6b7280',
                          fontSize: '14px'
                        }}>
                          <Users size={16} />
                          <span>{event.currentRegistrations || 0} / {event.maxCapacity || '∞'} registered</span>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#6b7280',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          <DollarSign size={16} />
                          <span>{event.registrationFee > 0 ? formatCurrency(event.registrationFee) : 'Free'}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        paddingTop: '16px',
                        borderTop: '1px solid #f3f4f6'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/organizer/event/${event._id}`);
                          }}
                          style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                        >
                          <Eye size={14} />
                          View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/organizer/edit-event/${event._id}`);
                          }}
                          style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#fbbf24',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f59e0b'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#fbbf24'}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
