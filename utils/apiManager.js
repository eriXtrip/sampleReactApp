// SAMPLEREACTAPP/utils/apiManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = '';        // add your key here after node.js deployment
let inMemoryApiUrl = null; // 🧠 In-memory cache

export const getApiUrl = async () => {
  if (inMemoryApiUrl) {
    return inMemoryApiUrl;
  }

  try {
    const url = await AsyncStorage.getItem(API_KEY);
    if (url) {
      inMemoryApiUrl = url; // 🧠 Cache it
    }
    console.log('[apiManager] Retrieved URL:', url);
    return url;
  } catch (error) {
    console.error('[apiManager] Error getting URL:', error);
    return null;
  }
};

// ✅ NEW: Synchronous getter (only works if already loaded)
export const getCachedApiUrl = () => {
  return inMemoryApiUrl;
};

export const setApiUrl = async (url) => {
  try {
    if (!url) throw new Error('URL cannot be empty');
    console.log('[apiManager] Saving URL:', url);
    await AsyncStorage.setItem(API_KEY, url);
    inMemoryApiUrl = url; // 🧠 Update cache
    console.log('[apiManager] URL saved successfully');
    return true;
  } catch (error) {
    console.error('[apiManager] Error saving URL:', error);
    throw error;
  }
};

export const clearApiUrl = async () => {
  try {
    await AsyncStorage.removeItem(API_KEY);
    inMemoryApiUrl = null; // 🧠 Clear cache
    console.log('[apiManager] URL cleared successfully');
  } catch (error) {
    console.error('[apiManager] Error clearing URL:', error);
    throw error;
  }
};