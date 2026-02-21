import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Home } from 'lucide-react';

const NotAuthorized = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    if (user?.role === 'Admin') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'Organizer') {
      navigate('/organizer/dashboard');
    } else if (user?.role === 'Participant') {
      navigate('/participant/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '500px'
      }}>
        <ShieldAlert size={80} style={{ color: '#dc3545', marginBottom: '20px' }} />
        
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#dc3545',
          margin: '0 0 15px 0'
        }}>
          Access Denied
        </h1>
        
        <p style={{ 
          fontSize: '18px', 
          color: '#666',
          margin: '0 0 10px 0'
        }}>
          You do not have permission to access this page.
        </p>
        
        <p style={{ 
          fontSize: '14px', 
          color: '#999',
          margin: '0 0 30px 0'
        }}>
          {user ? (
            <>Your current role is <strong>{user.role}</strong>. This page requires different permissions.</>
          ) : (
            <>Please log in with an account that has the required permissions.</>
          )}
        </p>

        <button
          onClick={handleGoToDashboard}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            textDecoration: 'none'
          }}
        >
          <Home size={20} />
          Go to My Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotAuthorized;
