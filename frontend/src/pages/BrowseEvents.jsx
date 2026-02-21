import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Tag,
  TrendingUp,
  Package,
  Loader,
  AlertCircle,
  Star,
  Flame,
} from 'lucide-react';

const BrowseEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [userFollowing, setUserFollowing] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEligibility, setSelectedEligibility] = useState('All');
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);

  const categories = [
    'All',
    'Technical',
    'Cultural',
    'Sports',
    'Literary',
    'Art',
    'Music',
    'Dance',
    'Photography',
    'Gaming',
    'Other',
  ];

  useEffect(() => {
    fetchEvents();
    if (user?.role === 'Participant') {
      fetchUserData();
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedType, selectedCategory, selectedEligibility, showFollowedOnly, events]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('/api/users/me');
      setUserFollowing(response.data.data.preferences?.following || []);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/events/public');
      const eventsData = response.data.data;
      setEvents(eventsData);
      calculateTrendingEvents(eventsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
      setLoading(false);
    }
  };

  const calculateTrendingEvents = (eventsData) => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // For demo purposes, we'll use currentRegistrations as proxy
    // In production, you'd track registrations with timestamps
    const trending = [...eventsData]
      .filter((event) => event.isPublished)
      .sort((a, b) => (b.currentRegistrations || 0) - (a.currentRegistrations || 0))
      .slice(0, 5);

    setTrendingEvents(trending);
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Filter by search query (name)
    if (searchQuery.trim()) {
      filtered = filtered.filter((event) =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'All') {
      filtered = filtered.filter((event) => event.type === selectedType);
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((event) => event.category === selectedCategory);
    }

    // Filter by eligibility (based on registration fee and event type)
    if (selectedEligibility !== 'All') {
      // In a real implementation, this would check event.eligibility field
      // For now, we'll use a proxy logic
      filtered = filtered.filter((event) => {
        // You can add an eligibility field to events or use other criteria
        // For demo: let's say free events are open to all, paid might be restricted
        if (selectedEligibility === 'IIIT') {
          return event.registrationFee === 0; // Example logic
        } else if (selectedEligibility === 'Non-IIIT') {
          return event.registrationFee > 0; // Example logic
        }
        return true;
      });
    }

    // Filter by followed clubs
    if (showFollowedOnly && user?.role === 'Participant' && userFollowing.length > 0) {
      filtered = filtered.filter((event) => {
        const organizerId = typeof event.organizer === 'object' ? event.organizer._id : event.organizer;
        return userFollowing.some((followedId) => {
          const followedIdStr = typeof followedId === 'object' ? followedId._id : followedId;
          return followedIdStr === organizerId;
        });
      });
    }

    setFilteredEvents(filtered);
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const isLowStock = (event) => {
    if (event.type === 'Merchandise' && event.stockQuantity !== undefined) {
      return event.stockQuantity < 10;
    }
    return false;
  };

  const isRegistrationOpen = (event) => {
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    return (
      now <= deadline &&
      (!event.registrationLimit || event.currentRegistrations < event.registrationLimit)
    );
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Loader size={48} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Browse Events
          </h1>
          <p style={{ color: '#6b7280' }}>Discover upcoming events and activities</p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={20} color="#dc2626" />
            <span style={{ color: '#dc2626' }}>{error}</span>
          </div>
        )}

        {/* Search Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}
            />
            <input
              type="text"
              placeholder="Search events by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                color: '#333',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem' }}>
          {/* Filter Sidebar */}
          <div>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Filter size={20} color="#374151" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>Filters</h3>
              </div>

              {/* Event Type Filter */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Event Type
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {['All', 'Normal', 'Merchandise'].map((type) => (
                    <label
                      key={type}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: selectedType === type ? '#eff6ff' : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="eventType"
                        value={type}
                        checked={selectedType === type}
                        onChange={(e) => setSelectedType(e.target.value)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}>
                        {type === 'Normal' ? 'Activities/Workshops' : type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Category
                </h4>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#333',
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Eligibility Filter */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Eligibility
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {['All', 'IIIT', 'Non-IIIT'].map((eligibility) => (
                    <label
                      key={eligibility}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: selectedEligibility === eligibility ? '#eff6ff' : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name="eligibility"
                        value={eligibility}
                        checked={selectedEligibility === eligibility}
                        onChange={(e) => setSelectedEligibility(e.target.value)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}>
                        {eligibility}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Followed Clubs Filter */}
              {user?.role === 'Participant' && userFollowing.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={showFollowedOnly}
                      onChange={(e) => setShowFollowedOnly(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ color: '#374151', fontSize: '0.875rem', fontWeight: '500' }}>
                      Show only followed clubs
                    </span>
                  </label>
                </div>
              )}

              {/* Results Count */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  <strong style={{ color: '#1f2937' }}>{filteredEvents.length}</strong> events found
                </p>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div>
            {/* Trending Section */}
            {trendingEvents.length > 0 && (
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Flame size={24} color="#ef4444" />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                    Trending Events
                  </h2>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: '9999px',
                    }}
                  >
                    Top 5
                  </span>
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Most popular events based on registrations
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {trendingEvents.map((event, index) => (
                    <div
                      key={event._id}
                      onClick={() => handleEventClick(event._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: '1px solid #e5e7eb',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      {/* Rank Badge */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#cd7f32' : '#f3f4f6',
                          color: index < 3 ? 'white' : '#6b7280',
                          fontWeight: 'bold',
                          borderRadius: '50%',
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </div>

                      {/* Event Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            marginBottom: '0.25rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {event.name}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Users size={12} />
                            {event.currentRegistrations || 0} registered
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Tag size={12} />
                            {event.category}
                          </span>
                        </div>
                      </div>

                      {/* Event Type Badge */}
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: event.type === 'Merchandise' ? '#8b5cf6' : '#3b82f6',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}
                      >
                        {event.type === 'Merchandise' ? 'Merch' : 'Event'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Events */}
            {filteredEvents.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '3rem',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <Package size={64} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                  No events found
                </h3>
                <p style={{ color: '#6b7280' }}>Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredEvents.map((event) => (
                  <div
                    key={event._id}
                    onClick={() => handleEventClick(event._id)}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* Event Image */}
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.name}
                        style={{
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '180px',
                          backgroundColor: '#e5e7eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Calendar size={48} color="#9ca3af" />
                      </div>
                    )}

                    {/* Badges */}
                    <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      {/* Event Type Badge */}
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: event.type === 'Merchandise' ? '#8b5cf6' : '#3b82f6',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          borderRadius: '9999px',
                        }}
                      >
                        {event.type === 'Merchandise' ? 'Merchandise' : 'Activity'}
                      </span>

                      {/* Low Stock Badge */}
                      {isLowStock(event) && (
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            borderRadius: '9999px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <TrendingUp size={12} />
                          Limited Stock
                        </span>
                      )}
                    </div>

                    {/* Event Details */}
                    <div style={{ padding: '1.25rem' }}>
                      {/* Category Tag */}
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            borderRadius: '4px',
                          }}
                        >
                          <Tag size={12} />
                          {event.category}
                        </span>
                      </div>

                      {/* Event Name */}
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '0.5rem',
                          lineHeight: '1.5',
                        }}
                      >
                        {event.name}
                      </h3>

                      {/* Description */}
                      <p
                        style={{
                          color: '#6b7280',
                          fontSize: '0.875rem',
                          marginBottom: '1rem',
                          lineHeight: '1.5',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {event.description}
                      </p>

                      {/* Event Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                          <Calendar size={16} />
                          <span>{new Date(event.startDate).toLocaleDateString()}</span>
                        </div>

                        {event.venue && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                            <MapPin size={16} />
                            <span>{event.venue}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                          <DollarSign size={16} />
                          <span>{event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}</span>
                        </div>

                        {event.type === 'Merchandise' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                            <Package size={16} />
                            <span>{event.stockQuantity} in stock</span>
                          </div>
                        )}

                        {event.registrationLimit && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                            <Users size={16} />
                            <span>
                              {event.currentRegistrations}/{event.registrationLimit} registered
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Registration Status */}
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                        {isRegistrationOpen(event) ? (
                          <div
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#d1fae5',
                              color: '#065f46',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              borderRadius: '6px',
                              textAlign: 'center',
                            }}
                          >
                            Registration Open
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#fee2e2',
                              color: '#991b1b',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              borderRadius: '6px',
                              textAlign: 'center',
                            }}
                          >
                            Registration Closed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseEvents;
