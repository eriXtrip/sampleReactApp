import { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const [themeColors, setTheme] = useState('system');

  // Load theme from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Update theme and save to AsyncStorage
  const updateTheme = async (newTheme) => {
    try {
      setTheme(newTheme);
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  return (
    <ProfileContext.Provider value={{ themeColors, updateTheme }}>
      {children}
    </ProfileContext.Provider>
  );
}