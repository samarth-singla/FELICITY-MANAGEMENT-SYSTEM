import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import EventForum from '../components/EventForum';
import EventFeedbackView from '../components/EventFeedbackView';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity,
  Mail,
  School,
  FileText,
  Download,
  Search,
  Filter,
  QrCode,
  User,
  Package,
  AlertCircle,
  Loader,
  Eye
} from 'lucide-react';

const OrganizerEventView = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, analytics, participants
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [scanningImage, setScanningImage] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  useEffect(() => {
    applyFilters();
  }, [registrations, statusFilter, paymentFilter, searchQuery]);

  const fetchEventData = async () => {
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
      console.error('Error fetching event data:', err);
      setError(err.response?.data?.error || 'Failed to load event data');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...registrations];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(reg => reg.status === statusFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(reg => reg.paymentStatus === paymentFilter);
    }

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

  const calculateAnalytics = () => {
    const totalRegistrations = registrations.length;
    const totalAttended = registrations.filter(r => r.status === 'attended').length;
    const totalCancelled = registrations.filter(r => r.status === 'cancelled').length;
    const pendingPayments = registrations.filter(r => r.paymentStatus === 'pending').length;
    const completedPayments = registrations.filter(r => r.paymentStatus === 'completed').length;
    
    let totalRevenue = 0;
    registrations.forEach(reg => {
      if (reg.paymentStatus === 'completed') {
        totalRevenue += reg.paymentAmount || 0;
      }
    });

    // Calculate team completion (if event has teams)
    const teamsMap = {};
    registrations.forEach(reg => {
      if (reg.teamName) {
        if (!teamsMap[reg.teamName]) {
          teamsMap[reg.teamName] = [];
        }
        teamsMap[reg.teamName].push(reg);
      }
    });
    const totalTeams = Object.keys(teamsMap).length;

    return {
      totalRegistrations,
      totalAttended,
      totalCancelled,
      pendingPayments,
      completedPayments,
      totalRevenue,
      totalTeams,
      attendanceRate: totalRegistrations > 0 ? ((totalAttended / totalRegistrations) * 100).toFixed(1) : 0
    };
  };

  const handleQRImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setScanningImage(true);
    setError('');

    try {
      // Create an image element to load the file
      const image = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        image.onload = () => {
          // Create a canvas to draw the image
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = image.width;
          canvas.height = image.height;
          context.drawImage(image, 0, 0);

          // Get image data
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Try to decode QR code using jsQR (if available)
          // If jsQR is not available, we'll use a simpler approach
          try {
            // Dynamically import jsQR
            import('jsqr').then(({ default: jsQR }) => {
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (code && code.data) {
                setQrInput(code.data);
                setQrImage(URL.createObjectURL(file));
                setSuccess('QR Code scanned successfully! Ticket ID extracted.');
                setTimeout(() => setSuccess(''), 3000);
              } else {
                setError('No QR code found in the image. Please try another image or enter ticket ID manually.');
                setTimeout(() => setError(''), 3000);
              }
              setScanningImage(false);
            }).catch(() => {
              // Fallback: If jsQR is not available, try manual extraction
              fallbackQRExtraction(file);
            });
          } catch (err) {
            fallbackQRExtraction(file);
          }
        };
        image.src = event.target.result;
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing QR image:', err);
      setError('Failed to process QR code image');
      setTimeout(() => setError(''), 3000);
      setScanningImage(false);
    }
  };

  const fallbackQRExtraction = (file) => {
    // Fallback approach: Just show the image and let user manually enter
    setQrImage(URL.createObjectURL(file));
    setError('Could not automatically scan QR code. Please enter the ticket ID manually from the image.');
    setTimeout(() => setError(''), 4000);
    setScanningImage(false);
  };

  const handleMarkAttendance = async () => {
    if (!qrInput.trim()) {
      setError('Please enter a ticket ID');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(`/api/registrations/attend/${qrInput.trim()}`);
      setSuccess('Attendance marked successfully!');
      setQrInput('');
      fetchEventData(); // Refresh data
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError(err.response?.data?.error || 'Failed to mark attendance');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const handleApprovePayment = async (registrationId) => {
    if (!window.confirm('Approve this payment and send ticket to participant?')) return;

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(`/api/registrations/${registrationId}/approve-payment`);
      setSuccess('Payment approved! Ticket sent to participant.');
      fetchEventData(); // Refresh data
      setSelectedReceipt(null);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error approving payment:', err);
      setError(err.response?.data?.error || 'Failed to approve payment');
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'College', 'Registration Date', 'Payment Status', 'Team Name', 'Attendance Status', 'Ticket ID'],
      ...filteredRegistrations.map(reg => [
        `${reg.participant?.firstName || ''} ${reg.participant?.lastName || ''}`,
        reg.participant?.email || '',
        reg.participant?.collegeName || '',
        new Date(reg.createdAt).toLocaleDateString(),
        reg.paymentStatus,
        reg.teamName || 'N/A',
        reg.status,
        reg.ticketId || reg._id
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.name || 'event'}_registrations.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  const getStatusBadge = (status) => {
    const styles = {
      registered: { bg: '#d4edda', color: '#155724', icon: CheckCircle },
      attended: { bg: '#cce5ff', color: '#004085', icon: CheckCircle },
      cancelled: { bg: '#f8d7da', color: '#721c24', icon: XCircle },
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
      pending: { bg: '#fff3cd', color: '#856404', icon: Clock },
      completed: { bg: '#d4edda', color: '#155724', icon: CheckCircle },
      failed: { bg: '#f8d7da', color: '#721c24', icon: XCircle },
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

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: '#007bff' }} size={48} />
          <p style={{ color: '#6b7280' }}>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle style={{ margin: '0 auto 1rem', color: '#dc3545' }} size={48} />
          <p style={{ color: '#dc3545', fontWeight: '500', marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={() => navigate('/organizer/dashboard')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const analytics = calculateAnalytics();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/organizer/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'white',
            color: '#007bff',
            border: '1px solid #007bff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '20px'
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {/* Success/Error Messages */}
        {error && (
          <div style={{
            padding: '12px 20px',
            marginBottom: '20px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            color: '#721c24',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px 20px',
            marginBottom: '20px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            color: '#155724',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        {/* Event Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                {event?.name}
              </h1>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: event?.isPublished ? '#d4edda' : '#fff3cd',
                  color: event?.isPublished ? '#155724' : '#856404',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {event?.isPublished ? 'Published' : 'Draft'}
                </span>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: '#e7f3ff',
                  color: '#0056b3',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {event?.type}
                </span>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: '#f3e5f5',
                  color: '#7c3aed',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {event?.category}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowQRScanner(!showQRScanner)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <QrCode size={18} />
              {showQRScanner ? 'Hide' : 'Scan'} QR Code
            </button>
          </div>

          {/* QR Scanner */}
          {showQRScanner && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                Mark Attendance
              </h3>

              {/* QR Image Upload */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                  Upload QR Code Image:
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQRImageUpload}
                    disabled={processing || scanningImage}
                    style={{
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  />
                  {scanningImage && (
                    <span style={{ fontSize: '14px', color: '#007bff', fontWeight: '500' }}>
                      Scanning...
                    </span>
                  )}
                </div>
                <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                  Upload a QR code image to automatically extract the ticket ID
                </small>
              </div>

              {/* Preview of uploaded QR image */}
              {qrImage && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <img 
                    src={qrImage} 
                    alt="QR Code Preview" 
                    style={{ 
                      maxWidth: '200px', 
                      maxHeight: '200px', 
                      border: '2px solid #d1d5db', 
                      borderRadius: '8px',
                      objectFit: 'contain'
                    }} 
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>QR Code Preview</p>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#d1d5db' }}></div>
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#d1d5db' }}></div>
              </div>

              {/* Manual Ticket ID Entry */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                    Enter Ticket ID Manually:
                  </label>
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleMarkAttendance()}
                    placeholder="Enter ticket ID..."
                    disabled={processing}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <button
                  onClick={handleMarkAttendance}
                  disabled={processing || !qrInput.trim()}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: processing || !qrInput.trim() ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: processing || !qrInput.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {processing ? 'Processing...' : 'Mark Attended'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '0',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            {['overview', 'analytics', 'participants', 'feedback'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  backgroundColor: activeTab === tab ? '#007bff' : 'white',
                  color: activeTab === tab ? 'white' : '#374151',
                  border: 'none',
                  borderBottom: activeTab === tab ? '3px solid #0056b3' : 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '2rem' }}>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Event Overview
                </h2>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        Event Type
                      </label>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0 }}>{event?.type}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        Category
                      </label>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0 }}>{event?.category}</p>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        Status
                      </label>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0 }}>
                        {event?.isPublished ? 'Published' : 'Draft'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        Start Date
                      </label>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} />
                        {formatDate(event?.startDate)}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        End Date
                      </label>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} />
                        {formatDate(event?.endDate)}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        Registration Deadline
                      </label>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} />
                        {formatDate(event?.registrationDeadline)}
                      </p>
                    </div>
                  </div>

                  {event?.location && (
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        Venue
                      </label>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} />
                        {event.location}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        Registration Fee
                      </label>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                        <DollarSign size={16} />
                        {event?.registrationFee > 0 ? formatCurrency(event.registrationFee) : 'Free'}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        Eligibility
                      </label>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0 }}>
                        {event?.eligibility?.join(', ') || 'All'}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        Capacity
                      </label>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} />
                        {event?.maxCapacity || 'Unlimited'}
                      </p>
                    </div>
                  </div>

                  {event?.description && (
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        Description
                      </label>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0, lineHeight: '1.6' }}>
                        {event.description}
                      </p>
                    </div>
                  )}

                  {event?.type === 'Merchandise' && event?.stockQuantity !== undefined && (
                    <div>
                      <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                        Stock Quantity
                      </label>
                      <p style={{ fontSize: '16px', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={16} />
                        {event.stockQuantity} units available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Event Analytics
                </h2>
                
                {/* Stats Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    backgroundColor: '#e7f3ff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #b3d9ff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '14px', color: '#0056b3', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Total Registrations
                        </p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0056b3', margin: 0 }}>
                          {analytics.totalRegistrations}
                        </p>
                      </div>
                      <Users size={40} style={{ color: '#0056b3', opacity: 0.6 }} />
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#d4edda',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #c3e6cb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '14px', color: '#155724', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Total Attended
                        </p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724', margin: 0 }}>
                          {analytics.totalAttended}
                        </p>
                      </div>
                      <CheckCircle size={40} style={{ color: '#155724', opacity: 0.6 }} />
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#fff3cd',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #ffeaa7'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '14px', color: '#856404', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Attendance Rate
                        </p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#856404', margin: 0 }}>
                          {analytics.attendanceRate}%
                        </p>
                      </div>
                      <Activity size={40} style={{ color: '#856404', opacity: 0.6 }} />
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#d1f4e0',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #a8e6cf'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '14px', color: '#0d6832', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Total Revenue
                        </p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0d6832', margin: 0 }}>
                          {formatCurrency(analytics.totalRevenue)}
                        </p>
                      </div>
                      <DollarSign size={40} style={{ color: '#0d6832', opacity: 0.6 }} />
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#e9d5ff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #d8b4fe'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '14px', color: '#7c3aed', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Total Teams
                        </p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed', margin: 0 }}>
                          {analytics.totalTeams}
                        </p>
                      </div>
                      <Users size={40} style={{ color: '#7c3aed', opacity: 0.6 }} />
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#fee2e2',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #fecaca'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '14px', color: '#991b1b', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Cancelled
                        </p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#991b1b', margin: 0 }}>
                          {analytics.totalCancelled}
                        </p>
                      </div>
                      <XCircle size={40} style={{ color: '#991b1b', opacity: 0.6 }} />
                    </div>
                  </div>
                </div>

                {/* Payment Stats */}
                <div style={{ marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                    Payment Statistics
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>Completed Payments</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                        {analytics.completedPayments}
                      </p>
                    </div>
                    <div style={{
                      backgroundColor: '#f9fafb',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '0.5rem' }}>Pending Approvals</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>
                        {analytics.pendingPayments}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Participants Tab */}
            {activeTab === 'participants' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                    Participants List
                  </h2>
                  <button
                    onClick={handleExportCSV}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                </div>

                {/* Filters */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 300px' }}>
                      <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px', fontWeight: '500' }}>
                        Search
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Search
                          size={18}
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af'
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
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px', fontWeight: '500' }}>
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="all">All Status</option>
                        <option value="registered">Registered</option>
                        <option value="attended">Attended</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px', fontWeight: '500' }}>
                        Payment
                      </label>
                      <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        style={{
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="all">All Payments</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', fontSize: '14px', color: '#6b7280' }}>
                    Showing {filteredRegistrations.length} of {registrations.length} registrations
                  </div>
                </div>

                {/* Participants Table */}
                {filteredRegistrations.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '2px dashed #e5e7eb'
                  }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                      No participants found
                    </h3>
                    <p style={{ color: '#6b7280' }}>
                      {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'No one has registered for this event yet'}
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Reg. Date</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Payment</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Team</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Attendance</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Ticket ID</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegistrations.map((reg) => (
                          <tr key={reg._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px', color: '#111827', fontWeight: '500' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={16} />
                                {reg.participant?.firstName} {reg.participant?.lastName}
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: '#6b7280' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Mail size={16} />
                                {reg.participant?.email}
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: '#6b7280' }}>
                              {new Date(reg.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px' }}>{getPaymentBadge(reg.paymentStatus)}</td>
                            <td style={{ padding: '12px', color: '#6b7280' }}>{reg.teamName || 'N/A'}</td>
                            <td style={{ padding: '12px' }}>{getStatusBadge(reg.status)}</td>
                            <td style={{ padding: '12px' }}>
                              <code style={{
                                padding: '4px 8px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: '#374151',
                                fontFamily: 'monospace'
                              }}>
                                {reg.ticketId || reg._id.slice(-8)}
                              </code>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {reg.paymentReceipt && reg.paymentStatus === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => setSelectedReceipt(reg.paymentReceipt)}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: 'white',
                                        color: '#667eea',
                                        border: '1px solid #667eea',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <Eye size={14} />
                                      View Receipt
                                    </button>
                                    <button
                                      onClick={() => handleApprovePayment(reg._id)}
                                      disabled={processing}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: processing ? '#9ca3af' : '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: processing ? 'not-allowed' : 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        opacity: processing ? 0.6 : 1
                                      }}
                                    >
                                      <CheckCircle size={14} />
                                      Approve
                                    </button>
                                  </>
                                )}
                                {reg.paymentStatus === 'completed' && (
                                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '500' }}>✓ Approved</span>
                                )}
                                {!reg.paymentReceipt && reg.paymentStatus === 'pending' && (
                                  <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '500' }}>Awaiting Receipt</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', marginBottom: '1.5rem' }}>
                  Event Feedback
                </h2>
                {event && <EventFeedbackView eventId={event._id} />}
              </div>
            )}
          </div>
        </div>

        {/* Discussion Forum */}
        {event && (
          <EventForum 
            eventId={event._id} 
            isRegistered={false}
            isOrganizer={true}
          />
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
    </div>
  );
};

export default OrganizerEventView;
