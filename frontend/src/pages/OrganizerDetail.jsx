import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Calendar, 
  Users, 
  Heart, 
  MapPin, 
  Clock, 
  DollarSign,
  Tag,
  TrendingUp,
  CheckCircle
} from 'lucide-react';

const OrganizerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchOrganizerDetails();
    fetchUserPreferences();
  }, [id]);

  const fetchOrganizerDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/users/organizer/${id}`);
      const { organizer, events, followersCount } = response.data.data;
      setOrganizer(organizer);
      setEvents(events);
      setFollowersCount(followersCount);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching organizer:', err);
      setError(err.response?.data?.error || 'Failed to load organizer details');
      setLoading(false);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await axios.get('/api/users/me');
      const following = response.data.data.preferences?.following || [];
      const followingIds = following.map(f => typeof f === 'object' ? f._id : f);
      setIsFollowing(followingIds.includes(id));
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  };

  const handleToggleFollow = async () => {
    if (updating) return;

    setUpdating(true);
    
    try {
      const response = await axios.get('/api/users/me');
      const following = response.data.data.preferences?.following || [];
      const followingIds = following.map(f => typeof f === 'object' ? f._id : f);
      
      const newFollowing = isFollowing
        ? followingIds.filter(orgId => orgId !== id)
        : [...followingIds, id];

      await axios.put('/api/users/preferences', {
        following: newFollowing
      });

      setIsFollowing(!isFollowing);
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
      setUpdating(false);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update preferences');
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const now = new Date();
  const upcomingEvents = events.filter(event => new Date(event.startDate) >= now);
  const pastEvents = events.filter(event => new Date(event.startDate) < now);
  const displayedEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        paddingTop: '80px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: '#666' }}>Loading organizer details...</p>
        </div>
      </div>
    );
  }

  if (error && !organizer) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        paddingTop: '80px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '40px auto',
          padding: '0 20px'
        }}>
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #f5c6cb',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Error</h3>
            <p style={{ margin: 0 }}>{error}</p>
            <button
              onClick={() => navigate('/organizers')}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Back to Organizers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      paddingTop: '80px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/organizers')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'white',
            color: '#667eea',
            border: '1px solid #667eea',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '20px'
          }}
        >
          <ArrowLeft size={16} />
          Back to Clubs
        </button>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Organizer Info Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#667eea',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '600'
                }}>
                  {organizer?.organizerName?.charAt(0) || 'O'}
                </div>
                <div>
                  <h1 style={{
                    margin: '0 0 4px 0',
                    fontSize: '28px',
                    color: '#333'
                  }}>
                    {organizer?.organizerName}
                  </h1>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: '#e7f3ff',
                    color: '#0066cc',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {organizer?.category}
                  </div>
                </div>
              </div>

              <p style={{
                margin: '0 0 20px 0',
                fontSize: '16px',
                color: '#666',
                lineHeight: '1.6'
              }}>
                {organizer?.description || 'No description available'}
              </p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#666'
                }}>
                  <Mail size={18} />
                  <span>{organizer?.contactEmail || organizer?.email}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#666'
                }}>
                  <Users size={18} />
                  <span>{followersCount} follower{followersCount !== 1 ? 's' : ''}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#666'
                }}>
                  <TrendingUp size={18} />
                  <span>{events.length} total event{events.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={handleToggleFollow}
                disabled={updating}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isFollowing ? 'white' : '#667eea',
                  color: isFollowing ? '#667eea' : 'white',
                  border: isFollowing ? '2px solid #667eea' : 'none',
                  borderRadius: '6px',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  opacity: updating ? 0.6 : 1,
                  minWidth: '140px',
                  justifyContent: 'center'
                }}
              >
                <Heart
                  size={20}
                  fill={isFollowing ? '#667eea' : 'none'}
                />
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '20px',
            borderBottom: '2px solid #f0f0f0',
            marginBottom: '30px'
          }}>
            <button
              onClick={() => setActiveTab('upcoming')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: activeTab === 'upcoming' ? '#667eea' : '#666',
                border: 'none',
                borderBottom: activeTab === 'upcoming' ? '3px solid #667eea' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s',
                marginBottom: '-2px'
              }}
            >
              Upcoming Events ({upcomingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: activeTab === 'past' ? '#667eea' : '#666',
                border: 'none',
                borderBottom: activeTab === 'past' ? '3px solid #667eea' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s',
                marginBottom: '-2px'
              }}
            >
              Past Events ({pastEvents.length})
            </button>
          </div>

          {/* Events List */}
          {displayedEvents.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666'
            }}>
              <Calendar size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>
                No {activeTab} events
              </h3>
              <p style={{ fontSize: '14px', color: '#999' }}>
                {activeTab === 'upcoming' 
                  ? 'This organizer has no upcoming events at the moment.'
                  : 'This organizer has no past events.'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {displayedEvents.map(event => (
                <div
                  key={event._id}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    backgroundColor: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => navigate(`/events/${event._id}`)}
                >
                  {/* Event Image */}
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      style={{
                        width: '100%',
                        height: '180px',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '180px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '48px'
                    }}>
                      📅
                    </div>
                  )}

                  {/* Event Content */}
                  <div style={{ padding: '20px' }}>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#e7f3ff',
                        color: '#0066cc',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {event.category}
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#f0f4ff',
                        color: '#667eea',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {event.eventType}
                      </span>
                    </div>

                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '18px',
                      color: '#333',
                      fontWeight: '600',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {event.title}
                    </h3>

                    <p style={{
                      margin: '0 0 16px 0',
                      fontSize: '14px',
                      color: '#666',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {event.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '13px',
                      color: '#666'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Calendar size={14} />
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Clock size={14} />
                        <span>{formatTime(event.startDate)}</span>
                      </div>
                      {event.location && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <MapPin size={14} />
                          <span style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {event.location}
                          </span>
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '8px',
                        borderTop: '1px solid #f0f0f0'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <DollarSign size={14} />
                          <span>{event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Users size={14} />
                          <span>{event.currentRegistrations || 0}/{event.maxCapacity || '∞'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OrganizerDetail;
