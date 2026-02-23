import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import EventForum from '../components/EventForum';
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Tag,
  Clock,
  Package,
  TrendingUp,
  ArrowLeft,
  Loader,
  AlertCircle,
  CheckCircle,
  ShoppingCart,
  Ticket,
} from 'lucide-react';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [event, setEvent] = useState(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState(null);

  // Normal Event: Custom Form Data
  const [customFormData, setCustomFormData] = useState({});

  // Merchandise Event: Purchase Data
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  // Payment Receipt Upload (for paid events)
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    if (user && user.role === 'Participant') {
      checkRegistrationStatus();
    }
  }, [id, user?.role]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/events/${id}`);
      setEvent(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event details:', err);
      setError('Failed to load event details.');
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const response = await axios.get('/api/registrations/me');
      const registrations = response.data.data;
      const registration = registrations.find(
        (reg) => reg.event && reg.event._id === id && reg.status !== 'cancelled'
      );
      if (registration) {
        setIsAlreadyRegistered(true);
        setExistingRegistration(registration);
        setTicketId(registration.ticketId);
      }
    } catch (err) {
      console.error('Error checking registration status:', err);
      // Don't set error state, just fail silently as this is not critical
    }
  };

  const handleCustomFormChange = (fieldLabel, value) => {
    setCustomFormData({ ...customFormData, [fieldLabel]: value });
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentReceipt(reader.result);
      setReceiptPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async () => {
    setError('');
    setSuccessMessage('');

    // Validate payment receipt for paid events
    if (event.registrationFee > 0 && !paymentReceipt) {
      setError('Please upload payment receipt');
      return;
    }

    // Validate custom form if Normal event
    if (event.type === 'Normal' && event.customForm?.length > 0) {
      for (const field of event.customForm) {
        if (field.isRequired && !customFormData[field.fieldLabel]) {
          setError(`${field.fieldLabel} is required`);
          return;
        }
      }
    }

    // Validate merchandise selection
    if (event.type === 'Merchandise') {
      if (quantity < 1 || quantity > event.purchaseLimitPerParticipant) {
        setError(`Quantity must be between 1 and ${event.purchaseLimitPerParticipant}`);
        return;
      }
      if (quantity > event.stockQuantity) {
        setError(`Only ${event.stockQuantity} items available`);
        return;
      }
    }

    try {
      setSubmitting(true);

      const payload =
        event.type === 'Normal'
          ? { customFormData, paymentReceipt }
          : {
              quantity,
              selectedSize,
              selectedColor,
              paymentReceipt,
            };

      const response = await axios.post(`/api/events/${id}/register`, payload);

      setSuccessMessage(response.data.message);
      setTicketId(response.data.data.ticketId);
      setIsAlreadyRegistered(true);
      setExistingRegistration(response.data.data.registration);
      // Refresh event details to show updated registration count/stock
      fetchEventDetails();
    } catch (err) {
      console.error('Error registering for event:', err);
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
      setSubmitting(false);
    }
  };

  const isRegistrationOpen = () => {
    if (!event) return false;
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    return (
      event.isPublished &&
      now <= deadline &&
      (!event.registrationLimit || event.currentRegistrations < event.registrationLimit)
    );
  };

  const renderCustomFormField = (field) => {
    const commonStyle = {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '1rem',
      color: '#333',
    };

    switch (field.fieldType) {
      case 'textarea':
        return (
          <textarea
            value={customFormData[field.fieldLabel] || ''}
            onChange={(e) => handleCustomFormChange(field.fieldLabel, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            style={{ ...commonStyle, resize: 'vertical' }}
          />
        );

      case 'select':
        return (
          <select
            value={customFormData[field.fieldLabel] || ''}
            onChange={(e) => handleCustomFormChange(field.fieldLabel, e.target.value)}
            style={commonStyle}
          >
            <option value="">Select an option</option>
            {field.options.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {field.options.map((option, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={field.fieldLabel}
                  value={option}
                  checked={customFormData[field.fieldLabel] === option}
                  onChange={(e) => handleCustomFormChange(field.fieldLabel, e.target.value)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ color: '#374151' }}>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {field.options.map((option, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  value={option}
                  checked={(customFormData[field.fieldLabel] || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = customFormData[field.fieldLabel] || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v) => v !== option);
                    handleCustomFormChange(field.fieldLabel, newValues);
                  }}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ color: '#374151' }}>{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type={field.fieldType}
            value={customFormData[field.fieldLabel] || ''}
            onChange={(e) => handleCustomFormChange(field.fieldLabel, e.target.value)}
            placeholder={field.placeholder}
            style={commonStyle}
          />
        );
    }
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
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div
            style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.5rem' }}>
              Error Loading Event
            </h2>
            <p style={{ color: '#991b1b', marginBottom: '1rem' }}>{error}</p>
            <button
              onClick={() => navigate('/events')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            color: '#374151',
            fontWeight: '500',
          }}
        >
          <ArrowLeft size={20} />
          Back to Events
        </button>

        {/* Success/Error Messages */}
        {successMessage && (
          <div
            style={{
              backgroundColor: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={20} color="#065f46" />
              <span style={{ color: '#065f46', fontWeight: '500' }}>{successMessage}</span>
            </div>
            {ticketId && (
              <div style={{ marginLeft: '1.75rem', color: '#065f46', fontSize: '0.875rem' }}>
                Your Ticket ID: <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{ticketId}</span>
                <br />
                <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                  Save this ticket ID. You can view it in My Registrations.
                </span>
              </div>
            )}
          </div>
        )}

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

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Main Content */}
          <div>
            {/* Event Header */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {/* Image */}
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  style={{
                    width: '100%',
                    height: '300px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '300px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={80} color="#9ca3af" />
                </div>
              )}

              {/* Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: event.type === 'Merchandise' ? '#8b5cf6' : '#3b82f6',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    borderRadius: '9999px',
                  }}
                >
                  {event.type === 'Merchandise' ? 'Merchandise' : 'Activity'}
                </span>

                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    borderRadius: '9999px',
                  }}
                >
                  {event.category}
                </span>

                {event.type === 'Merchandise' && event.stockQuantity < 10 && (
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <TrendingUp size={14} />
                    Limited Stock
                  </span>
                )}
              </div>

              {/* Event Name */}
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
                {event.name}
              </h1>

              {/* Organizer */}
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Organized by{' '}
                <strong style={{ color: '#374151' }}>
                  {event.organizer?.organizerName || `${event.organizer?.firstName} ${event.organizer?.lastName}`}
                </strong>
              </p>

              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                  About this Event
                </h3>
                <p style={{ color: '#6b7280', lineHeight: '1.75' }}>{event.description}</p>
              </div>

              {/* Tags */}
              {event.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {event.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        borderRadius: '9999px',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Already Registered Message */}
            {isAlreadyRegistered && !successMessage && user?.role === 'Participant' && (
              <div
                style={{
                  backgroundColor: '#d1fae5',
                  border: '2px solid #10b981',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <CheckCircle size={28} style={{ color: '#059669' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#065f46', margin: 0 }}>
                    You're Already Registered!
                  </h3>
                </div>
                <p style={{ color: '#047857', marginBottom: '1rem', fontSize: '0.95rem' }}>
                  You have successfully registered for this event. Your registration details:
                </p>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Ticket size={18} style={{ color: '#059669' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#065f46' }}>
                      TICKET ID
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#047857',
                    letterSpacing: '0.05em'
                  }}>
                    {ticketId}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/participant/registrations')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#047857'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#059669'}
                  >
                    View My Registrations
                  </button>
                  <button
                    onClick={() => navigate('/events')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'white',
                      color: '#059669',
                      border: '2px solid #059669',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#f0fdf4'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    Browse More Events
                  </button>
                </div>
              </div>
            )}

            {/* Registration/Purchase Section */}
            {isRegistrationOpen() && !isAlreadyRegistered && !successMessage && user?.role === 'Participant' && (
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '1.5rem' }}>
                  {event.type === 'Merchandise' ? 'Purchase Details' : 'Registration Form'}
                </h2>

                {/* Normal Event: Custom Form */}
                {event.type === 'Normal' && event.customForm?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {event.customForm.map((field, idx) => (
                      <div key={idx}>
                        <label
                          style={{
                            display: 'block',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem',
                          }}
                        >
                          {field.fieldLabel}
                          {field.isRequired && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
                        </label>
                        {renderCustomFormField(field)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Merchandise Event: Selector */}
                {event.type === 'Merchandise' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Quantity */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        min="1"
                        max={Math.min(event.stockQuantity, event.purchaseLimitPerParticipant)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          color: '#333',
                          backgroundColor: 'white',
                        }}
                      />
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        Maximum {event.purchaseLimitPerParticipant} per person
                      </p>
                    </div>

                    {/* Sizes */}
                    {event.itemDetails?.size?.length > 0 && (
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Select Size
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {event.itemDetails.size.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setSelectedSize(size)}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: selectedSize === size ? '#3b82f6' : 'white',
                                color: selectedSize === size ? 'white' : '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '500',
                              }}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Colors */}
                    {event.itemDetails?.color?.length > 0 && (
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Select Color
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {event.itemDetails.color.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setSelectedColor(color)}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: selectedColor === color ? '#3b82f6' : 'white',
                                color: selectedColor === color ? 'white' : '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '500',
                              }}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Receipt Upload for Paid Events */}
                {event.registrationFee > 0 && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Payment Receipt <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                      }}
                    />
                    {receiptPreview && (
                      <div style={{ marginTop: '1rem' }}>
                        <p
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Preview:
                        </p>
                        <img
                          src={receiptPreview}
                          alt="Payment Receipt Preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleRegister}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {event.type === 'Merchandise' ? <ShoppingCart size={20} /> : <CheckCircle size={20} />}
                  {submitting
                    ? 'Processing...'
                    : event.type === 'Merchandise'
                    ? 'Purchase Now'
                    : 'Register for Event'}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: '2rem',
              }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                Event Details
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Calendar size={20} color="#6b7280" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                  <div>
                    <p style={{ color: '#6b7280', marginBottom: '0.125rem' }}>Start Date</p>
                    <p style={{ color: '#1f2937', fontWeight: '500' }}>
                      {new Date(event.startDate).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Calendar size={20} color="#6b7280" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                  <div>
                    <p style={{ color: '#6b7280', marginBottom: '0.125rem' }}>End Date</p>
                    <p style={{ color: '#1f2937', fontWeight: '500' }}>
                      {new Date(event.endDate).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Clock size={20} color="#6b7280" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                  <div>
                    <p style={{ color: '#6b7280', marginBottom: '0.125rem' }}>Registration Deadline</p>
                    <p style={{ color: '#1f2937', fontWeight: '500' }}>
                      {new Date(event.registrationDeadline).toLocaleString()}
                    </p>
                  </div>
                </div>

                {event.venue && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <MapPin size={20} color="#6b7280" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                    <div>
                      <p style={{ color: '#6b7280', marginBottom: '0.125rem' }}>Venue</p>
                      <p style={{ color: '#1f2937', fontWeight: '500' }}>{event.venue}</p>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <DollarSign size={20} color="#6b7280" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                  <div>
                    <p style={{ color: '#6b7280', marginBottom: '0.125rem' }}>Registration Fee</p>
                    <p style={{ color: '#1f2937', fontWeight: '500' }}>
                      {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                    </p>
                  </div>
                </div>

                {event.type === 'Merchandise' && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <Package size={20} color="#6b7280" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                    <div>
                      <p style={{ color: '#6b7280', marginBottom: '0.125rem' }}>Stock Available</p>
                      <p style={{ color: '#1f2937', fontWeight: '500' }}>{event.stockQuantity} items</p>
                    </div>
                  </div>
                )}

                {event.registrationLimit && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <Users size={20} color="#6b7280" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
                    <div>
                      <p style={{ color: '#6b7280', marginBottom: '0.125rem' }}>Registrations</p>
                      <p style={{ color: '#1f2937', fontWeight: '500' }}>
                        {event.currentRegistrations} / {event.registrationLimit}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
                {isRegistrationOpen() ? (
                  <div
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    ✓ Registration Open
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    ✕ Registration Closed
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Discussion Forum */}
          {event && (
            <EventForum 
              eventId={event._id} 
              isRegistered={isAlreadyRegistered}
              isOrganizer={user?.role === 'Organizer' && event.organizer === user?.id}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
