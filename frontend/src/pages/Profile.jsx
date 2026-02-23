import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { User as UserIcon, Mail, School, Heart, Users, Check, Save, X, RefreshCw, Phone, Lock, Edit2 } from 'lucide-react';

const Profile = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // User data
  const [userData, setUserData] = useState(null);
  
  // Editable personal details
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [hasDetailsChanges, setHasDetailsChanges] = useState(false);

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Organizers list
  const [organizers, setOrganizers] = useState([]);
  const [organizersLoading, setOrganizersLoading] = useState(true);
  
  // Editable preferences
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState([]);
  
  // Track if changes were made
  const [hasChanges, setHasChanges] = useState(false);

  // Available interests
  const availableInterests = [
    'Technical',
    'Cultural',
    'Sports',
    'Literary',
    'Art',
    'Music',
    'Dance',
    'Photography',
    'Gaming',
    'Other'
  ];

  useEffect(() => {
    fetchUserData();
    fetchOrganizers();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/me');
      const data = response.data.data;
      setUserData(data);
      
      // Set initial personal details
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setContactNumber(data.contactNumber || '');
      setCollegeName(data.collegeName || '');
      
      // Set initial preferences
      setSelectedInterests(data.preferences?.interests || []);
      setSelectedOrganizers(
        data.preferences?.following?.map(f => typeof f === 'object' ? f._id : f) || []
      );
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
      setLoading(false);
    }
  };

  const fetchOrganizers = async () => {
    try {
      setOrganizersLoading(true);
      const response = await axios.get('/api/users/organizers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setOrganizers(response.data.data);
      setOrganizersLoading(false);
    } catch (err) {
      console.error('Error fetching organizers:', err);
      setOrganizersLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    
    setSelectedInterests(newInterests);
    setHasChanges(true);
  };

  const toggleOrganizer = (organizerId) => {
    const newOrganizers = selectedOrganizers.includes(organizerId)
      ? selectedOrganizers.filter(id => id !== organizerId)
      : [...selectedOrganizers, organizerId];
    
    setSelectedOrganizers(newOrganizers);
    setHasChanges(true);
  };

  // Personal details handlers
  const handleEditDetails = () => {
    setIsEditingDetails(true);
    setHasDetailsChanges(false);
  };

  const handleCancelEditDetails = () => {
    setIsEditingDetails(false);
    setFirstName(userData?.firstName || '');
    setLastName(userData?.lastName || '');
    setContactNumber(userData?.contactNumber || '');
    setCollegeName(userData?.collegeName || '');
    setHasDetailsChanges(false);
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.put('/api/users/updatedetails', {
        firstName,
        lastName,
        contactNumber,
        collegeName
      });

      setUserData(response.data.data);
      setSuccessMessage('Personal details updated successfully!');
      setIsEditingDetails(false);
      setHasDetailsChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      setSaving(false);
    } catch (err) {
      console.error('Error updating details:', err);
      setError(err.response?.data?.error || 'Failed to update details');
      setSaving(false);
    }
  };

  // Password change handlers
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      await axios.put('/api/users/updatepassword', {
        currentPassword,
        newPassword
      });

      setSuccessMessage('Password changed successfully!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      setSaving(false);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err.response?.data?.error || 'Failed to change password');
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await axios.put('/api/users/preferences', {
        interests: selectedInterests,
        following: selectedOrganizers
      });

      setSuccessMessage('Preferences updated successfully!');
      setHasChanges(false);
      
      // Refresh user data to get updated following list with populated data
      await fetchUserData();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      setSaving(false);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err.response?.data?.error || 'Failed to save preferences');
      setSaving(false);
    }
  };

  const handleResetPreferences = () => {
    // Reset to original values from userData
    setSelectedInterests(userData?.preferences?.interests || []);
    setSelectedOrganizers(
      userData?.preferences?.following?.map(f => typeof f === 'object' ? f._id : f) || []
    );
    setHasChanges(false);
    setError('');
    setSuccessMessage('');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <div style={{ color: '#333', fontSize: '18px' }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <h1 style={{ color: '#333', marginBottom: '30px' }}>My Profile</h1>

        {/* Alerts */}
        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            color: '#721c24',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '6px',
            color: '#155724',
            fontSize: '14px'
          }}>
            ✓ {successMessage}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '20px'
        }}>
          {/* Personal Information Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: '#333', margin: 0 }}>
                Personal Information
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                {!isEditingDetails ? (
                  <>
                    <button
                      onClick={handleEditDetails}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      <Edit2 size={16} />
                      Edit Details
                    </button>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: 'white',
                        color: '#667eea',
                        border: '2px solid #667eea',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      <Lock size={16} />
                      Change Password
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEditDetails}
                      disabled={saving}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: 'white',
                        color: '#6c757d',
                        border: '1px solid #6c757d',
                        borderRadius: '6px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        opacity: saving ? 0.6 : 1
                      }}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDetails}
                      disabled={saving || !hasDetailsChanges}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: hasDetailsChanges ? '#28a745' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: (saving || !hasDetailsChanges) ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        opacity: (saving || !hasDetailsChanges) ? 0.6 : 1
                      }}
                    >
                      {saving ? (
                        <>
                          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              {/* First Name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#667eea',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <UserIcon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    First Name
                  </div>
                  {isEditingDetails ? (
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setHasDetailsChanges(true);
                      }}
                      style={{
                        width: '100%',
                        fontSize: '16px',
                        color: '#333',
                        fontWeight: '600',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        backgroundColor: 'white'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '16px', color: '#333', fontWeight: '600' }}>
                      {userData?.firstName}
                    </div>
                  )}
                </div>
              </div>

              {/* Last Name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#667eea',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <UserIcon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Last Name
                  </div>
                  {isEditingDetails ? (
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setHasDetailsChanges(true);
                      }}
                      style={{
                        width: '100%',
                        fontSize: '16px',
                        color: '#333',
                        fontWeight: '600',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        backgroundColor: 'white'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '16px', color: '#333', fontWeight: '600' }}>
                      {userData?.lastName}
                    </div>
                  )}
                </div>
              </div>

              {/* Email (non-editable) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#667eea',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Email Address
                  </div>
                  <div style={{ fontSize: '16px', color: '#333', fontWeight: '600' }}>
                    {userData?.email}
                  </div>
                </div>
              </div>

              {/* Contact Number */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#667eea',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Phone size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Contact Number
                  </div>
                  {isEditingDetails ? (
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => {
                        setContactNumber(e.target.value);
                        setHasDetailsChanges(true);
                      }}
                      style={{
                        width: '100%',
                        fontSize: '16px',
                        color: '#333',
                        fontWeight: '600',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        backgroundColor: 'white'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '16px', color: '#333', fontWeight: '600' }}>
                      {userData?.contactNumber || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>

              {/* College Name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#667eea',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <School size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    College
                  </div>
                  {isEditingDetails ? (
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => {
                        setCollegeName(e.target.value);
                        setHasDetailsChanges(true);
                      }}
                      style={{
                        width: '100%',
                        fontSize: '16px',
                        color: '#333',
                        fontWeight: '600',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        backgroundColor: 'white'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '16px', color: '#333', fontWeight: '600' }}>
                      {userData?.collegeName}
                    </div>
                  )}
                </div>
              </div>

              {/* Participant Type (non-editable) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#667eea',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Participant Type
                  </div>
                  <div style={{ fontSize: '16px', color: '#333', fontWeight: '600' }}>
                    {userData?.participantType}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Preferences Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: '#333', margin: 0 }}>
                <Heart size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                My Preferences
              </h2>
              
              {hasChanges && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleResetPreferences}
                    disabled={saving}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: 'white',
                      color: '#6c757d',
                      border: '1px solid #6c757d',
                      borderRadius: '6px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    {saving ? (
                      <>
                        <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Interests Section */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#333', fontSize: '18px', marginBottom: '15px' }}>
                Areas of Interest
              </h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                Select topics you're interested in to get personalized event recommendations.
              </p>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px'
              }}>
                {availableInterests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    disabled={saving}
                    style={{
                      padding: '12px 16px',
                      border: selectedInterests.includes(interest)
                        ? '2px solid #667eea'
                        : '2px solid #dee2e6',
                      backgroundColor: selectedInterests.includes(interest)
                        ? '#f0f4ff'
                        : 'white',
                      borderRadius: '8px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: selectedInterests.includes(interest)
                        ? '#667eea'
                        : '#333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    {selectedInterests.includes(interest) && (
                      <Check size={16} />
                    )}
                    {interest}
                  </button>
                ))}
              </div>

              <p style={{ color: '#999', fontSize: '13px', fontStyle: 'italic', marginTop: '12px' }}>
                Selected: {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Following Section */}
            <div>
              <h3 style={{ color: '#333', fontSize: '18px', marginBottom: '15px' }}>
                Following Clubs
              </h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                Stay updated with events from your favorite clubs.
              </p>

              {organizersLoading ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  Loading clubs...
                </div>
              ) : organizers.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  No active clubs available at the moment.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '16px',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  padding: '4px'
                }}>
                  {organizers.map((org) => (
                    <div
                      key={org._id}
                      onClick={() => !saving && toggleOrganizer(org._id)}
                      style={{
                        padding: '16px',
                        border: selectedOrganizers.includes(org._id)
                          ? '2px solid #667eea'
                          : '2px solid #dee2e6',
                        backgroundColor: selectedOrganizers.includes(org._id)
                          ? '#f0f4ff'
                          : 'white',
                        borderRadius: '8px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        opacity: saving ? 0.6 : 1
                      }}
                    >
                      {selectedOrganizers.includes(org._id) && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#667eea',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Check size={14} />
                        </div>
                      )}

                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '16px',
                        color: '#333',
                        fontWeight: '600'
                      }}>
                        {org.organizerName}
                      </h3>

                      <div style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        backgroundColor: '#e7f3ff',
                        color: '#0066cc',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        marginBottom: '8px'
                      }}>
                        {org.category}
                      </div>

                      <p style={{
                        margin: '8px 0 0 0',
                        fontSize: '13px',
                        color: '#666',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {org.description || 'No description available'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ color: '#999', fontSize: '13px', fontStyle: 'italic', marginTop: '12px' }}>
                Following: {selectedOrganizers.length} club{selectedOrganizers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ color: '#333', margin: 0 }}>
                <Lock size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Change Password
              </h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                disabled={saving}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {passwordError && (
              <div style={{
                backgroundColor: '#f8d7da',
                color: '#721c24',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                border: '1px solid #f5c6cb'
              }}>
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#1f2937',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#333',
                  fontWeight: '500'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={saving}
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#1f2937',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#333',
                  fontWeight: '500'
                }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#1f2937',
                    backgroundColor: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'white',
                    color: '#6c757d',
                    border: '1px solid #6c757d',
                    borderRadius: '6px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: saving ? 0.6 : 1
                  }}
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
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

export default Profile;
