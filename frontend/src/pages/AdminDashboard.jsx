import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { X, UserPlus, Users, Calendar, User, Ban, CheckCircle, Archive, Trash2, AlertTriangle, Clock, XCircle, Key, LogOut, LayoutDashboard, Shield } from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [stats, setStats] = useState({
    totalOrganizers: 0,
    activeOrganizers: 0,
    totalEvents: 0,
    totalParticipants: 0,
    pendingPasswordChangeRequests: 0,
    pendingPasswordResetRequests: 0,
  });

  // Password change requests state
  const [passwordChangeRequests, setPasswordChangeRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Password reset requests state
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
  const [resetRequestsLoading, setResetRequestsLoading] = useState(false);
  const [showResetRejectModal, setShowResetRejectModal] = useState(false);
  const [selectedResetRequest, setSelectedResetRequest] = useState(null);
  const [resetRejectionComment, setResetRejectionComment] = useState('');
  const [resetRejectLoading, setResetRejectLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    organizerName: '',
    category: '',
    description: '',
    contactEmail: '',
  });

  // Fetch organizers on component mount
  useEffect(() => {
    fetchOrganizers();
    fetchStats();
    fetchPasswordChangeRequests();
    fetchPasswordResetRequests();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/organizers');
      setOrganizers(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching organizers:', err);
      setError('Failed to fetch organizers');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats({
        totalOrganizers: response.data.data.organizers.total,
        activeOrganizers: response.data.data.organizers.active,
        totalEvents: 0, // Will be updated when events API is ready
        totalParticipants: response.data.data.participants,
        pendingPasswordChangeRequests: response.data.data.passwordChangeRequests?.pending || 0,
        pendingPasswordResetRequests: response.data.data.passwordResetRequests?.pending || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setFormLoading(true);

    try {
      const response = await axios.post('/api/admin/provision-organizer', formData);
      
      // Store generated credentials
      setGeneratedCredentials(response.data.credentials);
      setSuccessMessage('Organizer provisioned successfully!');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        organizerName: '',
        category: '',
        description: '',
        contactEmail: '',
      });

      // Refresh organizers list
      fetchOrganizers();
      fetchStats();

      // Don't close modal immediately so admin can copy credentials
      setFormLoading(false);
    } catch (err) {
      console.error('Error provisioning organizer:', err);
      setError(err.response?.data?.error || 'Failed to provision organizer');
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setGeneratedCredentials(null);
    setSuccessMessage('');
    setError('');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      organizerName: '',
      category: '',
      description: '',
      contactEmail: '',
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleStatusChange = async (organizerId, newStatus) => {
    try {
      setError('');
      await axios.put(`/api/admin/organizers/${organizerId}/status`, { status: newStatus });
      setSuccessMessage(`Organizer ${newStatus === 'active' ? 'enabled' : newStatus === 'disabled' ? 'disabled' : 'archived'} successfully!`);
      fetchOrganizers();
      fetchStats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating organizer status:', err);
      setError(err.response?.data?.error || 'Failed to update organizer status');
    }
  };

  const handleDeleteOrganizer = async (organizerId) => {
    try {
      setError('');
      await axios.delete(`/api/admin/organizers/${organizerId}`);
      setSuccessMessage('Organizer permanently deleted!');
      fetchOrganizers();
      fetchStats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting organizer:', err);
      setError(err.response?.data?.error || 'Failed to delete organizer');
    }
  };

  const openConfirmModal = (action, organizer) => {
    setConfirmAction(action);
    setSelectedOrganizer(organizer);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setSelectedOrganizer(null);
  };

  const handleConfirmedAction = () => {
    if (!confirmAction || !selectedOrganizer) return;

    switch (confirmAction.type) {
      case 'disable':
        handleStatusChange(selectedOrganizer._id, 'disabled');
        break;
      case 'enable':
        handleStatusChange(selectedOrganizer._id, 'active');
        break;
      case 'archive':
        handleStatusChange(selectedOrganizer._id, 'archived');
        break;
      case 'delete':
        handleDeleteOrganizer(selectedOrganizer._id);
        break;
      default:
        break;
    }

    closeConfirmModal();
  };

  const getActionConfirmation = () => {
    if (!confirmAction || !selectedOrganizer) return {};

    const confirmations = {
      disable: {
        title: 'Disable Organizer Account',
        message: `Are you sure you want to disable ${selectedOrganizer.organizerName}? They will not be able to log in, but their data will be preserved.`,
        buttonText: 'Disable Account',
        buttonColor: '#ffc107',
        icon: Ban
      },
      enable: {
        title: 'Enable Organizer Account',
        message: `Are you sure you want to enable ${selectedOrganizer.organizerName}? They will be able to log in again.`,
        buttonText: 'Enable Account',
        buttonColor: '#28a745',
        icon: CheckCircle
      },
      archive: {
        title: 'Archive Organizer Account',
        message: `Are you sure you want to archive ${selectedOrganizer.organizerName}? They will not be able to log in, and the account will be marked as archived.`,
        buttonText: 'Archive Account',
        buttonColor: '#6c757d',
        icon: Archive
      },
      delete: {
        title: 'Permanently Delete Organizer',
        message: `⚠️ WARNING: Are you sure you want to permanently delete ${selectedOrganizer.organizerName}? This action CANNOT be undone and will remove all organizer data.`,
        buttonText: 'Permanently Delete',
        buttonColor: '#dc3545',
        icon: Trash2
      }
    };

    return confirmations[confirmAction.type] || {};
  };

  // Password change request functions
  const fetchPasswordChangeRequests = async () => {
    try {
      setRequestsLoading(true);
      const response = await axios.get('/api/admin/password-change-requests');
      setPasswordChangeRequests(response.data.data);
      setRequestsLoading(false);
    } catch (err) {
      console.error('Error fetching password change requests:', err);
      setRequestsLoading(false);
    }
  };

  const handleApprovePasswordChange = async (requestId) => {
    try {
      await axios.put(`/api/admin/password-change-requests/${requestId}/approve`);
      setSuccessMessage('Password change request approved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchPasswordChangeRequests();
      fetchStats(); // Refresh stats to update pending count
    } catch (err) {
      console.error('Error approving password change:', err);
      setError(err.response?.data?.message || 'Failed to approve password change');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
    setRejectionComment('');
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectionComment('');
    setRejectLoading(false);
  };

  const handleRejectPasswordChange = async () => {
    if (!rejectionComment.trim()) {
      setError('Rejection comment is required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setRejectLoading(true);
      await axios.put(`/api/admin/password-change-requests/${selectedRequest._id}/reject`, {
        rejectionComment: rejectionComment.trim()
      });
      setSuccessMessage('Password change request rejected');
      setTimeout(() => setSuccessMessage(''), 3000);
      closeRejectModal();
      fetchPasswordChangeRequests();
      fetchStats(); // Refresh stats to update pending count
    } catch (err) {
      console.error('Error rejecting password change:', err);
      setError(err.response?.data?.message || 'Failed to reject password change');
      setTimeout(() => setError(''), 3000);
      setRejectLoading(false);
    }
  };

  // Password reset request functions
  const fetchPasswordResetRequests = async () => {
    try {
      setResetRequestsLoading(true);
      const response = await axios.get('/api/admin/reset-requests');
      setPasswordResetRequests(response.data.data);
      setResetRequestsLoading(false);
    } catch (err) {
      console.error('Error fetching password reset requests:', err);
      setResetRequestsLoading(false);
    }
  };

  const handleApprovePasswordReset = async (requestId) => {
    if (!window.confirm('This will generate a new password for the organizer. Continue?')) {
      return;
    }

    try {
      const response = await axios.put(`/api/admin/reset-requests/${requestId}/approve`);
      setGeneratedPassword(response.data.credentials);
      setShowPasswordModal(true);
      setSuccessMessage('Password reset approved! New password generated.');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchPasswordResetRequests();
      fetchStats();
    } catch (err) {
      console.error('Error approving password reset:', err);
      setError(err.response?.data?.error || 'Failed to approve password reset');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openResetRejectModal = (request) => {
    setSelectedResetRequest(request);
    setShowResetRejectModal(true);
    setResetRejectionComment('');
  };

  const closeResetRejectModal = () => {
    setShowResetRejectModal(false);
    setSelectedResetRequest(null);
    setResetRejectionComment('');
    setResetRejectLoading(false);
  };

  const handleRejectPasswordReset = async () => {
    if (!resetRejectionComment.trim()) {
      setError('Admin comment is required for rejection');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setResetRejectLoading(true);
      await axios.put(`/api/admin/reset-requests/${selectedResetRequest._id}/reject`, {
        adminComments: resetRejectionComment.trim()
      });
      setSuccessMessage('Password reset request rejected');
      setTimeout(() => setSuccessMessage(''), 3000);
      closeResetRejectModal();
      fetchPasswordResetRequests();
      fetchStats();
    } catch (err) {
      console.error('Error rejecting password reset:', err);
      setError(err.response?.data?.error || 'Failed to reject password reset');
      setTimeout(() => setError(''), 3000);
      setResetRejectLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      {/* Navbar */}
      <nav style={{
        backgroundColor: '#1f2937',
        padding: '0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px', borderRight: '1px solid #374151' }}>
              <Shield size={28} color="#60a5fa" />
              <span style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>Admin Panel</span>
            </div>
            <div style={{ display: 'flex' }}>
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  padding: '16px 24px',
                  backgroundColor: activeTab === 'dashboard' ? '#374151' : 'transparent',
                  color: activeTab === 'dashboard' ? '#60a5fa' : '#d1d5db',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  borderBottom: activeTab === 'dashboard' ? '3px solid #60a5fa' : '3px solid transparent'
                }}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('organizers')}
                style={{
                  padding: '16px 24px',
                  backgroundColor: activeTab === 'organizers' ? '#374151' : 'transparent',
                  color: activeTab === 'organizers' ? '#60a5fa' : '#d1d5db',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  borderBottom: activeTab === 'organizers' ? '3px solid #60a5fa' : '3px solid transparent'
                }}
              >
                <Users size={18} />
                Manage Clubs/Organizers
              </button>
              <button
                onClick={() => setActiveTab('password-requests')}
                style={{
                  padding: '16px 24px',
                  backgroundColor: activeTab === 'password-requests' ? '#374151' : 'transparent',
                  color: activeTab === 'password-requests' ? '#60a5fa' : '#d1d5db',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  borderBottom: activeTab === 'password-requests' ? '3px solid #60a5fa' : '3px solid transparent',
                  position: 'relative'
                }}
              >
                <Key size={18} />
                Password Reset Requests
                {((stats.pendingPasswordChangeRequests || 0) + (stats.pendingPasswordResetRequests || 0)) > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {(stats.pendingPasswordChangeRequests || 0) + (stats.pendingPasswordResetRequests || 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '16px 24px',
              backgroundColor: 'transparent',
              color: '#d1d5db',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#374151';
              e.target.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#d1d5db';
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ padding: '30px 20px', maxWidth: '1400px', margin: '0 auto' }}>

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

        {successMessage && (
          <div style={{
            padding: '12px 20px',
            marginBottom: '20px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            color: '#155724',
            fontSize: '14px'
          }}>
            {successMessage}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <h1 style={{ margin: '0 0 30px 0', color: '#1f2937', fontSize: '32px', fontWeight: '700' }}>Dashboard Overview</h1>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#007bff', 
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', opacity: 0.9 }}>Total Organizers</h3>
              <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>{stats.totalOrganizers}</p>
            </div>
            <Users size={40} style={{ opacity: 0.8 }} />
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#28a745', 
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', opacity: 0.9 }}>Active Organizers</h3>
              <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>{stats.activeOrganizers}</p>
            </div>
            <Users size={40} style={{ opacity: 0.8 }} />
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#17a2b8', 
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', opacity: 0.9 }}>Total Events</h3>
              <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>{stats.totalEvents}</p>
            </div>
            <Calendar size={40} style={{ opacity: 0.8 }} />
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#ffc107', 
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', opacity: 0.9 }}>Total Participants</h3>
              <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>{stats.totalParticipants}</p>
            </div>
            <User size={40} style={{ opacity: 0.8 }} />
          </div>
        </div>

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#ff6b6b', 
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', opacity: 0.9 }}>Pending Password Requests</h3>
              <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold' }}>
                {(stats.pendingPasswordChangeRequests || 0) + (stats.pendingPasswordResetRequests || 0)}
              </p>
              <p style={{ fontSize: '12px', margin: '8px 0 0 0', opacity: 0.9 }}>
                {stats.pendingPasswordResetRequests || 0} Reset · {stats.pendingPasswordChangeRequests || 0} Change
              </p>
            </div>
            <Key size={40} style={{ opacity: 0.8 }} />
          </div>
        </div>
      </div>
          </>
        )}

        {/* Manage Clubs/Organizers Tab */}
        {activeTab === 'organizers' && (
          <>
            <h1 style={{ margin: '0 0 30px 0', color: '#1f2937', fontSize: '32px', fontWeight: '700' }}>Manage Clubs/Organizers</h1>

      {/* Organizers Section */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0 }}>Manage Organizers</h2>
          <button 
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <UserPlus size={18} />
            Provision New Organizer
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading organizers...</div>
        ) : organizers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No organizers found. Provision your first organizer!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Organizer Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Created</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#1f2937' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizers.map((org) => (
                  <tr 
                    key={org._id} 
                    style={{ 
                      borderBottom: '1px solid #dee2e6',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '12px', color: '#1f2937', fontWeight: '500' }}>{org.organizerName}</td>
                    <td style={{ padding: '12px', color: '#374151' }}>{org.firstName} {org.lastName}</td>
                    <td style={{ padding: '12px', color: '#374151' }}>{org.email}</td>
                    <td style={{ padding: '12px', color: '#374151' }}>{org.category}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: 
                          org.accountStatus === 'active' ? '#d4edda' : 
                          org.accountStatus === 'disabled' ? '#fff3cd' : 
                          '#f8d7da',
                        color: 
                          org.accountStatus === 'active' ? '#155724' : 
                          org.accountStatus === 'disabled' ? '#856404' : 
                          '#721c24'
                      }}>
                        {org.accountStatus.charAt(0).toUpperCase() + org.accountStatus.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#374151' }}>
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                      }}>
                        {org.accountStatus === 'active' ? (
                          <button
                            onClick={() => openConfirmModal({ type: 'disable' }, org)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              backgroundColor: '#ffc107',
                              color: '#856404',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Disable account - cannot log in"
                          >
                            <Ban size={14} />
                            Disable
                          </button>
                        ) : org.accountStatus === 'disabled' ? (
                          <button
                            onClick={() => openConfirmModal({ type: 'enable' }, org)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Enable account - allow login"
                          >
                            <CheckCircle size={14} />
                            Enable
                          </button>
                        ) : (
                          <button
                            onClick={() => openConfirmModal({ type: 'enable' }, org)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Enable account - allow login"
                          >
                            <CheckCircle size={14} />
                            Enable
                          </button>
                        )}
                        
                        {org.accountStatus !== 'archived' && (
                          <button
                            onClick={() => openConfirmModal({ type: 'archive' }, org)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Archive account - mark as inactive"
                          >
                            <Archive size={14} />
                            Archive
                          </button>
                        )}
                        
                        <button
                          onClick={() => openConfirmModal({ type: 'delete' }, org)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Permanently delete - cannot be undone"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
          </>
        )}

        {/* Password Reset Requests Tab */}
        {activeTab === 'password-requests' && (
          <>
            <h1 style={{ margin: '0 0 30px 0', color: '#1f2937', fontSize: '32px', fontWeight: '700' }}>Password Reset Requests</h1>

      {/* Password Reset Requests Section */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '30px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Key size={24} />
          Password Reset Requests (Organizers)
        </h2>

        {resetRequestsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading password reset requests...
          </div>
        ) : passwordResetRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No password reset requests found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Organizer</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Club Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Reason</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Requested On</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {passwordResetRequests.map((request) => (
                  <tr 
                    key={request._id}
                    style={{ 
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: request.status === 'pending' 
                        ? '#fff9e6' 
                        : request.status === 'approved' 
                        ? '#e8f5e9' 
                        : '#ffebee'
                    }}
                  >
                    <td style={{ padding: '12px', color: '#1f2937', fontWeight: '500' }}>
                      {request.user?.firstName} {request.user?.lastName}
                    </td>
                    <td style={{ padding: '12px', color: '#1f2937', fontWeight: '500' }}>
                      {request.user?.organizerName || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', color: '#374151' }}>
                      {request.user?.email || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', color: '#374151', maxWidth: '250px' }}>
                      <div style={{ 
                        maxHeight: '60px', 
                        overflowY: 'auto',
                        fontSize: '13px',
                        lineHeight: '1.4'
                      }}>
                        {request.reason}
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: '#374151' }}>
                      {new Date(request.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {request.status === 'pending' && (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Clock size={14} />
                          Pending
                        </span>
                      )}
                      {request.status === 'approved' && (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle size={14} />
                          Approved
                        </span>
                      )}
                      {request.status === 'rejected' && (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <XCircle size={14} />
                          Rejected
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {request.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleApprovePasswordReset(request._id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => openResetRejectModal(request)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#6c757d' }}>
                          {request.status === 'approved' && (
                            <span>✓ Approved</span>
                          )}
                          {request.status === 'rejected' && request.adminComments && (
                            <div>
                              <strong>Rejected:</strong>
                              <div style={{ marginTop: '4px', color: '#dc3545' }}>
                                {request.adminComments}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Change Requests Section */}
      <div style={{ 
        backgroundColor: 'white',
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '30px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Key size={24} />
          Password Change Requests
        </h2>

        {requestsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading password change requests...
          </div>
        ) : passwordChangeRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No password change requests found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Organizer</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Requested On</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {passwordChangeRequests.map((request) => (
                  <tr 
                    key={request._id}
                    style={{ 
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: request.status === 'pending' 
                        ? '#fff9e6' 
                        : request.status === 'approved' 
                        ? '#e8f5e9' 
                        : '#ffebee'
                    }}
                  >
                    <td style={{ padding: '12px', color: '#1f2937', fontWeight: '500' }}>
                      {request.organizer?.organizerName || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', color: '#374151' }}>
                      {request.organizer?.email || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', color: '#374151' }}>
                      {new Date(request.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {request.status === 'pending' && (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Clock size={14} />
                          Pending
                        </span>
                      )}
                      {request.status === 'approved' && (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle size={14} />
                          Approved
                        </span>
                      )}
                      {request.status === 'rejected' && (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <XCircle size={14} />
                          Rejected
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {request.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleApprovePasswordChange(request._id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(request)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#6c757d', fontSize: '12px' }}>
                          {request.status === 'approved' ? 'Approved' : `Rejected: ${request.rejectionComment}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
          </>
        )}

      </div>{/* End Main Content */}

      {/* Modal */}
      {showModal && (
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
            maxWidth: '500px',
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
              <h2 style={{ margin: 0 }}>Provision New Organizer</h2>
              <button 
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div style={{
                padding: '10px',
                marginBottom: '15px',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '4px',
                color: '#721c24',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {/* Success View - Show Only When Credentials Generated */}
            {generatedCredentials ? (
              <div>
                <div style={{
                  padding: '20px',
                  marginBottom: '20px',
                  backgroundColor: '#d4edda',
                  border: '2px solid #28a745',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>✓</div>
                  <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>
                    Organizer Provisioned Successfully!
                  </h3>
                  
                  <div style={{
                    backgroundColor: 'white',
                    padding: '15px',
                    borderRadius: '6px',
                    marginTop: '15px',
                    textAlign: 'left'
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: '#666',
                        marginBottom: '4px',
                        fontWeight: '600'
                      }}>
                        EMAIL
                      </label>
                      <div style={{ 
                        padding: '8px 12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        color: '#333'
                      }}>
                        {generatedCredentials.email}
                      </div>
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '12px', 
                        color: '#666',
                        marginBottom: '4px',
                        fontWeight: '600'
                      }}>
                        TEMPORARY PASSWORD
                      </label>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{ 
                          flex: 1,
                          padding: '8px 12px',
                          backgroundColor: '#fff3cd',
                          border: '2px solid #ffc107',
                          borderRadius: '4px',
                          fontSize: '16px',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          color: '#856404',
                          letterSpacing: '1px'
                        }}>
                          {generatedCredentials.temporaryPassword}
                        </div>
                        <button
                          onClick={() => copyToClipboard(generatedCredentials.temporaryPassword)}
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <p style={{ 
                    margin: '15px 0 0 0', 
                    fontSize: '13px',
                    color: '#856404',
                    backgroundColor: '#fff3cd',
                    padding: '10px',
                    borderRadius: '4px'
                  }}>
                    ⚠️ {generatedCredentials.note || 'Please share these credentials securely with the organizer. They must change this password on first login.'}
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              /* Form View - Show Only When No Credentials Yet */
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    First Name <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    required
                    disabled={formLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: formLoading ? '#f8f9fa' : 'white',
                      color: '#333'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Last Name <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    required
                    disabled={formLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: formLoading ? '#f8f9fa' : 'white',
                      color: '#333'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Email <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g., codingclub@iiit.ac.in"
                    required
                    disabled={formLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: formLoading ? '#f8f9fa' : 'white',
                      color: '#333'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Organizer Name (Club/Organization) <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="organizerName"
                    value={formData.organizerName}
                    onChange={handleInputChange}
                    placeholder="e.g., Coding Club, Dance Society"
                    required
                    disabled={formLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: formLoading ? '#f8f9fa' : 'white',
                      color: '#333'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Category <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    disabled={formLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: formLoading ? '#f8f9fa' : 'white',
                      cursor: formLoading ? 'not-allowed' : 'pointer',
                      color: '#333'
                    }}
                  >
                    <option value="">Select a category</option>
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description about the club/organization"
                    rows="3"
                    disabled={formLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical',
                      backgroundColor: formLoading ? '#f8f9fa' : 'white',
                      color: '#333'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder="Leave empty to use primary email"
                    disabled={formLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: formLoading ? '#f8f9fa' : 'white',
                      color: '#333'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={formLoading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: formLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: formLoading ? 0.6 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: formLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: formLoading ? 0.6 : 1
                    }}
                  >
                    {formLoading ? 'Provisioning...' : 'Provision Organizer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && selectedOrganizer && (
        <div 
          style={{
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
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeConfirmModal();
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            position: 'relative'
          }}>
            {(() => {
              const confirmation = getActionConfirmation(confirmAction.type);
              const IconComponent = confirmation.icon;
              
              return (
                <>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <IconComponent 
                      size={32} 
                      style={{ color: confirmation.color }} 
                    />
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {confirmation.title}
                    </h3>
                  </div>

                  <div style={{ 
                    marginBottom: '24px',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    borderLeft: `4px solid ${confirmation.color}`
                  }}>
                    <p style={{ 
                      margin: '0 0 12px 0', 
                      fontSize: '14px',
                      color: '#374151',
                      lineHeight: '1.5'
                    }}>
                      {confirmation.message}
                    </p>
                    <div style={{
                      padding: '8px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}>
                      <strong>Organizer:</strong> {selectedOrganizer.organizerName}<br />
                      <strong>Email:</strong> {selectedOrganizer.email}<br />
                      <strong>Status:</strong> {selectedOrganizer.accountStatus}
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'flex-end' 
                  }}>
                    <button
                      onClick={closeConfirmModal}
                      disabled={formLoading}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: formLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        opacity: formLoading ? 0.6 : 1
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmedAction}
                      disabled={formLoading}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: confirmation.color,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: formLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        opacity: formLoading ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <IconComponent size={16} />
                      {formLoading ? 'Processing...' : confirmation.buttonText}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Reject Password Change Modal */}
      {showRejectModal && selectedRequest && (
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
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <XCircle size={24} color="#dc3545" />
                Reject Password Change Request
              </h2>
              <button
                onClick={closeRejectModal}
                disabled={rejectLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: rejectLoading ? 'not-allowed' : 'pointer',
                  fontSize: '24px',
                  color: '#333'
                }}
              >
                ×
              </button>
            </div>

            <div style={{
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#856404'
            }}>
              <strong>Organizer:</strong> {selectedRequest.organizer?.organizerName}<br />
              <strong>Email:</strong> {selectedRequest.organizer?.email}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                Rejection Comment <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <textarea
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="Provide a reason for rejecting this password change request..."
                disabled={rejectLoading}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#1f2937',
                  backgroundColor: rejectLoading ? '#f8f9fa' : 'white',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <small style={{ color: '#6c757d', fontSize: '12px' }}>
                This comment will be visible to the organizer
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeRejectModal}
                disabled={rejectLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: rejectLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: rejectLoading ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPasswordChange}
                disabled={rejectLoading || !rejectionComment.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: rejectLoading || !rejectionComment.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: rejectLoading || !rejectionComment.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <XCircle size={16} />
                {rejectLoading ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Rejection Modal */}
      {showResetRejectModal && selectedResetRequest && (
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
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <XCircle size={24} color="#dc3545" />
              Reject Password Reset Request
            </h2>

            <div style={{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <strong>Organizer:</strong> {selectedResetRequest.user?.organizerName}<br />
              <strong>Email:</strong> {selectedResetRequest.user?.email}<br />
              <strong>Reason:</strong> {selectedResetRequest.reason}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151',
                fontSize: '14px'
              }}>
                Admin Comment (Required) <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <textarea
                value={resetRejectionComment}
                onChange={(e) => setResetRejectionComment(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                disabled={resetRejectLoading}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '10px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  backgroundColor: resetRejectLoading ? '#f8f9fa' : 'white'
                }}
              />
              <small style={{ color: '#6c757d', fontSize: '12px' }}>
                This comment will be visible to the organizer
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeResetRejectModal}
                disabled={resetRejectLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: resetRejectLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: resetRejectLoading ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPasswordReset}
                disabled={resetRejectLoading || !resetRejectionComment.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: resetRejectLoading || !resetRejectionComment.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: resetRejectLoading || !resetRejectionComment.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <XCircle size={16} />
                {resetRejectLoading ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Password Modal */}
      {showPasswordModal && generatedPassword && (
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
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={24} color="#28a745" />
              Password Reset Approved
            </h2>

            <div style={{
              padding: '16px',
              backgroundColor: '#fff3cd',
              border: '2px solid #ffc107',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: '600', color: '#856404', fontSize: '14px' }}>
                ⚠️ Important: Copy these credentials now!
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#856404' }}>
                This password will only be shown once. Share it securely with the organizer.
              </p>
            </div>

            <div style={{
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#6c757d', marginBottom: '4px', fontWeight: '600' }}>
                  ORGANIZER NAME
                </label>
                <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>
                  {generatedPassword.organizerName}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#6c757d', marginBottom: '4px', fontWeight: '600' }}>
                  EMAIL
                </label>
                <div style={{ fontSize: '15px', color: '#1f2937', fontWeight: '500' }}>
                  {generatedPassword.email}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#6c757d', marginBottom: '4px', fontWeight: '600' }}>
                  TEMPORARY PASSWORD
                </label>
                <div style={{ 
                  fontSize: '18px', 
                  color: '#dc3545', 
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  backgroundColor: 'white',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '2px dashed #dc3545',
                  letterSpacing: '2px'
                }}>
                  {generatedPassword.temporaryPassword}
                </div>
              </div>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#e3f2fd',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#1565c0'
            }}>
              <strong>Note:</strong> {generatedPassword.note}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${generatedPassword.email}\\nPassword: ${generatedPassword.temporaryPassword}`);
                  setSuccessMessage('Credentials copied to clipboard!');
                  setTimeout(() => setSuccessMessage(''), 2000);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                📋 Copy to Clipboard
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setGeneratedPassword(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
