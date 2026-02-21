import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { token: authToken, user: userData } = response.data;

      // Store in state
      setToken(authToken);
      setUser(userData);

      // Persist to localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      // Check if Participant needs onboarding
      const needsOnboarding = 
        userData.role === 'Participant' && 
        (!userData.preferences?.interests || userData.preferences.interests.length === 0);

      return { success: true, user: userData, needsOnboarding };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Remove axios authorization header
    delete axios.defaults.headers.common['Authorization'];

    // Redirect to login page
    window.location.href = '/login';
  };

  // Register function (optional, for convenience)
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);

      const { token: authToken, user: registeredUser } = response.data;

      // Store in state
      setToken(authToken);
      setUser(registeredUser);

      // Persist to localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(registeredUser));

      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      return { success: true, user: registeredUser };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    hasRole,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
