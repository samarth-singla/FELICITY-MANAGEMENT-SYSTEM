import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import { Star, Filter, MessageSquare, TrendingUp, Users, Loader, AlertCircle } from 'lucide-react';

const EventFeedbackView = ({ eventId }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRating, setFilterRating] = useState('all');

  useEffect(() => {
    if (eventId) {
      fetchFeedback();
    }
  }, [eventId, filterRating]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const params = filterRating !== 'all' ? { rating: filterRating } : {};
      const response = await axios.get(`/api/events/${eventId}/feedback`, { params });
      setFeedbacks(response.data.data);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err.response?.data?.error || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, size = 16) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={star <= rating ? '#fbbf24' : 'none'}
            color={star <= rating ? '#fbbf24' : '#d1d5db'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        <Loader size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        <p>Loading feedback...</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginTop: '2rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <MessageSquare size={24} color="#667eea" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
          Event Feedback
        </h2>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '6px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Statistics */}
      {stats && stats.totalFeedbacks > 0 && (
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {/* Average Rating */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={18} color="#667eea" />
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Average Rating</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem', fontWeight: '700', color: '#111827' }}>
                  {stats.averageRating.toFixed(1)}
                </span>
                {renderStars(Math.round(stats.averageRating), 20)}
              </div>
            </div>

            {/* Total Feedbacks */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Users size={18} color="#667eea" />
                <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Total Feedbacks</span>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: '700', color: '#111827' }}>
                {stats.totalFeedbacks}
              </span>
            </div>
          </div>

          {/* Rating Distribution */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
              Rating Distribution
            </h4>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating] || 0;
              const percentage = stats.totalFeedbacks > 0 ? (count / stats.totalFeedbacks) * 100 : 0;
              return (
                <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151', minWidth: '50px' }}>
                    {rating} Star
                  </span>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      backgroundColor: '#fbbf24',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '14px', color: '#6b7280', minWidth: '60px', textAlign: 'right' }}>
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
          <Filter size={16} />
          Filter by Rating
        </label>
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '2px dashed #e5e7eb'
        }}>
          <MessageSquare size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
            No feedback yet
          </h3>
          <p style={{ color: '#6b7280' }}>
            {filterRating !== 'all' ? 'No feedback with this rating' : 'Feedback will appear here once participants submit them'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {feedbacks.map((feedback) => (
            <div
              key={feedback._id}
              style={{
                padding: '1rem',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  {renderStars(feedback.rating, 18)}
                  <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    {feedback.rating}.0
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </span>
              </div>
              {feedback.comment && (
                <p style={{
                  color: '#374151',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {feedback.comment}
                </p>
              )}
              {!feedback.comment && (
                <p style={{ color: '#9ca3af', fontSize: '14px', fontStyle: 'italic', margin: 0 }}>
                  No comment provided
                </p>
              )}
            </div>
          ))}
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

export default EventFeedbackView;
