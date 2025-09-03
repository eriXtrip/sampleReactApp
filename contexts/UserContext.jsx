// SAMPLEREACTAPP/contexts/UserContext.jsx  to create apk: eas build --platform android --profile preview
import { createContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from 'expo-secure-store';
import { UserService } from '../local-database/services/userService';
import { useSQLiteContext } from 'expo-sqlite';
import { initializeDatabase } from '../local-database/services/database';
import { testServerConnection } from '../local-database/services/testServerConnection';
import { triggerLocalNotification } from '../utils/notificationUtils';
import { getApiUrl } from '../utils/apiManager.js';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [registrationData, setRegistrationData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [serverReachable, setServerReachable] = useState(false);
  //const API_URL = "http://192.168.0.101:3001/api";
  const [API_URL, setApiUrl] = useState(null);
  const db = useSQLiteContext();

  useEffect(() => {
    (async () => {
      const url = await getApiUrl();
      setApiUrl(url);
      console.log('URL: ', url);
      
    })();
  }, []);

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

    await triggerLocalNotification('👋 Welcome Aboard!', `Your account has been created. Let's start the quest, ${data.first_name}!`);
    
    return await response.json();
  };

  // Login function (updated for new schema)
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
            status: response.status,
            userData: data.user,
            hasToken: !!data.token,
            error: data.error
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error(data.error);
            }
            throw new Error(data.error || 'Login failed. Please try again.');
        }

        // Transform server data to match new SQLite schema
        const userDataForSync = {
            server_id: data.user.id,
            email: data.user.email,
            first_name: data.user.firstName,
            middle_name: data.user.middleName || 'N/A',
            last_name: data.user.lastName,
            suffix: data.user.suffix || 'N/A',
            birth_date: data.user.birthday,
            gender: data.user.gender,
            role_id: data.user.role, // Fixed to match server response
            lrn: data.user.lrn || 'N/A',
            teacher_id: data.user.teacherId || 'N/A'
        };

        // Store authentication data and sync to SQLite
        await Promise.all([
            SecureStore.setItemAsync('authToken', data.token),
            SecureStore.setItemAsync('userData', JSON.stringify(userDataForSync)),
            UserService.syncUser(userDataForSync, data.token)
        ]);

        await triggerLocalNotification('✅ Login Successful', `Welcome back, ${userDataForSync.first_name}`);
        setUser(userDataForSync);
        return { success: true, user: userDataForSync };
    } catch (error) {
        await UserService.clearUserData();
        throw new Error(error.message); // Preserve specific error message
    } finally {
        setLoading(false);
    }
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

  const logout = async () => {
    console.log('🚪 Logging out...');

    // 0. Check server reachability first
    try {
      const isReachable = await testServerConnection(API_URL);
      if (!isReachable) {
        console.warn('❌ Server not reachable — aborting logout');
        return false; // <- explicitly return false if server is down
      }
    } catch (err) {
      console.error('❌ Error checking server reachability:', err);
      return false;
    }

    // 1. Wait if DB is still initializing
    if (!dbInitialized) {
      console.warn('⏳ Waiting for DB to finish initializing before logout...');
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    try {
      // 2. Clear SecureStore
      await Promise.all([
        SecureStore.deleteItemAsync('authToken'),
        SecureStore.deleteItemAsync('userData'),
      ]);
      console.log('🧹 SecureStore cleared');

      // 3. Clear local DB if available
      if (dbInitialized && UserService.db) {
        try {
          await UserService.clearUserData();
          console.log('🧹 Local DB user data cleared');
        } catch (dbError) {
          console.warn('⚠️ Failed to clear user data:', dbError);
        }
      } else {
        console.warn('⚠️ DB not ready — skipped clearing user data');
      }

      // 4. Clear React state
      setUser(null);
      console.log('✅ Logout successful');

      // 5. Close database connection safely
      try {
        if (UserService.db) {
          await UserService.db.closeAsync();
          console.log('🔒 Database closed after logout');
          UserService.db = null;
        }
      } catch (closeError) {
        console.warn('⚠️ Failed to close DB after logout:', closeError);
      }

      return true; // <- only return true if everything went fine

    } catch (logoutError) {
      console.error('❌ Logout failed:', logoutError);
      return false;
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
    await triggerLocalNotification('⚠️ Security Alert', 'A password reset was requested for your account.');
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
    await triggerLocalNotification('🔐 Password Changed', 'Your password was updated successfully.');
    return await response.json();
  };

  const changepassword = async (data) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_URL}/auth/change-password`;
    console.log('ChangePassword request:', { url, token, server_id: data.server_id, currentPassword: data.currentPassword, newPassword: data.newPassword });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        server_id: data.server_id,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', { status: response.status, url, text });
      throw new Error(`Expected JSON, received ${contentType || 'no content-type'}: ${text.slice(0, 100)}...`);
    }

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to change password');
    }
    await triggerLocalNotification('🔐 Password Changed', 'Your password was updated successfully.');
    return responseData;
  };

  // Vulnerable version (for testing SQL injection)
  const testVulnerableFunction = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/vulnerable-function`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        const text = await response.text(); // Read raw HTML/text
        throw new Error(`Server Error: ${response.status}\n${text}`);
      }

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('✅ Vulnerable Function Response:', data);
        return data;
      } else {
        const text = await response.text();
        console.warn('⚠️ Unexpected response:', text);
        throw new Error('Server did not return JSON');
      }

    } catch (error) {
      console.error('❌ Vulnerable test error:', error.message);
      return { error: error.message };
    }
  };

  // Secure version
  const testSecureFunction = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/secure-function`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('Secure Function Response:', data);
      return data;
    } catch (error) {
      console.error('❌ Secure test error:', error.message);
      return { error: error.message };
    }
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
      verifyTokenSilently,
      loadUserSession,
      serverReachable,
      API_URL,
      changepassword,
      testVulnerableFunction,
      testSecureFunction,
    }}>
      {children}
    </UserContext.Provider>
  );
}

