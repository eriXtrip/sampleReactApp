// SAMPLEREACTAPP/contexts/UserContext.jsx

import { createContext, useState, useEffect } from "react";
import * as SecureStore from 'expo-secure-store';
import { UserService } from '../local-database/services/userService';
import { useSQLiteContext } from 'expo-sqlite';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [registrationData, setRegistrationData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = "http://192.168.0.107:3001/api";
  const db = useSQLiteContext();

  // Initialize database service
  useEffect(() => {
    if (db) {
      UserService.setDatabase(db);
    }
  }, [db]);

  // Registration functions (unchanged)
  const startRegistration = async (data) => {
    const response = await fetch(`${API_URL}/auth/start-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (response.ok) setRegistrationData(data);
    return result;
  };

  const verifyCode = async (email, code) => {
    const response = await fetch(`${API_URL}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    return await response.json();
  };

  const completeRegistration = async (data) => {
    const response = await fetch(`${API_URL}/auth/complete-registration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }
    
    return await response.json();
  };

  // Improved login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('Attempting login with:', { email });
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('Initial login response:', { 
        ok: response.ok, 
        userData: data.user,
        hasToken: !!data.token 
      });

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      // Transform server data to match SQLite schema
      const userDataForSync = {
        user_id: data.user.id,
        email: data.user.email,
        first_name: data.user.firstName,
        last_name: data.user.lastName,
        role_id: data.user.role, // This should be the numeric role_id from server
        lrn: data.user.lrn || null,
        teacher_id: data.user.teacherId || null
      };

      console.log('Data prepared for SQLite sync:', userDataForSync);

      // Store authentication data and sync to SQLite
      await Promise.all([
        SecureStore.setItemAsync('authToken', data.token),
        SecureStore.setItemAsync('userData', JSON.stringify(userDataForSync)),
        UserService.syncUser(userDataForSync, data.token)
      ]);
      
      setUser(userDataForSync);
      return { success: true, user: userDataForSync };

    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        stack: error.stack,
        fullError: JSON.stringify(error)
      });
      await clearAuthData();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Either remove it completely (if not needed) or fix the endpoint:
  // const fetchAdditionalUserData = async (token, userId) => {
  //   try {
  //     console.log('Fetching additional data for user:', userId);
  //     const response = await fetch(`${API_URL}/users/${userId}/details`, {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const data = await response.json();
  //     console.log('Additional user data:', data);
  //     return data;
  //   } catch (error) {
  //     console.error('Error fetching additional user data:', error);
  //     return {}; // Return empty object if additional data isn't critical
  //   }
  // };

  // Helper function to clear auth data
  const clearAuthData = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync('authToken'),
      SecureStore.deleteItemAsync('userData'),
      UserService.clearUserData()
    ]);
  };

  // Load user session on initial render
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (!token) {
          setLoading(false);
          return;
        }

        // First try to get user from SQLite
        const dbUser = await UserService.getCurrentUser();
        if (dbUser) {
          setUser(dbUser);
          setLoading(false);
          
          // Optional: Verify with server if token is still valid
          await verifyTokenWithServer(token, dbUser.user_id);
          return;
        }

        // Fallback to SecureStore if SQLite doesn't have user
        const userData = await SecureStore.getItemAsync('userData');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          // Sync to SQLite for next time
          await UserService.syncUser(parsedUser, token);
        }
      } catch (error) {
        console.error('Failed to load user session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserSession();
  }, []);

  // Verify token with server
  const verifyTokenWithServer = async (token, userId) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      await clearAuthData();
      setUser(null);
    }
  };

  // Improved logout function
  const logout = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('authToken');
      
      // Optional: Notify backend about logout
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(e => console.log('Logout notification failed:', e));
      }

      // Clear local authentication data
      await Promise.all([
        SecureStore.deleteItemAsync('authToken'),
        SecureStore.deleteItemAsync('userData')
      ]);
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const startPasswordReset = async (data) => {
    const response = await fetch(`${API_URL}/auth/start-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Account not found');
    }
    
    return await response.json();
  };

  const verifyResetCode = async (email, code) => {
    const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    return await response.json();
  };

  const completePasswordReset = async (data) => {
    const response = await fetch(`${API_URL}/auth/complete-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Faild to Reset Password');
    }
    
    return await response.json();
  };

  return (
    <UserContext.Provider value={{ 
      user,
      loading,
      registrationData,
      startRegistration,
      verifyCode,
      completeRegistration,
      login,
      logout,
      isAuthenticated,
      startPasswordReset,
      verifyResetCode,  
      completePasswordReset
    }}>
      {children}
    </UserContext.Provider>
  );
}