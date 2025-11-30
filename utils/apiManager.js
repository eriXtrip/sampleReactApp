// SAMPLEREACTAPP/utils/apiManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = 'https://mquest-backend-production.up.railway.app/api';        // add your key here after node.js deployment
let inMemoryApiUrl = null; // 🧠 In-memory cache

export const getApiUrl = async () => {
  // 🟦 Case 1: Developer manually set API_KEY
  if (API_KEY && API_KEY.trim() !== '') {
    console.log('[apiManager] Using hardcoded API:', API_KEY);
    inMemoryApiUrl = API_KEY; // cache it
    return API_KEY;
  }

  // 🟧 Case 2: API_KEY is empty → load from AsyncStorage
  if (inMemoryApiUrl) {
    return inMemoryApiUrl; // return cached value
  }

  try {
    const savedUrl = await AsyncStorage.getItem('API_URL');
    console.log('[apiManager] Retrieved saved API:', savedUrl);

    if (savedUrl) {
      inMemoryApiUrl = savedUrl;
      return savedUrl;
    }

    return null;
  } catch (error) {
    console.error('[apiManager] Error reading API:', error);
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

    // ❗ Save only if API_KEY is empty
    if (!API_KEY || API_KEY.trim() === '') {
      console.log('[apiManager] Saving API:', url);
      await AsyncStorage.setItem('API_URL', url);
    } else {
      console.warn('[apiManager] API_KEY is set → ignoring setApiUrl()');
    }

    inMemoryApiUrl = url;
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