import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { Check, X, ChevronRight, SkipForward } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [organizers, setOrganizers] = useState([]);
  const [organizersLoading, setOrganizersLoading] = useState(true);

  // User selections
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState([]);
  const [customInterest, setCustomInterest] = useState('');

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

  // Fetch organizers on component mount
  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setOrganizersLoading(true);
      // Use the new user-accessible route with JWT token
      const response = await axios.get('/api/users/organizers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setOrganizers(response.data.data);
      setOrganizersLoading(false);
    } catch (err) {
      console.error('Error fetching organizers:', err);
      setError('Failed to load organizers');
      setOrganizersLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const addCustomInterest = () => {
    const trimmedInterest = customInterest.trim();
    if (trimmedInterest && !selectedInterests.includes(trimmedInterest)) {
      setSelectedInterests([...selectedInterests, trimmedInterest]);
      setCustomInterest('');
    }
  };

  const removeInterest = (interest) => {
    setSelectedInterests(selectedInterests.filter(i => i !== interest));
  };

  const toggleOrganizer = (organizerId) => {
    if (selectedOrganizers.includes(organizerId)) {
      setSelectedOrganizers(selectedOrganizers.filter(id => id !== organizerId));
    } else {
      setSelectedOrganizers([...selectedOrganizers, organizerId]);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      handleFinish();
    }
  };

  const handleSkip = async () => {
    // Skip to dashboard without saving preferences
    navigate('/participant/dashboard');
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.put('/api/users/preferences', {
        interests: selectedInterests,
        following: selectedOrganizers
      });

      // Redirect to participant dashboard
      navigate('/participant/dashboard');
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err.response?.data?.error || 'Failed to save preferences');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        width: '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '30px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>
            Welcome to Felicity, {user?.firstName}!
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
            Let's personalize your experience
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 1 ? '#667eea' : '#e9ecef',
              color: currentStep >= 1 ? 'white' : '#6c757d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              {currentStep > 1 ? <Check size={20} /> : '1'}
            </div>
            <span style={{
              color: '#333',
              fontWeight: currentStep === 1 ? 'bold' : 'normal',
              fontSize: '14px'
            }}>
              Interests
            </span>

            <div style={{
              width: '40px',
              height: '2px',
              backgroundColor: currentStep >= 2 ? '#667eea' : '#e9ecef'
            }} />

            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 2 ? '#667eea' : '#e9ecef',
              color: currentStep >= 2 ? 'white' : '#6c757d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              2
            </div>
            <span style={{
              color: '#333',
              fontWeight: currentStep === 2 ? 'bold' : 'normal',
              fontSize: '14px'
            }}>
              Follow Clubs
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '30px' }}>
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

          {/* Step 1: Select Interests */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ color: '#333', marginTop: 0, marginBottom: '10px' }}>
                What are your interests?
              </h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Select topics you're interested in. This helps us recommend relevant events.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {availableInterests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    style={{
                      padding: '12px 16px',
                      border: selectedInterests.includes(interest)
                        ? '2px solid #667eea'
                        : '2px solid #dee2e6',
                      backgroundColor: selectedInterests.includes(interest)
                        ? '#f0f4ff'
                        : 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: selectedInterests.includes(interest)
                        ? '#667eea'
                        : '#333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {selectedInterests.includes(interest) && (
                      <Check size={16} />
                    )}
                    {interest}
                  </button>
                ))}
              </div>

              {/* Custom Interest Input */}
              <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  Add Custom Interest:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomInterest()}
                    placeholder="Enter a custom interest..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '2px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomInterest}
                    disabled={!customInterest.trim()}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: customInterest.trim() ? '#667eea' : '#dee2e6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: customInterest.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Selected Interests Display */}
              {selectedInterests.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '10px' }}>
                    Selected Interests ({selectedInterests.length}):
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedInterests.map((interest) => (
                      <div
                        key={interest}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: '#667eea',
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        {interest}
                        <button
                          onClick={() => removeInterest(interest)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '2px'
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Follow Organizers */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ color: '#333', marginTop: 0, marginBottom: '10px' }}>
                Follow Your Favorite Clubs
              </h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Stay updated with events from clubs you're interested in.
              </p>

              {organizersLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
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
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '4px'
                }}>
                  {organizers.map((org) => (
                    <div
                      key={org._id}
                      onClick={() => toggleOrganizer(org._id)}
                      style={{
                        padding: '16px',
                        border: selectedOrganizers.includes(org._id)
                          ? '2px solid #667eea'
                          : '2px solid #dee2e6',
                        backgroundColor: selectedOrganizers.includes(org._id)
                          ? '#f0f4ff'
                          : 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative'
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

              <p style={{
                color: '#999',
                fontSize: '13px',
                fontStyle: 'italic',
                marginTop: '16px'
              }}>
                Following: {selectedOrganizers.length} club{selectedOrganizers.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '20px 30px',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handleSkip}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: 'transparent',
              color: '#6c757d',
              border: '1px solid #6c757d',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: loading ? 0.6 : 1
            }}
          >
            <SkipForward size={18} />
            Skip for now
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#333',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: loading ? 0.6 : 1
                }}
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Saving...' : currentStep === 1 ? 'Next' : 'Finish'}
              {!loading && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
