// SAMPLEREACTAPP/contexts/UserContext.jsx  to create apk: eas build --platform android --profile preview    to expose API: ngrok http 3001

import { createContext, useState, useEffect, useCallback, useContext } from "react";
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import  UserService  from '../local-database/services/userService';
import { useSQLiteContext } from 'expo-sqlite';
import { initializeDatabase } from '../local-database/services/database';
import { testServerConnection } from '../local-database/services/testServerConnection';
import { triggerLocalNotification } from '../utils/notificationUtils';
import { saveSyncDataToSQLite } from '../local-database/services/syncService';
import { getApiUrl } from '../utils/apiManager.js';
import { getLocalAvatarPath, ensureAvatarDirectory } from '../utils/avatarHelper';
import { triggerSyncIfOnline } from "../local-database/services/syncUp.js";
import { ApiUrlContext } from '../contexts/ApiUrlContext';
import { useRouter } from 'expo-router';
import { safeExec, safeGetAll, safeGetFirst, safeRun } from "../utils/dbHelpers.js";

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
  const router = useRouter();

  const { isOffline, isReachable, isApiLoaded } = useContext(ApiUrlContext);

  useEffect(() => {
    console.log("🔍 useSQLiteContext db in UserContext:", db);
  }, [db]);

  const getCurrentFlags = () => ({
    isOffline,
    isReachable,
    isApiLoaded,
  });

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
      if (!db) {
        console.warn("⏳ Database not ready yet in UserContext");
        return;
      }

      // Only initialize if UserService doesn't already have a db (set by DatabaseBinder)
      if (!UserService.db) {
        try {
          await initializeDatabase(db);
          UserService.setDatabase(db);
          console.log("✅ Database initialized successfully (UserContext)");
        } catch (error) {
          //console.error("❌ Logout failed:", logoutError);("❌ Database initialization error in UserContext:", error);
        } finally {
          setDbInitialized(true);
        }
      } else {
        console.log("⚡ UserService already has a DB from DatabaseBinder");
        setDbInitialized(true);
      }
    };

    initDb();
  }, [db]); // ✅ dependency array must be separate

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

    await triggerLocalNotification('Welcome Aboard!', `Your account has been created. Let's start the quest, ${data.first_name}!`);
    
    return await response.json();
  };

  // Helper: fetch with timeout
  const fetchWithTimeout = async (url, options = {}, timeout = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };


  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('Attempting login with:', { email, API_URL, dbInitialized, hasUserServiceDb: !!UserService.db });

      // defensive: ensure API_URL & db
      if (!API_URL) {
        throw new Error('API_URL not set yet');
      }
      if (!db) {
        console.warn('⚠️ login: local db (useSQLiteContext) is not available. Aborting sync steps.');
      }

      // clear previous user rows (if DB available)
      try {
        if (UserService && UserService.db) {
          console.log('Clearing existing user data via UserService');
          await UserService.clearUserData(db); // pass db or fallback inside method
        }
      } catch (clearErr) {
        console.warn('Failed clearing user data (non-fatal):', clearErr);
      }

      // call login endpoint
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => null);
      console.log('Initial login response:', {
        ok: response.ok,
        status: response.status,
        hasBody: !!data,
        error: data?.error
      });

      if (!response.ok) {
        const msg = data?.error || `Login HTTP ${response.status}`;
        throw new Error(msg);
      }

      const userDataForSync = {
        server_id: data.user.id,
        email: data.user.email,
        first_name: data.user.firstName,
        middle_name: data.user.middleName || 'N/A',
        last_name: data.user.lastName,
        suffix: data.user.suffix || 'N/A',
        birth_date: data.user.birthday,
        gender: data.user.gender,
        role_id: data.user.role,
        lrn: data.user.lrn || 'N/A',
        teacher_id: data.user.teacherId || 'N/A',
        total_points: data.user.total_points,
        avatar: data.user.avatar ? {
          id: data.user.avatar.id,
          fileName: data.user.avatar.fileName,
          url: data.user.avatar.url,
          avatar: data.user.avatar.avatar,
          thumbnail: data.user.avatar.thumbnail
        } : null
      };

      // Open in-app browser for roles 1 or 2
      const roleNum = Number(userDataForSync.role_id);
      const isWebUser = roleNum === 1 || roleNum === 2;

      if (isWebUser) {
        console.log('User is web user (role 1 or 2), skipping local storage');
        // For web users, we don't store data locally or download avatars
        return { 
          success: true, 
          user: userDataForSync,
          isWebUser: true // This flag will control navigation
        };
      }

      if (data.user.avatar?.url && data.user.avatar?.fileName) {
        console.log('Downloading avatar:', data.user.avatar.fileName);

        await ensureAvatarDirectory(); // ← same pattern as your videos

        const localPath = getLocalAvatarPath(data.user.avatar.fileName);

        const downloadRes = await FileSystem.downloadAsync(
          data.user.avatar.url,
          localPath
        );

        if (downloadRes.status === 200) {
          console.log('AVATAR DOWNLOADED:', localPath);
          userDataForSync.avatar_url = localPath;         // ← save full path
          userDataForSync.avatar_file_name = data.user.avatar.fileName; // ← save name only
        }
      }

      console.log("CHECK LOCAL AVATAR PATH:", getLocalAvatarPath(userDataForSync.avatar_file_name));

      const info = await FileSystem.getInfoAsync(
        getLocalAvatarPath(userDataForSync.avatar_file_name)
      );
      console.log("DOES LOCAL AVATAR EXIST?", info);

      // store auth token and userData sequentially so we know exactly what failed
      try {
        console.log('Saving token and userData to SecureStore...');
        await SecureStore.setItemAsync('authToken', data.token);
        await SecureStore.setItemAsync('userData', JSON.stringify(userDataForSync));
        console.log('SecureStore write OK');
      } catch (storeErr) {
        //console.error("❌ Logout failed:", logoutError);('Failed to save token/userData to SecureStore:', storeErr);
        // decide whether to continue; here we continue to local DB sync
      }

      // Sync user row into local DB using the live db (db from useSQLiteContext())
      try {
        console.log('Running UserService.syncUser(...)');
        await UserService.syncUser(userDataForSync, data.token, db); // pass db explicitly
        console.log('UserService.syncUser completed');
      } catch (usrSyncErr) {
        console.warn('UserService.syncUser failed (non-fatal):', usrSyncErr);
        // continue to full sync attempt (or decide to abort)
      }

      await triggerLocalNotification('Login Successful', `Welcome back, ${userDataForSync.first_name}`);
      setUser(userDataForSync);

      // Fetch full sync data then save to sqlite (guard db)
      try {
        if (!db) {
          console.warn('⚠️ Skipping full sync: db unavailable');
        } else {
          console.log('Fetching /user/sync-data from server...');
          const syncRes = await fetchWithTimeout(`${API_URL}/user/sync-data`, {
            headers: { Authorization: `Bearer ${data.token}` }
          }, 15000);

          if (!syncRes.ok) {
            const text = await syncRes.text().catch(() => '<no body>');
            throw new Error(`Sync endpoint returned ${syncRes.status}: ${text}`);
          }

          const syncData = await syncRes.json().catch((e) => {
            throw new Error('Invalid JSON from sync endpoint: ' + e?.message);
          });

          console.log('Saving full sync payload into local DB (saveSyncDataToSQLite)...');
          await saveSyncDataToSQLite(syncData, db); // pass same db
          console.log('✅ Full sync completed');
        }
      } catch (syncErr) {
        console.warn('Sync failed:', syncErr);
      }

      return { success: true, user: userDataForSync, isWebUser: false };
    } catch (error) {
      // don't swallow the real error — log then rethrow so caller/UI sees it
      //console.error("❌ Logout failed:", logoutError);('Login flow error:', error);
      // try best-effort cleanup
      try { await UserService.clearUserData(db); } catch (_) {}
      throw error;
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
      await UserService.display_sqliteDatabase();

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
      //console.error("❌ Logout failed:", logoutError);('Session load error:', error);
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

  const logout = async (server_id) => { 
    console.log('🚪 Logging out...');

    // 0. Check server reachability first
    try {
      const isReachable = await testServerConnection(API_URL);
      console.log("API URL in logout:", API_URL);
      if (!isReachable) {
        console.warn('❌ Server not reachable — aborting logout');
        return false;
      }
    } catch (err) {
      //console.error("❌ Logout failed:", logoutError);('❌ Error checking server reachability:', err);
      return false;
    }

    // 1. Wait if DB is still initializing
    if (!dbInitialized) {
      console.warn('⏳ Waiting for DB to finish initializing before logout...');
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    try {
      // 🔄 **NEW: Get local pupil_points before sync**
      let localPupilPoints = 0;
      let userServerId = server_id;
      
      if (db) {
        try {
          // Get user's local points from SQLite
          const userResult = await safeGetAll(
            db,
            'SELECT pupil_points, server_id FROM users WHERE server_id = ? LIMIT 1',
            [server_id]
          );
          
          if (userResult && userResult.length > 0) {
            localPupilPoints = userResult[0].pupil_points || 0;
            userServerId = userResult[0].server_id;
            console.log(`📊 Local pupil_points before sync: ${localPupilPoints}`);
          }
        } catch (pointsErr) {
          console.warn('⚠️ Could not fetch local pupil_points:', pointsErr);
        }
      }

      // 🔄 Trigger offline sync if online
      if (db) {
        try {
          console.log("🔄 Triggering offline sync before logout...");
          await triggerSyncIfOnline(db, getCurrentFlags());
          console.log("✅ Offline sync completed");
        } catch (syncErr) {
          console.warn("⚠️ Sync before logout failed (non-fatal):", syncErr);
        }
      }

      // 🔹 **NEW: Sync pupil_points to server**
      if (localPupilPoints > 0 && userServerId) {
        try {
          console.log(`🔄 Syncing pupil_points to server: ${localPupilPoints}`);
          const token = await SecureStore.getItemAsync("authToken");
          
          const syncResponse = await fetch(`${API_URL}/auth/sync-points`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
              user_id: userServerId, 
              pupil_points: localPupilPoints 
            })
          });
          
          if (syncResponse.ok) {
            console.log("✅ Pupil points synced to server");
          } else {
            const errorData = await syncResponse.json();
            console.warn(`⚠️ Points sync failed: ${errorData.error || 'Unknown error'}`);
          }
        } catch (pointsSyncErr) {
          console.warn("⚠️ Points sync error (non-fatal):", pointsSyncErr);
        }
      }

      // 🔹 Logout from server
      const token = await SecureStore.getItemAsync("authToken");
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          user_id: server_id,
          // Optional: Include final points in logout request
          pupil_points: localPupilPoints 
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Logout failed on server");
      }
      console.log("✅ Server logout successful");

      // 2. Clear SecureStore
      await Promise.all([
        SecureStore.deleteItemAsync("authToken"),
        SecureStore.deleteItemAsync("userData"),
      ]);
      console.log("🧹 SecureStore cleared");

      // 3. Clear all local DB tables
      if (dbInitialized && db) {
        console.log("🗑️ Clearing local DB tables...");
        await safeExec(
          db, 
          `DELETE FROM users;
          DELETE FROM sections;
          DELETE FROM subjects;
          DELETE FROM subjects_in_section;
          DELETE FROM lessons;
          DELETE FROM subject_contents;
          DELETE FROM games;
          DELETE FROM notifications;
          DELETE FROM pupil_test_scores;
          DELETE FROM pupil_achievements;
          DELETE FROM pupil_answers;
          DELETE FROM notifications;
          DELETE FROM classmates;
        `);
        console.log("✅ Local DB cleared");
      } else {
        console.warn("⚠️ DB not ready — skipped clear");
      }

      // 4. Clear React state
      setUser(null);
      console.log("✅ Logout successful");

      return true;

    } catch (logoutError) {
      //console.error("❌ Logout failed:", logoutError);("❌ Logout failed:", logoutError);
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
    await triggerLocalNotification('Security Alert', 'A password reset was requested for your account.');
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
    await triggerLocalNotification('Password Changed', 'Your password was updated successfully.');
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
      //console.error("❌ Logout failed:", logoutError);('Non-JSON response:', { status: response.status, url, text });
      throw new Error(`Expected JSON, received ${contentType || 'no content-type'}: ${text.slice(0, 100)}...`);
    }

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to change password');
    }
    await triggerLocalNotification('Password Changed', 'Your password was updated successfully.');
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
      //console.error("❌ Logout failed:", logoutError);('❌ Vulnerable test error:', error.message);
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
      //console.error("❌ Logout failed:", logoutError);('❌ Secure test error:', error.message);
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

