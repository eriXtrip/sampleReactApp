// SAMPLEREACTAPP/contexts/UserContext.jsx
import { createContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from 'expo-secure-store';
import { UserService } from '../local-database/services/userService';
import { useSQLiteContext } from 'expo-sqlite';
import { initializeDatabase } from '../local-database/services/database';
import { testServerConnection } from '../local-database/services/testServerConnection';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [registrationData, setRegistrationData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [serverReachable, setServerReachable] = useState(false);
  const API_URL = "http://192.168.0.100:3001/api";
  const db = useSQLiteContext();

  // Initialize database using database.js
  useEffect(() => {
    const initDb = async () => {
      if (!db) return;
      
      try {
        await initializeDatabase(db);
        UserService.setDatabase(db);
        setDbInitialized(true);
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Database initialization error:', error);
        setDbInitialized(true); // Continue anyway (consider revising)
      }
    };

    initDb();
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

  // Login function (updated for new schema)
  const login = async (email, password) => {
    try {
      setLoading(true);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error(data.error || 'Invalid email format.');
      }
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

      // Transform server data to match new SQLite schema
      const userDataForSync = {
        server_id: data.user.id,
        email: data.user.email,
        first_name: data.user.firstName, // Required field
        middle_name: data.user.middleName || 'N/A',
        last_name: data.user.lastName, // Required field
        suffix: data.user.suffix || 'N/A',
        birth_date: data.user.birthday,
        gender: data.user.gender,
        role_id: data.user.role, // Assumes server returns numeric role_id
        lrn: data.user.lrn || 'N/A',
        teacher_id: data.user.teacherId || "N/A"
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

      if (!UserService.db) {
        console.log('Database not initialized - skipping session load');
        return;
      }

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
      const initApp = async () => {
        await loadUserSession();
        const isReachable = await testServerConnection(API_URL); // Use the service
        setServerReachable(isReachable);
      };
      initApp();
    }
  }, [dbInitialized, loadUserSession]);

  // Cleanup on unmount if needed
  useEffect(() => {
    return () => {
      if (db) {
        db.closeAsync().catch(console.warn);
      }
    };
  }, [db]);

  const logout = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
          
      if (token) {
          const response = await fetch(`${API_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              }
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Logout failed');
          }
      }

      // 1. First clear SecureStore (no DB dependency)
      await Promise.all([
        SecureStore.deleteItemAsync('authToken'),
        SecureStore.deleteItemAsync('userData')
      ]);

      // 2. Only attempt DB operations if initialized
      if (dbInitialized) {
        try {
          await UserService.clearUserData();
        } catch (dbError) {
          console.warn('Non-critical DB clear error:', dbError);
          // Continue logout even if DB clear fails
        }
      }

      // 3. Update state last
      setUser(null);
      console.log('✅ Logout successful');
      
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed');
    }
  };

  const verifyTokenSilently = async (token, email) => {
      try {
          const response = await fetch(`${API_URL}/auth/verify-token`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email })
          });
          const data = await response.json();
          if (!data.valid) {
              await logout(); // Auto-logout if token is invalid
          }
      } catch (error) {
          console.warn('Background verification failed:', error);
          await logout(); // Auto-logout on error
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
      throw new Error(errorData.error || 'Failed to Reset Password');
    }
    
    return await response.json();
  };

  return (
    <UserContext.Provider value={{ 
      user,
      setUser,
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
      clearAuthData,
      verifyTokenSilently,
      loadUserSession,
      serverReachable,
      API_URL,
    }}>
      {children}
    </UserContext.Provider>
  );
}