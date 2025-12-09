// samplereactnative/contexts/ProfileContext.jsx  

import { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSQLiteContext } from "expo-sqlite";
import { safeExec, safeGetAll, safeRun, safeGetFirst } from '../utils/dbHelpers';

export const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const db = useSQLiteContext();

  const [themeColors, setTheme] = useState('light');
  const [user, setUser] = useState(null);   // <-- ADD USER STATE

  // Load theme from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setTheme(savedTheme);
        }
      } catch (error) {
        //console.error("❌ Logout failed:", logoutError);('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  // ⚡ Load user from SQLite on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const row = await safeGetFirst(db, `SELECT * FROM users LIMIT 1`);
        if (row) {
          console.log("PROFILE CONTEXT LOADED USER:", row);
          setUser(row);   // <-- VERY IMPORTANT
        } else {
          console.log("PROFILE CONTEXT: No user found in SQLite.");
        }
      } catch (error) {
        //console.error("❌ Logout failed:", logoutError);('Failed to load user:', error);
      }
    };

    loadUser();
  }, [db]);

  // 🔥 Function to refresh user manually after updates (achievements, sync, avatar changes)
  const refreshUser = async () => {
    try {
      const row = await safeGetFirst(db, `SELECT * FROM users LIMIT 1`);
      if (row) {
        console.log("PROFILE CONTEXT REFRESHED USER:", row);
        setUser(row);
      }
    } catch (err) {
      console.log("Failed to refresh user:", err);
    }
  };

  // Save theme
  const updateTheme = async (newTheme) => {
    try {
      setTheme(newTheme);
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      //console.error("❌ Logout failed:", logoutError);('Failed to save theme:', error);
    }
  };

  return (
    <ProfileContext.Provider value={{ 
      themeColors, 
      updateTheme,
      user,          // <-- PROVIDE USER
      setUser,       // <-- OPTIONAL direct setter
      refreshUser    // <-- FUNCTION TO RELOAD USER FROM SQLite
    }}>
      {children}
    </ProfileContext.Provider>
  );
}
