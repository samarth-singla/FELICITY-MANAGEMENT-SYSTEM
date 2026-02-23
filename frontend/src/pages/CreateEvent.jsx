import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import {
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  Send,
  X,
  AlertCircle,
} from 'lucide-react';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Common fields
  const [eventType, setEventType] = useState('Normal');
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
    eligibility: 'All',
  });

  // Normal Event: Custom Form Builder
  const [customForm, setCustomForm] = useState([]);
  const [newField, setNewField] = useState({
    fieldLabel: '',
    fieldType: 'text',
    isRequired: false,
    options: '',
    placeholder: '',
  });

  // Merchandise Event: Item Details
  const [merchandiseData, setMerchandiseData] = useState({
    stockQuantity: 0,
    purchaseLimitPerParticipant: 1,
    sizes: [],
    colors: [],
  });
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

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

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'tel', label: 'Phone' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
  ];

  // Handle common input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add custom form field
  const handleAddField = () => {
    if (!newField.fieldLabel.trim()) {
      setError('Field label is required');
      return;
    }

    const field = {
      fieldLabel: newField.fieldLabel,
      fieldType: newField.fieldType,
      isRequired: newField.isRequired,
      placeholder: newField.placeholder,
      options: newField.options ? newField.options.split(',').map((opt) => opt.trim()) : [],
    };

    setCustomForm([...customForm, field]);
    setNewField({
      fieldLabel: '',
      fieldType: 'text',
      isRequired: false,
      options: '',
      placeholder: '',
    });
    setError('');
  };

  // Remove custom form field
  const handleRemoveField = (index) => {
    setCustomForm(customForm.filter((_, i) => i !== index));
  };

  // Add size
  const handleAddSize = () => {
    if (newSize.trim() && !merchandiseData.sizes.includes(newSize.trim())) {
      setMerchandiseData({
        ...merchandiseData,
        sizes: [...merchandiseData.sizes, newSize.trim()],
      });
      setNewSize('');
    }
  };

  // Remove size
  const handleRemoveSize = (size) => {
    setMerchandiseData({
      ...merchandiseData,
      sizes: merchandiseData.sizes.filter((s) => s !== size),
    });
  };

  // Add color
  const handleAddColor = () => {
    if (newColor.trim() && !merchandiseData.colors.includes(newColor.trim())) {
      setMerchandiseData({
        ...merchandiseData,
        colors: [...merchandiseData.colors, newColor.trim()],
      });
      setNewColor('');
    }
  };

  // Remove color
  const handleRemoveColor = (color) => {
    setMerchandiseData({
      ...merchandiseData,
      colors: merchandiseData.colors.filter((c) => c !== color),
    });
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) return 'Event name is required';
    if (!formData.description.trim()) return 'Description is required';
    if (!formData.startDate) return 'Start date is required';
    if (!formData.endDate) return 'End date is required';
    if (!formData.registrationDeadline) return 'Registration deadline is required';

    // Merchandise-specific validation
    if (eventType === 'Merchandise') {
      if (merchandiseData.stockQuantity <= 0) return 'Stock quantity must be greater than 0';
      if (merchandiseData.purchaseLimitPerParticipant <= 0)
        return 'Purchase limit must be greater than 0';
      if (
        merchandiseData.sizes.length === 0 &&
        merchandiseData.colors.length === 0
      )
        return 'At least one size or color is required for merchandise';
    }

    return null;
  };

  // Handle submission
  const handleSubmit = async (isPublished) => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build request payload
      const payload = {
        ...formData,
        type: eventType,
        registrationLimit: formData.registrationLimit ? parseInt(formData.registrationLimit) : null,
        registrationFee: parseFloat(formData.registrationFee),
        tags: formData.tags ? formData.tags.split(',').map((tag) => tag.trim()) : [],
        isPublished,
      };

      // Add type-specific fields
      if (eventType === 'Normal') {
        payload.customForm = customForm;
      } else if (eventType === 'Merchandise') {
        payload.stockQuantity = parseInt(merchandiseData.stockQuantity);
        payload.purchaseLimitPerParticipant = parseInt(merchandiseData.purchaseLimitPerParticipant);
        payload.itemDetails = {
          size: merchandiseData.sizes,
          color: merchandiseData.colors,
        };
      }

      const response = await axios.post('/api/events', payload);

      setSuccessMessage(
        `Event ${isPublished ? 'published' : 'saved as draft'} successfully!`
      );
      setTimeout(() => {
        navigate('/organizer/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error creating event:', err);
      setError(
        err.response?.data?.error || 'Failed to create event. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Create New Event
          </h1>
          <p style={{ color: '#6b7280' }}>
            Fill in the details below to create a new event
          </p>
        </div>

        {/* Error/Success Messages */}
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

        {successMessage && (
          <div
            style={{
              backgroundColor: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#065f46',
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Main Form */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {/* Event Type Selection */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              Event Type *
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                borderRadius: '8px',
                fontSize: '1rem',
                color: '#333',
              }}
            >
              <option value="Normal">Normal Event</option>
              <option value="Merchandise">Merchandise</option>
            </select>
          </div>

          {/* Common Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Event Name */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Event Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Annual Tech Fest 2026"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#333',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Provide a detailed description of the event..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#333',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '1rem',
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

            {/* Eligibility */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Eligibility *
              </label>
              <select
                name="eligibility"
                value={formData.eligibility}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#333',
                }}
              >
                <option value="All">Open to All</option>
                <option value="IIIT">IIIT Students Only</option>
                <option value="Non-IIIT">Non-IIIT Students Only</option>
              </select>
            </div>

            {/* Dates Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  <Calendar size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #d1d5db',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#1f2937',
                    fontWeight: '500',
                    colorScheme: 'light',
                    cursor: 'pointer',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  <Calendar size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #d1d5db',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#1f2937',
                    fontWeight: '500',
                    colorScheme: 'light',
                    cursor: 'pointer',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  <Calendar size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  Registration Deadline *
                </label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #d1d5db',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#1f2937',
                    fontWeight: '500',
                    colorScheme: 'light',
                    cursor: 'pointer',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            {/* Registration Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  <DollarSign size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  Registration Fee
                </label>
                <input
                  type="number"
                  name="registrationFee"
                  value={formData.registrationFee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: '#333',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  <Users size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  Registration Limit
                </label>
                <input
                  type="number"
                  name="registrationLimit"
                  value={formData.registrationLimit}
                  onChange={handleInputChange}
                  placeholder="Leave empty for unlimited"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    fontSize: '1rem',
                    color: '#333',
                  }}
                />
              </div>
            </div>

            {/* Venue */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                <MapPin size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Venue
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                placeholder="e.g., Main Auditorium"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#333',
                }}
              />
            </div>

            {/* Image URL */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                <ImageIcon size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Image URL
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#333',
                }}
              />
            </div>

            {/* Tags */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="e.g., workshop, coding, beginner-friendly"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  color: '#333',
                }}
              />
            </div>
          </div>

          {/* Conditional Rendering: Normal Event - Dynamic Form Builder */}
          {eventType === 'Normal' && (
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                Custom Registration Form Builder
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Add custom fields for participant registration
              </p>

              {/* Add New Field Form */}
              <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Field Label *
                    </label>
                    <input
                      type="text"
                      value={newField.fieldLabel}
                      onChange={(e) => setNewField({ ...newField, fieldLabel: e.target.value })}
                      placeholder="e.g., GitHub Username"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        color: '#333',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Field Type *
                    </label>
                    <select
                      value={newField.fieldType}
                      onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        fontSize: '0.875rem',
                        color: '#333',
                      }}
                    >
                      {fieldTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={newField.placeholder}
                    onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                    placeholder="e.g., Enter your GitHub username"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#333',
                    }}
                  />
                </div>

                {['select', 'radio', 'checkbox'].includes(newField.fieldType) && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Options (comma-separated) *
                    </label>
                    <input
                      type="text"
                      value={newField.options}
                      onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                      placeholder="e.g., Veg, Non-Veg, Vegan"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        color: '#333',
                      }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newField.isRequired}
                      onChange={(e) => setNewField({ ...newField, isRequired: e.target.checked })}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontWeight: '500', color: '#374151', fontSize: '0.875rem' }}>
                      Required Field
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleAddField}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  <Plus size={16} />
                  Add Field
                </button>
              </div>

              {/* Display Added Fields */}
              {customForm.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>
                    Added Fields ({customForm.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {customForm.map((field, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: 'white',
                          padding: '1rem',
                          borderRadius: '6px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                            {field.fieldLabel}
                            {field.isRequired && (
                              <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Type: {field.fieldType}
                            {field.options.length > 0 && ` | Options: ${field.options.join(', ')}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(index)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conditional Rendering: Merchandise Event */}
          {eventType === 'Merchandise' && (
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                Merchandise Details
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={merchandiseData.stockQuantity}
                    onChange={(e) =>
                      setMerchandiseData({ ...merchandiseData, stockQuantity: e.target.value })
                    }
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: '#333',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Purchase Limit Per Participant *
                  </label>
                  <input
                    type="number"
                    value={merchandiseData.purchaseLimitPerParticipant}
                    onChange={(e) =>
                      setMerchandiseData({
                        ...merchandiseData,
                        purchaseLimitPerParticipant: e.target.value,
                      })
                    }
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: '#333',
                    }}
                  />
                </div>
              </div>

              {/* Available Sizes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Available Sizes
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                    placeholder="e.g., XL"
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: '#333',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSize}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {merchandiseData.sizes.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {merchandiseData.sizes.map((size) => (
                      <div
                        key={size}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                        }}
                      >
                        <span style={{ color: '#374151', fontWeight: '500' }}>{size}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(size)}
                          style={{
                            padding: '0.25rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Colors */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Available Colors
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                    placeholder="e.g., Navy Blue"
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: '#333',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {merchandiseData.colors.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {merchandiseData.colors.map((color) => (
                      <div
                        key={color}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                        }}
                      >
                        <span style={{ color: '#374151', fontWeight: '500' }}>{color}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(color)}
                          style={{
                            padding: '0.25rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <button
              type="button"
              onClick={() => navigate('/organizer/dashboard')}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                opacity: loading ? 0.6 : 1,
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Save size={20} />
              Save as Draft
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Send size={20} />
              {loading ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
