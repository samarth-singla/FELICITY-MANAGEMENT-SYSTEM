import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import {
  Calendar,
  MapPin,
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Loader,
  Package,
  DollarSign,
  User,
} from 'lucide-react';

const MyRegistrations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const [statusFilter, setStatusFilter] = useState('all'); // all, registered, attended, cancelled
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.role !== 'Participant') {
      navigate('/dashboard');
      return;
    }
    fetchRegistrations();
  }, [user, navigate]);

  useEffect(() => {
    applyFilters();
  }, [registrations, filter, statusFilter, searchQuery]);

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

  const applyFilters = () => {
    let filtered = [...registrations];
    const now = new Date();

    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      filtered = filtered.filter((reg) => reg.status === statusFilter);
    }

    // Apply time filter (upcoming/past)
    if (filter === 'upcoming') {
      filtered = filtered.filter((reg) => new Date(reg.event.startDate) >= now);
    } else if (filter === 'past') {
      filtered = filtered.filter((reg) => new Date(reg.event.startDate) < now);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((reg) =>
        reg.event.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRegistrations(filtered);
  };

  const handleCancelRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) {
      return;
    }

    try {
      await axios.put(
        `/api/registrations/${registrationId}/cancel`,
        { reason: 'Cancelled by participant' }
      );
      alert('Registration cancelled successfully');
      fetchRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel registration');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'registered':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={14} />
            Registered
          </span>
        );
      case 'attended':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle size={14} />
            Attended
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={14} />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeBadge = (type) => {
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          type === 'Merchandise'
            ? 'bg-purple-100 text-purple-800'
            : 'bg-blue-100 text-blue-800'
        }`}
      >
        {type === 'Merchandise' ? 'Merchandise' : 'Activity/Workshop'}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Loading your registrations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchRegistrations}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            My Registrations
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            View and manage your event registrations and purchases
          </p>
        </div>

        {/* Filters */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '1.5rem', 
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            {/* Search */}
            <div style={{ flex: '1', minWidth: '250px' }}>
              <div style={{ position: 'relative' }}>
                <Search 
                  style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }} 
                  size={20} 
                />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.625rem',
                    paddingBottom: '0.625rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Time Filter */}
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  padding: '0.625rem 2.5rem 0.625rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.625rem 2.5rem 0.625rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Status</option>
                <option value="registered">Registered</option>
                <option value="attended">Attended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Showing {filteredRegistrations.length} of {registrations.length} registrations
          </div>
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <AlertCircle style={{ margin: '0 auto 1rem', color: '#9ca3af' }} size={48} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              No registrations found
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {searchQuery || statusFilter !== 'all' || filter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start exploring events and register now!'}
            </p>
            <button
              onClick={() => navigate('/events')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredRegistrations.map((registration) => (
              <div
                key={registration._id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'box-shadow 0.2s',
                  border: '1px solid #e5e7eb'
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
              >
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {/* Event Image */}
                    <div style={{ 
                      width: '200px', 
                      height: '200px',
                      flexShrink: 0,
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      {registration.event.imageUrl ? (
                        <img
                          src={registration.event.imageUrl}
                          alt={registration.event.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Calendar size={48} style={{ color: 'white', opacity: 0.7 }} />
                        </div>
                      )}
                    </div>

                    {/* Event Details */}
                    <div style={{ flex: '1', minWidth: '300px' }}>
                      {/* Title and Badges */}
                      <div style={{ marginBottom: '1rem' }}>
                        <h3
                          onClick={() => navigate(`/events/${registration.event._id}`)}
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#111827',
                            marginBottom: '0.75rem',
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.color = '#2563eb'}
                          onMouseOut={(e) => e.target.style.color = '#111827'}
                        >
                          {registration.event.name}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {getTypeBadge(registration.event.type)}
                          {getStatusBadge(registration.status)}
                          <span style={{
                            padding: '0.375rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            backgroundColor: '#f3f4f6',
                            color: '#374151'
                          }}>
                            {registration.event.category}
                          </span>
                        </div>
                      </div>

                      {/* Ticket ID and QR Code - Prominent Display */}
                      <div style={{
                        backgroundColor: '#eff6ff',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: '1', minWidth: '200px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.25rem'
                          }}>
                            <Ticket size={16} style={{ color: '#2563eb' }} />
                            <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: '600' }}>
                              TICKET ID
                            </span>
                          </div>
                          <div style={{
                            fontFamily: 'monospace',
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#1e3a8a',
                            letterSpacing: '0.05em'
                          }}>
                            {registration.ticketId}
                          </div>
                        </div>
                        {registration.qrCode && (
                          <div style={{ textAlign: 'center' }}>
                            <img
                              src={registration.qrCode}
                              alt="QR Code"
                              style={{
                                width: '100px',
                                height: '100px',
                                border: '2px solid #3b82f6',
                                borderRadius: '8px',
                                padding: '4px',
                                backgroundColor: 'white'
                              }}
                            />
                            <div style={{ fontSize: '0.7rem', color: '#1e40af', marginTop: '0.25rem' }}>
                              Scan at Venue
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Event Info */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={18} style={{ color: '#3b82f6' }} />
                          <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                            {formatDate(registration.event.startDate)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={18} style={{ color: '#ef4444' }} />
                          <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                            {registration.event.venue}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={18} style={{ color: '#10b981' }} />
                          <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                            {formatDate(registration.createdAt)}
                          </span>
                        </div>
                        {registration.event.registrationFee > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DollarSign size={18} style={{ color: '#f59e0b' }} />
                            <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                              ₹{registration.paymentAmount} - {registration.paymentStatus}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Merchandise Details */}
                      {registration.event.type === 'Merchandise' && registration.formData?.quantity && (
                        <div style={{
                          backgroundColor: '#faf5ff',
                          border: '1px solid #e9d5ff',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          marginBottom: '1rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem'
                          }}>
                            <Package size={18} style={{ color: '#7c3aed' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b21a8' }}>
                              Purchase Details
                            </span>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#7c3aed' }}>
                            Quantity: {registration.formData.quantity}
                            {registration.formData.selectedSize && (
                              <span style={{ marginLeft: '1rem' }}>
                                Size: {registration.formData.selectedSize}
                              </span>
                            )}
                            {registration.formData.selectedColor && (
                              <span style={{ marginLeft: '1rem' }}>
                                Color: {registration.formData.selectedColor}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <button
                          onClick={() => navigate(`/events/${registration.event._id}`)}
                          style={{
                            padding: '0.625rem 1.25rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                        >
                          View Event
                        </button>
                        {registration.status === 'registered' &&
                          new Date(registration.event.startDate) > new Date() && (
                            <button
                              onClick={() => handleCancelRegistration(registration._id)}
                              style={{
                                padding: '0.625rem 1.25rem',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                borderRadius: '8px',
                                border: '1px solid #fecaca',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseOver={(e) => e.target.style.backgroundColor = '#fee2e2'}
                              onMouseOut={(e) => e.target.style.backgroundColor = '#fef2f2'}
                            >
                              Cancel Registration
                            </button>
                          )}
                        {registration.status === 'attended' && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#059669',
                            fontSize: '0.875rem'
                          }}>
                            <CheckCircle size={18} />
                            <span>Attended on {formatDate(registration.attendanceDate)}</span>
                          </div>
                        )}
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
  );
};

export default MyRegistrations;
