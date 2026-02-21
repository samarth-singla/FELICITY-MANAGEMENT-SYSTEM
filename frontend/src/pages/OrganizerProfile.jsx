import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { Lock, User, Mail, Building2, Tag, FileText, Save, Phone, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const OrganizerProfile = () => {
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    reason: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordResetRequest, setPasswordResetRequest] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    organizerName: user?.organizerName || '',
    category: user?.category || '',
    description: user?.description || '',
    contactEmail: user?.contactEmail || user?.email || '',
    contactNumber: user?.contactNumber || '',
    discordWebhookUrl: user?.discordWebhookUrl || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Fetch password reset request status
  useEffect(() => {
    fetchPasswordResetRequestStatus();
  }, []);

  const fetchPasswordResetRequestStatus = async () => {
    try {
      setRequestLoading(true);
      const response = await axios.get('/api/auth/my-reset-requests');
      // Get the most recent pending or processed request
      const requests = response.data.data || [];
      if (requests.length > 0) {
        setPasswordResetRequest(requests[0]); // Most recent request
      }
      setRequestLoading(false);
    } catch (err) {
      console.error('Error fetching password reset request:', err);
      setRequestLoading(false);
    }
  };

  const handlePasswordInputChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
    setPasswordError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.reason || passwordForm.reason.trim().length < 10) {
      setPasswordError('Please provide a detailed reason (at least 10 characters)');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await axios.post('/api/auth/request-password-reset', {
        reason: passwordForm.reason
      });

      // Password reset request submitted
      setPasswordSuccess(response.data.message);
      
      setPasswordForm({
        reason: ''
      });

      // Refresh the request status
      await fetchPasswordResetRequestStatus();

      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 3000);

      setPasswordLoading(false);
    } catch (err) {
      console.error('Error submitting password reset request:', err);
      setPasswordError(err.response?.data?.error || 'Failed to submit password reset request.');
      setPasswordLoading(false);
    }
  };

  const handleProfileInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
    setProfileError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      await axios.put('/api/users/updatedetails', profileData);
      setProfileSuccess('Profile updated successfully!');
      setEditMode(false);
      
      setTimeout(() => {
        setProfileSuccess('');
      }, 3000);

      setProfileLoading(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError(err.response?.data?.error || 'Failed to update profile');
      setProfileLoading(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({
      reason: ''
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', color: '#333', marginBottom: '8px' }}>
            Profile Settings
          </h1>
          <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
            Manage your profile information and security settings
          </p>
        </div>

        {/* Profile Information Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px'
          }}>
            <h2 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
              Profile Information
            </h2>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Edit Profile
              </button>
            )}
          </div>

          {profileSuccess && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              color: '#155724',
              fontSize: '14px'
            }}>
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              color: '#721c24',
              fontSize: '14px'
            }}>
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileInputChange}
                  disabled={!editMode || profileLoading}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#1f2937',
                    backgroundColor: !editMode || profileLoading ? '#f8f9fa' : 'white'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileInputChange}
                  disabled={!editMode || profileLoading}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#1f2937',
                    backgroundColor: !editMode || profileLoading ? '#f8f9fa' : 'white'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                <Building2 size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Organizer Name / Club Name
              </label>
              <input
                type="text"
                name="organizerName"
                value={profileData.organizerName}
                onChange={handleProfileInputChange}
                disabled={!editMode || profileLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1f2937',
                  backgroundColor: !editMode || profileLoading ? '#f8f9fa' : 'white'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                <Tag size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Category
              </label>
              <select
                name="category"
                value={profileData.category}
                onChange={handleProfileInputChange}
                disabled={!editMode || profileLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1f2937',
                  backgroundColor: !editMode || profileLoading ? '#f8f9fa' : 'white'
                }}
              >
                <option value="">Select Category</option>
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Literary">Literary</option>
                <option value="Art">Art</option>
                <option value="Music">Music</option>
                <option value="Dance">Dance</option>
                <option value="Photography">Photography</option>
                <option value="Social">Social</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Description
              </label>
              <textarea
                name="description"
                value={profileData.description}
                onChange={handleProfileInputChange}
                disabled={!editMode || profileLoading}
                rows="4"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1f2937',
                  backgroundColor: !editMode || profileLoading ? '#f8f9fa' : 'white',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Login Email - Read Only */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                <Mail size={16} />
                Login Email
                <span style={{
                  fontSize: '12px',
                  fontWeight: '400',
                  color: '#6b7280',
                  marginLeft: '4px'
                }}>
                  (Read-Only)
                </span>
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Contact Email - Editable */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={profileData.contactEmail}
                onChange={handleProfileInputChange}
                disabled={!editMode || profileLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1f2937',
                  backgroundColor: !editMode || profileLoading ? '#f8f9fa' : 'white'
                }}
              />
            </div>

            {/* Contact Number */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                <Phone size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={profileData.contactNumber}
                onChange={handleProfileInputChange}
                disabled={!editMode || profileLoading}
                placeholder="+1234567890"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1f2937',
                  backgroundColor: !editMode || profileLoading ? '#f8f9fa' : 'white'
                }}
              />
            </div>

            {/* Discord Webhook URL - Highlighted Section */}
            <div style={{ 
              marginBottom: '20px',
              padding: '16px',
              backgroundColor: '#eff6ff',
              border: '2px solid #3b82f6',
              borderRadius: '8px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontWeight: '700',
                color: '#1e40af',
                fontSize: '15px'
              }}>
                <MessageSquare size={20} style={{ color: '#3b82f6' }} />
                Discord Webhook URL
                <span style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#3b82f6',
                  backgroundColor: '#dbeafe',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  🎯 Auto-post events
                </span>
              </label>
              <input
                type="url"
                name="discordWebhookUrl"
                value={profileData.discordWebhookUrl}
                onChange={handleProfileInputChange}
                disabled={!editMode || profileLoading}
                placeholder="https://discord.com/api/webhooks/1234567890/abcdefghijklmnop"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #93c5fd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#1f2937',
                  backgroundColor: !editMode || profileLoading ? '#f8f9fa' : 'white',
                  fontFamily: 'monospace'
                }}
              />
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#dbeafe',
                borderRadius: '6px',
                borderLeft: '4px solid #3b82f6'
              }}>
                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '13px',
                  color: '#1e40af',
                  fontWeight: '600'
                }}>
                  💡 How it works:
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '12px',
                  color: '#1e3a8a',
                  lineHeight: '1.6'
                }}>
                  When you publish a new event, it will automatically be posted to your Discord server with full event details, including dates, fees, venue, and registration link. Get your webhook URL from: Discord Server → Edit Channel → Integrations → Webhooks
                </p>
              </div>
            </div>

            {editMode && (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setProfileData({
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || '',
                      organizerName: user?.organizerName || '',
                      category: user?.category || '',
                      description: user?.description || '',
                    contactEmail: user?.contactEmail || user?.email || '',
                    contactNumber: user?.contactNumber || '',
                    discordWebhookUrl: user?.discordWebhookUrl || ''
                    });
                    setProfileError('');
                  }}
                  disabled={profileLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: profileLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: profileLoading ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: profileLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: profileLoading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Save size={16} />
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Security Card */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '20px' }}>
            Security Settings
          </h2>

          {/* Password Reset Request Status */}
          {passwordResetRequest && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid ' + (
                passwordResetRequest.status === 'pending' ? '#ffc107' :
                passwordResetRequest.status === 'approved' ? '#28a745' :
                '#dc3545'
              ),
              backgroundColor: (
                passwordResetRequest.status === 'pending' ? '#fff9e6' :
                passwordResetRequest.status === 'approved' ? '#d4edda' :
                '#f8d7da'
              )
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {passwordResetRequest.status === 'pending' && <Clock size={20} color="#ffc107" />}
                {passwordResetRequest.status === 'approved' && <CheckCircle size={20} color="#28a745" />}
                {passwordResetRequest.status === 'rejected' && <XCircle size={20} color="#dc3545" />}
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  Password Reset Request: {passwordResetRequest.status.charAt(0).toUpperCase() + passwordResetRequest.status.slice(1)}
                </h3>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                {passwordResetRequest.status === 'pending' && 'Your password reset request is waiting for admin approval.'}
                {passwordResetRequest.status === 'approved' && 'Your password has been reset. Admin will share new credentials with you.'}
                {passwordResetRequest.status === 'rejected' && 'Your password reset request was rejected.'}
              </p>
              {passwordResetRequest.reason && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  borderLeft: '4px solid #667eea'
                }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#667eea' }}>
                    Your Reason:
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#333' }}>
                    {passwordResetRequest.reason}
                  </p>
                </div>
              )}
              {passwordResetRequest.adminComments && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  borderLeft: '4px solid ' + (passwordResetRequest.status === 'rejected' ? '#dc3545' : '#28a745')
                }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: passwordResetRequest.status === 'rejected' ? '#dc3545' : '#28a745' }}>
                    Admin Comment:
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#333' }}>
                    {passwordResetRequest.adminComments}
                  </p>
                </div>
              )}
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#888' }}>
                Submitted: {new Date(passwordResetRequest.createdAt).toLocaleString()}
                {(passwordResetRequest.approvedAt || passwordResetRequest.rejectedAt) && (
                  <> • Reviewed: {new Date(passwordResetRequest.approvedAt || passwordResetRequest.rejectedAt).toLocaleString()}</>
                )}
              </p>
            </div>
          )}

          <button
            onClick={() => setShowPasswordModal(true)}
            disabled={passwordResetRequest?.status === 'pending'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: passwordResetRequest?.status === 'pending' ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: passwordResetRequest?.status === 'pending' ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: passwordResetRequest?.status === 'pending' ? 0.6 : 1
            }}
          >
            <Lock size={18} />
            {passwordResetRequest?.status === 'pending' ? 'Request Pending' : 'Request Password Reset'}
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '450px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, color: '#333' }}>Request Password Reset</h2>
              <button
                onClick={closePasswordModal}
                disabled={passwordLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: passwordLoading ? 'not-allowed' : 'pointer',
                  fontSize: '24px',
                  color: '#333'
                }}
              >
                ×
              </button>
            </div>

            {/* Admin Approval Info */}
            <div style={{
              display: 'flex',
              gap: '10px',
              padding: '12px',
              marginBottom: '15px',
              backgroundColor: '#e3f2fd',
              border: '1px solid #90caf9',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1565c0'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Admin Will Generate New Password</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  You cannot set your own password. Admin will review your request and generate a secure password to share with you upon approval.
                </p>
              </div>
            </div>

            {passwordError && (
              <div style={{
                padding: '10px',
                marginBottom: '15px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                color: '#721c24',
                fontSize: '14px'
              }}>
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div style={{
                padding: '10px',
                marginBottom: '15px',
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                color: '#155724',
                fontSize: '14px'
              }}>
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Reason for Password Reset <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <textarea
                  name="reason"
                  value={passwordForm.reason}
                  onChange={handlePasswordInputChange}
                  required
                  disabled={passwordLoading}
                  rows="5"
                  placeholder="Please provide a detailed reason for requesting a password reset (e.g., forgot password, security concern, etc.)"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#1f2937',
                    backgroundColor: passwordLoading ? '#f8f9fa' : 'white',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6c757d' }}>
                  Minimum 10 characters
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={passwordLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: passwordLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: passwordLoading ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: passwordLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: passwordLoading ? 0.6 : 1
                  }}
                >
                  {passwordLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerProfile;
