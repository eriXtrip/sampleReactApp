// SAMPLEREACTAPP/contexts/UserContext.jsx

import { createContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from 'expo-secure-store';
import { UserService } from '../local-database/services/userService';
import { useSQLiteContext } from 'expo-sqlite';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [registrationData, setRegistrationData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const API_URL = "http://192.168.0.116:3001/api";
  const db = useSQLiteContext();

  // Initialize database service
  useEffect(() => {
    const initializeDatabase = async () => {
      if (!db) return;
      
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            email TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            role_id INTEGER,
            lrn TEXT,
            teacher_id INTEGER,
            token TEXT,
            last_sync TEXT
          )
        `);
        UserService.setDatabase(db);
        setDbInitialized(true);
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Database initialization error:', error);
        setDbInitialized(true); // Continue anyway
      }
    };

    initializeDatabase();
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
        middle_name: data.user.middleName || null,
        last_name: data.user.lastName,
        suffix: data.user.suffix || null,
        birth_date: data.user.birthDate,
        gender: data.user.gender,
        role_id: data.user.role, // This should be the numeric role_id from server
        lrn: data.user.lrn || null,
        teacher_id: data.user.teacherId || null
      };

    

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
  const loadUserSession = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Attempting to load user session...');
      
      const token = await SecureStore.getItemAsync('authToken');
      console.log('Auth token exists:', !!token);
      
      if (!token) {
        console.log('No token found - no active session');
        setUser(null);
        return;
      }

      // Only proceed if database is initialized
      if (!UserService.db) {
        console.log('Database not initialized - skipping session load');
        return;
      }

      // Direct query without retries since DB is confirmed ready
      const dbUser = await UserService.getCurrentUser();
      console.log('User from local DB:', dbUser);

      if (dbUser) {
        setUser(dbUser);
      } else {
        console.log('No user found in database, checking SecureStore backup...');
        const backup = await SecureStore.getItemAsync('userData');
        if (backup) {
          const parsed = JSON.parse(backup);
          console.log('Restoring from SecureStore backup:', parsed);
          setUser(parsed);
          // Queue async sync without waiting
          UserService.syncUser(parsed, token).catch(e => 
            console.warn('Background sync failed:', e)
          );
        }
      }
    } catch (error) {
      console.error('Session load error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load session when db is ready or on mount
  useEffect(() => {
    if (dbInitialized) {
      loadUserSession();
    }
  }, [dbInitialized, loadUserSession]);

  const logout = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      await Promise.all([
        SecureStore.deleteItemAsync('authToken'),
        SecureStore.deleteItemAsync('userData'),
        UserService.clearUserData()
      ]);
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const verifyTokenSilently = async (token, email) => {
    try {
      await fetch(`${API_URL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
    } catch (error) {
      console.warn('Background verification failed:', error);
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
      completePasswordReset,
      verifyTokenSilently,
      clearAuthData,
      loadUserSession
    }}>
      {children}
    </UserContext.Provider>
  );
}