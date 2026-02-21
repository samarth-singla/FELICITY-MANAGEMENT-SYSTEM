import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import {
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  School,
  DollarSign,
  FileText,
  Eye,
  Calendar,
  Filter,
  Download,
  Search
} from 'lucide-react';

const EventRegistrations = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchEventAndRegistrations();
  }, [eventId]);

  useEffect(() => {
    applyFilters();
  }, [registrations, statusFilter, paymentFilter, searchQuery]);

  const fetchEventAndRegistrations = async () => {
    try {
      setLoading(true);
      // Fetch event details
      const eventRes = await axios.get(`/api/events/${eventId}`);
      setEvent(eventRes.data.data);

      // Fetch registrations
      const regRes = await axios.get(`/api/registrations/event/${eventId}`);
      setRegistrations(regRes.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || 'Failed to load registrations');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...registrations];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reg => reg.status === statusFilter);
    }

    // Apply payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(reg => reg.paymentStatus === paymentFilter);
    }

    // Apply search query (name or email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(reg => {
        const fullName = `${reg.participant?.firstName || ''} ${reg.participant?.lastName || ''}`.toLowerCase();
        const email = (reg.participant?.email || '').toLowerCase();
        return fullName.includes(query) || email.includes(query);
      });
    }

    setFilteredRegistrations(filtered);
  };

  const handleApprovePayment = async (registrationId) => {
    if (!window.confirm('Approve this payment and send ticket to participant?')) return;

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(`/api/registrations/${registrationId}/approve-payment`);
      setSuccess('Payment approved! Ticket sent to participant.');
      fetchEventAndRegistrations(); // Refresh data
      setSelectedReceipt(null);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error approving payment:', err);
      setError(err.response?.data?.error || 'Failed to approve payment');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      registered: { bg: '#d1fae5', color: '#065f46', icon: CheckCircle },
      attended: { bg: '#dbeafe', color: '#1e40af', icon: CheckCircle },
      cancelled: { bg: '#fee2e2', color: '#991b1b', icon: XCircle },
    };
    const config = styles[status] || styles.registered;
    const Icon = config.icon;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        backgroundColor: config.bg,
        color: config.color,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e', icon: Clock },
      completed: { bg: '#d1fae5', color: '#065f46', icon: CheckCircle },
      failed: { bg: '#fee2e2', color: '#991b1b', icon: XCircle },
      refunded: { bg: '#e0e7ff', color: '#3730a3', icon: DollarSign },
    };
    const config = styles[paymentStatus] || styles.pending;
    const Icon = config.icon;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        backgroundColor: config.bg,
        color: config.color,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        <Icon size={14} />
        {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
      </span>
    );
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
          <p style={{ color: '#666' }}>Loading registrations...</p>
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
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/organizer/my-events')}
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
          Back to My Events
        </button>

        {/* Error/Success Messages */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#d1fae5',
            color: '#065f46',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #a7f3d0'
          }}>
            {success}
          </div>
        )}

        {/* Event Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            margin: '0 0 10px 0',
            fontSize: '28px',
            color: '#333'
          }}>
            {event?.name}
          </h1>
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            color: '#666',
            fontSize: '14px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} />
              <span>{registrations.length} Total Registrations</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} />
              <span>{registrations.filter(r => r.paymentStatus === 'pending').length} Pending Approvals</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={16} />
              <span>Fee: {event?.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {/* Search Bar */}
          <div style={{
            marginBottom: '20px',
            position: 'relative'
          }}>
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999'
              }} 
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                  fontSize: '18px',
                  padding: '0 4px'
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Filters and Export */}
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} />
              <span style={{ fontWeight: '500', color: '#333' }}>Filters:</span>
            </div>
            
            <div>
              <label style={{ fontSize: '14px', color: '#666', marginRight: '8px' }}>
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All</option>
                <option value="registered">Registered</option>
                <option value="attended">Attended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '14px', color: '#666', marginRight: '8px' }}>
                Payment:
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>
                Showing {filteredRegistrations.length} of {registrations.length}
              </span>
              
              <button
                onClick={exportToCSV}
                disabled={filteredRegistrations.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: filteredRegistrations.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: filteredRegistrations.length === 0 ? 0.5 : 1
                }}
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Users size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
            <h3 style={{ color: '#666', fontSize: '18px', marginBottom: '8px' }}>
              No Registrations Found
            </h3>
            <p style={{ color: '#999', fontSize: '14px' }}>
              {statusFilter !== 'all' || paymentFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'No one has registered for this event yet'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '20px'
          }}>
            {filteredRegistrations.map(registration => (
              <div
                key={registration._id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '24px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: registration.paymentStatus === 'pending' ? '2px solid #fbbf24' : '1px solid #e5e7eb'
                }}
              >
                {/* Participant Info */}
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    color: '#333',
                    fontWeight: '600'
                  }}>
                    {registration.participant?.firstName} {registration.participant?.lastName}
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#666'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} />
                      <span>{registration.participant?.email}</span>
                    </div>
                    {registration.participant?.collegeName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <School size={14} />
                        <span>{registration.participant.collegeName}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      <span>Registered: {formatDate(registration.registrationDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
                  flexWrap: 'wrap'
                }}>
                  {getStatusBadge(registration.status)}
                  {getPaymentBadge(registration.paymentStatus)}
                  {registration.ticketId && (
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#f0f4ff',
                      color: '#667eea',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      Ticket: {registration.ticketId}
                    </span>
                  )}
                </div>

                {/* Payment Amount */}
                {registration.paymentAmount > 0 && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>Payment Amount:</span>
                    <span style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                      ₹{registration.paymentAmount}
                    </span>
                  </div>
                )}

                {/* Payment Receipt (for pending payments) */}
                {registration.paymentReceipt && registration.paymentStatus === 'pending' && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fbbf24',
                    borderRadius: '6px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#92400e' }}>
                        <FileText size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Payment Receipt
                      </span>
                      <button
                        onClick={() => setSelectedReceipt(registration.paymentReceipt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 12px',
                          backgroundColor: 'white',
                          color: '#667eea',
                          border: '1px solid #667eea',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {registration.paymentStatus === 'pending' && registration.paymentReceipt && (
                  <button
                    onClick={() => handleApprovePayment(registration._id)}
                    disabled={processing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: processing ? 0.6 : 1
                    }}
                  >
                    <CheckCircle size={16} />
                    {processing ? 'Processing...' : 'Approve Payment & Send Ticket'}
                  </button>
                )}

                {registration.emailSent && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#d1fae5',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#065f46',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Mail size={14} />
                    Ticket email sent on {formatDate(registration.emailSentAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div
          onClick={() => setSelectedReceipt(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>Payment Receipt</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <img
              src={selectedReceipt}
              alt="Payment Receipt"
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 100px)',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EventRegistrations;
