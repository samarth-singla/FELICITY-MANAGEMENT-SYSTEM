import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import { Users, Heart, Search, Building2, Tag, FileText, TrendingUp } from 'lucide-react';

const OrganizersList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [updating, setUpdating] = useState(false);

  const categories = [
    'All',
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
    fetchOrganizers();
    fetchUserPreferences();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/organizers', {
        params: { status: 'approved' }
      });
      setOrganizers(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching organizers:', err);
      setError('Failed to load organizers');
      setLoading(false);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await axios.get('/api/users/me');
      const following = response.data.data.preferences?.following || [];
      setFollowedOrganizers(
        following.map(f => typeof f === 'object' ? f._id : f)
      );
    } catch (err) {
      console.error('Error fetching preferences:', err);
    }
  };

  const handleToggleFollow = async (organizerId) => {
    if (updating) return;

    setUpdating(true);
    const isFollowing = followedOrganizers.includes(organizerId);
    
    const newFollowing = isFollowing
      ? followedOrganizers.filter(id => id !== organizerId)
      : [...followedOrganizers, organizerId];

    // Optimistic update
    setFollowedOrganizers(newFollowing);

    try {
      await axios.put('/api/users/preferences', {
        following: newFollowing
      });
      setUpdating(false);
    } catch (err) {
      console.error('Error updating preferences:', err);
      // Revert on error
      setFollowedOrganizers(followedOrganizers);
      setError('Failed to update preferences');
      setUpdating(false);
    }
  };

  const filteredOrganizers = organizers.filter(org => {
    const matchesSearch = org.organizerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || org.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <p style={{ color: '#666' }}>Loading clubs...</p>
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
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '36px',
            color: '#333',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <Building2 size={40} />
            Clubs & Organizers
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#666',
            margin: 0
          }}>
            Discover and follow your favorite event organizers
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {/* Search Bar */}
          <div style={{
            position: 'relative',
            marginBottom: '20px'
          }}>
            <Search
              size={20}
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
              placeholder="Search clubs by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              color: '#666',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <Tag size={16} />
              Filter by Category
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: selectedCategory === category ? '#667eea' : 'white',
                    color: selectedCategory === category ? 'white' : '#333',
                    border: selectedCategory === category ? 'none' : '1px solid #dee2e6',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div style={{
          marginBottom: '20px',
          color: '#666',
          fontSize: '14px'
        }}>
          Found {filteredOrganizers.length} club{filteredOrganizers.length !== 1 ? 's' : ''}
        </div>

        {/* Organizers Grid */}
        {filteredOrganizers.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <Building2 size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
            <h3 style={{ color: '#666', fontSize: '18px', marginBottom: '8px' }}>
              No Clubs Found
            </h3>
            <p style={{ color: '#999', fontSize: '14px' }}>
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {filteredOrganizers.map(org => {
              const isFollowing = followedOrganizers.includes(org._id);
              
              return (
                <div
                  key={org._id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '24px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    border: isFollowing ? '2px solid #667eea' : '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                  onClick={() => navigate(`/organizers/${org._id}`)}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '20px',
                        color: '#333',
                        fontWeight: '600'
                      }}>
                        {org.organizerName}
                      </h3>
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: '#e7f3ff',
                        color: '#0066cc',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {org.category}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{
                    marginBottom: '16px',
                    minHeight: '60px'
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      color: '#666',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {org.description || 'No description available'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#666',
                      fontSize: '13px'
                    }}>
                      <TrendingUp size={16} />
                      <span>{org.eventsCount || 0} events</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#666',
                      fontSize: '13px'
                    }}>
                      <Users size={16} />
                      <span>{org.followersCount || 0} followers</span>
                    </div>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFollow(org._id);
                    }}
                    disabled={updating}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: isFollowing ? 'white' : '#667eea',
                      color: isFollowing ? '#667eea' : 'white',
                      border: isFollowing ? '2px solid #667eea' : 'none',
                      borderRadius: '6px',
                      cursor: updating ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      opacity: updating ? 0.6 : 1
                    }}
                  >
                    <Heart
                      size={16}
                      fill={isFollowing ? '#667eea' : 'none'}
                    />
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OrganizersList;
