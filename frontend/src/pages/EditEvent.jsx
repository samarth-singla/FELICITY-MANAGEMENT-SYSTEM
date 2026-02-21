import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  MapPin,
  Image as ImageIcon,
  Save,
  X,
  AlertCircle,
  Lock,
  CheckCircle,
  Info,
  ArrowLeft,
} from 'lucide-react';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [event, setEvent] = useState(null);
  const [eventStatus, setEventStatus] = useState('draft'); // draft, published, ongoing, completed
  const [hasRegistrations, setHasRegistrations] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Technical',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    registrationFee: 0,
    registrationLimit: '',
    venue: '',
    imageUrl: '',
    tags: '',
    isPublished: false,
  });

  const categories = [
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
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/events/${id}`);
      const eventData = response.data.data;
      
      // Check if user is authorized to edit
      if (eventData.organizer._id !== user.id && user.role !== 'Admin') {
        setError('You are not authorized to edit this event');
        setLoading(false);
        return;
      }

      setEvent(eventData);
      setHasRegistrations(eventData.currentRegistrations > 0);

      // Determine event status
      const now = new Date();
      const startDate = new Date(eventData.startDate);
      const endDate = new Date(eventData.endDate);
      
      let status = 'draft';
      if (!eventData.isPublished) {
        status = 'draft';
      } else if (startDate > now) {
        status = 'published';
      } else if (startDate <= now && endDate >= now) {
        status = 'ongoing';
      } else {
        status = 'completed';
      }
      setEventStatus(status);

      // Populate form data
      setFormData({
        name: eventData.name || '',
        description: eventData.description || '',
        category: eventData.category || 'Technical',
        startDate: eventData.startDate ? new Date(eventData.startDate).toISOString().slice(0, 16) : '',
        endDate: eventData.endDate ? new Date(eventData.endDate).toISOString().slice(0, 16) : '',
        registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline).toISOString().slice(0, 16) : '',
        registrationFee: eventData.registrationFee || 0,
        registrationLimit: eventData.registrationLimit || '',
        venue: eventData.venue || '',
        imageUrl: eventData.imageUrl || '',
        tags: eventData.tags ? eventData.tags.join(', ') : '',
        isPublished: eventData.isPublished || false,
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError(err.response?.data?.error || 'Failed to load event details');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const isFieldEditable = (fieldName) => {
    // DRAFT: All fields editable (except custom form if has registrations)
    if (eventStatus === 'draft') {
      if (fieldName === 'customForm' && hasRegistrations) {
        return false;
      }
      return true;
    }
    
    // PUBLISHED: Only description, registrationDeadline, registrationLimit
    if (eventStatus === 'published') {
      return ['description', 'registrationDeadline', 'registrationLimit'].includes(fieldName);
    }
    
    // ONGOING/COMPLETED: Only status toggle (isPublished)
    if (eventStatus === 'ongoing' || eventStatus === 'completed') {
      return fieldName === 'isPublished';
    }
    
    return false;
  };

  const getStatusInfo = () => {
    switch (eventStatus) {
      case 'draft':
        return {
          label: 'Draft',
          color: '#fbbf24',
          bgColor: '#fef3c7',
          message: hasRegistrations 
            ? 'Full editing allowed. Note: Form builder is locked due to existing registrations.'
            : 'Full editing allowed for all fields.',
        };
      case 'published':
        return {
          label: 'Published',
          color: '#3b82f6',
          bgColor: '#dbeafe',
          message: 'Only Description, Registration Deadline, and Registration Limit can be edited.',
        };
      case 'ongoing':
        return {
          label: 'Ongoing',
          color: '#10b981',
          bgColor: '#d1fae5',
          message: 'Event is currently in progress. Only status can be changed.',
        };
      case 'completed':
        return {
          label: 'Completed',
          color: '#6b7280',
          bgColor: '#f3f4f6',
          message: 'Event has ended. Only status can be changed.',
        };
      default:
        return { label: 'Unknown', color: '#999', bgColor: '#eee', message: '' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validation
    if (isFieldEditable('name') && !formData.name.trim()) {
      setError('Event name is required');
      return;
    }

    if (isFieldEditable('description') && !formData.description.trim()) {
      setError('Event description is required');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare update data based on what's editable
      const updateData = {};
      
      if (eventStatus === 'draft') {
        // Draft: send all fields
        updateData.name = formData.name;
        updateData.description = formData.description;
        updateData.category = formData.category;
        updateData.startDate = formData.startDate;
        updateData.endDate = formData.endDate;
        updateData.registrationDeadline = formData.registrationDeadline;
        updateData.registrationFee = parseFloat(formData.registrationFee) || 0;
        updateData.registrationLimit = formData.registrationLimit ? parseInt(formData.registrationLimit) : null;
        updateData.venue = formData.venue;
        updateData.imageUrl = formData.imageUrl;
        updateData.tags = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        updateData.isPublished = formData.isPublished;
      } else if (eventStatus === 'published') {
        // Published: only description, registrationDeadline, registrationLimit
        updateData.description = formData.description;
        updateData.registrationDeadline = formData.registrationDeadline;
        updateData.registrationLimit = formData.registrationLimit ? parseInt(formData.registrationLimit) : null;
      } else if (eventStatus === 'ongoing' || eventStatus === 'completed') {
        // Ongoing/Completed: only status toggle
        updateData.isPublished = formData.isPublished;
      }

      const response = await axios.put(`/api/events/${id}`, updateData);
      
      setSuccessMessage('Event updated successfully!');
      setSubmitting(false);

      // Redirect after success
      setTimeout(() => {
        navigate(`/events/${id}`);
      }, 1500);

    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.response?.data?.error || 'Failed to update event');
      setSubmitting(false);
    }
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6b7280' }}>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h2 style={{ color: '#111827', marginBottom: '8px' }}>Event Not Found</h2>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>{error || 'The event you are looking for does not exist.'}</p>
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
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '20px'
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <h1 style={{ fontSize: '32px', color: '#111827', marginBottom: '8px', fontWeight: '700' }}>
            Edit Event
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
            {event.name}
          </p>
        </div>

        {/* Status Banner */}
        <div style={{
          backgroundColor: statusInfo.bgColor,
          border: `2px solid ${statusInfo.color}`,
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <Info size={24} style={{ color: statusInfo.color, flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                padding: '4px 12px',
                backgroundColor: statusInfo.color,
                color: 'white',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                {statusInfo.label}
              </span>
              {hasRegistrations && (
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {event.currentRegistrations} Registration{event.currentRegistrations !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
              {statusInfo.message}
            </p>
          </div>
        </div>

        {/* Messages */}
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

        {successMessage && (
          <div style={{
            padding: '16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#166534'
          }}>
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          {/* Event Type - Always Locked after creation */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              <Lock size={16} />
              Event Type
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>(Locked)</span>
            </label>
            <input
              type="text"
              value={event.type}
              disabled
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'not-allowed'
              }}
            />
          </div>

          {/* Event Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              {!isFieldEditable('name') && <Lock size={16} />}
              Event Name <span style={{ color: '#ef4444' }}>*</span>
              {!isFieldEditable('name') && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>(Locked)</span>}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!isFieldEditable('name')}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: isFieldEditable('name') ? 'white' : '#f3f4f6',
                color: isFieldEditable('name') ? '#111827' : '#6b7280',
                cursor: isFieldEditable('name') ? 'text' : 'not-allowed'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              {!isFieldEditable('description') && <Lock size={16} />}
              Description <span style={{ color: '#ef4444' }}>*</span>
              {!isFieldEditable('description') && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>(Locked)</span>}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={!isFieldEditable('description')}
              required
              rows="5"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: isFieldEditable('description') ? 'white' : '#f3f4f6',
                color: isFieldEditable('description') ? '#111827' : '#6b7280',
                cursor: isFieldEditable('description') ? 'text' : 'not-allowed',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              {!isFieldEditable('category') && <Lock size={16} />}
              Category <span style={{ color: '#ef4444' }}>*</span>
              {!isFieldEditable('category') && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>(Locked)</span>}
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              disabled={!isFieldEditable('category')}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: isFieldEditable('category') ? 'white' : '#f3f4f6',
                color: isFieldEditable('category') ? '#111827' : '#6b7280',
                cursor: isFieldEditable('category') ? 'pointer' : 'not-allowed'
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Dates Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {/* Start Date */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {!isFieldEditable('startDate') && <Lock size={16} />}
                <Calendar size={16} />
                Start Date <span style={{ color: '#ef4444' }}>*</span>
                {!isFieldEditable('startDate') && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>(Locked)</span>}
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                disabled={!isFieldEditable('startDate')}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: isFieldEditable('startDate') ? '2px solid #d1d5db' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: isFieldEditable('startDate') ? 'white' : '#f3f4f6',
                  color: isFieldEditable('startDate') ? '#1f2937' : '#6b7280',
                  colorScheme: 'light',
                  cursor: isFieldEditable('startDate') ? 'pointer' : 'not-allowed'
                }}
                onFocus={(e) => { if (isFieldEditable('startDate')) e.target.style.borderColor = '#3b82f6'; }}
                onBlur={(e) => { if (isFieldEditable('startDate')) e.target.style.borderColor = '#d1d5db'; }}
              />
            </div>

            {/* End Date */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {!isFieldEditable('endDate') && <Lock size={16} />}
                <Calendar size={16} />
                End Date <span style={{ color: '#ef4444' }}>*</span>
                {!isFieldEditable('endDate') && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>(Locked)</span>}
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                disabled={!isFieldEditable('endDate')}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: isFieldEditable('endDate') ? '2px solid #d1d5db' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: isFieldEditable('endDate') ? 'white' : '#f3f4f6',
                  color: isFieldEditable('endDate') ? '#1f2937' : '#6b7280',
                  colorScheme: 'light',
                  cursor: isFieldEditable('endDate') ? 'pointer' : 'not-allowed'
                }}
                onFocus={(e) => { if (isFieldEditable('endDate')) e.target.style.borderColor = '#3b82f6'; }}
                onBlur={(e) => { if (isFieldEditable('endDate')) e.target.style.borderColor = '#d1d5db'; }}
              />
            </div>
          </div>

          {/* Registration Deadline */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              {!isFieldEditable('registrationDeadline') && <Lock size={16} />}
              <Clock size={16} />
              Registration Deadline <span style={{ color: '#ef4444' }}>*</span>
              {eventStatus === 'published' && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '400' }}>(Editable)</span>}
            </label>
            <input
              type="datetime-local"
              name="registrationDeadline"
              value={formData.registrationDeadline}
              onChange={handleInputChange}
              disabled={!isFieldEditable('registrationDeadline')}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: isFieldEditable('registrationDeadline') ? '2px solid #d1d5db' : '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: isFieldEditable('registrationDeadline') ? 'white' : '#f3f4f6',
                color: isFieldEditable('registrationDeadline') ? '#1f2937' : '#6b7280',
                colorScheme: 'light',
                cursor: isFieldEditable('registrationDeadline') ? 'pointer' : 'not-allowed'
              }}
              onFocus={(e) => { if (isFieldEditable('registrationDeadline')) e.target.style.borderColor = '#3b82f6'; }}
              onBlur={(e) => { if (isFieldEditable('registrationDeadline')) e.target.style.borderColor = '#d1d5db'; }}
            />
          </div>

          {/* Registration Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {/* Registration Fee */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {!isFieldEditable('registrationFee') && <Lock size={16} />}
                <DollarSign size={16} />
                Registration Fee (₹)
                {!isFieldEditable('registrationFee') && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>(Locked)</span>}
              </label>
              <input
                type="number"
                name="registrationFee"
                value={formData.registrationFee}
                onChange={handleInputChange}
                disabled={!isFieldEditable('registrationFee')}
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: isFieldEditable('registrationFee') ? 'white' : '#f3f4f6',
                  color: isFieldEditable('registrationFee') ? '#111827' : '#6b7280',
                  cursor: isFieldEditable('registrationFee') ? 'text' : 'not-allowed'
                }}
              />
            </div>

            {/* Registration Limit */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                {!isFieldEditable('registrationLimit') && <Lock size={16} />}
                <Users size={16} />
                Registration Limit
                {eventStatus === 'published' && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '400' }}>(Editable)</span>}
              </label>
              <input
                type="number"
                name="registrationLimit"
                value={formData.registrationLimit}
                onChange={handleInputChange}
                disabled={!isFieldEditable('registrationLimit')}
                min="1"
                placeholder="Unlimited"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: isFieldEditable('registrationLimit') ? 'white' : '#f3f4f6',
                  color: isFieldEditable('registrationLimit') ? '#111827' : '#6b7280',
                  cursor: isFieldEditable('registrationLimit') ? 'text' : 'not-allowed'
                }}
              />
            </div>
          </div>

          {/* Venue */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              {!isFieldEditable('venue') && <Lock size={16} />}
              <MapPin size={16} />
              Venue
              {!isFieldEditable('venue') && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>(Locked)</span>}
            </label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleInputChange}
              disabled={!isFieldEditable('venue')}
              placeholder="Event location"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: isFieldEditable('venue') ? 'white' : '#f3f4f6',
                color: isFieldEditable('venue') ? '#111827' : '#6b7280',
                cursor: isFieldEditable('venue') ? 'text' : 'not-allowed'
              }}
            />
          </div>

          {/* Image URL */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              {!isFieldEditable('imageUrl') && <Lock size={16} />}
              <ImageIcon size={16} />
              Image URL
              {!isFieldEditable('imageUrl') && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>(Locked)</span>}
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              disabled={!isFieldEditable('imageUrl')}
              placeholder="https://example.com/image.jpg"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: isFieldEditable('imageUrl') ? 'white' : '#f3f4f6',
                color: isFieldEditable('imageUrl') ? '#111827' : '#6b7280',
                cursor: isFieldEditable('imageUrl') ? 'text' : 'not-allowed'
              }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              {!isFieldEditable('tags') && <Lock size={16} />}
              Tags
              {!isFieldEditable('tags') && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>(Locked)</span>}
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              disabled={!isFieldEditable('tags')}
              placeholder="Comma-separated tags"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: isFieldEditable('tags') ? 'white' : '#f3f4f6',
                color: isFieldEditable('tags') ? '#111827' : '#6b7280',
                cursor: isFieldEditable('tags') ? 'text' : 'not-allowed'
              }}
            />
          </div>

          {/* Form Builder Lock Notice */}
          {hasRegistrations && event.type === 'Normal' && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Lock size={20} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '14px', color: '#78350f' }}>
                <strong>Custom Form Builder is locked</strong> - The event has {event.currentRegistrations} registration{event.currentRegistrations !== 1 ? 's' : ''}. Form structure cannot be modified.
              </span>
            </div>
          )}

          {/* Publish Status Toggle */}
          <div style={{
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: isFieldEditable('isPublished') ? 'pointer' : 'not-allowed'
            }}>
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleInputChange}
                disabled={!isFieldEditable('isPublished')}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: isFieldEditable('isPublished') ? 'pointer' : 'not-allowed'
                }}
              />
              <span style={{
                fontWeight: '600',
                color: isFieldEditable('isPublished') ? '#111827' : '#6b7280',
                fontSize: '14px'
              }}>
                Publish Event
              </span>
              {!isFieldEditable('isPublished') && (
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>(Locked)</span>
              )}
            </label>
            <p style={{
              margin: '8px 0 0 32px',
              fontSize: '13px',
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              {formData.isPublished
                ? 'Event is visible to participants and open for registration'
                : 'Event is in draft mode and not visible to participants'}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            paddingTop: '24px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={submitting}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: submitting ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: submitting ? 0.6 : 1
              }}
            >
              <Save size={16} />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;
