import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';
import io from 'socket.io-client';
import {
  MessageCircle,
  Send,
  Pin,
  Trash2,
  ThumbsUp,
  Heart,
  Lightbulb,
  Sparkles,
  Reply,
  AlertCircle,
  Loader,
  Megaphone,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const EventForum = ({ eventId, isRegistered, isOrganizer }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('message');
  const [replyTo, setReplyTo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [newMessageNotification, setNewMessageNotification] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchMessages();
      setupSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave:event', eventId);
        socketRef.current.disconnect();
      }
    };
  }, [eventId]);

  const setupSocket = () => {
    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current.emit('join:event', eventId);
    });

    socketRef.current.on('forum:newMessage', ({ message }) => {
      setMessages(prev => [message, ...prev]);
      setNewMessageNotification(true);
      setTimeout(() => setNewMessageNotification(false), 3000);
    });

    socketRef.current.on('forum:messageUpdated', ({ messageId, isPinned }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, isPinned } : msg
      ));
    });

    socketRef.current.on('forum:messageDeleted', ({ messageId }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, isDeleted: true } : msg
      ));
    });

    socketRef.current.on('forum:reactionUpdated', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, reactions } : msg
      ));
    });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/events/${eventId}/forum`);
      setMessages(response.data.data);
    } catch (err) {
      console.error('Error fetching forum messages:', err);
      setError('Failed to load forum messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    if (!user) {
      setError('Please login to post messages');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post(`/api/events/${eventId}/forum`, {
        content: messageText,
        messageType,
        parentMessageId: replyTo?._id
      });

      setMessageText('');
      setReplyTo(null);
      setMessageType('message');
      setSuccess('Message posted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error posting message:', err);
      setError(err.response?.data?.error || 'Failed to post message');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (messageId) => {
    try {
      await axios.put(`/api/events/${eventId}/forum/${messageId}/pin`);
    } catch (err) {
      console.error('Error toggling pin:', err);
      setError(err.response?.data?.error || 'Failed to pin/unpin message');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await axios.delete(`/api/events/${eventId}/forum/${messageId}`);
      setSuccess('Message deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err.response?.data?.error || 'Failed to delete message');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleReaction = async (messageId, reactionType) => {
    if (!user) {
      setError('Please login to react to messages');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      await axios.post(`/api/events/${eventId}/forum/${messageId}/react`, {
        reactionType
      });
    } catch (err) {
      console.error('Error reacting to message:', err);
      setError(err.response?.data?.error || 'Failed to add reaction');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getReactionIcon = (type) => {
    switch (type) {
      case 'like': return <ThumbsUp size={14} />;
      case 'love': return <Heart size={14} />;
      case 'helpful': return <Lightbulb size={14} />;
      case 'celebrate': return <Sparkles size={14} />;
      default: return null;
    }
  };

  const getReactionCount = (message, reactionType) => {
    return message.reactions?.filter(r => r.type === reactionType).length || 0;
  };

  const hasUserReacted = (message, reactionType) => {
    if (!user) return false;
    return message.reactions?.some(r => r.user._id === user.id && r.type === reactionType);
  };

  const toggleExpandMessage = (messageId) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const renderMessage = (message, isReply = false) => {
    if (message.isDeleted && !isOrganizer) return null;

    return (
      <div
        key={message._id}
        style={{
          marginBottom: isReply ? '0.75rem' : '1rem',
          marginLeft: isReply ? '2rem' : '0',
          padding: '1rem',
          backgroundColor: message.isPinned ? '#fef3c7' : message.messageType === 'announcement' ? '#dbeafe' : 'white',
          border: `2px solid ${message.isPinned ? '#f59e0b' : message.messageType === 'announcement' ? '#3b82f6' : '#e5e7eb'}`,
          borderRadius: '8px',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '600', color: '#111827' }}>
                {message.author?.firstName} {message.author?.lastName}
              </span>
              {message.authorRole === 'organizer' && (
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  borderRadius: '4px',
                  fontWeight: '600'
                }}>
                  ORGANIZER
                </span>
              )}
              {message.messageType === 'announcement' && (
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '4px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Megaphone size={10} />
                  ANNOUNCEMENT
                </span>
              )}
              {message.isPinned && (
                <Pin size={14} color="#f59e0b" fill="#f59e0b" />
              )}
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {new Date(message.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Actions */}
          {(isOrganizer || (user && message.author._id === user.id)) && !message.isDeleted && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {isOrganizer && (
                <button
                  onClick={() => handleTogglePin(message._id)}
                  style={{
                    padding: '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: message.isPinned ? '#f59e0b' : '#6b7280'
                  }}
                  title={message.isPinned ? 'Unpin' : 'Pin'}
                >
                  <Pin size={16} fill={message.isPinned ? '#f59e0b' : 'none'} />
                </button>
              )}
              <button
                onClick={() => handleDeleteMessage(message._id)}
                style={{
                  padding: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ef4444'
                }}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {message.isDeleted ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '14px' }}>
            [Message deleted]
          </p>
        ) : (
          <>
            {message.parentMessage && !isReply && (
              <div style={{
                padding: '8px',
                backgroundColor: '#f3f4f6',
                borderLeft: '3px solid #9ca3af',
                marginBottom: '0.5rem',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                <strong>Replying to {message.parentMessage.author?.firstName}:</strong>
                <p style={{ margin: '4px 0 0 0' }}>{message.parentMessage.content.substring(0, 100)}...</p>
              </div>
            )}
            <p style={{ color: '#374151', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>
              {message.content}
            </p>

            {/* Reactions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {['like', 'love', 'helpful', 'celebrate'].map(reactionType => {
                const count = getReactionCount(message, reactionType);
                const hasReacted = hasUserReacted(message, reactionType);
                return (
                  <button
                    key={reactionType}
                    onClick={() => handleReaction(message._id, reactionType)}
                    disabled={!user || (!isRegistered && !isOrganizer)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: hasReacted ? '#dbeafe' : 'white',
                      border: `1px solid ${hasReacted ? '#3b82f6' : '#d1d5db'}`,
                      borderRadius: '16px',
                      cursor: (user && (isRegistered || isOrganizer)) ? 'pointer' : 'not-allowed',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: hasReacted ? '#1e40af' : '#6b7280',
                      opacity: (user && (isRegistered || isOrganizer)) ? 1 : 0.6
                    }}
                  >
                    {getReactionIcon(reactionType)}
                    {count > 0 && <span>{count}</span>}
                  </button>
                );
              })}

              {/* Reply Button */}
              {!isReply && user && (isRegistered || isOrganizer) && (
                <button
                  onClick={() => {
                    setReplyTo(message);
                    setMessageType('message');
                  }}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#6b7280',
                    marginLeft: 'auto'
                  }}
                >
                  <Reply size={14} />
                  Reply
                </button>
              )}
            </div>
          </>
        )}

        {/* Show Replies */}
        {!isReply && message.replies && message.replies.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => toggleExpandMessage(message._id)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {expandedMessages.has(message._id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {message.replies.length} {message.replies.length === 1 ? 'Reply' : 'Replies'}
            </button>

            {expandedMessages.has(message._id) && (
              <div style={{ marginTop: '0.75rem' }}>
                {messages.filter(m => m.parentMessage?._id === message._id).map(reply => (
                  renderMessage(reply, true)
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const canPost = user && (isRegistered || isOrganizer);

  // Sort messages: pinned first, then by date
  const sortedMessages = [...messages].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Filter top-level messages (not replies)
  const topLevelMessages = sortedMessages.filter(m => !m.parentMessage);

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
        <MessageCircle size={24} color="#667eea" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
          Discussion Forum
        </h2>
        {newMessageNotification && (
          <span style={{
            fontSize: '12px',
            padding: '4px 8px',
            backgroundColor: '#10b981',
            color: 'white',
            borderRadius: '12px',
            fontWeight: '600',
            animation: 'pulse 1s ease-in-out'
          }}>
            New Message
          </span>
        )}
      </div>

      {/* Notifications */}
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

      {success && (
        <div style={{
          padding: '12px',
          backgroundColor: '#d1fae5',
          color: '#065f46',
          borderRadius: '6px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <MessageCircle size={16} />
          {success}
        </div>
      )}

      {/* Post Message Form */}
      {canPost ? (
        <form onSubmit={handleSendMessage} style={{ marginBottom: '1.5rem' }}>
          {replyTo && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              marginBottom: '8px',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                <strong>Replying to {replyTo.author.firstName}:</strong> {replyTo.content.substring(0, 50)}...
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            </div>
          )}

          {isOrganizer && !replyTo && (
            <div style={{ marginBottom: '8px', display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="message"
                  checked={messageType === 'message'}
                  onChange={(e) => setMessageType(e.target.value)}
                />
                Regular Message
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="announcement"
                  checked={messageType === 'announcement'}
                  onChange={(e) => setMessageType(e.target.value)}
                />
                <Megaphone size={14} />
                Announcement
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={replyTo ? "Write your reply..." : "Share your thoughts, ask questions..."}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <button
              type="submit"
              disabled={submitting || !messageText.trim()}
              style={{
                padding: '12px 20px',
                backgroundColor: submitting || !messageText.trim() ? '#9ca3af' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting || !messageText.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600',
                fontSize: '14px',
                height: 'fit-content'
              }}
            >
              {submitting ? <Loader size={16} /> : <Send size={16} />}
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{
          padding: '16px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          {user ? 'You must be registered for this event to participate in the forum' : 'Please login and register for this event to participate in the forum'}
        </div>
      )}

      {/* Messages List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p>Loading messages...</p>
        </div>
      ) : topLevelMessages.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '2px dashed #e5e7eb'
        }}>
          <MessageCircle size={48} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
            No messages yet
          </h3>
          <p style={{ color: '#6b7280' }}>
            Be the first to start the conversation!
          </p>
        </div>
      ) : (
        <div>
          {topLevelMessages.map(message => renderMessage(message))}
        </div>
      )}

      <div ref={messagesEndRef} />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default EventForum;
